# Middleware Guide

Middleware in IXP Server provides a powerful way to process requests and responses in a pipeline fashion.

## Overview

Middleware functions are executed in order for each request, allowing you to:
- Validate requests
- Add security headers
- Rate limit requests
- Log requests and responses
- Transform data
- Handle errors

## Built-in Middleware

### Rate Limiting Middleware

Protects your server from abuse by limiting the number of requests per IP.

```typescript
import { createRateLimitMiddleware } from 'ixp-server';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false, // Don't skip successful requests
  skipFailedRequests: false, // Don't skip failed requests
  keyGenerator: (req) => req.ip, // Use IP as key
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.round(windowMs / 1000)
    });
  }
});
```

**Configuration Options:**
- `windowMs`: Time window in milliseconds
- `max`: Maximum number of requests per window
- `message`: Error message when limit exceeded
- `standardHeaders`: Include standard rate limit headers
- `keyGenerator`: Function to generate rate limit key
- `handler`: Custom handler for rate limit exceeded

### Validation Middleware

Validates incoming requests against schemas.

```typescript
import { createValidationMiddleware } from 'ixp-server';

const validationMiddleware = createValidationMiddleware({
  validateIntentParameters: true,
  validateComponentProps: true,
  strictMode: true,
  allowUnknownProperties: false,
  sanitizeInputs: true,
  maxPayloadSize: '10MB',
  customValidators: {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^\+?[1-9]\d{1,14}$/.test(value)
  }
});
```

**Configuration Options:**
- `validateIntentParameters`: Validate intent parameters against schema
- `validateComponentProps`: Validate component props
- `strictMode`: Strict validation mode
- `allowUnknownProperties`: Allow properties not in schema
- `sanitizeInputs`: Sanitize input values
- `maxPayloadSize`: Maximum request payload size
- `customValidators`: Custom validation functions

### Origin Validation Middleware

Validates request origins for security.

```typescript
import { createOriginValidationMiddleware } from 'ixp-server';

const originValidationMiddleware = createOriginValidationMiddleware({
  allowedOrigins: [
    'http://localhost:3000',
    'https://myapp.com',
    /^https:\/\/.*\.myapp\.com$/
  ],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID']
});
```

**Configuration Options:**
- `allowedOrigins`: Array of allowed origins (strings or RegExp)
- `allowCredentials`: Allow credentials in CORS requests
- `maxAge`: Preflight cache duration
- `methods`: Allowed HTTP methods
- `allowedHeaders`: Allowed request headers
- `exposedHeaders`: Headers exposed to client

### Timeout Middleware

Sets request timeouts to prevent hanging requests.

```typescript
import { createTimeoutMiddleware } from 'ixp-server';

const timeoutMiddleware = createTimeoutMiddleware({
  timeout: 30000, // 30 seconds
  message: 'Request timeout',
  skipSuccessfulRequests: false,
  onTimeout: (req, res) => {
    console.log(`Request timeout: ${req.method} ${req.path}`);
    res.status(408).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  }
});
```

**Configuration Options:**
- `timeout`: Timeout duration in milliseconds
- `message`: Timeout error message
- `skipSuccessfulRequests`: Don't timeout successful requests
- `onTimeout`: Custom timeout handler

### Request ID Middleware

Adds unique request IDs for tracking and debugging.

```typescript
import { createRequestIdMiddleware } from 'ixp-server';

const requestIdMiddleware = createRequestIdMiddleware({
  headerName: 'X-Request-ID',
  generator: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  setResponseHeader: true,
  attributeName: 'requestId'
});
```

**Configuration Options:**
- `headerName`: Header name for request ID
- `generator`: Function to generate request ID
- `setResponseHeader`: Include request ID in response headers
- `attributeName`: Request attribute name for ID

### Compression Middleware

Compresses responses to reduce bandwidth usage.

```typescript
import { createCompressionMiddleware } from 'ixp-server';

const compressionMiddleware = createCompressionMiddleware({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Minimum size to compress (bytes)
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return true;
  }
});
```

### Security Headers Middleware

Adds security headers to responses.

```typescript
import { createSecurityHeadersMiddleware } from 'ixp-server';

const securityHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
});
```

## Using Middleware

### Configuration-based

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  middleware: [
    'rateLimit',
    'validation',
    'originValidation',
    'timeout',
    'requestId',
    'compression',
    'securityHeaders'
  ]
});
```

### Programmatic

```typescript
import { 
  createIXPServer,
  createRateLimitMiddleware,
  createValidationMiddleware
} from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json'
});

// Add middleware programmatically
server.use(createRateLimitMiddleware({ max: 100 }));
server.use(createValidationMiddleware({ strictMode: true }));
```

### With Options

```typescript
const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  middleware: [
    {
      name: 'rateLimit',
      options: {
        windowMs: 15 * 60 * 1000,
        max: 100
      }
    },
    {
      name: 'validation',
      options: {
        validateIntentParameters: true,
        strictMode: true
      }
    }
  ]
});
```

## Custom Middleware

### Basic Custom Middleware

```typescript
import { MiddlewareFunction } from 'ixp-server';

const customLoggingMiddleware: MiddlewareFunction = (req, res, next) => {
  const start = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Continue to next middleware
  next();
  
  // This runs after the response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
};
```

### Middleware with Configuration

```typescript
interface CustomMiddlewareOptions {
  logLevel: 'info' | 'debug' | 'error';
  includeHeaders: boolean;
  excludePaths: string[];
}

