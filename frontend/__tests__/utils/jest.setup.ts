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
