import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { getConfig } from "../lib/config";

export class Store extends OpenAPIRoute {
  schema = {
    tags: ["Voice API"],
    summary: "Endpoint for recording callback",
    request: {
      body: {
        content: {
          "application/x-www-form-urlencoded": {
            schema: z.object({
              AccountSid: z.string().nonempty().describe("The SID of the account that made the call").regex(/^AC[0-9a-fA-F]{32}$/, "Invalid Account SID format").min(34, "Account SID must be at least 34 characters long").max(34, "Account SID must be at most 34 characters long"),
              CallSid: z.string().nonempty().describe("The SID of the call being recorded").regex(/^CA[0-9a-fA-F]{32}$/, "Invalid Call SID format").min(34, "Call SID must be at least 34 characters long").max(34, "Call SID must be at most 34 characters long"),
              RecordingSid: z.string().nonempty().describe("The SID of the recording"),
              RecordingUrl: z.string().url().describe("The URL of the recording"),
              RecordingStatus: z.enum(["completed"]).describe("The status of the recording"),
              RecordingDuration: z.string().regex(/^\d+$/).describe("The duration of the recording in seconds"),
              RecordingChannels: z.string().regex(/^\d+$/).describe("The number of channels in the recording"),
              RecordingSource: z.literal('RecordVerb').describe("The initiation method used"),
            }),
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
      const body = await c.req.parseBody();

      if (config.provider === "twilio") {
        // Fetch recording metadata from Twilio API
        const metadataUrl = body.RecordingUrl as string + ".json";
        const metadataResponse = await fetch(metadataUrl);
        if (!metadataResponse.ok) {
          return c.json({ status: false, message: "Failed to fetch recording metadata" }, 400);
        }
        const recordingMetadata = await metadataResponse.json() as any;

        // Fetch call details from Twilio API  
        const callApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${body.AccountSid}/Calls/${body.CallSid}.json`;
        const callResponse = await fetch(callApiUrl);
        if (!callResponse.ok) {
          return c.json({ status: false, message: "Failed to fetch call details" }, 400);
        }
        const callDetails = await callResponse.json() as any;

        // Upload only the recording file
        const mediaUrl = body.RecordingUrl as string + ".mp3";
        const mediaResponse = await fetch(mediaUrl);
        if (!mediaResponse.ok) {
          return c.json({ status: false, message: "Failed to fetch recording file" }, 400);
        }
        const media = await mediaResponse.arrayBuffer();

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
        const indexEntry = {
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

        return c.json({
          status: true,
          message: "Recording stored successfully",
        });

      } else {
        return c.text("Unsupported provider", 400);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