function createCustomMiddleware(options: CustomMiddlewareOptions): MiddlewareFunction {
  const { logLevel, includeHeaders, excludePaths } = options;
  
  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.includes(req.path)) {
      return next();
    }
    
    const logData: any = {
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    };
    
    if (includeHeaders) {
      logData.headers = req.headers;
    }
    
    console.log(`[${logLevel.toUpperCase()}]`, logData);
    
    next();
  };
}

// Usage
const customMiddleware = createCustomMiddleware({
  logLevel: 'info',
  includeHeaders: false,
  excludePaths: ['/health', '/metrics']
});
```

### Async Middleware

```typescript
const asyncMiddleware: MiddlewareFunction = async (req, res, next) => {
  try {
    // Perform async operations
    const user = await authenticateUser(req.headers.authorization);
    
    // Add user to request
    (req as any).user = user;
    
    next();
  } catch (error) {
    // Handle errors
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};
```

### Error Handling Middleware

```typescript
const errorHandlingMiddleware: MiddlewareFunction = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};
```

## Middleware Factory Pattern

```typescript
class MiddlewareFactory {
  static rateLimit = createRateLimitMiddleware;
  static validation = createValidationMiddleware;
  static originValidation = createOriginValidationMiddleware;
  static timeout = createTimeoutMiddleware;
  static requestId = createRequestIdMiddleware;
  static compression = createCompressionMiddleware;
  static securityHeaders = createSecurityHeadersMiddleware;
  
  // Custom middleware factories
  static customLogging(options: LoggingOptions) {
    return createCustomMiddleware(options);
  }
  
  static authentication(options: AuthOptions) {
    return createAuthMiddleware(options);
  }
}

// Usage
const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  middleware: [
    MiddlewareFactory.rateLimit({ max: 100 }),
    MiddlewareFactory.validation({ strictMode: true }),
    MiddlewareFactory.customLogging({ logLevel: 'info' })
  ]
});
```

## Middleware Order

Middleware execution order is important. Recommended order:

1. **Security headers** - Set security headers early
2. **CORS/Origin validation** - Handle CORS preflight requests
3. **Rate limiting** - Block excessive requests early
4. **Request ID** - Add tracking ID
5. **Compression** - Enable response compression
6. **Timeout** - Set request timeouts
7. **Authentication** - Authenticate users
8. **Validation** - Validate request data
9. **Business logic** - Your application logic
10. **Error handling** - Handle errors (should be last)

```typescript
const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  middleware: [
    'securityHeaders',
    'originValidation',
    'rateLimit',
    'requestId',
    'compression',
    'timeout',
    'authentication',
    'validation'
    // Business logic middleware would go here
    // Error handling middleware should be last
  ]
});
```

## Conditional Middleware

```typescript
const conditionalMiddleware: MiddlewareFunction = (req, res, next) => {
  // Only apply to specific paths
  if (req.path.startsWith('/api/admin')) {
    return adminAuthMiddleware(req, res, next);
  }
  
  // Only apply in production
  if (process.env.NODE_ENV === 'production') {
    return productionOnlyMiddleware(req, res, next);
  }
  
  // Skip middleware
  next();
};
```

## Testing Middleware

```typescript
import request from 'supertest';
import { createIXPApp } from 'ixp-server';

describe('Custom Middleware', () => {
  let app;
  
  beforeEach(() => {
    app = createIXPApp({
      intents: [],
      components: {},
      middleware: [customLoggingMiddleware]
    });
  });
  
  it('should add request ID header', async () => {
    const response = await request(app)
      .get('/ixp/health')
      .expect(200);
    
    expect(response.headers['x-request-id']).toBeDefined();
  });
  
  it('should handle rate limiting', async () => {
    // Make multiple requests to trigger rate limit
    for (let i = 0; i < 101; i++) {
      await request(app).get('/ixp/health');
    }
    
    const response = await request(app)
      .get('/ixp/health')
      .expect(429);
    
    expect(response.body.error).toBe('Rate limit exceeded');
  });
});
```

## Best Practices

1. **Keep middleware focused** - Each middleware should have a single responsibility
2. **Handle errors gracefully** - Always include error handling
3. **Use async/await** - For asynchronous operations
4. **Order matters** - Place middleware in the correct order
5. **Performance** - Avoid heavy operations in middleware
6. **Testing** - Write tests for custom middleware
7. **Documentation** - Document middleware behavior and configuration
8. **Security** - Validate and sanitize all inputs
9. **Logging** - Log important events and errors
10. **Configuration** - Make middleware configurable

## Troubleshooting

### Common Issues

1. **Middleware not executing**: Check middleware order and ensure `next()` is called
2. **Rate limiting too aggressive**: Adjust `windowMs` and `max` values
3. **CORS errors**: Configure `allowedOrigins` correctly
4. **Validation failures**: Check schema definitions and input data
5. **Performance issues**: Profile middleware execution time
6. **Memory leaks**: Ensure proper cleanup in middleware

### Debugging

```typescript
const debugMiddleware: MiddlewareFunction = (req, res, next) => {
  console.log('Middleware stack:', req.app._router.stack.map(layer => layer.name));
  console.log('Current middleware:', arguments.callee.name);
  next();
};
```