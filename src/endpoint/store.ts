import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { storeRequestSchema, type AppContext } from "@/types";
import { getConfig } from "@/lib/config";
import { getProvider } from "@/lib/providers";
import { RecordingMetadata } from "@/lib/providers/base";

export class Store extends OpenAPIRoute {
  schema = {
    tags: ["Voice API"],
    summary: "Endpoint for recording callback",
    request: {
      body: {
        content: {
          "application/x-www-form-urlencoded": {
            schema: storeRequestSchema,
          },
        },
      }
    },
    responses: {
      "200": {
        description: "Returns status",
        content: {
          "application/json": {
            schema:
              z.object({
                status: z.boolean().describe("Status of the recording callback"),
                message: z.string().describe("Message providing additional information"),
              }),
          },
        },
      },
    }
  };

  async handle(c: AppContext) {
    try {
      const config = getConfig(c.env);
      const provider = getProvider(config);
      const { success, data, error } = storeRequestSchema.safeParse(await c.req.parseBody());
      if (!success) {
        return c.json({
          status: false,
          message: `Invalid request data: ${error.message}`,
        }, 400);
      }
      const body = data;

      // Fetch recording metadata
      const recordingMetadata = await provider.fetchRecordingMetadata(body.RecordingUrl as string);

      // Fetch call details
      const callDetails = await provider.fetchCallDetails(body.AccountSid as string, body.CallSid as string);

      // Upload only the recording file
      const media = await provider.fetchRecordingFile(body.RecordingUrl as string);

      await c.env.recordings.put(
        `recordings/${body.RecordingSid}.mp3`,
        media,
        {
          httpMetadata: {
            contentType: "audio/mpeg",
          },
        }
      );

      // Create metadata entry for the central index
      const indexEntry: RecordingMetadata = {
        recordingSid: recordingMetadata.sid,
        callSid: recordingMetadata.call_sid,
        start_time: recordingMetadata.start_time,
        duration: recordingMetadata.duration,
        from: callDetails.from,
        timestamp: new Date().toISOString(),
        mediaFile: `recordings/${body.RecordingSid}.mp3`
      };

      // Get existing index or create new one
      let existingIndex: any[] = [];
      try {
        const existingIndexData = await c.env.recordings.get("index.json");
        if (existingIndexData) {
          const indexText = await existingIndexData.text();
          existingIndex = JSON.parse(indexText);
        }
      } catch {
        existingIndex = [];
      }

      // Append new entry to index
      existingIndex.push(indexEntry);

      // Store updated index
      await c.env.recordings.put(
        "index.json",
        JSON.stringify(existingIndex, null, 2),
        {
          httpMetadata: {
            contentType: "application/json",
          },
        }
      );

      // Delete the recording from the provider
      await provider.deleteRecording(body.RecordingUrl as string);

      return c.json({
        status: true,
        message: "Recording stored successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
