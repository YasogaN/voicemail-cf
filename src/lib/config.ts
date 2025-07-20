import { ProviderConfigType } from "../types";

export function getConfig(env: Cloudflare.Env): ProviderConfigType {
  return {
    provider: env.provider, // Your VOIP provider, e.g., "twilio"
    numbers: env.numbers.split(",").map((number) => number.trim()), // Your phone numbers, e.g., ["+1234567890"]
  };
}