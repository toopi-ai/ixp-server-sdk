/**
 * Middleware Factories for IXP Server
 */

import { Request, Response, NextFunction } from 'express';
import type { IXPMiddleware } from '../types/index';
import { ErrorFactory } from '../utils/errors';

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}): IXPMiddleware {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  const clients = new Map<string, { count: number; resetTime: number }>();

  return {
    name: 'rate-limit',
    priority: 100,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      let client = clients.get(ip);
      
      // Reset if window has passed
      if (!client || now > client.resetTime) {
        client = { count: 0, resetTime: now + windowMs };
        clients.set(ip, client);
      }
      
      // Check if limit exceeded
      if (client.count >= max) {
        const error = ErrorFactory.rateLimitExceeded(max, windowMs);
        return next(error);
      }
      
      // Increment counter
      client.count++;
      
      // Set headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - client.count).toString(),
        'X-RateLimit-Reset': new Date(client.resetTime).toISOString()
      });
      
      // Handle response to potentially skip counting
      const originalSend = res.send;
      res.send = function(body) {
        const statusCode = res.statusCode;
        
        if (
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          client!.count--;
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    }
  };
}

/**
 * Request validation middleware factory
 */
export function createValidationMiddleware(options: {
  maxBodySize?: string;
  allowedContentTypes?: string[];
  requireContentType?: boolean;
}): IXPMiddleware {
  const {
    maxBodySize = '10mb',
    allowedContentTypes = ['application/json', 'application/x-www-form-urlencoded'],
    requireContentType = true
  } = options;

  return {
    name: 'request-validation',
    priority: 90,
    handler: (req: Request, res: Response, next: NextFunction) => {
      // Check content type for POST requests
      if (req.method === 'POST' && requireContentType) {
        const contentType = req.get('Content-Type');
        
        if (!contentType) {
          return next(ErrorFactory.invalidRequest('Content-Type header is required'));
        }
        
        const isAllowed = allowedContentTypes.some(allowed => 
          contentType.toLowerCase().includes(allowed.toLowerCase())
        );
        
        if (!isAllowed) {
          return next(ErrorFactory.invalidRequest(
            `Unsupported Content-Type. Allowed: ${allowedContentTypes.join(', ')}`
          ));
        }
      }
      
      next();
    }
  };
}

/**
 * Origin validation middleware factory
 */
export function createOriginValidationMiddleware(options: {
  allowedOrigins: string[];
  allowCredentials?: boolean;
}): IXPMiddleware {
  const { allowedOrigins, allowCredentials = true } = options;

  return {
    name: 'origin-validation',
    priority: 95,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const origin = req.get('Origin');
      
      // Skip validation for same-origin requests
      if (!origin) {
        return next();
      }
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
      
      if (!isAllowed) {
        return next(ErrorFactory.originNotAllowed(origin));
      }
      
      // Set CORS headers
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': allowCredentials.toString()
      });
      
      next();
    }
  };
}

/**
 * Request timeout middleware factory
 */
export function createTimeoutMiddleware(options: {
  timeout?: number;
  message?: string;
}): IXPMiddleware {
  const {
    timeout = 30000, // 30 seconds
    message = 'Request timeout'
  } = options;

  return {
    name: 'request-timeout',
    priority: 80,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const timer = setTimeout(() => {
        if (!res.headersSent) {
          const error = ErrorFactory.timeout('request', timeout);
          next(error);
        }
      }, timeout);
      
      // Clear timeout when response finishes
      res.on('finish', () => clearTimeout(timer));
      res.on('close', () => clearTimeout(timer));
      
      next();
    }
  };
}

/**
 * Request ID middleware factory
 */
export function createRequestIdMiddleware(options: {
  headerName?: string;
  generator?: () => string;
}): IXPMiddleware {
  const {
    headerName = 'X-Request-ID',
    generator = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  } = options;

  return {
    name: 'request-id',
    priority: 110,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.get(headerName) || generator();
      
      // Add to request for logging
      (req as any).requestId = requestId;
      
      // Add to response headers
      res.set(headerName, requestId);
      
      next();
    }
  };
}

/**
 * Security headers middleware factory
 */
export function createSecurityHeadersMiddleware(options: {
  hsts?: boolean;
  noSniff?: boolean;
  xssProtection?: boolean;
  referrerPolicy?: string;
  frameOptions?: string;
}): IXPMiddleware {
  const {
    hsts = true,
    noSniff = true,
    xssProtection = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    frameOptions = 'DENY'
  } = options;

  return {
    name: 'security-headers',
    priority: 105,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const headers: Record<string, string> = {};
      
      if (hsts) {
        headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
      }
      
      if (noSniff) {
        headers['X-Content-Type-Options'] = 'nosniff';
      }
      
      if (xssProtection) {
        headers['X-XSS-Protection'] = '1; mode=block';
      }
      
      if (referrerPolicy) {
        headers['Referrer-Policy'] = referrerPolicy;
      }
      
      if (frameOptions) {
        headers['X-Frame-Options'] = frameOptions;
      }
      
      res.set(headers);
      next();
    }
  };
}

/**
 * Component access control middleware factory
 */
export function createComponentAccessMiddleware(options: {
  checkOrigin?: boolean;
  checkUserAgent?: boolean;
  allowedUserAgents?: string[];
}): IXPMiddleware {
  const {
    checkOrigin = true,
    checkUserAgent = false,
    allowedUserAgents = []
  } = options;

  return {
    name: 'component-access-control',
    priority: 70,
    routes: ['/render'],
    handler: (req: Request, res: Response, next: NextFunction) => {
      // Check User-Agent if enabled
      if (checkUserAgent && allowedUserAgents.length > 0) {
        const userAgent = req.get('User-Agent') || '';
        const isAllowed = allowedUserAgents.some(allowed => 
          userAgent.toLowerCase().includes(allowed.toLowerCase())
        );
        
        if (!isAllowed) {
          return next(ErrorFactory.invalidRequest('User-Agent not allowed'));
        }
      }
      
      // Additional component-specific checks can be added here
      next();
    }
  };
}

/**
 * Request logging middleware factory
 */
export function createLoggingMiddleware(options: {
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  includeBody?: boolean;
  includeHeaders?: boolean;
  maxBodyLength?: number;
}): IXPMiddleware {
  const {
    logLevel = 'info',
    includeBody = false,
    includeHeaders = false,
    maxBodyLength = 1000
  } = options;

  return {
    name: 'request-logging',
    priority: 120,
    handler: (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const requestId = (req as any).requestId || 'unknown';
      
      const logData: any = {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      if (includeHeaders) {
        logData.headers = req.headers;
      }
      
      if (includeBody && req.body) {
        const bodyStr = JSON.stringify(req.body);
        logData.body = bodyStr.length > maxBodyLength 
          ? bodyStr.substring(0, maxBodyLength) + '...' 
          : bodyStr;
      }
      
      console.log(`[${logLevel.toUpperCase()}] Request started:`, logData);
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${logLevel.toUpperCase()}] Request completed:`, {
          requestId,
          statusCode: res.statusCode,
          duration: `${duration}ms`
        });
      });
      
      next();
    }
  };
}

// Export all middleware factories
export const MiddlewareFactory = {
  rateLimit: createRateLimitMiddleware,
  validation: createValidationMiddleware,
  originValidation: createOriginValidationMiddleware,
  timeout: createTimeoutMiddleware,
  requestId: createRequestIdMiddleware,
  securityHeaders: createSecurityHeadersMiddleware,
  componentAccess: createComponentAccessMiddleware,
  logging: createLoggingMiddleware
};