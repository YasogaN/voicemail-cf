import type { Context } from "hono";
import { url } from "inspector";
import z from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const ProviderConfig = z.object({
  provider: z.string(),
  numbers: z.array(z.string()),
  recording: z.object({
    type: z.string(),
    url: z.string().url().optional(),
    text: z.string().optional(),
    maxLength: z.number().optional(),
  })
})

export type ProviderConfigType = z.infer<typeof ProviderConfig>;
