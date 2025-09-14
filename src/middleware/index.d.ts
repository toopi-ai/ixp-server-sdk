/**
 * Middleware Factories for IXP Server
 */
import type { IXPMiddleware } from '../types/index';
export { createRenderMiddleware } from './renderMiddleware';
/**
 * Rate limiting middleware factory
 */
export declare function createRateLimitMiddleware(options: {
    windowMs?: number;
    max?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}): IXPMiddleware;
/**
 * Request validation middleware factory
 */
export declare function createValidationMiddleware(options: {
    maxBodySize?: string;
    allowedContentTypes?: string[];
    requireContentType?: boolean;
}): IXPMiddleware;
/**
 * Origin validation middleware factory
 */
export declare function createOriginValidationMiddleware(options: {
    allowedOrigins: string[];
    allowCredentials?: boolean;
}): IXPMiddleware;
/**
 * Request timeout middleware factory
 */
export declare function createTimeoutMiddleware(options: {
    timeout?: number;
    message?: string;
}): IXPMiddleware;
/**
 * Request ID middleware factory
 */
export declare function createRequestIdMiddleware(options: {
    headerName?: string;
    generator?: () => string;
}): IXPMiddleware;
/**
 * Security headers middleware factory
 */
export declare function createSecurityHeadersMiddleware(options: {
    hsts?: boolean;
    noSniff?: boolean;
    xssProtection?: boolean;
    referrerPolicy?: string;
    frameOptions?: string;
}): IXPMiddleware;
/**
 * Component access control middleware factory
 */
export declare function createComponentAccessMiddleware(options: {
    checkOrigin?: boolean;
    checkUserAgent?: boolean;
    allowedUserAgents?: string[];
}): IXPMiddleware;
/**
 * Request logging middleware factory
 */
export declare function createLoggingMiddleware(options: {
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    includeBody?: boolean;
    includeHeaders?: boolean;
    maxBodyLength?: number;
}): IXPMiddleware;
export declare const MiddlewareFactory: {
    rateLimit: typeof createRateLimitMiddleware;
    validation: typeof createValidationMiddleware;
    originValidation: typeof createOriginValidationMiddleware;
    timeout: typeof createTimeoutMiddleware;
    requestId: typeof createRequestIdMiddleware;
    securityHeaders: typeof createSecurityHeadersMiddleware;
    componentAccess: typeof createComponentAccessMiddleware;
    logging: typeof createLoggingMiddleware;
};
//# sourceMappingURL=index.d.ts.map