import { vi } from 'vitest';

/**
 * Base configuration that can be shared across tests
 */
export const createBaseTestConfig = () => ({
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
});

/**
 * Base environment variables for tests
 */
export const createBaseTestEnv = (): Env => ({
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
});

/**
 * Create a test config with optional overrides
 */
export const createTestConfig = (overrides: Partial<ReturnType<typeof createBaseTestConfig>> = {}) => {
  const baseConfig = createBaseTestConfig();
  return { ...baseConfig, ...overrides };
};

/**
 * Create a test environment with optional overrides
 */
export const createTestEnv = (overrides: Partial<Env> = {}): Env => {
  const baseEnv = createBaseTestEnv();
  return { ...baseEnv, ...overrides };
};

/**
 * Setup mock config for tests that use getConfig
 */
export const setupMockConfig = (getConfigMock: any, configOverrides: Partial<ReturnType<typeof createBaseTestConfig>> = {}) => {
  const mockConfig = createTestConfig(configOverrides);
  vi.mocked(getConfigMock).mockReturnValue(mockConfig);
  return mockConfig;
};

/**
 * Common configuration variations for different test scenarios
 */
export const testConfigVariations = {
  /**
   * Config for URL-based recording instead of text
   */
  urlRecording: (baseConfig: ReturnType<typeof createBaseTestConfig>) => ({
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
  singleNumber: (baseConfig: ReturnType<typeof createBaseTestConfig>) => ({
    ...baseConfig,
    numbers: ['+1234567890'] as [string, ...string[]]
  }),

  /**
   * Config with multiple phone numbers
   */
  multipleNumbers: (baseConfig: ReturnType<typeof createBaseTestConfig>) => ({
    ...baseConfig,
    numbers: ['+1234567890', '+0987654321', '+1111111111'] as [string, ...string[]]
  }),

  /**
   * Config with different recording length
   */
  customRecordingLength: (baseConfig: ReturnType<typeof createBaseTestConfig>, maxLength: number) => ({
    ...baseConfig,
    recording: {
      ...baseConfig.recording,
      maxLength
    }
  })
};

/**
 * Environment variations for different test scenarios
 */
export const testEnvVariations = {
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
};
