import '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  onmessage: null,
  onopen: null,
  onerror: null,
  onclose: null,
}));

// Mock Fetch
global.fetch = jest.fn();

if (typeof global.Response === 'undefined') {
  class MockResponse {
    body: any;
    status: number;
    headers: Record<string, string>;

    constructor(body?: any, init: { status?: number; headers?: Record<string, string> } = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.headers = init.headers ?? {};
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Response = MockResponse;
}
