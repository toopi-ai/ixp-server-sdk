/**
 * Test Setup for IXP Server SDK
 */

import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
});

// Global test teardown
afterAll(() => {
  // Cleanup any global resources
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Extend Jest matchers
expect.extend({
  toBeValidIXPError(received: any) {
    const pass = 
      received &&
      typeof received.code === 'string' &&
      typeof received.message === 'string' &&
      typeof received.statusCode === 'number' &&
      typeof received.timestamp === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid IXP error`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid IXP error with code, message, statusCode, and timestamp`,
        pass: false
      };
    }
  },
  
  toBeValidIntentDefinition(received: any) {
    const pass = 
      received &&
      typeof received.name === 'string' &&
      typeof received.description === 'string' &&
      typeof received.component === 'string' &&
      typeof received.version === 'string' &&
      received.parameters &&
      received.parameters.type === 'object';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid intent definition`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid intent definition`,
        pass: false
      };
    }
  },
  
  toBeValidComponentDefinition(received: any) {
    const pass = 
      received &&
      typeof received.name === 'string' &&
      typeof received.framework === 'string' &&
      typeof received.remoteUrl === 'string' &&
      typeof received.exportName === 'string' &&
      typeof received.version === 'string' &&
      Array.isArray(received.allowedOrigins) &&
      received.propsSchema &&
      received.propsSchema.type === 'object';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid component definition`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid component definition`,
        pass: false
      };
    }
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidIXPError(): R;
      toBeValidIntentDefinition(): R;
      toBeValidComponentDefinition(): R;
    }
  }
}