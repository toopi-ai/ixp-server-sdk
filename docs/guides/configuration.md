# Configuration Guide

This comprehensive guide covers all aspects of configuring your IXP Server, from basic setup to advanced production configurations.

## Table of Contents

- [Configuration Overview](#configuration-overview)
- [Server Configuration](#server-configuration)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Intent Configuration](#intent-configuration)
- [Component Configuration](#component-configuration)
- [Middleware Configuration](#middleware-configuration)
- [Plugin Configuration](#plugin-configuration)
- [Security Configuration](#security-configuration)
- [Performance Configuration](#performance-configuration)
- [Logging Configuration](#logging-configuration)
- [Development vs Production](#development-vs-production)
- [Configuration Validation](#configuration-validation)
- [Best Practices](#best-practices)

## Configuration Overview

IXP Server supports multiple configuration methods with the following priority order (highest to lowest):

1. **Command-line arguments**
2. **Environment variables**
3. **Configuration files** (JSON, YAML, JS)
4. **Default values**

### Configuration Sources

```typescript
import { createIXPServer, ConfigBuilder } from 'ixp-server';

// Method 1: Direct configuration object
const server = createIXPServer({
  name: 'my-server',
  port: 3000,
  // ... other options
});

// Method 2: Using ConfigBuilder
const config = new ConfigBuilder()
  .setName('my-server')
  .setPort(3000)
  .loadFromEnv()
  .loadFromFile('./config/server.json')
  .build();

const server = createIXPServer(config);

// Method 3: Loading from file
const server = createIXPServer('./config/server.json');
```

## Server Configuration

### Basic Server Options

```typescript
interface IXPServerConfig {
  // Basic server settings
  name: string;                    // Server name
  version?: string;                // Server version
  description?: string;            // Server description
  
  // Network settings
  port?: number;                   // Port to listen on (default: 3000)
  host?: string;                   // Host to bind to (default: 'localhost')
  
  // Protocol settings
  https?: {
    enabled: boolean;
    cert: string;                  // Path to certificate file
    key: string;                   // Path to private key file
    ca?: string;                   // Path to CA file (optional)
  };
  
  // CORS settings
  cors?: {
    enabled: boolean;
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  };
  
  // Request settings
  bodyParser?: {
    json?: {
      limit?: string;              // JSON payload limit (default: '1mb')
      strict?: boolean;
    };
    urlencoded?: {
      limit?: string;
      extended?: boolean;
    };
  };
  
  // Static file serving
  static?: {
    enabled: boolean;
    path: string;                  // Path to static files
    route?: string;                // Route prefix (default: '/')
    options?: {
      maxAge?: number;
      etag?: boolean;
      dotfiles?: 'allow' | 'deny' | 'ignore';
    };
  };
}
```

### Example Configuration

```typescript
const config: IXPServerConfig = {
  name: 'production-ixp-server',
  version: '2.1.0',
  description: 'Production IXP Server for customer service',
  
  // Network
  port: 8080,
  host: '0.0.0.0',
  
  // HTTPS
  https: {
    enabled: true,
    cert: '/etc/ssl/certs/server.crt',
    key: '/etc/ssl/private/server.key'
  },
  
  // CORS
  cors: {
    enabled: true,
    origin: ['https://myapp.com', 'https://admin.myapp.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  
  // Request parsing
  bodyParser: {
    json: {
      limit: '10mb',
      strict: true
    },
    urlencoded: {
      limit: '10mb',
      extended: true
    }
  },
  
  // Static files
  static: {
    enabled: true,
    path: './public',
    route: '/assets',
    options: {
      maxAge: 86400000, // 1 day
      etag: true
    }
  }
};
```

## Environment Variables

### Standard Environment Variables

```bash
# Server Configuration
IXP_SERVER_NAME=my-ixp-server
IXP_SERVER_VERSION=1.0.0
IXP_SERVER_DESCRIPTION="My IXP Server"
PORT=3000
HOST=localhost
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key

# HTTPS
HTTPS_ENABLED=false
HTTPS_CERT_PATH=/path/to/cert.pem
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CA_PATH=/path/to/ca.pem

# CORS
CORS_ENABLED=true
CORS_ORIGIN=https://myapp.com,https://admin.myapp.com
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/ixp-server.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Performance
CLUSTER_ENABLED=false
CLUSTER_WORKERS=4
MAX_MEMORY=512m
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL=false

# Monitoring
MONITORING_ENABLED=true
MONITORING_ENDPOINT=https://monitoring.example.com
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
METRICS_PORT=9090

# External Services
WEATHER_API_KEY=your-weather-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5
NEWS_API_KEY=your-news-api-key
ANALYTICS_ENDPOINT=https://analytics.example.com
```

### Loading Environment Variables

```typescript
import { config } from 'dotenv';
import { ConfigBuilder } from 'ixp-server';

// Load environment variables
config({ path: '.env' });

// Create configuration from environment
const serverConfig = new ConfigBuilder()
  .setName(process.env.IXP_SERVER_NAME || 'default-server')
  .setPort(parseInt(process.env.PORT || '3000'))
  .setHost(process.env.HOST || 'localhost')
  .enableCors(process.env.CORS_ENABLED === 'true')
  .setLogLevel(process.env.LOG_LEVEL as any || 'info')
  .build();
```

## Configuration Files

### JSON Configuration

`config/server.json`:
```json
{
  "name": "my-ixp-server",
  "version": "1.0.0",
  "description": "My IXP Server",
  "port": 3000,
  "host": "localhost",
  "cors": {
    "enabled": true,
    "origin": ["http://localhost:3000"],
    "credentials": true
  },
  "logging": {
    "level": "info",
    "format": "combined",
    "transports": [
      {
        "type": "console",
        "colorize": true
      },
      {
        "type": "file",
        "filename": "logs/server.log",
        "maxSize": "10m",
        "maxFiles": 5
      }
    ]
  },
  "database": {
    "url": "postgresql://localhost:5432/ixpdb",
    "pool": {
      "min": 2,
      "max": 20
    }
  },
  "redis": {
    "url": "redis://localhost:6379",
    "db": 0
  },
  "rateLimit": {
    "enabled": true,
    "windowMs": 60000,
    "maxRequests": 100
  }
}
```

### YAML Configuration

`config/server.yaml`:
```yaml
name: my-ixp-server
version: 1.0.0
description: My IXP Server
port: 3000
host: localhost

cors:
  enabled: true
  origin:
    - http://localhost:3000
  credentials: true

logging:
  level: info
  format: combined
  transports:
    - type: console
      colorize: true
    - type: file
      filename: logs/server.log
      maxSize: 10m
      maxFiles: 5

database:
  url: postgresql://localhost:5432/ixpdb
  pool:
    min: 2
    max: 20

redis:
  url: redis://localhost:6379
  db: 0

rateLimit:
  enabled: true
  windowMs: 60000
  maxRequests: 100
```

### JavaScript Configuration

`config/server.js`:
```javascript
module.exports = {
  name: 'my-ixp-server',
  version: '1.0.0',
  description: 'My IXP Server',
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || 'localhost',
  
  cors: {
    enabled: process.env.NODE_ENV !== 'production',
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'combined',
    transports: [
      { type: 'console', colorize: process.env.NODE_ENV !== 'production' },
      ...(process.env.LOG_FILE ? [{
        type: 'file',
        filename: process.env.LOG_FILE,
        maxSize: '10m',
        maxFiles: 5
      }] : [])
    ]
  },
  
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX) || 20
    }
  }
};
```

## Intent Configuration

### Intent Registry Configuration

`config/intents.json`:
```json
{
  "registry": {
    "autoLoad": true,
    "directories": [
      "./src/intents",
      "./plugins/*/intents"
    ],
    "patterns": [
      "**/*.intent.js",
      "**/*.intent.ts"
    ]
  },
  "validation": {
    "strict": true,
    "requireExamples": true,
    "maxParameters": 10
  },
  "resolution": {
    "algorithm": "semantic",
    "threshold": 0.8,
    "fallback": "unknown_intent"
  },
  "intents": {
    "get_weather": {
      "enabled": true,
      "rateLimit": {
        "maxRequests": 50,
        "windowMs": 60000
      },
      "cache": {
        "enabled": true,
        "ttl": 300000
      }
    },
    "get_news": {
      "enabled": true,
      "requireAuth": true,
      "permissions": ["read:news"]
    }
  }
}
```

### Loading Intent Configuration

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer(config);

// Load intent configuration
server.loadIntentConfig('./config/intents.json');

// Or configure programmatically
server.configureIntents({
  validation: {
    strict: true,
    requireExamples: true
  },
  resolution: {
    algorithm: 'semantic',
    threshold: 0.8
  }
});
```

## Component Configuration

### Component Registry Configuration

`config/components.json`:
```json
{
  "registry": {
    "autoLoad": true,
    "directories": [
      "./src/components",
      "./plugins/*/components"
    ],
    "patterns": [
      "**/*.component.js",
      "**/*.component.ts"
    ]
  },
  "rendering": {
    "engine": "default",
    "cache": {
      "enabled": true,
      "ttl": 3600000
    },
    "optimization": {
      "minify": true,
      "compress": true
    }
  },
  "validation": {
    "strict": true,
    "validateProps": true,
    "requireSchema": true
  },
  "components": {
    "weather-card": {
      "enabled": true,
      "cache": {
        "enabled": true,
        "ttl": 600000
      }
    },
    "user-profile": {
      "enabled": true,
      "requireAuth": true,
      "permissions": ["read:profile"]
    }
  }
}
```

## Middleware Configuration

### Middleware Stack Configuration

```typescript
interface MiddlewareConfig {
  name: string;
  enabled: boolean;
  order: number;
  options?: Record<string, any>;
}

const middlewareConfig: MiddlewareConfig[] = [
  {
    name: 'cors',
    enabled: true,
    order: 1,
    options: {
      origin: ['https://myapp.com'],
      credentials: true
    }
  },
  {
    name: 'helmet',
    enabled: true,
    order: 2,
    options: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"]
        }
      }
    }
  },
  {
    name: 'rate-limit',
    enabled: true,
    order: 3,
    options: {
      windowMs: 60000,
      maxRequests: 100,
      message: 'Too many requests'
    }
  },
  {
    name: 'auth',
    enabled: true,
    order: 4,
    options: {
      secret: process.env.JWT_SECRET,
      algorithms: ['HS256'],
      skipPaths: ['/health', '/docs']
    }
  },
  {
    name: 'logging',
    enabled: true,
    order: 5,
    options: {
      format: 'combined',
      skip: (req) => req.url === '/health'
    }
  }
];

// Apply middleware configuration
server.configureMiddleware(middlewareConfig);
```

## Plugin Configuration

### Plugin Registry Configuration

`config/plugins.json`:
```json
{
  "registry": {
    "autoLoad": true,
    "directories": [
      "./plugins",
      "./node_modules/ixp-plugin-*"
    ]
  },
  "plugins": {
    "database": {
      "enabled": true,
      "package": "@ixp/plugin-database",
      "config": {
        "url": "${DATABASE_URL}",
        "pool": {
          "min": 2,
          "max": 20
        },
        "migrations": {
          "directory": "./migrations",
          "autoRun": true
        }
      }
    },
    "redis": {
      "enabled": true,
      "package": "@ixp/plugin-redis",
      "config": {
        "url": "${REDIS_URL}",
        "db": 0,
        "keyPrefix": "ixp:"
      }
    },
    "analytics": {
      "enabled": true,
      "package": "@ixp/plugin-analytics",
      "config": {
        "endpoint": "${ANALYTICS_ENDPOINT}",
        "apiKey": "${ANALYTICS_API_KEY}",
        "batchSize": 100,
        "flushInterval": 5000
      }
    },
    "monitoring": {
      "enabled": true,
      "package": "@ixp/plugin-monitoring",
      "config": {
        "metrics": {
          "enabled": true,
          "port": 9090,
          "path": "/metrics"
        },
        "healthCheck": {
          "enabled": true,
          "interval": 30000,
          "timeout": 5000
        }
      }
    }
  }
}
```

## Security Configuration

### Authentication Configuration

```typescript
interface AuthConfig {
  jwt: {
    secret: string;
    algorithm: string;
    expiresIn: string;
    issuer?: string;
    audience?: string;
  };
  apiKey: {
    enabled: boolean;
    header: string;
    keys: string[];
  };
  oauth: {
    enabled: boolean;
    providers: {
      google?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      };
      github?: {
        clientId: string;
        clientSecret: string;
      };
    };
  };
}

const authConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    algorithm: 'HS256',
    expiresIn: '24h',
    issuer: 'ixp-server',
    audience: 'ixp-client'
  },
  apiKey: {
    enabled: true,
    header: 'X-API-Key',
    keys: process.env.API_KEYS?.split(',') || []
  },
  oauth: {
    enabled: true,
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!
      }
    }
  }
};
```

### Security Headers Configuration

```typescript
const securityConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.example.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  }
};
```

## Performance Configuration

### Clustering Configuration

```typescript
interface ClusterConfig {
  enabled: boolean;
  workers: number | 'auto';
  respawn: boolean;
  maxMemory: string;
  gracefulShutdown: {
    timeout: number;
    killTimeout: number;
  };
}

const clusterConfig: ClusterConfig = {
  enabled: process.env.NODE_ENV === 'production',
  workers: process.env.CLUSTER_WORKERS ? parseInt(process.env.CLUSTER_WORKERS) : 'auto',
  respawn: true,
  maxMemory: process.env.MAX_MEMORY || '512m',
  gracefulShutdown: {
    timeout: 30000,
    killTimeout: 5000
  }
};
```

### Caching Configuration

```typescript
interface CacheConfig {
  memory: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  redis: {
    enabled: boolean;
    url: string;
    keyPrefix: string;
    ttl: number;
  };
  http: {
    enabled: boolean;
    maxAge: number;
    etag: boolean;
    lastModified: boolean;
  };
}

const cacheConfig: CacheConfig = {
  memory: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 300000 // 5 minutes
  },
  redis: {
    enabled: !!process.env.REDIS_URL,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'ixp:cache:',
    ttl: 3600000 // 1 hour
  },
  http: {
    enabled: true,
    maxAge: 86400000, // 1 day
    etag: true,
    lastModified: true
  }
};
```

## Logging Configuration

### Comprehensive Logging Setup

```typescript
interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  format: 'json' | 'combined' | 'simple';
  transports: LogTransport[];
  meta: {
    service: string;
    version: string;
    environment: string;
  };
}

