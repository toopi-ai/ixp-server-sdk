---
id: troubleshooting
title: Troubleshooting Guide
sidebar_label: Troubleshooting
sidebar_position: 9
description: Common issues and solutions when working with the IXP Server SDK
---

# Troubleshooting Guide

This guide helps you resolve common issues when working with the IXP Server SDK.

## Common Issues

### Server Startup Issues

#### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
1. Change the port in your configuration:
   ```typescript
   const server = createIXPServer({
     port: 3002, // Use a different port
     // ... other config
   });
   ```

2. Kill the process using the port:
   ```bash
   # Find the process
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

3. Use environment variable for port:
   ```typescript
   const server = createIXPServer({
     port: process.env.PORT || 3001,
     // ... other config
   });
   ```

#### Configuration File Not Found

**Error:**
```
Error: ENOENT: no such file or directory, open './config/intents.json'
```

**Solutions:**
1. Verify file paths are correct:
   ```typescript
   const server = createIXPServer({
     intents: path.resolve(__dirname, '../config/intents.json'),
     components: path.resolve(__dirname, '../config/components.json')
   });
   ```

2. Use inline configuration instead:
   ```typescript
   const server = createIXPServer({
     intents: [
       // Define intents directly
     ],
     components: {
       // Define components directly
     }
   });
   ```

#### Invalid Configuration Schema

**Error:**
```
Validation Error: Invalid configuration schema
```

**Solutions:**
1. Validate your configuration against the schema:
   ```typescript
   import { validateConfig } from 'ixp-server';
   
   const config = {
     // your config
   };
   
   const validation = validateConfig(config);
   if (!validation.valid) {
     console.error('Configuration errors:', validation.errors);
   }
   ```

2. Check required fields:
   ```json
   {
     "intents": [], // Required
     "components": {}, // Required
     "port": 3001 // Optional, defaults to 3000
   }
   ```

### Intent Resolution Issues

#### Intent Not Found

**Error:**
```
{
  "success": false,
  "error": {
    "code": "INTENT_NOT_FOUND",
    "message": "Intent 'unknown_intent' not found"
  }
}
```

**Solutions:**
1. Check intent name spelling:
   ```bash
   curl http://localhost:3001/ixp/intents
   ```

2. Verify intent is properly registered:
   ```typescript
   // Check if intent exists in configuration
   const intents = server.getIntents();
   console.log('Available intents:', intents.map(i => i.name));
   ```

3. Reload configuration if using file-based config:
   ```typescript
   server.reloadConfiguration();
   ```

#### Component Not Found

**Error:**
```
{
  "success": false,
  "error": {
    "code": "COMPONENT_NOT_FOUND",
    "message": "Component 'MyComponent' not found"
  }
}
```

**Solutions:**
1. Verify component is registered:
   ```bash
   curl http://localhost:3001/ixp/components
   ```

2. Check component name matches intent configuration:
   ```json
   {
     "name": "my_intent",
     "component": "MyComponent", // Must match component key
     // ...
   }
   ```

3. Ensure component definition is complete:
   ```json
   {
     "MyComponent": {
       "name": "MyComponent",
       "framework": "react",
       "remoteUrl": "https://example.com/MyComponent.js",
       "exportName": "MyComponent",
       "propsSchema": { /* ... */ },
       "version": "1.0.0",
       "allowedOrigins": ["*"]
     }
   }
   ```

#### Parameter Validation Errors

**Error:**
```
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parameter validation failed",
    "details": [
      {
        "field": "email",
        "message": "must be a valid email"
      }
    ]
  }
}
```

**Solutions:**
1. Check parameter schema in intent definition:
   ```json
   {
     "parameters": {
       "type": "object",
       "properties": {
         "email": {
           "type": "string",
           "format": "email"
         }
       },
       "required": ["email"]
     }
   }
   ```

2. Validate request payload:
   ```javascript
   const request = {
     intent: {
       name: 'my_intent',
       parameters: {
         email: 'user@example.com' // Must be valid email
       }
     }
   };
   ```

### Component Loading Issues

#### Remote Component Failed to Load

**Error:**
```
Component load error: Failed to fetch component from https://example.com/Component.js
```

**Solutions:**
1. Check component URL accessibility:
   ```bash
   curl -I https://example.com/Component.js
   ```

2. Verify CORS headers on component server:
   ```javascript
   // Component server should include:
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Methods', 'GET');
   ```

3. Use local fallback:
   ```json
   {
     "MyComponent": {
       "remoteUrl": "https://example.com/Component.js",
       "fallbackUrl": "./local/Component.js",
       // ...
     }
   }
   ```

#### Component Security Policy Violation

**Error:**
```
Security Policy Violation: Component exceeds maximum bundle size
```

**Solutions:**
1. Increase bundle size limit:
   ```json
   {
     "MyComponent": {
       "securityPolicy": {
         "maxBundleSize": "200KB" // Increase limit
       }
     }
   }
   ```

2. Optimize component bundle:
   ```bash
   # Analyze bundle size
   npm run build -- --analyze
   
   # Use code splitting
   const LazyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

### Middleware Issues

#### Rate Limiting Too Strict

**Error:**
```
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

**Solutions:**
1. Adjust rate limit configuration:
   ```typescript
   server.use(createRateLimitMiddleware({
     max: 200, // Increase limit
     windowMs: 15 * 60 * 1000, // 15 minutes
     skipSuccessfulRequests: true
   }));
   ```

2. Implement custom rate limiting logic:
   ```typescript
   const customRateLimit = (req, res, next) => {
     // Custom logic based on user type, endpoint, etc.
     if (req.user?.premium) {
       return next(); // Skip rate limiting for premium users
     }
     // Apply standard rate limiting
     rateLimitMiddleware(req, res, next);
   };
   ```

#### CORS Issues

**Error:**
```
Access to fetch at 'http://localhost:3001/ixp/render' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. Configure CORS properly:
   ```typescript
   const server = createIXPServer({
     cors: {
       origins: ['http://localhost:3000', 'https://myapp.com'],
       credentials: true,
       methods: ['GET', 'POST', 'OPTIONS']
     }
   });
   ```

