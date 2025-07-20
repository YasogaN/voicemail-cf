import { ProviderConfig, ProviderConfigType } from "../types";

export function getConfig(env: Cloudflare.Env): ProviderConfigType {
  // Parse numbers from comma-separated string
  const numbers = env.numbers ?
    env.numbers.split(",")
      .map((number) => number.trim())
      .filter(number => number.length > 0) :
    [];

  // Build recording configuration
  let recordingConfig: Record<string, string | number | undefined> = {
    type: env.recording_type
  };

  if (env.recording_type === 'url') {
    recordingConfig.url = env.recording_url;
  } else if (env.recording_type === 'text') {
    recordingConfig.text = env.recording_text;
  }

  // Add maxLength if provided
  if (env.recording_max_length) {
    const maxLength = parseInt(env.recording_max_length);
    if (!isNaN(maxLength)) {
      recordingConfig.maxLength = maxLength;
    }
  }

  // Build config object with provider-specific fields
  let config: Record<string, any> = {
    provider: env.provider,
    numbers,
    recording: recordingConfig,
    endpoint: env.endpoint
  };

  // Add provider-specific fields
  if (env.provider === 'twilio') {
    config.apiKey = env.twilio_api_key;
    config.apiSecret = env.twilio_api_secret;
  }

  // Validate with Zod schema - let Zod handle all validation
  const parsedConfig = ProviderConfig.safeParse(config);
  if (!parsedConfig.success) {
    const errorMessages = parsedConfig.error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`
    ).join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return parsedConfig.data;
}