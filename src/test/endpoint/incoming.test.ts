import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Incoming } from '@/endpoint/incoming';
import { fromHono } from 'chanfana';
import { getConfig } from '@/lib/config';
import { TwilioProvider } from '@/lib/providers/twilio';
import { createTestConfig, setupMockConfig } from '../utils/test-config';

// Mock only the config module to provide test configuration
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn()
}));

describe('Incoming Endpoint', () => {
  let app: Hono<{ Bindings: Env }>;
  let openapi: any;
  let mockConfig: any;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    openapi = fromHono(app, {
      docs_url: "/",
    });
    openapi.get("/incoming", Incoming);

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock config using the shared utility
    mockConfig = setupMockConfig(getConfig);
  });

  it('should handle incoming call with From parameter', async () => {
    // Create a real provider instance to test against
    const provider = new TwilioProvider(mockConfig);
    const twiml = provider.createIncomingCallResponse('+5555555555');

    // Test through the endpoint - should use the same real logic
    const url = 'http://localhost/incoming?From=%2B5555555555';
    const req = new Request(url);
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');

    const endpointResponse = await res.text();
    // The endpoint should return the same TwiML as the real provider
    expect(endpointResponse).toBe(twiml);

    // Verify it's properly formed TwiML
    expect(twiml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(twiml).toContain('<Response>');
    expect(twiml).toContain('<Redirect method="GET">');
    expect(twiml).toContain('</Response>');
  });

  it('should handle incoming call without From parameter', async () => {
    // Create a real provider instance to test against
    const provider = new TwilioProvider(mockConfig);
    const twiml = provider.createIncomingCallResponse(null);

    // Test through the endpoint - should use the same real logic
    const url = 'http://localhost/incoming';
    const req = new Request(url);
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);
    const endpointResponse = await res.text();
    expect(endpointResponse).toBe(twiml);
  });

  it('should handle config errors', async () => {
    vi.mocked(getConfig).mockImplementation(() => {
      throw new Error('Configuration error');
    });

    const url = 'http://localhost/incoming?From=%2B5555555555';
    const req = new Request(url);
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error: Configuration error');
  });

  it('should handle provider errors', async () => {
    // Mock config to return an invalid provider type to trigger provider creation error
    vi.mocked(getConfig).mockImplementation(() => {
      return {
        ...mockConfig,
        provider: 'invalid' as any
      };
    });

    const url = 'http://localhost/incoming?From=%2B5555555555';
    const req = new Request(url);
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
  });

  it('should decode URL-encoded phone numbers correctly', async () => {
    // Create a real provider instance to test against
    const provider = new TwilioProvider(mockConfig);
    const twiml = provider.createIncomingCallResponse('+1234567890');

    const url = 'http://localhost/incoming?From=%2B1234567890'; // +1234567890 URL encoded
    const req = new Request(url);
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);
    const endpointResponse = await res.text();
    expect(endpointResponse).toBe(twiml);
  });
});
