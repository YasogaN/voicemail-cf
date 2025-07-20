import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { getConfig } from "../lib/config";
import { getProvider } from "../lib/providers";

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
      const provider = getProvider(config);

      const response = provider.createRecordingResponse();
      return c.text(response, 200);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.text(`Internal Server Error: ${errorMessage}`, 500);
    }
  }
}
