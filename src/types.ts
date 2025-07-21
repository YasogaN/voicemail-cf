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
  }),
  BaseProviderConfig.extend({
    provider: z.literal("signalwire"),
    apiKey: z.string().nonempty("SignalWire API key is required"),
    apiSecret: z.string().nonempty("SignalWire API secret is required")
  })
])

export type ProviderConfigType = z.infer<typeof ProviderConfig>;


export const storeRequestSchema = z.object({
  AccountSid: z.string().nonempty().describe("The SID of the account that made the call").regex(/^AC[0-9a-fA-F]{32}$/, "Invalid Account SID format").min(34, "Account SID must be at least 34 characters long").max(34, "Account SID must be at most 34 characters long"),
  CallSid: z.string().nonempty().describe("The SID of the call being recorded").regex(/^CA[0-9a-fA-F]{32}$/, "Invalid Call SID format").min(34, "Call SID must be at least 34 characters long").max(34, "Call SID must be at most 34 characters long"),
  RecordingSid: z.string().nonempty().describe("The SID of the recording"),
  RecordingUrl: z.string().url().describe("The URL of the recording"),
  RecordingStatus: z.enum(["completed"]).describe("The status of the recording"),
  RecordingDuration: z.string().regex(/^\d+$/).describe("The duration of the recording in seconds"),
  RecordingChannels: z.string().regex(/^\d+$/).describe("The number of channels in the recording"),
  RecordingSource: z.literal('RecordVerb').describe("The initiation method used"),
})