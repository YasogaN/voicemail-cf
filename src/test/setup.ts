import 'service-worker-mock';
import { vi } from 'vitest';
import { createBaseTestEnv } from './utils/test-config';

// Mock global fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock Cloudflare Worker environment
global.addEventListener = vi.fn();
(global as any).FetchEvent = class FetchEvent extends Event {
  constructor(type: string, init: any) {
    super(type);
    Object.assign(this, init);
  }
};

// Mock console methods for testing
(global as any).console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Setup global mock environment for tests
(global as any).baseEnv = createBaseTestEnv();
