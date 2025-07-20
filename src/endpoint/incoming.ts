import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { getConfig } from "../lib/config";

export class Incoming extends OpenAPIRoute {
  schema = {
    tags: ["Incoming"],
    summary: "Endpoint for incoming calls",
    responses: {
      "200": {
        description: "Returns incoming call instructions",
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
      const req = c.req;

      if (config.provider === "twilio") {
        // Extract query parameters from the request
        const url = new URL(req.url);
        const fromNumber = url.searchParams.get('From')!;

        const twiml = new VoiceResponse();

        // Handle the call based on whether it's from a configured number
        if (config.numbers.includes(fromNumber)) {
          twiml.redirect("../menu");
        } else {
          twiml.redirect("../record");
        }
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