2. Use wildcard for development:
   ```typescript
   const server = createIXPServer({
     cors: {
       origins: process.env.NODE_ENV === 'development' ? ['*'] : ['https://myapp.com']
     }
   });
   ```

### Performance Issues

#### Slow Response Times

**Symptoms:**
- API responses taking > 2 seconds
- High CPU usage
- Memory leaks

**Solutions:**
1. Enable response caching:
   ```typescript
   server.plugin(createCachePlugin({
     type: 'memory',
     defaultTTL: 300,
     maxSize: 1000
   }));
   ```

2. Add request timeout:
   ```typescript
   server.use(createTimeoutMiddleware({
     timeout: 5000 // 5 seconds
   }));
   ```

3. Monitor performance:
   ```typescript
   server.plugin(createMetricsPlugin({
     collectDefaultMetrics: true,
     customMetrics: [
       {
         name: 'response_time',
         help: 'Response time in milliseconds',
         type: 'histogram'
       }
     ]
   }));
   ```

#### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Server crashes with out-of-memory errors

**Solutions:**
1. Monitor memory usage:
   ```typescript
   setInterval(() => {
     const usage = process.memoryUsage();
     console.log('Memory usage:', {
       rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
       heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
     });
   }, 30000);
   ```

2. Implement proper cleanup:
   ```typescript
   process.on('SIGTERM', async () => {
     console.log('Shutting down gracefully...');
     await server.stop();
     process.exit(0);
   });
   ```

### Development Issues

#### Hot Reload Not Working

**Solutions:**
1. Ensure file watching is enabled:
   ```typescript
   const devServer = await createDevServer({
     hotReload: true,
     watchFiles: [
       './config/**/*.json',
       './src/**/*.ts'
     ]
   });
   ```

2. Check file permissions:
   ```bash
   # Ensure files are readable
   chmod 644 config/*.json
   ```

#### TypeScript Compilation Errors

**Error:**
```
TS2307: Cannot find module 'ixp-server' or its corresponding type declarations.
```

**Solutions:**
1. Install type definitions:
   ```bash
   npm install --save-dev @types/ixp-server
   ```

2. Add to tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true
     }
   }
   ```

## Debugging Tools

### Enable Debug Logging

```typescript
// Set environment variable
process.env.DEBUG = 'ixp:*';

// Or use debug mode
const server = createIXPServer({
  debugMode: true,
  logLevel: 'debug'
});
```

### Health Check Endpoint

```bash
# Check server health
curl http://localhost:3001/ixp/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "external_services": "healthy"
  }
}
```

### Metrics Endpoint

```bash
# View server metrics
curl http://localhost:3001/metrics

# Example metrics:
# ixp_requests_total{method="POST",route="/ixp/render",status="200"} 150
# ixp_request_duration_seconds{method="POST",route="/ixp/render"} 0.045
# ixp_active_connections 5
```

### Configuration Validation

```typescript
import { validateConfig, validateIntent, validateComponent } from 'ixp-server';

// Validate entire configuration
const configValidation = validateConfig(config);
if (!configValidation.valid) {
  console.error('Config errors:', configValidation.errors);
}

// Validate individual intent
const intentValidation = validateIntent(intentDefinition);
if (!intentValidation.valid) {
  console.error('Intent errors:', intentValidation.errors);
}

// Validate component
const componentValidation = validateComponent(componentDefinition);
if (!componentValidation.valid) {
  console.error('Component errors:', componentValidation.errors);
}
```

## Getting Help

### Log Analysis

1. **Enable structured logging:**
   ```typescript
   const server = createIXPServer({
     logging: {
       level: 'info',
       format: 'json',
       destination: './logs/ixp-server.log'
     }
   });
   ```

2. **Analyze logs:**
   ```bash
   # View recent errors
   grep "ERROR" logs/ixp-server.log | tail -20
   
   # Monitor logs in real-time
   tail -f logs/ixp-server.log | jq .
   ```

### Performance Profiling

```typescript
// Enable profiling
const server = createIXPServer({
  profiling: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of requests
    outputPath: './profiles'
  }
});

// Generate heap dump
server.generateHeapDump('./heap-dump.heapsnapshot');
```

### Community Resources

- **Documentation:** Check the latest docs at `/docs`
- **Examples:** Review example implementations in `/examples`
- **Issues:** Report bugs and feature requests on GitHub
- **Discussions:** Join community discussions for help and best practices

### Creating Minimal Reproduction

When reporting issues, create a minimal reproduction:

```typescript
// minimal-repro.ts
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: [
    {
      name: 'test_intent',
      description: 'Minimal test case',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      },
      component: 'TestComponent',
      version: '1.0.0'
    }
  ],
  components: {
    TestComponent: {
      name: 'TestComponent',
      framework: 'react',
      remoteUrl: 'http://localhost:5173/Test.js',
      exportName: 'Test',
      propsSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['*']
    }
  },
  port: 3001
});

server.listen().then(() => {
  console.log('Minimal reproduction server running');
}).catch(error => {
  console.error('Error:', error);
});
```

This troubleshooting guide covers the most common issues you might encounter. If you're still experiencing problems, please check the documentation or reach out to the community for support.