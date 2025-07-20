import { ProviderConfigType } from "@/types";
import { BaseProvider } from "@/lib/providers/base";
import { TwilioProvider } from "./twilio";

// Export only the provider classes
export { BaseProvider } from "@/lib/providers/base";
export { TwilioProvider } from "@/lib/providers/twilio";

// Factory function to get the appropriate provider instance
export function getProvider(config: ProviderConfigType): BaseProvider {
  switch (config.provider) {
    case "twilio":
      return new TwilioProvider(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
