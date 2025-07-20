import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig } from '@/lib/config';

describe('Config Module', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
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
    };
  });

  it('should parse valid twilio config with text recording', () => {
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
    mockEnv.recording_type = 'url';
    mockEnv.recording_url = 'https://example.com/greeting.mp3';
    delete mockEnv.recording_text;

    const config = getConfig(mockEnv);

    expect(config.recording.type).toBe('url');
    if (config.recording.type === 'url') {
      expect(config.recording.url).toBe('https://example.com/greeting.mp3');
    }
  });

  it('should handle single phone number', () => {
    mockEnv.numbers = '+1234567890';

    const config = getConfig(mockEnv);

    expect(config.numbers).toEqual(['+1234567890']);
  });

  it('should handle numbers with extra whitespace', () => {
    mockEnv.numbers = ' +1234567890 , +0987654321 ';

    const config = getConfig(mockEnv);

    expect(config.numbers).toEqual(['+1234567890', '+0987654321']);
  });

  it('should use default maxLength when not provided', () => {
    delete mockEnv.recording_max_length;

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(30);
  });

  it('should throw error for missing required fields', () => {
    delete mockEnv.twilio_api_key;

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid recording type', () => {
    mockEnv.recording_type = 'invalid' as any;

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for empty numbers array', () => {
    mockEnv.numbers = '';

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid endpoint URL', () => {
    mockEnv.endpoint = 'not-a-url';

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should throw error for invalid recording URL', () => {
    mockEnv.recording_type = 'url';
    mockEnv.recording_url = 'not-a-url';
    delete mockEnv.recording_text;

    expect(() => getConfig(mockEnv)).toThrow('Configuration validation failed');
  });

  it('should handle numeric maxLength strings', () => {
    mockEnv.recording_max_length = '60';

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(60);
  });

  it('should ignore invalid maxLength strings', () => {
    mockEnv.recording_max_length = 'invalid';

    const config = getConfig(mockEnv);

    expect(config.recording.maxLength).toBe(30); // default value
  });
});
