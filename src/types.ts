import type { Context } from "hono";
import z from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const ProviderConfig = z.object({
  provider: z.string(),
  numbers: z.array(z.string()),
})

export type ProviderConfigType = z.infer<typeof ProviderConfig>;
