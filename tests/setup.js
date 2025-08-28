"use strict";
/**
 * Test Setup for IXP Server SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
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
    log: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn()
};
// Extend Jest matchers
expect.extend({
    toBeValidIXPError(received) {
        const pass = received &&
            typeof received.code === 'string' &&
            typeof received.message === 'string' &&
            typeof received.statusCode === 'number' &&
            typeof received.timestamp === 'string';
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid IXP error`,
                pass: true
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid IXP error with code, message, statusCode, and timestamp`,
                pass: false
            };
        }
    },
    toBeValidIntentDefinition(received) {
        const pass = received &&
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
        }
        else {
            return {
                message: () => `expected ${received} to be a valid intent definition`,
                pass: false
            };
        }
    },
    toBeValidComponentDefinition(received) {
        const pass = received &&
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
        }
        else {
            return {
                message: () => `expected ${received} to be a valid component definition`,
                pass: false
            };
        }
    }
});
//# sourceMappingURL=setup.js.map