interface LogTransport {
  type: 'console' | 'file' | 'http' | 'syslog';
  level?: string;
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
  url?: string;
  colorize?: boolean;
}

const loggingConfig: LoggingConfig = {
  level: (process.env.LOG_LEVEL as any) || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'combined',
  transports: [
    {
      type: 'console',
      level: 'debug',
      colorize: process.env.NODE_ENV !== 'production'
    },
    {
      type: 'file',
      level: 'info',
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: 5
    },
    {
      type: 'file',
      level: 'error',
      filename: 'logs/error.log',
      maxSize: '10m',
      maxFiles: 5
    },
    ...(process.env.LOG_HTTP_ENDPOINT ? [{
      type: 'http' as const,
      url: process.env.LOG_HTTP_ENDPOINT
    }] : [])
  ],
  meta: {
    service: 'ixp-server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
};
```

## Development vs Production

### Development Configuration

```typescript
// config/development.js
module.exports = {
  name: 'ixp-server-dev',
  port: 3000,
  host: 'localhost',
  
  // Enable detailed logging
  logging: {
    level: 'debug',
    format: 'combined',
    transports: [
      { type: 'console', colorize: true }
    ]
  },
  
  // Disable security features for easier development
  cors: {
    enabled: true,
    origin: '*',
    credentials: true
  },
  
  // Enable hot reloading
  hotReload: {
    enabled: true,
    watchPaths: ['./src'],
    ignorePatterns: ['**/*.test.ts', '**/node_modules/**']
  },
  
  // Development database
  database: {
    url: 'postgresql://localhost:5432/ixpdb_dev',
    logging: true,
    synchronize: true
  },
  
  // Disable rate limiting
  rateLimit: {
    enabled: false
  },
  
  // Enable debug endpoints
  debug: {
    enabled: true,
    endpoints: ['/debug', '/metrics']
  }
};
```

### Production Configuration

```typescript
// config/production.js
module.exports = {
  name: 'ixp-server-prod',
  port: parseInt(process.env.PORT) || 8080,
  host: '0.0.0.0',
  
  // Secure HTTPS
  https: {
    enabled: true,
    cert: process.env.HTTPS_CERT_PATH,
    key: process.env.HTTPS_KEY_PATH
  },
  
  // Production logging
  logging: {
    level: 'warn',
    format: 'json',
    transports: [
      {
        type: 'file',
        filename: '/var/log/ixp-server.log',
        maxSize: '50m',
        maxFiles: 10
      },
      {
        type: 'http',
        url: process.env.LOG_AGGREGATOR_URL
      }
    ]
  },
  
  // Strict CORS
  cors: {
    enabled: true,
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
  },
  
  // Enable clustering
  cluster: {
    enabled: true,
    workers: 'auto',
    maxMemory: '512m'
  },
  
  // Production database
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 5,
      max: 50
    },
    ssl: {
      rejectUnauthorized: false
    }
  },
  
  // Enable rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 1000
  },
  
  // Security headers
  security: {
    helmet: {
      contentSecurityPolicy: true,
      hsts: true
    }
  },
  
  // Disable debug endpoints
  debug: {
    enabled: false
  }
};
```

## Configuration Validation

### Schema Validation

```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/),
  port: Joi.number().port().default(3000),
  host: Joi.string().hostname().default('localhost'),
  
  https: Joi.object({
    enabled: Joi.boolean().default(false),
    cert: Joi.string().when('enabled', {
      is: true,
      then: Joi.required()
    }),
    key: Joi.string().when('enabled', {
      is: true,
      then: Joi.required()
    })
  }),
  
  database: Joi.object({
    url: Joi.string().uri().required(),
    pool: Joi.object({
      min: Joi.number().min(0).default(2),
      max: Joi.number().min(1).default(20)
    })
  }),
  
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),
    format: Joi.string().valid('json', 'combined', 'simple').default('combined')
  })
});

