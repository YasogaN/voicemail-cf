import type { Context } from "hono";
import z from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const ProviderConfig = z.object({
  provider: z.enum(["twilio"]),
  numbers: z.array(z.string().min(5, "Number must be at least 5 characters long")).nonempty("At least one number must be specified"),
  recording: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("url"),
      url: z.string().url().nonempty("Recording URL must be a valid URL"),
    }),
    z.object({
      type: z.literal("text"),
      text: z.string().nonempty("Recording text must be provided"),
    })
  ]).and(z.object({
    maxLength: z.number().optional()
  }))
})

export type ProviderConfigType = z.infer<typeof ProviderConfig>;
