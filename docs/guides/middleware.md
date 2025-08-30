# Middleware Development Guide

This comprehensive guide covers how to develop, implement, and manage middleware in the IXP Server SDK.

## Table of Contents

- [Middleware Overview](#middleware-overview)
- [Middleware Types](#middleware-types)
- [Creating Middleware](#creating-middleware)
- [Middleware Registration](#middleware-registration)
- [Request Processing](#request-processing)
- [Response Processing](#response-processing)
- [Error Handling](#error-handling)
- [Middleware Composition](#middleware-composition)
- [Built-in Middleware](#built-in-middleware)
- [Custom Middleware Examples](#custom-middleware-examples)
- [Testing Middleware](#testing-middleware)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## Middleware Overview

Middleware in IXP Server provides a powerful way to intercept, modify, and enhance the request-response cycle. Middleware functions execute in a specific order and can perform various tasks such as authentication, logging, validation, transformation, and more.

### Middleware Execution Flow

```
Request → Middleware 1 → Middleware 2 → Intent Handler → Middleware 2 → Middleware 1 → Response
```

### Middleware Characteristics

- **Chainable**: Multiple middleware can be chained together
- **Bidirectional**: Can process both requests and responses
- **Configurable**: Can be configured with options
- **Reusable**: Can be applied to multiple routes or globally
- **Composable**: Can be combined to create complex processing pipelines

## Middleware Types

### Request Middleware

Processes incoming requests before they reach the intent handler.

```typescript
import { RequestMiddleware, MiddlewareContext, NextFunction } from 'ixp-server';

class RequestLoggingMiddleware implements RequestMiddleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request, logger } = context;
    
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    // Continue to next middleware
    await next();
  }
}
```

### Response Middleware

Processes responses before they are sent to the client.

```typescript
import { ResponseMiddleware, MiddlewareContext, NextFunction } from 'ixp-server';

class ResponseCompressionMiddleware implements ResponseMiddleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    // Continue to next middleware first
    await next();
    
    const { response, request } = context;
    
    // Check if client accepts compression
    const acceptEncoding = request.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('gzip') && response.body) {
      const compressed = await this.compressResponse(response.body);
      response.body = compressed;
      response.headers['content-encoding'] = 'gzip';
      response.headers['content-length'] = compressed.length.toString();
    }
  }
  
  private async compressResponse(data: any): Promise<Buffer> {
    // Compression logic here
    return Buffer.from(JSON.stringify(data));
  }
}
```

### Error Middleware

Handles errors that occur during request processing.

```typescript
import { ErrorMiddleware, MiddlewareContext, NextFunction } from 'ixp-server';

class ErrorHandlingMiddleware implements ErrorMiddleware {
  async process(error: Error, context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { response, logger, request } = context;
    
    logger.error('Request processing error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      userId: context.user?.id
    });
    
    // Handle different error types
    if (error.name === 'ValidationError') {
      response.status = 400;
      response.body = {
        error: 'Validation failed',
        details: error.details || [],
        code: 'VALIDATION_ERROR'
      };
    } else if (error.name === 'AuthenticationError') {
      response.status = 401;
      response.body = {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      };
    } else if (error.name === 'AuthorizationError') {
      response.status = 403;
      response.body = {
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      };
    } else {
      response.status = 500;
      response.body = {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
    
    // Don't call next() to stop error propagation
  }
}
```

### Global Middleware

Applies to all requests across the entire application.

```typescript
import { GlobalMiddleware, MiddlewareContext, NextFunction } from 'ixp-server';

class SecurityHeadersMiddleware implements GlobalMiddleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { response } = context;
    
    // Set security headers
    response.headers['X-Content-Type-Options'] = 'nosniff';
    response.headers['X-Frame-Options'] = 'DENY';
    response.headers['X-XSS-Protection'] = '1; mode=block';
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    response.headers['Content-Security-Policy'] = "default-src 'self'";
    
    await next();
  }
}
```

## Creating Middleware

### Basic Middleware Structure

```typescript
import { Middleware, MiddlewareContext, NextFunction, MiddlewareOptions } from 'ixp-server';

interface CustomMiddlewareOptions extends MiddlewareOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
}

class CustomMiddleware implements Middleware {
  private options: CustomMiddlewareOptions;
  
  constructor(options: CustomMiddlewareOptions = {}) {
    this.options = {
      enabled: true,
      timeout: 5000,
      retries: 3,
      ...options
    };
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    if (!this.options.enabled) {
      return next();
    }
    
    const startTime = Date.now();
    
    try {
      // Pre-processing logic
      await this.preProcess(context);
      
      // Continue to next middleware
      await next();
      
      // Post-processing logic
      await this.postProcess(context);
      
    } catch (error) {
      await this.handleError(error, context);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      context.logger.debug('Middleware execution completed', {
        middleware: this.constructor.name,
        duration
      });
    }
  }
  
  private async preProcess(context: MiddlewareContext): Promise<void> {
    // Pre-processing logic here
  }
  
  private async postProcess(context: MiddlewareContext): Promise<void> {
    // Post-processing logic here
  }
  
  private async handleError(error: Error, context: MiddlewareContext): Promise<void> {
    // Error handling logic here
  }
}
```

### Async Middleware

```typescript
class AsyncDataFetchMiddleware implements Middleware {
  private cache = new Map<string, any>();
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request, user } = context;
    
    // Fetch user data asynchronously
    const userData = await this.fetchUserData(user.id);
    
    // Add data to context for use by subsequent middleware and intent handlers
    context.userData = userData;
    
    await next();
  }
  
  private async fetchUserData(userId: string): Promise<any> {
    // Check cache first
    if (this.cache.has(userId)) {
      return this.cache.get(userId);
    }
    
    // Fetch from database
    const userData = await this.database.users.findById(userId);
    
    // Cache for future requests
    this.cache.set(userId, userData);
    
    return userData;
  }
}
```

### Conditional Middleware

```typescript
class ConditionalMiddleware implements Middleware {
  private condition: (context: MiddlewareContext) => boolean;
  private middleware: Middleware;
  
  constructor(condition: (context: MiddlewareContext) => boolean, middleware: Middleware) {
    this.condition = condition;
    this.middleware = middleware;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    if (this.condition(context)) {
      await this.middleware.process(context, next);
    } else {
      await next();
    }
  }
}

// Usage
const conditionalAuth = new ConditionalMiddleware(
  (context) => context.request.url.startsWith('/api/protected'),
  new AuthenticationMiddleware()
);
```

## Middleware Registration

### Global Registration

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer();

// Register global middleware (applies to all requests)
server.use(new SecurityHeadersMiddleware());
server.use(new RequestLoggingMiddleware());
server.use(new AuthenticationMiddleware());
server.use(new ErrorHandlingMiddleware());
```

### Route-Specific Registration

```typescript
// Register middleware for specific routes
server.use('/api/protected/*', new AuthorizationMiddleware());
server.use('/api/admin/*', new AdminAuthMiddleware());
server.use('/api/public/*', new RateLimitingMiddleware({ limit: 100 }));
```

### Intent-Specific Registration

```typescript
// Register middleware for specific intents
server.registerIntent(new WeatherIntent(), {
  middleware: [
    new CacheMiddleware({ ttl: 300 }),
    new ValidationMiddleware()
  ]
});
```

### Conditional Registration

```typescript
// Register middleware based on environment
if (process.env.NODE_ENV === 'development') {
  server.use(new DebugMiddleware());
}

if (process.env.NODE_ENV === 'production') {
  server.use(new CompressionMiddleware());
  server.use(new CacheMiddleware());
}

// Register middleware based on configuration
if (config.features.analytics) {
  server.use(new AnalyticsMiddleware());
}

if (config.security.rateLimiting.enabled) {
  server.use(new RateLimitingMiddleware(config.security.rateLimiting));
}
```

## Request Processing

### Request Transformation

```typescript
class RequestTransformMiddleware implements Middleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request } = context;
    
    // Transform request body
    if (request.body && typeof request.body === 'string') {
      try {
        request.body = JSON.parse(request.body);
      } catch (error) {
        throw new Error('Invalid JSON in request body');
      }
    }
    
    // Normalize headers
    request.headers = this.normalizeHeaders(request.headers);
    
    // Add computed fields
    request.timestamp = new Date().toISOString();
    request.requestId = this.generateRequestId();
    
    await next();
  }
  
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      normalized[key.toLowerCase()] = value;
    });
    
    return normalized;
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Request Validation

```typescript
import Joi from 'joi';

class RequestValidationMiddleware implements Middleware {
  private schema: Joi.ObjectSchema;
  
  constructor(schema: Joi.ObjectSchema) {
    this.schema = schema;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request } = context;
    
    try {
      // Validate request body
      const { error, value } = this.schema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        
        throw validationError;
      }
      
      // Replace request body with validated and sanitized data
      request.body = value;
      
      await next();
      
    } catch (error) {
      throw error;
    }
  }
}

// Usage
const userSchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120)
});

server.use('/api/users', new RequestValidationMiddleware(userSchema));
```

### Request Enrichment

```typescript
class RequestEnrichmentMiddleware implements Middleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request, user } = context;
    
    // Add geolocation data
    const clientIP = this.getClientIP(request);
    const geoData = await this.getGeolocation(clientIP);
    
    // Add device information
    const deviceInfo = this.parseUserAgent(request.headers['user-agent']);
    
    // Add user preferences
    const preferences = await this.getUserPreferences(user.id);
    
    // Enrich context with additional data
    context.geolocation = geoData;
    context.device = deviceInfo;
    context.preferences = preferences;
    
    await next();
  }
  
  private getClientIP(request: any): string {
    return request.headers['x-forwarded-for'] || 
           request.headers['x-real-ip'] || 
           request.connection.remoteAddress || 
           '127.0.0.1';
  }
  
  private async getGeolocation(ip: string): Promise<any> {
    // Mock geolocation service
    return {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    };
  }
  
  private parseUserAgent(userAgent: string): any {
    // Mock user agent parsing
    return {
      browser: 'Chrome',
      version: '91.0',
      os: 'Windows',
      device: 'Desktop'
    };
  }
  
  private async getUserPreferences(userId: string): Promise<any> {
    // Mock user preferences
    return {
      language: 'en',
      theme: 'light',
      notifications: true
    };
  }
}
```

## Response Processing

### Response Transformation

```typescript
class ResponseTransformMiddleware implements Middleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    await next();
    
    const { response, request } = context;
    
    // Transform response based on Accept header
    const acceptHeader = request.headers.accept || 'application/json';
    
    if (acceptHeader.includes('application/xml')) {
      response.body = this.jsonToXml(response.body);
      response.headers['content-type'] = 'application/xml';
    } else if (acceptHeader.includes('text/csv')) {
      response.body = this.jsonToCsv(response.body);
      response.headers['content-type'] = 'text/csv';
    } else {
      response.headers['content-type'] = 'application/json';
    }
    
    // Add response metadata
    if (typeof response.body === 'object') {
      response.body = {
        ...response.body,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.requestId,
          version: '1.0'
        }
      };
    }
  }
  
  private jsonToXml(data: any): string {
    // Simple JSON to XML conversion
    return `<?xml version="1.0"?><root>${JSON.stringify(data)}</root>`;
  }
  
  private jsonToCsv(data: any): string {
    // Simple JSON to CSV conversion
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      const rows = data.map(item => headers.map(header => item[header]).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
    return '';
  }
}
```

### Response Caching

```typescript
class ResponseCacheMiddleware implements Middleware {
  private cache = new Map<string, any>();
  private defaultTTL = 300; // 5 minutes
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { request, response } = context;
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next();
    }
    
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      // Return cached response
      response.body = cached.body;
      response.headers = { ...response.headers, ...cached.headers };
      response.headers['x-cache'] = 'HIT';
      return;
    }
    
    await next();
    
    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      this.setCache(cacheKey, {
        body: response.body,
        headers: response.headers
      });
      response.headers['x-cache'] = 'MISS';
    }
  }
  
  private generateCacheKey(request: any): string {
    return `${request.method}:${request.url}:${JSON.stringify(request.query || {})}`;
  }
  
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.defaultTTL * 1000) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }
  
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

## Error Handling

### Comprehensive Error Handler

```typescript
class ComprehensiveErrorMiddleware implements ErrorMiddleware {
  async process(error: Error, context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { response, request, logger, user } = context;
    
    // Log error with context
    logger.error('Request processing error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body
      },
      user: {
        id: user?.id,
        email: user?.email
      },
      timestamp: new Date().toISOString()
    });
    
    // Handle different error types
    const errorResponse = this.createErrorResponse(error, context);
    
    response.status = errorResponse.status;
    response.body = errorResponse.body;
    response.headers['content-type'] = 'application/json';
    
    // Add error tracking headers
    response.headers['x-error-id'] = this.generateErrorId();
    response.headers['x-error-type'] = error.name;
    
    // Don't call next() to stop error propagation
  }
  
  private createErrorResponse(error: Error, context: MiddlewareContext): { status: number; body: any } {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    switch (error.name) {
      case 'ValidationError':
        return {
          status: 400,
          body: {
            error: 'Validation failed',
            message: error.message,
            details: error.details || [],
            code: 'VALIDATION_ERROR',
            ...(isDevelopment && { stack: error.stack })
          }
        };
        
      case 'AuthenticationError':
        return {
          status: 401,
          body: {
            error: 'Authentication required',
            message: 'Please provide valid authentication credentials',
            code: 'AUTH_REQUIRED'
          }
        };
        
      case 'AuthorizationError':
        return {
          status: 403,
          body: {
            error: 'Access denied',
            message: 'You do not have permission to access this resource',
            code: 'ACCESS_DENIED'
          }
        };
        
      case 'NotFoundError':
        return {
          status: 404,
          body: {
            error: 'Resource not found',
            message: 'The requested resource could not be found',
            code: 'NOT_FOUND'
          }
        };
        
      case 'RateLimitError':
        return {
          status: 429,
          body: {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: error.retryAfter || 60
          }
        };
        
      default:
        return {
          status: 500,
          body: {
            error: 'Internal server error',
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            ...(isDevelopment && { stack: error.stack })
          }
        };
    }
  }
  
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Error Recovery Middleware

```typescript
class ErrorRecoveryMiddleware implements Middleware {
  private maxRetries = 3;
  private retryDelay = 1000;
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      try {
        await next();
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        
        if (attempt > this.maxRetries || !this.isRetryableError(error)) {
          throw error; // Re-throw if max retries reached or error is not retryable
        }
        
        context.logger.warn(`Request failed, retrying (${attempt}/${this.maxRetries})`, {
          error: error.message,
          attempt
        });
        
        // Wait before retrying with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }
  
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ServiceUnavailableError',
      'TemporaryError'
    ];
    
    return retryableErrors.includes(error.name);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Middleware Composition

### Pipeline Composition

```typescript
class MiddlewarePipeline {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }
  
  async execute(context: MiddlewareContext): Promise<void> {
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware.process(context, next);
      }
    };
    
    await next();
  }
}

// Usage
const pipeline = new MiddlewarePipeline()
  .use(new SecurityHeadersMiddleware())
  .use(new AuthenticationMiddleware())
  .use(new ValidationMiddleware())
  .use(new CacheMiddleware());

server.use(pipeline);
```

### Conditional Composition

```typescript
class ConditionalPipeline {
  private conditions: Array<{
    condition: (context: MiddlewareContext) => boolean;
    middleware: Middleware;
  }> = [];
  
  when(condition: (context: MiddlewareContext) => boolean, middleware: Middleware): this {
    this.conditions.push({ condition, middleware });
    return this;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    for (const { condition, middleware } of this.conditions) {
      if (condition(context)) {
        await middleware.process(context, async () => {});
      }
    }
    
    await next();
  }
}

// Usage
const conditionalPipeline = new ConditionalPipeline()
  .when(
    (ctx) => ctx.request.url.startsWith('/api/admin'),
    new AdminAuthMiddleware()
  )
  .when(
    (ctx) => ctx.user?.tier === 'premium',
    new PremiumFeaturesMiddleware()
  )
  .when(
    (ctx) => process.env.NODE_ENV === 'development',
    new DebugMiddleware()
  );
```

### Parallel Composition

```typescript
class ParallelMiddleware implements Middleware {
  private middlewares: Middleware[];
  
  constructor(middlewares: Middleware[]) {
    this.middlewares = middlewares;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    // Execute all middlewares in parallel
    await Promise.all(
      this.middlewares.map(middleware => 
        middleware.process(context, async () => {})
      )
    );
    
    await next();
  }
}

// Usage - for middlewares that don't depend on each other
const parallelMiddleware = new ParallelMiddleware([
  new AnalyticsMiddleware(),
  new MetricsMiddleware(),
  new AuditLogMiddleware()
]);
```

## Built-in Middleware

### Authentication Middleware

```typescript
import { AuthenticationMiddleware } from 'ixp-server/middleware';

// JWT Authentication
server.use(new AuthenticationMiddleware({
  type: 'jwt',
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  issuer: 'ixp-server',
  audience: 'ixp-client'
}));

// API Key Authentication
server.use(new AuthenticationMiddleware({
  type: 'apikey',
  header: 'x-api-key',
  validate: async (apiKey: string) => {
    // Validate API key
    return await apiKeyService.validate(apiKey);
  }
}));
```

### Rate Limiting Middleware

```typescript
import { RateLimitMiddleware } from 'ixp-server/middleware';

// Basic rate limiting
server.use(new RateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}));

// Advanced rate limiting with different limits for different routes
server.use('/api/public/*', new RateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 1000
}));

