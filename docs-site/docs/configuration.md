---
id: configuration
title: Configuration Guide
sidebar_label: Configuration
sidebar_position: 3
description: Complete guide to configuring your IXP Server with all available options
---

# Configuration Guide

Comprehensive guide to configuring your IXP Server.

## Basic Configuration

### Minimal Configuration

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001
});
```

### Using ConfigBuilder

```typescript
import { ConfigBuilder } from 'ixp-server';

const config = ConfigBuilder.create()
  .port(3001)
  .intents('./config/intents.json')
  .components('./config/components.json')
  .middleware(['rateLimit', 'validation', 'cors'])
  .plugins(['swagger', 'healthMonitoring', 'metrics'])
  .build();

const server = createIXPServer(config);
```

## Configuration Options

### IXPServerConfig Interface

```typescript
interface IXPServerConfig {
  // Core settings
  port?: number;
  intents: IntentDefinition[] | string;
  components: ComponentRegistry | string;
  
  // Extensions
  middleware?: (string | MiddlewareFunction)[];
  plugins?: (string | PluginFunction)[];
  
  // Security & Performance
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;
  
  // Features
  logging?: LoggingOptions;
  dataProviders?: DataProviderConfig[];
  theme?: ThemeConfig;
  crawler?: CrawlerConfig;
  
  // Development
  dev?: DevOptions;
}
```

## Core Settings

### Port Configuration

```typescript
{
  port: 3001 // Default: 3001
}
```

**Environment Variable:** `IXP_PORT`

### Intents Configuration

#### From File

```typescript
{
  intents: './config/intents.json'
}
```

#### Inline Definition

```typescript
{
  intents: [
    {
      name: 'show_products',
      description: 'Display product catalog',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 50 }
        },
        required: ['category']
      },
      component: 'ProductGrid',
      version: '1.0.0',
      crawlable: true,
      category: 'ecommerce',
      tags: ['products', 'catalog', 'shopping']
    }
  ]
}
```

### Components Configuration

#### From File

```typescript
{
  components: './config/components.json'
}
```

#### Inline Definition

```typescript
{
  components: {
    ProductGrid: {
      name: 'ProductGrid',
      framework: 'react',
      remoteUrl: 'http://localhost:5173/ProductGrid.js',
      exportName: 'ProductGrid',
      propsSchema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          limit: { type: 'number' }
        },
        required: ['category']
      },
      version: '1.0.0',
      allowedOrigins: ['http://localhost:3000', 'https://myapp.com'],
      bundleSize: '45KB',
      performance: {
        tti: '0.8s',
        bundleSizeGzipped: '15KB'
      },
      securityPolicy: {
        allowEval: false,
        maxBundleSize: '200KB',
        sandboxed: true
      },
      dependencies: [
        {
          name: 'react',
          version: '^18.0.0',
          type: 'peer'
        }
      ],
      fallback: {
        component: 'ErrorComponent',
        message: 'Product grid unavailable'
      }
    }
  }
}
```

## Security Configuration

### CORS Options

```typescript
{
  cors: {
    origins: ['http://localhost:3000', 'https://myapp.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  }
}
```

### Rate Limiting

```typescript
{
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  }
}
```

### Security Policy

```typescript
{
  security: {
    // Content Security Policy
    csp: {
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
    
    // Component security
    componentSecurity: {
      maxBundleSize: '1MB',
      allowEval: false,
      sandboxed: true,
      trustedOrigins: ['https://cdn.mycompany.com'],
      validateSignatures: true
    },
    
    // Request validation
    validation: {
      maxPayloadSize: '10MB',
      validateSchemas: true,
      sanitizeInputs: true,
      allowUnknownProperties: false
    }
  }
}
```

## Middleware Configuration

### Built-in Middleware

```typescript
{
  middleware: [
    'rateLimit',      // Rate limiting
    'validation',     // Request validation
    'cors',          // CORS handling
    'originValidation', // Origin validation
    'timeout',       // Request timeout
    'requestId',     // Request ID tracking
    'compression',   // Response compression
    'helmet'         // Security headers
  ]
}
```

### Custom Middleware

```typescript
import { MiddlewareFunction } from 'ixp-server';

const customLogging: MiddlewareFunction = (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

{
  middleware: [
    'rateLimit',
    customLogging,
    'validation'
  ]
}
```

### Middleware Options

```typescript
{
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
        validateComponentProps: true,
        strictMode: true
      }
    }
  ]
}
```

## Plugin Configuration

### Built-in Plugins

```typescript
{
  plugins: [
    'swagger',           // API documentation
    'healthMonitoring',  // Health checks
    'metrics',          // Performance metrics
    'logging',          // Enhanced logging
    'cache',            // Response caching
    'analytics'         // Usage analytics
  ]
}
```

### Plugin Options

```typescript
{
  plugins: [
    {
      name: 'swagger',
      options: {
        title: 'My IXP Server API',
        version: '1.0.0',
        description: 'API documentation',
        path: '/api-docs',
        ui: true,
        json: true
      }
    },
    {
      name: 'metrics',
      options: {
        path: '/metrics',
        collectDefaultMetrics: true,
        customMetrics: [
          {
            name: 'intent_resolution_duration',
            help: 'Time to resolve intents',
            type: 'histogram'
          }
        ]
      }
    }
  ]
}
```

## Logging Configuration

```typescript
{
  logging: {
    level: 'info', // 'error', 'warn', 'info', 'debug'
    format: 'json', // 'json', 'simple', 'combined'
    transports: [
      {
        type: 'console',
        options: {
          colorize: true,
          timestamp: true
        }
      },
      {
        type: 'file',
        options: {
          filename: 'logs/ixp-server.log',
          maxSize: '10MB',
          maxFiles: 5,
          rotate: true
        }
      }
    ],
    requestLogging: {
      enabled: true,
      includeBody: false,
      includeHeaders: false,
      excludePaths: ['/health', '/metrics']
    }
  }
}
```

## Data Providers Configuration

```typescript
{
  dataProviders: [
    {
      name: 'products',
      type: 'rest',
      config: {
        baseUrl: 'https://api.mystore.com',
        headers: {
          'Authorization': 'Bearer ${PRODUCTS_API_TOKEN}',
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        retries: 3
      }
    },
    {
      name: 'users',
      type: 'graphql',
      config: {
        endpoint: 'https://api.myapp.com/graphql',
        headers: {
          'Authorization': 'Bearer ${USERS_API_TOKEN}'
        }
      }
    },
    {
      name: 'cache',
      type: 'redis',
      config: {
        host: 'localhost',
        port: 6379,
        password: '${REDIS_PASSWORD}',
        db: 0
      }
    }
  ]
}
```

## Theme Configuration

```typescript
{
  theme: {
    name: 'default',
    version: '1.0.0',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '3rem'
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    }
  }
}
```

## Crawler Configuration

```typescript
{
  crawler: {
    enabled: true,
    path: '/crawler_content',
    includeIntents: true,
    includeComponents: false,
    sitemapPath: '/sitemap.xml',
    robotsTxtPath: '/robots.txt',
    metadata: {
      title: 'My IXP Server',
      description: 'Intent Exchange Protocol Server',
      keywords: ['ixp', 'intents', 'components'],
      author: 'My Company'
    },
    seo: {
      generateMetaTags: true,
      generateStructuredData: true,
      canonicalUrl: 'https://myapp.com'
    }
  }
}
```

## Development Configuration

```typescript
{
  dev: {
    hotReload: true,
    watchFiles: [
      './config/**/*.json',
      './src/**/*.ts'
    ],
    debugMode: true,
    mockData: {
      enabled: true,
      path: './mocks'
    },
    proxy: {
      '/api': 'http://localhost:8080',
      '/assets': 'http://localhost:5173'
    }
  }
}
```

## Environment Variables

The SDK supports configuration via environment variables:

```bash
# Server
IXP_PORT=3001
IXP_HOST=localhost

