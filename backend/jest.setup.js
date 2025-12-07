// Global setup for Jest tests
// This file runs once before all tests

// Suppress console logs during tests unless explicitly needed
if (process.env.VERBOSE_TESTS !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.SERVICE_TOKEN = 'test-service-token';

// Mock external services by default
jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));
