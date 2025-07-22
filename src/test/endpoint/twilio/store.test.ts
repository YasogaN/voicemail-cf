import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Store } from '@/endpoint/store';
import { fromHono } from 'chanfana';
import { getConfig } from '@/lib/config';
import { TestR2Bucket } from 'cloudflare-test-utils';
import { createTestEnv, setupMockConfig } from '../../utils/test-config';

// Mock only the config module to provide test configuration
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn()
}));

// Mock global fetch for provider API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Store Endpoint', () => {
  let app: Hono<{ Bindings: Env }>;
  let openapi: any;
  let mockConfig: any;
  let mockEnv: Env;

  // Common test data
  let accountSid: string;
  let callSid: string;
  let recordingSid: string;
  let recordingUrl: string;
  let mockRecordingMetadata: any;
  let mockCallDetails: any;
  let mockAudioBuffer: ArrayBuffer;
  let formData: URLSearchParams;

  // Mock response configurations
  let mockResponses: {
    recordingMetadata: { ok: boolean; data?: any; status?: number };
    callDetails: { ok: boolean; data?: any; status?: number };
    recordingFile: { ok: boolean; data?: ArrayBuffer; status?: number };
    deleteRecording: { ok: boolean; status?: number };
  };

  // Helper function to setup configurable mock fetch
  const setupMockFetch = () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      // Handle dynamic URLs for different test scenarios
      const isRecordingMetadataUrl = url.includes('/Recordings/') && url.endsWith('.json') && !options?.method;
      const isCallDetailsUrl = url.includes('/Calls/') && url.endsWith('.json');
      const isRecordingFileUrl = url.includes('/Recordings/') && url.endsWith('.mp3');
      const isDeleteRecordingUrl = url.includes('/Recordings/') && options?.method === 'DELETE';

      if (isRecordingMetadataUrl) {
        return Promise.resolve({
          ok: mockResponses.recordingMetadata.ok,
          status: mockResponses.recordingMetadata.status || (mockResponses.recordingMetadata.ok ? 200 : 404),
          json: () => Promise.resolve(mockResponses.recordingMetadata.data || mockRecordingMetadata),
        });
      } else if (isCallDetailsUrl) {
        return Promise.resolve({
          ok: mockResponses.callDetails.ok,
          status: mockResponses.callDetails.status || (mockResponses.callDetails.ok ? 200 : 404),
          json: () => Promise.resolve(mockResponses.callDetails.data || mockCallDetails),
        });
      } else if (isRecordingFileUrl) {
        return Promise.resolve({
          ok: mockResponses.recordingFile.ok,
          status: mockResponses.recordingFile.status || (mockResponses.recordingFile.ok ? 200 : 404),
          arrayBuffer: () => Promise.resolve(mockResponses.recordingFile.data || mockAudioBuffer),
        });
      } else if (isDeleteRecordingUrl) {
        return Promise.resolve({
          ok: mockResponses.deleteRecording.ok,
          status: mockResponses.deleteRecording.status || (mockResponses.deleteRecording.ok ? 200 : 404),
        });
      }
      // Fallback for unexpected calls
      return Promise.resolve({
        ok: false,
        status: 404,
      });
    });
  };

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    openapi = fromHono(app, {
      docs_url: "/",
    });
    openapi.post("/store", Store);

    // Reset mocks
    vi.clearAllMocks();
    mockFetch.mockClear();

    // Setup common test data
    accountSid = 'AC1234567890abcdef1234567890abcdef';
    callSid = 'CA1234567890abcdef1234567890abcdef';
    recordingSid = 'RE1234567890abcdef1234567890abcdef';
    recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}`;

    mockRecordingMetadata = {
      sid: recordingSid,
      call_sid: callSid,
      start_time: '2023-01-01T12:00:00Z',
      duration: '45',
    };

    mockCallDetails = {
      from: '+5555555555',
    };

    mockAudioBuffer = new ArrayBuffer(1024);

    formData = new URLSearchParams({
      AccountSid: accountSid,
      CallSid: callSid,
      RecordingSid: recordingSid,
      RecordingUrl: recordingUrl,
      RecordingStatus: 'completed',
      RecordingDuration: '45',
      RecordingChannels: '1',
      RecordingSource: 'RecordVerb',
    });

    // Setup default successful mock responses
    mockResponses = {
      recordingMetadata: { ok: true },
      callDetails: { ok: true },
      recordingFile: { ok: true },
      deleteRecording: { ok: true },
    };

    // Setup mock config using the shared utility
    mockConfig = setupMockConfig(getConfig, 'twilio');

    // Setup mock environment with R2 bucket
    const mockR2Bucket = new TestR2Bucket();

    mockEnv = createTestEnv('twilio', {
      recordings: mockR2Bucket,
    });

    // Set up global mockEnv for consistency with other tests
    (global as any).mockEnv = mockEnv;

    // Setup configurable mock fetch
    setupMockFetch();
  });

  it('should successfully store recording and metadata', async () => {
    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const responseJson = await res.json();
    expect(responseJson).toEqual({
      status: true,
      message: 'Recording stored successfully',
    });

    // Verify R2 operations
    expect(mockEnv.recordings.put).toHaveBeenCalledTimes(2);

    // Check recording file upload
    expect(mockEnv.recordings.put).toHaveBeenCalledWith(
      `recordings/${recordingSid}.mp3`,
      mockAudioBuffer,
      {
        httpMetadata: {
          contentType: 'audio/mpeg',
        },
      }
    );

    // Check index.json update
    const indexCallArgs = (mockEnv.recordings.put as any).mock.calls.find(
      (call: any) => call[0] === 'index.json'
    );
    expect(indexCallArgs).toBeTruthy();

    const indexData = JSON.parse(indexCallArgs[1]);
    expect(indexData).toHaveLength(1);
    expect(indexData[0]).toMatchObject({
      recordingSid: recordingSid,
      callSid: callSid,
      start_time: '2023-01-01T12:00:00Z',
      duration: '45',
      from: '+5555555555',
      mediaFile: `recordings/${recordingSid}.mp3`,
    });
    expect(indexData[0].timestamp).toBeTruthy();

    // Verify provider API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(4);

    // Check recording metadata fetch
    expect(mockFetch).toHaveBeenCalledWith(
      `${recordingUrl}.json`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      })
    );

    // Check call details fetch
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      })
    );

    // Check recording file fetch
    expect(mockFetch).toHaveBeenCalledWith(
      `${recordingUrl}.mp3`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      })
    );

    // Check recording deletion
    expect(mockFetch).toHaveBeenCalledWith(
      `${recordingUrl}.json`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Basic'),
        }),
      })
    );
  });

  it('should append to existing index when recordings already exist', async () => {
    // Mock existing index data
    const existingIndex = [
      {
        recordingSid: 'RE_OLD',
        callSid: 'CA_OLD',
        start_time: '2023-01-01T10:00:00Z',
        duration: '30',
        from: '+1111111111',
        timestamp: '2023-01-01T10:01:00Z',
        mediaFile: 'recordings/RE_OLD.mp3',
      },
    ];

    const mockR2Object = {
      text: vi.fn().mockResolvedValue(JSON.stringify(existingIndex)),
    };

    mockEnv.recordings.get = vi.fn().mockResolvedValue(mockR2Object);

    // Use different IDs for this test
    const testCallSid = 'CA2234567890abcdef1234567890abcdef';
    const testRecordingSid = 'RE2234567890abcdef1234567890abcdef';

    // Override mock data for this specific test
    mockResponses.recordingMetadata.data = {
      sid: testRecordingSid,
      call_sid: testCallSid,
      start_time: '2023-01-01T12:00:00Z',
      duration: '60',
    };
    mockResponses.callDetails.data = { from: '+2222222222' };
    mockResponses.recordingFile.data = new ArrayBuffer(512);

    const testFormData = new URLSearchParams({
      AccountSid: accountSid,
      CallSid: testCallSid,
      RecordingSid: testRecordingSid,
      RecordingUrl: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${testRecordingSid}`,
      RecordingStatus: 'completed',
      RecordingDuration: '60',
      RecordingChannels: '1',
      RecordingSource: 'RecordVerb',
    });

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testFormData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);

    // Verify index was updated with both old and new entries
    const indexCallArgs = (mockEnv.recordings.put as any).mock.calls.find(
      (call: any) => call[0] === 'index.json'
    );
    const updatedIndex = JSON.parse(indexCallArgs[1]);

    expect(updatedIndex).toHaveLength(2);
    expect(updatedIndex[0]).toMatchObject(existingIndex[0]);
    expect(updatedIndex[1]).toMatchObject({
      recordingSid: testRecordingSid,
      callSid: testCallSid,
      from: '+2222222222',
    });
  });

  it('should handle missing or invalid form data', async () => {
    const invalidFormData = new URLSearchParams({
      AccountSid: 'invalid_sid', // Invalid format
      CallSid: callSid,
      RecordingSid: recordingSid,
      RecordingUrl: 'not_a_url', // Invalid URL
      RecordingStatus: 'completed',
      RecordingDuration: '45',
      RecordingChannels: '1',
      RecordingSource: 'RecordVerb',
    });

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: invalidFormData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(400);
  });

  it('should handle recording metadata fetch failure', async () => {
    // Configure mock to fail recording metadata fetch
    mockResponses.recordingMetadata.ok = false;
    mockResponses.recordingMetadata.status = 404;

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
    expect(text).toContain('Failed to fetch recording metadata');
  });

  it('should handle call details fetch failure', async () => {
    // Configure mock to fail call details fetch
    mockResponses.callDetails.ok = false;
    mockResponses.callDetails.status = 403;

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
    expect(text).toContain('Failed to fetch call details');
  });

  it('should handle recording file fetch failure', async () => {
    // Configure mock to fail recording file fetch
    mockResponses.recordingFile.ok = false;
    mockResponses.recordingFile.status = 500;

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
    expect(text).toContain('Failed to fetch recording file');
  });

  it('should handle R2 storage failure', async () => {
    // Mock R2 failure
    mockEnv.recordings.put = vi.fn().mockRejectedValue(new Error('R2 storage failed'));

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
    expect(text).toContain('R2 storage failed');
  });

  it('should handle configuration errors', async () => {
    vi.mocked(getConfig).mockImplementation(() => {
      throw new Error('Configuration error');
    });

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error: Configuration error');
  });

  it('should handle recording deletion failure gracefully', async () => {
    // Configure mock to fail recording deletion
    mockResponses.deleteRecording.ok = false;
    mockResponses.deleteRecording.status = 404;

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error');
    expect(text).toContain('Failed to delete recording from Twilio');
  });

  it('should handle non-Error exceptions', async () => {
    vi.mocked(getConfig).mockImplementation(() => {
      throw 'String error';
    });

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Internal Server Error: String error');
  });

  it('should handle malformed existing index JSON gracefully', async () => {
    // Mock corrupted index data
    const mockR2Object = {
      text: vi.fn().mockResolvedValue('invalid json{'),
    };

    mockEnv.recordings.get = vi.fn().mockResolvedValue(mockR2Object);

    const req = new Request('http://localhost/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await app.request(req, {}, (global as any).mockEnv);

    expect(res.status).toBe(200);

    // Should create new index with just the current entry
    const indexCallArgs = (mockEnv.recordings.put as any).mock.calls.find(
      (call: any) => call[0] === 'index.json'
    );
    const newIndex = JSON.parse(indexCallArgs[1]);
    expect(newIndex).toHaveLength(1);
  });
});
