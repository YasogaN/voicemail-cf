import { ProviderConfigType } from "../types";

export function getConfig(env: Cloudflare.Env): ProviderConfigType {
  return {
    provider: env.provider,
    numbers: env.numbers.split(",").map((number) => number.trim()),
    recording: {
      type: env.recording_type,
      url: env.recording_type == "url" ? env.recording_url : null,
      text: env.recording_type == "text" ? env.recording_text : null,
      maxLength: env.recording_max_length ? parseInt(env.recording_max_length) : null,
    },
  };
}