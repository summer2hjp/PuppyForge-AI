import '@testing-library/jest-dom';

if (typeof globalThis.Response === 'undefined') {
  class MockResponse {
    status: number;
    private body: unknown;

    constructor(body: unknown, init?: { status?: number }) {
      this.body = typeof body === 'string' ? JSON.parse(body) : body;
      this.status = init?.status ?? 200;
    }

    async json() {
      return this.body;
    }
  }

  (globalThis as { Response?: unknown }).Response = MockResponse;
}
