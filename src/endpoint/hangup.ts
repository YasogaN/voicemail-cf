import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { getConfig } from "../lib/config";

export class Hangup extends OpenAPIRoute {
  schema = {
    tags: ["Voice API"],
    summary: "Endpoint for hanging up incoming calls",
    responses: {
      "200": {
        description: "Returns hangup instruction",
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
        twiml.hangup();

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