// Validate configuration
function validateConfig(config: any) {
  const { error, value } = configSchema.validate(config, {
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }
  
  return value;
}
```

### Runtime Validation

```typescript
class ConfigValidator {
  static validateEnvironment() {
    const required = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  static validatePorts(config: any) {
    const port = config.port;
    const metricsPort = config.metrics?.port;
    
    if (port === metricsPort) {
      throw new Error('Server port and metrics port cannot be the same');
    }
  }
  
  static validateSecurity(config: any) {
    if (config.https?.enabled && (!config.https.cert || !config.https.key)) {
      throw new Error('HTTPS enabled but certificate or key not provided');
    }
    
    if (process.env.NODE_ENV === 'production' && !config.https?.enabled) {
      console.warn('⚠️  Running in production without HTTPS');
    }
  }
}
```

## Best Practices

### 1. Environment-Specific Configurations

```typescript
// Use different config files for different environments
const environment = process.env.NODE_ENV || 'development';
const configFile = `./config/${environment}.json`;

const server = createIXPServer(configFile);
```

### 2. Secret Management

```typescript
// Never commit secrets to version control
// Use environment variables or secret management services

// ❌ Bad
const config = {
  jwt: {
    secret: 'hardcoded-secret'
  }
};

// ✅ Good
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET environment variable is required');
    })()
  }
};
```

### 3. Configuration Hierarchy

```typescript
// Create a configuration hierarchy
const config = new ConfigBuilder()
  .loadDefaults()                    // 1. Default values
  .loadFromFile('./config/base.json') // 2. Base configuration
  .loadFromFile(`./config/${env}.json`) // 3. Environment-specific
  .loadFromEnv()                     // 4. Environment variables
  .loadFromArgs()                    // 5. Command-line arguments
  .validate()                        // 6. Validate final config
  .build();
