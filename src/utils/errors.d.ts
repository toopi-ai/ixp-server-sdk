import type { IXPError as IIXPError, IXPErrorResponse } from '../types/index';
/**
 * Custom IXP Error class with structured error information
 */
export declare class IXPError extends Error implements IIXPError {
    readonly code: string;
    readonly statusCode: number;
    readonly timestamp: string;
    readonly details?: any;
    constructor(message: string, code?: string, statusCode?: number, details?: any);
    /**
     * Convert error to API response format
     */
    toResponse(): IXPErrorResponse;
    /**
     * Create error from unknown error object
     */
    static fromError(error: unknown, defaultCode?: string): IXPError;
}
/**
 * Predefined error factory functions
 */
export declare const ErrorFactory: {
    /**
     * Intent not found error
     */
    intentNotFound(intentName: string): IXPError;
    /**
     * Component not found error
     */
    componentNotFound(componentName: string): IXPError;
    /**
     * Invalid request error
     */
    invalidRequest(message: string, details?: any): IXPError;
    /**
     * Parameter validation error
     */
    parameterValidation(errors: string[], details?: any): IXPError;
    /**
     * Component validation error
     */
    componentValidation(componentName: string, errors: string[]): IXPError;
    /**
     * Configuration error
     */
    configuration(message: string, details?: any): IXPError;
    /**
     * Rate limit exceeded error
     */
    rateLimitExceeded(limit: number, windowMs: number): IXPError;
    /**
     * Origin not allowed error
     */
    originNotAllowed(origin: string, componentName?: string): IXPError;
    /**
     * Plugin error
     */
    plugin(pluginName: string, message: string, details?: any): IXPError;
    /**
     * Data provider error
     */
    dataProvider(message: string, details?: any): IXPError;
    /**
     * File system error
     */
    fileSystem(operation: string, path: string, originalError?: Error): IXPError;
    /**
     * Network error
     */
    network(message: string, details?: any): IXPError;
    /**
     * Timeout error
     */
    timeout(operation: string, timeoutMs: number): IXPError;
};
/**
 * Error code constants
 */
export declare const ErrorCodes: {
    readonly INVALID_REQUEST: "INVALID_REQUEST";
    readonly INTENT_NOT_SUPPORTED: "INTENT_NOT_SUPPORTED";
    readonly COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND";
    readonly PARAMETER_VALIDATION_FAILED: "PARAMETER_VALIDATION_FAILED";
    readonly COMPONENT_VALIDATION_FAILED: "COMPONENT_VALIDATION_FAILED";
    readonly ORIGIN_NOT_ALLOWED: "ORIGIN_NOT_ALLOWED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly PLUGIN_ERROR: "PLUGIN_ERROR";
    readonly DATA_PROVIDER_ERROR: "DATA_PROVIDER_ERROR";
    readonly FILE_SYSTEM_ERROR: "FILE_SYSTEM_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
};
/**
 * Check if error is an IXP error
 */
export declare function isIXPError(error: unknown): error is IXPError;
/**
 * Get HTTP status code from error
 */
export declare function getErrorStatusCode(error: unknown): number;
/**
 * Convert any error to IXP error response format
 */
export declare function toErrorResponse(error: unknown): IXPErrorResponse;
//# sourceMappingURL=errors.d.ts.map