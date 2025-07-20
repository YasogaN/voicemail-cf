import type { Context } from "hono";
import z from "zod";

export type AppContext = Context<{ Bindings: Env }>;

const BaseProviderConfig = z.object({
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
    maxLength: z.number().optional().default(30).refine(val => val > 0, "Max length must be a positive number")
  })),
  endpoint: z.string().url()
});

export const ProviderConfig = z.discriminatedUnion("provider", [
  BaseProviderConfig.extend({
    provider: z.literal("twilio"),
    apiKey: z.string().nonempty("Twilio API key is required"),
    apiSecret: z.string().nonempty("Twilio API secret is required")
  })
])

export type ProviderConfigType = z.infer<typeof ProviderConfig>;