server.use('/api/premium/*', new RateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  keyGenerator: (context) => context.user.id // Rate limit per user
}));
```

### Validation Middleware

```typescript
import { ValidationMiddleware } from 'ixp-server/middleware';
import Joi from 'joi';

// Request validation
server.use('/api/users', new ValidationMiddleware({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(18)
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
}));
```

### Compression Middleware

```typescript
import { CompressionMiddleware } from 'ixp-server/middleware';

server.use(new CompressionMiddleware({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9)
  filter: (context) => {
    // Only compress JSON and text responses
    const contentType = context.response.headers['content-type'] || '';
    return contentType.includes('json') || contentType.includes('text');
  }
}));
```

## Custom Middleware Examples

### Analytics Middleware

```typescript
class AnalyticsMiddleware implements Middleware {
  private analyticsService: AnalyticsService;
  
  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    try {
      await next();
      
      // Track successful request
      await this.trackEvent(context, {
        type: 'request_completed',
        duration: Date.now() - startTime,
        status: 'success'
      });
      
    } catch (error) {
      // Track failed request
      await this.trackEvent(context, {
        type: 'request_failed',
        duration: Date.now() - startTime,
        status: 'error',
        error: error.name
      });
      
      throw error;
    }
  }
  
  private async trackEvent(context: MiddlewareContext, event: any): Promise<void> {
    const { request, user, geolocation, device } = context;
    
    await this.analyticsService.track({
      ...event,
      userId: user?.id,
      sessionId: context.session?.id,
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      geolocation,
      device,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Feature Flag Middleware

```typescript
class FeatureFlagMiddleware implements Middleware {
  private featureFlagService: FeatureFlagService;
  
  constructor(featureFlagService: FeatureFlagService) {
    this.featureFlagService = featureFlagService;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { user } = context;
    
    // Get feature flags for the user
    const featureFlags = await this.featureFlagService.getFlags(user.id, {
      userTier: user.tier,
      country: context.geolocation?.country,
      device: context.device?.type
    });
    
    // Add feature flags to context
    context.featureFlags = featureFlags;
    
    await next();
  }
}
```

### A/B Testing Middleware

```typescript
class ABTestingMiddleware implements Middleware {
  private abTestService: ABTestService;
  
  constructor(abTestService: ABTestService) {
    this.abTestService = abTestService;
  }
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    const { user } = context;
    
    // Get active experiments for the user
    const experiments = await this.abTestService.getExperiments(user.id);
    
    // Assign user to experiment variants
    const assignments = {};
    for (const experiment of experiments) {
      assignments[experiment.name] = await this.abTestService.assignVariant(
        experiment.id,
        user.id
      );
    }
    
    // Add experiment assignments to context
    context.experiments = assignments;
    
    await next();
    
    // Track experiment exposure
    for (const [experimentName, variant] of Object.entries(assignments)) {
      await this.abTestService.trackExposure(experimentName, variant, user.id);
    }
  }
}
```

## Testing Middleware

### Unit Testing

```typescript
import { createMockContext } from 'ixp-server/testing';
import RequestLoggingMiddleware from '../RequestLoggingMiddleware';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;
  let mockContext: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    middleware = new RequestLoggingMiddleware();
    mockContext = createMockContext({
      request: {
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'test-agent' }
      },
      logger: {
        info: jest.fn(),
        error: jest.fn()
      }
    });
    nextFn = jest.fn();
  });

  it('should log request information', async () => {
    await middleware.process(mockContext, nextFn);

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        userAgent: 'test-agent'
      })
    );
    
    expect(nextFn).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    nextFn.mockRejectedValue(error);

    await expect(middleware.process(mockContext, nextFn)).rejects.toThrow('Test error');
  });
});
```

### Integration Testing

```typescript
import { createTestServer } from 'ixp-server/testing';

describe('Middleware Integration', () => {
  let server: any;

  beforeEach(async () => {
    server = createTestServer({
      middleware: [
        new SecurityHeadersMiddleware(),
        new AuthenticationMiddleware(),
        new ValidationMiddleware()
      ]
    });
    
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should apply middleware in correct order', async () => {
    const response = await server.request({
      method: 'GET',
      url: '/api/test',
      headers: {
        'authorization': 'Bearer valid-token'
      }
    });

    // Check that security headers were added
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    
    // Check that authentication was successful
    expect(response.status).not.toBe(401);
  });
});
```

## Performance Considerations

### Middleware Optimization

```typescript
class OptimizedMiddleware implements Middleware {
  private cache = new LRUCache<string, any>({ max: 1000 });
  
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    // Use caching to avoid expensive operations
    const cacheKey = this.generateCacheKey(context);
    let result = this.cache.get(cacheKey);
    
    if (!result) {
      result = await this.expensiveOperation(context);
      this.cache.set(cacheKey, result);
    }
    
    context.cachedResult = result;
    
    await next();
  }
  
  private async expensiveOperation(context: MiddlewareContext): Promise<any> {
    // Expensive operation here
    return { computed: 'value' };
  }
  
  private generateCacheKey(context: MiddlewareContext): string {
    return `${context.user.id}:${context.request.url}`;
  }
}
```

### Async Optimization

```typescript
class AsyncOptimizedMiddleware implements Middleware {
  async process(context: MiddlewareContext, next: NextFunction): Promise<void> {
    // Start async operations early
    const userDataPromise = this.fetchUserData(context.user.id);
    const preferencesPromise = this.fetchPreferences(context.user.id);
    
    // Continue with synchronous work
    await next();
    
    // Wait for async operations to complete
    const [userData, preferences] = await Promise.all([
      userDataPromise,
      preferencesPromise
    ]);
    
    // Use the data in post-processing
    context.response.body = {
      ...context.response.body,
      userData,
      preferences
    };
  }
  
  private async fetchUserData(userId: string): Promise<any> {
    // Fetch user data
    return {};
  }
  
  private async fetchPreferences(userId: string): Promise<any> {
    // Fetch preferences
    return {};
  }
}
```

## Best Practices

### Design Principles

1. **Single Responsibility**: Each middleware should have one clear purpose
2. **Composability**: Design middleware to work well with others
3. **Configuration**: Make middleware configurable and reusable
4. **Error Handling**: Handle errors gracefully and provide meaningful messages
5. **Performance**: Optimize for performance and avoid blocking operations

### Implementation Guidelines

1. **Always call next()**: Unless you're intentionally stopping the pipeline
2. **Handle errors**: Catch and handle errors appropriately
3. **Use async/await**: Prefer async/await over promises for better readability
4. **Validate inputs**: Validate middleware configuration and inputs
5. **Log appropriately**: Log important events but avoid excessive logging

### Security Considerations

1. **Input validation**: Always validate and sanitize inputs
2. **Authentication**: Implement proper authentication checks
3. **Authorization**: Check user permissions before allowing access
4. **Rate limiting**: Implement rate limiting to prevent abuse
5. **Security headers**: Add appropriate security headers

### Performance Best Practices

1. **Caching**: Cache expensive operations and API calls
2. **Lazy loading**: Load resources only when needed
3. **Parallel processing**: Execute independent operations in parallel
4. **Resource cleanup**: Properly clean up resources
5. **Monitoring**: Monitor middleware performance and optimize bottlenecks

### Testing Strategies

1. **Unit tests**: Test middleware in isolation
2. **Integration tests**: Test middleware interactions
3. **Performance tests**: Test middleware under load
4. **Security tests**: Test for security vulnerabilities
5. **Error scenarios**: Test error handling and recovery

This guide provides a comprehensive foundation for developing robust, scalable, and secure middleware with the IXP Server SDK. For more advanced patterns and examples, refer to the [Examples](../examples/) section of the documentation.