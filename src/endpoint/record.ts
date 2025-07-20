import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { getConfig } from "../lib/config";

export class Record extends OpenAPIRoute {
  schema = {
    tags: ["Voice API"],
    summary: "Endpoint for recording incoming calls",
    responses: {
      "200": {
        description: "Returns recording instructions",
        content: {
          "application/xml": {
            schema: z.string(),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      const config = getConfig(c.env);

      if (config.provider === "twilio") {
        const twiml = new VoiceResponse();
        if (config.recording.type === 'url') {
          twiml.play(config.recording.url);
        }
        else if (config.recording.type === 'text') {
          twiml.say(config.recording.text);
        }

        twiml.record({
          action: "../hangup",
          method: 'GET',
          maxLength: config.recording.maxLength,
          playBeep: true,
          recordingStatusCallback: "../store",
          recordingStatusCallbackEvent: ["completed"],
          recordingStatusCallbackMethod: 'POST',
        });

        return c.text(twiml.toString(), 200);
      } else {
        return c.text("Unsupported provider", 400);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
