import { vi } from 'vitest';

/**
 * Provider-specific test configurations
 */
export const ProviderTestConfigs = {
  twilio: {
    createConfig: () => ({
      provider: 'twilio' as const,
      numbers: ['+1234567890'] as [string, ...string[]],
      recording: {
        type: 'text' as const,
        text: 'Please leave a message',
        maxLength: 30
      },
      endpoint: 'https://example.com/webhook',
      apiKey: 'test_key',
      apiSecret: 'test_secret'
    }),

    createEnv: (): Env => ({
      provider: 'twilio',
      numbers: '+1234567890,+0987654321',
      recording_type: 'text',
      recording_text: 'Please leave a message after the beep.',
      recording_max_length: '30',
      endpoint: 'https://example.com/webhook',
      twilio_api_key: 'test_api_key',
      twilio_api_secret: 'test_api_secret',
      recording_url: '', // default value for tests
      recordings: undefined
    })
  }
  // Additional providers can be added here in the future
  // Example:
  // voip: {
  //   createConfig: () => ({ ... }),
  //   createEnv: () => ({ ... })
  // }
};

/**
 * Base configuration that can be shared across tests (defaults to Twilio for backward compatibility)
 */
export const createBaseTestConfig = ProviderTestConfigs.twilio.createConfig;

/**
 * Base environment variables for tests (defaults to Twilio for backward compatibility)
 */
export const createBaseTestEnv = ProviderTestConfigs.twilio.createEnv;

/**
 * Create a test config with optional overrides for a specific provider
 */
export const createTestConfig = <T extends keyof typeof ProviderTestConfigs>(
  provider: T = 'twilio' as T,
  overrides: Partial<ReturnType<typeof ProviderTestConfigs[T]['createConfig']>> = {}
) => {
  const baseConfig = ProviderTestConfigs[provider].createConfig();
  return { ...baseConfig, ...overrides };
};

/**
 * Create a test environment with optional overrides for a specific provider
 */
export const createTestEnv = <T extends keyof typeof ProviderTestConfigs>(
  provider: T = 'twilio' as T,
  overrides: Partial<Env> = {}
): Env => {
  const baseEnv = ProviderTestConfigs[provider].createEnv();
  return { ...baseEnv, ...overrides };
};

/**
 * Setup mock config for tests that use getConfig - provider-aware
 */
export const setupMockConfig = <T extends keyof typeof ProviderTestConfigs>(
  getConfigMock: any,
  provider: T = 'twilio' as T,
  configOverrides: Partial<ReturnType<typeof ProviderTestConfigs[T]['createConfig']>> = {}
) => {
  const mockConfig = createTestConfig(provider, configOverrides);
  vi.mocked(getConfigMock).mockReturnValue(mockConfig);
  return mockConfig;
};

/**
 * Provider-specific configuration variations for different test scenarios
 */
export const ProviderTestVariations = {
  twilio: {
    /**
     * Config for URL-based recording instead of text
     */
    urlRecording: (baseConfig: ReturnType<typeof ProviderTestConfigs.twilio.createConfig>) => ({
      ...baseConfig,
      recording: {
        type: 'url' as const,
        url: 'https://example.com/greeting.mp3',
        maxLength: baseConfig.recording.maxLength
      }
    }),

    /**
     * Config with single phone number
     */
    singleNumber: (baseConfig: ReturnType<typeof ProviderTestConfigs.twilio.createConfig>) => ({
      ...baseConfig,
      numbers: ['+1234567890'] as [string, ...string[]]
    }),

    /**
     * Config with multiple phone numbers
     */
    multipleNumbers: (baseConfig: ReturnType<typeof ProviderTestConfigs.twilio.createConfig>) => ({
      ...baseConfig,
      numbers: ['+1234567890', '+0987654321', '+1111111111'] as [string, ...string[]]
    }),

    /**
     * Config with different recording length
     */
    customRecordingLength: (baseConfig: ReturnType<typeof ProviderTestConfigs.twilio.createConfig>, maxLength: number) => ({
      ...baseConfig,
      recording: {
        ...baseConfig.recording,
        maxLength
      }
    })
  }
  // Additional provider variations can be added here
};

/**
 * Provider-specific environment variations for different test scenarios
 */
export const ProviderEnvVariations = {
  twilio: {
    /**
     * Environment for URL-based recording
     */
    urlRecording: (baseEnv: Env) => ({
      ...baseEnv,
      recording_type: 'url',
      recording_url: 'https://example.com/greeting.mp3',
      recording_text: undefined
    }),

    /**
     * Environment with single phone number
     */
    singleNumber: (baseEnv: Env) => ({
      ...baseEnv,
      numbers: '+1234567890'
    }),

    /**
     * Environment with custom recording length
     */
    customRecordingLength: (baseEnv: Env, maxLength: string) => ({
      ...baseEnv,
      recording_max_length: maxLength
    })
  }
  // Additional provider environment variations can be added here
};
