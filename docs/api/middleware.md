# Middleware API Reference

Middleware in the IXP Server SDK provides a powerful way to intercept, modify, and enhance requests and responses. Middleware functions execute in a pipeline, allowing you to add cross-cutting concerns like authentication, logging, validation, and more.

## Table of Contents

- [Overview](#overview)
- [Middleware Definition](#middleware-definition)
- [Middleware Types](#middleware-types)
- [Execution Pipeline](#execution-pipeline)
- [Built-in Middleware](#built-in-middleware)
- [Custom Middleware](#custom-middleware)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Middleware functions are executed in sequence during request processing. Each middleware can:

- Modify the request before it reaches the intent handler
- Transform the response before it's sent to the client
- Perform side effects like logging or analytics
- Short-circuit the pipeline by returning early
- Handle errors and provide fallback responses

## Middleware Definition

### Basic Structure

```typescript
interface MiddlewareDefinition {
  name: string;
  description: string;
  version: string;
  type: MiddlewareType;
  priority: number;
  handler: MiddlewareHandler;
  config?: MiddlewareConfig;
  dependencies?: string[];
}

type MiddlewareType = 'request' | 'response' | 'error' | 'global';

type MiddlewareHandler = (
  context: MiddlewareContext,
  next: NextFunction
) => Promise<void> | void;
```

### Properties

#### `name` (required)
- **Type:** `string`
- **Description:** Unique identifier for the middleware
- **Example:** `"auth-validator"`, `"request-logger"`

#### `description` (required)
- **Type:** `string`
- **Description:** Human-readable description of the middleware's purpose
- **Example:** `"Validates user authentication tokens"`

#### `version` (required)
- **Type:** `string`
- **Description:** Version of the middleware
- **Example:** `"1.1.1"`

#### `type` (required)
- **Type:** `MiddlewareType`
- **Description:** When the middleware executes
- **Options:**
  - `request` - Executes before intent processing
  - `response` - Executes after intent processing
  - `error` - Executes when errors occur
  - `global` - Executes for all requests

#### `priority` (required)
- **Type:** `number`
- **Description:** Execution order (lower numbers execute first)
- **Range:** `0-1000`

#### `handler` (required)
- **Type:** `MiddlewareHandler`
- **Description:** The middleware function

#### `config` (optional)
- **Type:** `MiddlewareConfig`
- **Description:** Configuration options for the middleware

#### `dependencies` (optional)
- **Type:** `string[]`
- **Description:** Names of middleware that must execute before this one

## Middleware Types

### Request Middleware

Executes before intent processing to modify or validate requests.

```typescript
const requestLogger: MiddlewareDefinition = {
  name: 'request-logger',
  description: 'Logs incoming requests',
  version: '1.1.1',
  type: 'request',
  priority: 10,
  handler: async (context, next) => {
    const { request } = context;
    console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
    
    // Continue to next middleware
    await next();
  }
};
```

### Response Middleware

Executes after intent processing to modify responses.

```typescript
const responseHeaders: MiddlewareDefinition = {
  name: 'response-headers',
  description: 'Adds security headers to responses',
  version: '1.1.1',
  type: 'response',
  priority: 100,
  handler: async (context, next) => {
    await next();
    
    const { response } = context;
    response.headers['X-Content-Type-Options'] = 'nosniff';
    response.headers['X-Frame-Options'] = 'DENY';
    response.headers['X-XSS-Protection'] = '1; mode=block';
  }
};
```

### Error Middleware

Handles errors that occur during request processing.

```typescript
const errorHandler: MiddlewareDefinition = {
  name: 'error-handler',
  description: 'Handles and formats errors',
  version: '1.1.1',
  type: 'error',
  priority: 1000,
  handler: async (context, next) => {
    try {
      await next();
    } catch (error) {
      const { response } = context;
      
      console.error('Request error:', error);
      
      response.status = error.status || 500;
      response.body = {
        error: {
          message: error.message || 'Internal Server Error',
          code: error.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
```

### Global Middleware

Executes for all requests regardless of intent.

```typescript
const corsHandler: MiddlewareDefinition = {
  name: 'cors-handler',
  description: 'Handles CORS requests',
  version: '1.1.1',
  type: 'global',
  priority: 5,
  handler: async (context, next) => {
    const { request, response } = context;
    
    // Set CORS headers
    response.headers['Access-Control-Allow-Origin'] = '*';
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      response.status = 200;
      response.body = '';
      return; // Don't call next()
    }
    
    await next();
  }
};
```

## Execution Pipeline

### Pipeline Order

1. **Global Middleware** (by priority)
2. **Request Middleware** (by priority)
3. **Intent Processing**
4. **Response Middleware** (by priority)
5. **Error Middleware** (if errors occur)

### Context Object

The middleware context provides access to request and response data:

```typescript
interface MiddlewareContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    params: Record<string, any>;
    query: Record<string, any>;
    intent?: string;
    user?: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  server: IXPServer;
  metadata: Record<string, any>;
}
```

### Next Function

The `next` function continues execution to the next middleware:

```typescript
// Continue to next middleware
await next();

// Skip remaining middleware (short-circuit)
return;

// Pass error to error middleware
throw new Error('Something went wrong');
```

## Built-in Middleware

### Authentication Middleware

```typescript
import { authMiddleware } from 'ixp-server/middleware';

const auth = authMiddleware({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  skipPaths: ['/health', '/public']
});
```

### Rate Limiting Middleware

```typescript
import { rateLimitMiddleware } from 'ixp-server/middleware';

const rateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Validation Middleware

```typescript
import { validationMiddleware } from 'ixp-server/middleware';

const validation = validationMiddleware({
  validateHeaders: true,
  validateParams: true,
  validateBody: true,
  strict: true
});
```

### Compression Middleware

```typescript
import { compressionMiddleware } from 'ixp-server/middleware';

const compression = compressionMiddleware({
  threshold: 1024, // Only compress responses > 1KB
  algorithms: ['gzip', 'deflate']
});
```

## Custom Middleware

### Creating Custom Middleware

```typescript
const customAnalytics: MiddlewareDefinition = {
  name: 'analytics-tracker',
  description: 'Tracks request analytics',
  version: '1.1.1',
  type: 'request',
  priority: 20,
  config: {
    endpoint: process.env.ANALYTICS_ENDPOINT,
    apiKey: process.env.ANALYTICS_API_KEY
  },
  handler: async (context, next) => {
    const startTime = Date.now();
    
    // Add request ID for tracking
    context.metadata.requestId = generateRequestId();
    
    try {
      await next();
      
      // Track successful request
      await trackEvent({
        type: 'request_success',
        requestId: context.metadata.requestId,
        intent: context.request.intent,
        duration: Date.now() - startTime,
        status: context.response.status
      });
    } catch (error) {
      // Track failed request
      await trackEvent({
        type: 'request_error',
        requestId: context.metadata.requestId,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      throw error; // Re-throw to continue error handling
    }
  }
};

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

async function trackEvent(event: any): Promise<void> {
  // Send analytics event to external service
  try {
    await fetch(process.env.ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
      },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}
```

### Conditional Middleware

```typescript
const conditionalAuth: MiddlewareDefinition = {
  name: 'conditional-auth',
  description: 'Applies authentication based on intent',
  version: '1.1.1',
  type: 'request',
  priority: 15,
  config: {
    protectedIntents: ['user_profile', 'account_settings', 'private_data'],
    publicIntents: ['home', 'about', 'contact']
  },
  handler: async (context, next) => {
    const { request } = context;
    const { protectedIntents, publicIntents } = context.config;
    
    // Skip auth for public intents
    if (publicIntents.includes(request.intent)) {
      await next();
      return;
    }
    
    // Require auth for protected intents
    if (protectedIntents.includes(request.intent)) {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      try {
        const user = await validateToken(token);
        context.request.user = user;
      } catch (error) {
        throw new Error('Invalid authentication token');
      }
    }
    
    await next();
  }
};
```

### Middleware with Dependencies

```typescript
const userEnrichment: MiddlewareDefinition = {
  name: 'user-enrichment',
  description: 'Enriches request with user data',
  version: '1.1.1',
  type: 'request',
  priority: 25,
  dependencies: ['conditional-auth'], // Runs after auth middleware
  handler: async (context, next) => {
    const { request } = context;
    
    if (request.user) {
      // Fetch additional user data
      const userProfile = await getUserProfile(request.user.id);
      const userPreferences = await getUserPreferences(request.user.id);
      
      // Enrich request with user data
      context.request.user = {
        ...request.user,
        profile: userProfile,
        preferences: userPreferences
      };
    }
    
    await next();
  }
};
```

## Error Handling

### Error Types

```typescript
class MiddlewareError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'MiddlewareError';
  }
}

// Usage in middleware
throw new MiddlewareError(
  'Invalid API key',
  'INVALID_API_KEY',
  401,
  { providedKey: apiKey }
);
```

### Comprehensive Error Handler

```typescript
const comprehensiveErrorHandler: MiddlewareDefinition = {
  name: 'comprehensive-error-handler',
  description: 'Handles all types of errors with proper formatting',
  version: '1.1.1',
  type: 'error',
  priority: 1000,
  handler: async (context, next) => {
    try {
      await next();
    } catch (error) {
      const { response } = context;
      
      // Log error for debugging
      console.error('Request failed:', {
        error: error.message,
        stack: error.stack,
        requestId: context.metadata.requestId,
        intent: context.request.intent,
        timestamp: new Date().toISOString()
      });
      
      // Format error response based on error type
      if (error instanceof MiddlewareError) {
        response.status = error.status;
        response.body = {
          error: {
            message: error.message,
            code: error.code,
            details: error.details
          }
        };
      } else if (error.name === 'ValidationError') {
        response.status = 400;
        response.body = {
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.details
          }
        };
      } else {
        // Generic error
        response.status = 500;
        response.body = {
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            requestId: context.metadata.requestId
          }
        };
      }
      
      // Set error headers
      response.headers['Content-Type'] = 'application/json';
    }
  }
};
```

## Examples

### API Key Authentication

```typescript
const apiKeyAuth: MiddlewareDefinition = {
  name: 'api-key-auth',
  description: 'Validates API keys',
  version: '1.1.1',
  type: 'request',
  priority: 10,
  config: {
    headerName: 'X-API-Key',
    validKeys: process.env.VALID_API_KEYS?.split(',') || []
  },
  handler: async (context, next) => {
    const { request } = context;
    const { headerName, validKeys } = context.config;
    
    const apiKey = request.headers[headerName.toLowerCase()];
    
    if (!apiKey) {
      throw new MiddlewareError(
        'API key required',
        'API_KEY_MISSING',
        401
      );
    }
    
    if (!validKeys.includes(apiKey)) {
      throw new MiddlewareError(
        'Invalid API key',
        'API_KEY_INVALID',
        401
      );
    }
    
    // Add API key info to request
    context.request.apiKey = apiKey;
    
    await next();
  }
};
```

### Request/Response Transformation

```typescript
const dataTransformer: MiddlewareDefinition = {
  name: 'data-transformer',
  description: 'Transforms request and response data',
  version: '1.1.1',
  type: 'global',
  priority: 50,
  handler: async (context, next) => {
    const { request, response } = context;
    
    // Transform request data
    if (request.body && typeof request.body === 'object') {
      // Convert snake_case to camelCase
      request.body = transformKeys(request.body, toCamelCase);
    }
    
    await next();
    
    // Transform response data
    if (response.body && typeof response.body === 'object') {
      // Convert camelCase to snake_case
      response.body = transformKeys(response.body, toSnakeCase);
    }
  }
};

function transformKeys(obj: any, transformer: (key: string) => string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const transformedKey = transformer(key);
      result[transformedKey] = transformKeys(obj[key], transformer);
      return result;
    }, {} as any);
  }
  
  return obj;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
```

### Caching Middleware

```typescript
const cacheMiddleware: MiddlewareDefinition = {
  name: 'response-cache',
  description: 'Caches responses for improved performance',
  version: '1.1.1',
  type: 'request',
  priority: 30,
  config: {
    ttl: 300, // 5 minutes
    cacheableIntents: ['weather', 'news', 'static_content'],
    cacheKeyPrefix: 'ixp_cache:'
  },
  handler: async (context, next) => {
    const { request } = context;
    const { ttl, cacheableIntents, cacheKeyPrefix } = context.config;
    
    // Only cache specific intents
    if (!cacheableIntents.includes(request.intent)) {
      await next();
      return;
    }
    
    // Generate cache key
    const cacheKey = `${cacheKeyPrefix}${request.intent}:${JSON.stringify(request.params)}`;
    
    // Try to get from cache
    const cached = await getFromCache(cacheKey);
    if (cached) {
      context.response.body = cached;
      context.response.headers['X-Cache'] = 'HIT';
      return; // Skip intent processing
    }
    
    // Process request
    await next();
    
    // Cache successful responses
    if (context.response.status === 200) {
      await setCache(cacheKey, context.response.body, ttl);
      context.response.headers['X-Cache'] = 'MISS';
    }
  }
};

// Cache implementation (using Redis or in-memory)
const cache = new Map();

async function getFromCache(key: string): Promise<any> {
  return cache.get(key);
}

async function setCache(key: string, value: any, ttl: number): Promise<void> {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl * 1000);
}
```

## Best Practices

### 1. Middleware Design
- Keep middleware focused on a single responsibility
- Make middleware reusable across different projects
- Use appropriate priority values to control execution order
- Handle errors gracefully and provide meaningful messages

### 2. Performance
- Avoid heavy computations in middleware
- Use async/await properly to prevent blocking
- Cache expensive operations when possible
- Set appropriate timeouts for external calls

### 3. Configuration
- Make middleware configurable through environment variables
- Provide sensible defaults for configuration options
- Validate configuration at startup
- Document all configuration options

### 4. Error Handling
- Always handle errors appropriately
- Provide detailed error information for debugging
- Use proper HTTP status codes
- Log errors with sufficient context

### 5. Testing
- Write unit tests for middleware logic
- Test error conditions and edge cases
- Mock external dependencies in tests
- Test middleware integration with the pipeline

### 6. Security
- Validate all inputs in security-related middleware
- Use secure defaults for configuration
- Avoid logging sensitive information
- Follow security best practices for authentication and authorization

## Related Documentation

- [Core API](./core.md) - Understand the core server functionality
- [Intents API](./intents.md) - Learn about intent definitions
- [Components API](./components.md) - Understand component rendering
- [Configuration Guide](../guides/configuration.md) - Configure your server