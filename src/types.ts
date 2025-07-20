import type { Context } from "hono";
import z from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const ProviderConfig = z.object({
  provider: z.string(),
})

export type ProviderConfig = z.infer<typeof ProviderConfig>;
