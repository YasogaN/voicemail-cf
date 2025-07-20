import { ProviderConfigType } from "../../types";
import { BaseProvider } from "./base";
import { TwilioProvider } from "./twilio";

// Export only the provider classes
export { BaseProvider } from "./base";
export { TwilioProvider } from "./twilio";

// Factory function to get the appropriate provider instance
export function getProvider(config: ProviderConfigType): BaseProvider {
  switch (config.provider) {
    case "twilio":
      return new TwilioProvider(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
