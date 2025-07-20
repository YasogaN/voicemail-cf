import { ProviderConfig } from "../types";

export function getConfig(env: Cloudflare.Env): ProviderConfig {
  return {
    provider: env.provider,
    numbers: env.numbers.split(",").map((number) => number.trim()),
  };
}