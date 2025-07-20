import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { getConfig } from "@/lib/config";
import { getProvider } from "@/lib/providers";

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
      const provider = getProvider(config);

      const response = provider.createHangupResponse();
      return c.text(response, 200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
