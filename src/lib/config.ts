import { ProviderConfig } from "../types";

export function getConfig(env: Cloudflare.Env): ProviderConfig {
  return {
    provider: env.provider,
  };
}