# Security
IXP_CORS_ORIGINS=http://localhost:3000,https://myapp.com
IXP_RATE_LIMIT_MAX=100
IXP_RATE_LIMIT_WINDOW=900000

# Data Providers
PRODUCTS_API_TOKEN=your_token_here
USERS_API_TOKEN=your_token_here
REDIS_PASSWORD=your_password_here

# Logging
IXP_LOG_LEVEL=info
IXP_LOG_FORMAT=json

# Development
IXP_DEV_MODE=true
IXP_HOT_RELOAD=true
```

## Configuration Files

### package.json Scripts

```json
{
  "scripts": {
    "dev": "ixp-server dev",
    "start": "ixp-server start",
    "build": "ixp-server build",
    "test": "ixp-server test",
    "validate": "ixp-server validate"
  }
}
```

### ixp.config.js

```javascript
module.exports = {
  port: 3001,
  intents: './config/intents.json',
  components: './config/components.json',
  middleware: ['rateLimit', 'validation', 'cors'],
  plugins: ['swagger', 'healthMonitoring'],
  cors: {
    origins: process.env.NODE_ENV === 'production' 
      ? ['https://myapp.com']
      : ['http://localhost:3000']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000
  }
};
```

### .env File

```bash
# .env
IXP_PORT=3001
IXP_LOG_LEVEL=debug
PRODUCTS_API_TOKEN=your_token_here
REDIS_PASSWORD=your_password_here
```

## Configuration Validation

The SDK automatically validates configuration on startup:

```typescript
import { validateConfig } from 'ixp-server';

const config = {
  // your configuration
};

const validation = validateConfig(config);
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}
```

## Best Practices

1. **Environment-specific configs**: Use different configurations for development, staging, and production
2. **Security**: Never commit secrets to version control; use environment variables
3. **Performance**: Configure appropriate rate limits and timeouts for your use case
4. **Monitoring**: Enable health monitoring and metrics in production
5. **Validation**: Always validate configuration before deployment
6. **Documentation**: Keep configuration documented and up-to-date

## Troubleshooting

### Common Configuration Issues

1. **Port conflicts**: Ensure the configured port is available
2. **File paths**: Use absolute paths or paths relative to the working directory
3. **CORS issues**: Configure allowed origins correctly
4. **Rate limiting**: Adjust limits based on expected traffic
5. **Component URLs**: Ensure component URLs are accessible and return valid modules