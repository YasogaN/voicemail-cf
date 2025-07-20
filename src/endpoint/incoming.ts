import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { getConfig } from "../lib/config";
import { getProvider } from "../lib/providers";

export class Incoming extends OpenAPIRoute {
  schema = {
    tags: ["Voice API"],
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
      const provider = getProvider(config);
      const req = c.req;

      // Extract query parameters from the request
      const url = new URL(req.url);
      const fromNumber = url.searchParams.get('From')!;

      const response = provider.createIncomingCallResponse(fromNumber);
      return c.text(response, 200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