```

### 4. Configuration Documentation

```typescript
/**
 * Server Configuration
 * 
 * @example
 * {
 *   "name": "my-server",
 *   "port": 3000,
 *   "database": {
 *     "url": "postgresql://localhost:5432/mydb"
 *   }
 * }
 */
interface ServerConfig {
  /** Server name - used for logging and monitoring */
  name: string;
  
  /** Port to listen on (default: 3000) */
  port?: number;
  
  /** Database configuration */
  database: {
    /** Database connection URL */
    url: string;
    
    /** Connection pool settings */
    pool?: {
      /** Minimum connections (default: 2) */
      min?: number;
      /** Maximum connections (default: 20) */
      max?: number;
    };
  };
}
```

### 5. Configuration Testing

```typescript
// Test configuration loading
describe('Configuration', () => {
  test('should load development config', () => {
    process.env.NODE_ENV = 'development';
    const config = loadConfig();
    
    expect(config.logging.level).toBe('debug');
    expect(config.cors.enabled).toBe(true);
  });
  
  test('should validate required fields', () => {
    expect(() => {
      validateConfig({ name: '' });
    }).toThrow('name is required');
  });
  
  test('should merge configurations correctly', () => {
    const base = { port: 3000, logging: { level: 'info' } };
    const override = { port: 8080, cors: { enabled: true } };
    
    const merged = mergeConfigs(base, override);
    
    expect(merged.port).toBe(8080);
    expect(merged.logging.level).toBe('info');
    expect(merged.cors.enabled).toBe(true);
  });
});
```

## Related Documentation

- [Installation Guide](./installation.md) - Setup and installation
- [First Server Guide](./first-server.md) - Create your first server
- [Advanced Guide](./advanced.md) - Advanced configuration patterns
- [Security Best Practices](../reference/security.md) - Security configuration
- [Performance Tuning](../reference/performance.md) - Performance optimization

## Summary

Proper configuration is crucial for a robust IXP Server deployment. Key takeaways:

- ✅ Use environment-specific configurations
- ✅ Validate configurations at startup
- ✅ Keep secrets out of version control
- ✅ Document configuration options
- ✅ Test configuration loading
- ✅ Use configuration hierarchy
- ✅ Monitor configuration changes

With proper configuration management, your IXP Server will be secure, performant, and maintainable across all environments.