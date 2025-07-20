import { describe, it, expect } from 'vitest';
import { ProviderConfig } from '@/types';

describe('Types Module', () => {
  describe('ProviderConfig Schema', () => {
    it('should validate valid Twilio config with text recording', () => {
      const validConfig = {
        provider: 'twilio',
        numbers: ['+1234567890', '+0987654321'],
        recording: {
          type: 'text',
          text: 'Please leave a message after the beep.',
          maxLength: 30
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(validConfig);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.provider).toBe('twilio');
        expect(result.data.numbers).toEqual(['+1234567890', '+0987654321']);
        expect(result.data.recording.type).toBe('text');
        if (result.data.recording.type === 'text') {
          expect(result.data.recording.text).toBe('Please leave a message after the beep.');
        }
        expect(result.data.recording.maxLength).toBe(30);
      }
    });

    it('should validate valid Twilio config with URL recording', () => {
      const validConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'url',
          url: 'https://example.com/greeting.mp3',
          maxLength: 60
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(validConfig);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.recording.type).toBe('url');
        if (result.data.recording.type === 'url') {
          expect(result.data.recording.url).toBe('https://example.com/greeting.mp3');
        }
        expect(result.data.recording.maxLength).toBe(60);
      }
    });

    it('should apply default maxLength', () => {
      const configWithoutMaxLength = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(configWithoutMaxLength);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.recording.maxLength).toBe(30);
      }
    });

    it('should reject empty numbers array', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: [],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject numbers that are too short', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['123'], // Too short
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject missing apiKey for Twilio provider', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook',
        // apiKey missing
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject missing apiSecret for Twilio provider', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key'
        // apiSecret missing
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid endpoint URL', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'not-a-url',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid recording URL', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'url',
          url: 'not-a-url'
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject empty recording text', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: ''
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative maxLength', () => {
      const invalidConfig = {
        provider: 'twilio',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.',
          maxLength: 0
        },
        endpoint: 'https://example.com/webhook',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject unknown provider', () => {
      const invalidConfig = {
        provider: 'unknown',
        numbers: ['+1234567890'],
        recording: {
          type: 'text',
          text: 'Please leave a message.'
        },
        endpoint: 'https://example.com/webhook'
      };

      const result = ProviderConfig.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
});
