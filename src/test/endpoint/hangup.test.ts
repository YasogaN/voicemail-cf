import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Hangup } from '@/endpoint/hangup';
import { fromHono } from 'chanfana';
import { getConfig } from '@/lib/config';
import { TwilioProvider } from '@/lib/providers/twilio';

// Mock only the config module to provide test configuration
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn()
}));

describe('Hangup Endpoint', () => {
  let app: Hono<{ Bindings: Env }>;
  let openapi: any;
  let mockConfig: any;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    openapi = fromHono(app, {
      docs_url: "/",
    });
    openapi.get("/hangup", Hangup);

    // Reset mocks
    vi.clearAllMocks();

    mockConfig = {
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
    };

    vi.mocked(getConfig).mockReturnValue(mockConfig);
  });

  it('should generate valid TwiML hangup response', async () => {
    // Create a real provider instance to test against
    const provider = new TwilioProvider(mockConfig);
    const twiml = provider.createHangupResponse();

    // Test through the endpoint - should use the same real logic
    const req = new Request('http://localhost/hangup');
    const res = await app.request(req, {}, (global as any).mockEnv);
    const endpointResponse = await res.text();

    // The endpoint should return the same TwiML as the real provider
    expect(endpointResponse).toBe(twiml);

    // Verify it's properly formed TwiML
    expect(twiml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(twiml).toContain('<Response>');
    expect(twiml).toContain('<Hangup/>');
    expect(twiml).toContain('</Response>');
  });
});
