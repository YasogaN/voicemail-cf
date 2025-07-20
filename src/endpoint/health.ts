import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class Health extends OpenAPIRoute {
  schema = {
    tags: ["Health"],
    summary: "Get the health status",
    responses: {
      "200": {
        description: "Returns the health status",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string(),
              timestamp: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
    };

    return c.json(healthStatus, 200);
  }
}
