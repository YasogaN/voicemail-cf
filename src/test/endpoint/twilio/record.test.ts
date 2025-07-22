import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Record } from '@/endpoint/record';
import { fromHono } from 'chanfana';
import { getConfig } from '@/lib/config';
import { TwilioProvider } from '@/lib/providers/twilio';
import { setupMockConfig } from '../../utils/test-config';

// Mock only the config module to provide test configuration
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn()
}));

describe('Record Endpoint', () => {
  let app: Hono<{ Bindings: Env }>;
  let openapi: any;
  let mockConfig: any;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    openapi = fromHono(app, {
      docs_url: "/",
    });
    openapi.get("/record", Record);

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock config using the shared utility
    mockConfig = setupMockConfig(getConfig);
  });

  it('should return recording TwiML response', async () => {
    // Create a real provider instance to test against
    const provider = new TwilioProvider(mockConfig);
    const twiml = provider.createRecordingResponse();

    // Test through the endpoint - should use the same real logic
    const req = new Request('http://localhost/record');
    const res = await app.request(req, {}, (global as any).mockEnv);
    const endpointResponse = await res.text();

    // The endpoint should return the same TwiML as the real provider
    expect(endpointResponse).toBe(twiml);

    expect(twiml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(twiml).toContain('<Response>');
    expect(twiml).toContain('<Say>Please leave a message</Say>');
    expect(twiml).toContain(`<Record action="${mockConfig.endpoint}/hangup" method="GET" maxLength="30" playBeep="true" recordingStatusCallback="${mockConfig.endpoint}/store" recordingStatusCallbackEvent="completed" recordingStatusCallbackMethod="POST"/>`);
    expect(twiml).toContain('</Response>');
  });

  it('should handle config errors', async () => {
    vi.mocked(getConfig).mockImplementation(() => {
      throw new Error('Configuration error');
    });

    const req = new Request('http://localhost/record');
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

    const req = new Request('http://localhost/record');
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
  });

  it('should handle provider method errors', async () => {
    // Mock config to return a configuration that would cause TwiML generation to fail
    vi.mocked(getConfig).mockImplementation(() => {
      return {
        ...mockConfig,
        endpoint: undefined as any // This should cause an error in TwiML generation
      };
    });

    const req = new Request('http://localhost/record');
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
  });

  it('should handle non-Error exceptions', async () => {
    // This test might not be as relevant without mock providers, 
    // but we can test by making getConfig throw a non-Error
    vi.mocked(getConfig).mockImplementation(() => {
      throw 'String error';
    });

    const req = new Request('http://localhost/record');
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error: String error');
  });
});
