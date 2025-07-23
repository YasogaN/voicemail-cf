import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig } from '@/lib/config';
import { createBaseTestEnv, createTestEnv, ProviderEnvVariations } from '../utils/test-config';

describe('Config Module', () => {
  let mockEnv: Env;
  let baseEnv: Env;

  beforeEach(() => {
    baseEnv = createBaseTestEnv();
  });

  it('should parse valid twilio config with text recording', () => {
    mockEnv = baseEnv;
    const config = getConfig(mockEnv);

    expect(config.provider).toBe('twilio');
    expect(config.numbers).toEqual(['+1234567890', '+0987654321']);
    expect(config.recording.type).toBe('text');
    if (config.recording.type === 'text') {
      expect(config.recording.text).toBe('Please leave a message after the beep.');
    }
    expect(config.recording.maxLength).toBe(30);
    expect(config.endpoint).toBe('https://example.com/webhook');
    expect(config.apiKey).toBe('test_api_key');
    expect(config.apiSecret).toBe('test_api_secret');
  });

  it('should parse valid twilio config with URL recording', () => {
    mockEnv = ProviderEnvVariations.twilio.urlRecording(baseEnv);
    const config = getConfig(mockEnv);

    expect(config.recording.type).toBe('url');
    if (config.recording.type === 'url') {
      expect(config.recording.url).toBe('https://example.com/greeting.mp3');
    }
  });

  it('should handle single phone number', () => {
    mockEnv = createTestEnv('twilio', ProviderEnvVariations.twilio.singleNumber(baseEnv));

    const config = getConfig(mockEnv);

    expect(config.numbers).toEqual(['+1234567890']);
  });

  it('should handle numbers with extra whitespace', () => {
    mockEnv = createTestEnv('twilio', { numbers: ' +1234567890 , +0987654321 ' });

    const config = getConfig(mockEnv);

    expect(config.numbers).toEqual(['+1234567890', '+0987654321']);
  });

  it('should use default maxLength when not provided', () => {
    mockEnv = createTestEnv('twilio', { recording_max_length: undefined });

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(30);
  });

  it('should throw error for missing required fields', () => {
    mockEnv = createTestEnv('twilio', { twilio_api_key: undefined });

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid recording type', () => {
    mockEnv = createTestEnv('twilio', { recording_type: 'invalid' as any });

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for empty numbers array', () => {
    mockEnv = createTestEnv('twilio', { numbers: '' });

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid endpoint URL', () => {
    mockEnv = createTestEnv('twilio', { endpoint: 'not-a-url' });

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid recording URL', () => {
    mockEnv = createTestEnv('twilio', {
      recording_type: 'url',
      recording_url: 'not-a-url',
      recording_text: undefined
    });

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should handle numeric maxLength strings', () => {
    mockEnv = createTestEnv('twilio', ProviderEnvVariations.twilio.customRecordingLength(baseEnv, '60'));

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(60);
  });

  it('should ignore invalid maxLength strings', () => {
    mockEnv = createTestEnv('twilio', { recording_max_length: 'invalid' });

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(30); // default value
  });
});
