import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Health } from '@/endpoint/health';
import { fromHono } from 'chanfana';

describe('Health Endpoint', () => {
  let app: Hono<{ Bindings: Env }>;
  let openapi: any;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    openapi = fromHono(app, {
      docs_url: "/",
    });
    openapi.get("/health", Health);
  });

  it('should return health status with 200', async () => {
    const req = new Request('http://localhost/health');
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);

    const json = await res.json() as { status: string; timestamp: string };
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('timestamp');
    expect(typeof json.timestamp).toBe('string');

    // Verify timestamp is a valid ISO string
    expect(() => new Date(json.timestamp)).not.toThrow();
  });

  it('should return consistent structure', async () => {
    const req = new Request('http://localhost/health');
    const res = await app.request(req, {}, (global as any).mockEnv);

    const json = await res.json();
    expect(Object.keys(json)).toEqual(['status', 'timestamp']);
  });

  it('should return content-type application/json', async () => {
    const req = new Request('http://localhost/health');
    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
