# Configuration Schema Reference

This document provides the complete configuration schema for the IXP Server SDK, including all available options, their types, default values, and validation rules.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Server Configuration](#server-configuration)
- [Database Configuration](#database-configuration)
- [Cache Configuration](#cache-configuration)
- [Security Configuration](#security-configuration)
- [Logging Configuration](#logging-configuration)
- [Plugin Configuration](#plugin-configuration)
- [Performance Configuration](#performance-configuration)
- [Development Configuration](#development-configuration)
- [Environment Variables](#environment-variables)
- [Configuration Validation](#configuration-validation)
- [Configuration Examples](#configuration-examples)

## Schema Overview

The IXP Server configuration follows a hierarchical structure with the following top-level sections:

```typescript
interface IXPServerConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  cache?: CacheConfig;
  security?: SecurityConfig;
  logging?: LoggingConfig;
  plugins?: PluginConfig[];
  performance?: PerformanceConfig;
  development?: DevelopmentConfig;
}
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "IXP Server Configuration",
  "type": "object",
  "required": ["server", "database"],
  "properties": {
    "server": { "$ref": "#/definitions/ServerConfig" },
    "database": { "$ref": "#/definitions/DatabaseConfig" },
    "cache": { "$ref": "#/definitions/CacheConfig" },
    "security": { "$ref": "#/definitions/SecurityConfig" },
    "logging": { "$ref": "#/definitions/LoggingConfig" },
    "plugins": {
      "type": "array",
      "items": { "$ref": "#/definitions/PluginConfig" }
    },
    "performance": { "$ref": "#/definitions/PerformanceConfig" },
    "development": { "$ref": "#/definitions/DevelopmentConfig" }
  }
}
```

## Server Configuration

Core server settings including network, routing, and basic behavior.

### Schema Definition

```typescript
interface ServerConfig {
  port: number;
  host?: string;
  name?: string;
  version?: string;
  cors?: CorsConfig;
  middleware?: MiddlewareConfig[];
  routes?: RouteConfig;
  timeout?: TimeoutConfig;
  compression?: CompressionConfig;
  static?: StaticConfig;
}
```

### JSON Schema

```json
{
  "definitions": {
    "ServerConfig": {
      "type": "object",
      "required": ["port"],
      "properties": {
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "description": "Port number for the server to listen on"
        },
        "host": {
          "type": "string",
          "default": "localhost",
          "description": "Hostname or IP address to bind to",
          "examples": ["localhost", "0.0.0.0", "127.0.0.1"]
        },
        "name": {
          "type": "string",
          "default": "IXP Server",
          "description": "Server name for identification"
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+",
          "description": "Server version (semantic versioning)"
        },
        "cors": { "$ref": "#/definitions/CorsConfig" },
        "middleware": {
          "type": "array",
          "items": { "$ref": "#/definitions/MiddlewareConfig" }
        },
        "routes": { "$ref": "#/definitions/RouteConfig" },
        "timeout": { "$ref": "#/definitions/TimeoutConfig" },
        "compression": { "$ref": "#/definitions/CompressionConfig" },
        "static": { "$ref": "#/definitions/StaticConfig" }
      }
    }
  }
}
```

### CORS Configuration

```typescript
interface CorsConfig {
  enabled: boolean;
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

```json
{
  "CorsConfig": {
    "type": "object",
    "properties": {
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Enable CORS support"
      },
      "origin": {
        "oneOf": [
          { "type": "string" },
          { "type": "array", "items": { "type": "string" } },
          { "type": "boolean" }
        ],
        "default": "*",
        "description": "Allowed origins for CORS requests"
      },
      "methods": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
        },
        "default": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
      },
      "allowedHeaders": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["Content-Type", "Authorization"]
      },
      "credentials": {
        "type": "boolean",
        "default": false,
        "description": "Allow credentials in CORS requests"
      },
      "maxAge": {
        "type": "integer",
        "minimum": 0,
        "default": 86400,
        "description": "CORS preflight cache duration in seconds"
      }
    }
  }
}
```

### Timeout Configuration

```typescript
interface TimeoutConfig {
  request?: number;
  response?: number;
  keepAlive?: number;
  headers?: number;
}
```

```json
{
  "TimeoutConfig": {
    "type": "object",
    "properties": {
      "request": {
        "type": "integer",
        "minimum": 1000,
        "default": 30000,
        "description": "Request timeout in milliseconds"
      },
      "response": {
        "type": "integer",
        "minimum": 1000,
        "default": 30000,
        "description": "Response timeout in milliseconds"
      },
      "keepAlive": {
        "type": "integer",
        "minimum": 1000,
        "default": 5000,
        "description": "Keep-alive timeout in milliseconds"
      },
      "headers": {
        "type": "integer",
        "minimum": 1000,
        "default": 60000,
        "description": "Headers timeout in milliseconds"
      }
    }
  }
}
```

## Database Configuration

Database connection and behavior settings.

### Schema Definition

```typescript
interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  url?: string;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean | SSLConfig;
  pool?: PoolConfig;
  migrations?: MigrationConfig;
  logging?: boolean;
  timezone?: string;
}
```

### JSON Schema

```json
{
  "DatabaseConfig": {
    "type": "object",
    "required": ["type", "database"],
    "properties": {
      "type": {
        "type": "string",
        "enum": ["postgresql", "mysql", "sqlite", "mongodb"],
        "description": "Database type"
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Complete database connection URL"
      },
      "host": {
        "type": "string",
        "default": "localhost",
        "description": "Database host"
      },
      "port": {
        "type": "integer",
        "minimum": 1,
        "maximum": 65535,
        "description": "Database port"
      },
      "database": {
        "type": "string",
        "minLength": 1,
        "description": "Database name"
      },
      "username": {
        "type": "string",
        "description": "Database username"
      },
      "password": {
        "type": "string",
        "description": "Database password"
      },
      "ssl": {
        "oneOf": [
          { "type": "boolean" },
          { "$ref": "#/definitions/SSLConfig" }
        ],
        "default": false,
        "description": "SSL configuration"
      },
      "pool": { "$ref": "#/definitions/PoolConfig" },
      "migrations": { "$ref": "#/definitions/MigrationConfig" },
      "logging": {
        "type": "boolean",
        "default": false,
        "description": "Enable database query logging"
      },
      "timezone": {
        "type": "string",
        "default": "UTC",
        "description": "Database timezone"
      }
    }
  }
}
```

### Pool Configuration

```typescript
interface PoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}
```

```json
{
  "PoolConfig": {
    "type": "object",
    "properties": {
      "min": {
        "type": "integer",
        "minimum": 0,
        "default": 2,
        "description": "Minimum number of connections in pool"
      },
      "max": {
        "type": "integer",
        "minimum": 1,
        "default": 10,
        "description": "Maximum number of connections in pool"
      },
      "acquireTimeoutMillis": {
        "type": "integer",
        "minimum": 1000,
        "default": 60000,
        "description": "Timeout for acquiring connection from pool"
      },
      "idleTimeoutMillis": {
        "type": "integer",
        "minimum": 1000,
        "default": 30000,
        "description": "Timeout for idle connections"
      }
    }
  }
}
```

## Cache Configuration

Caching system settings for improved performance.

### Schema Definition

```typescript
interface CacheConfig {
  type: 'memory' | 'redis' | 'memcached';
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  ttl?: number;
  maxSize?: number;
  compression?: boolean;
  serialization?: 'json' | 'msgpack';
}
```

### JSON Schema

```json
{
  "CacheConfig": {
    "type": "object",
    "required": ["type"],
    "properties": {
      "type": {
        "type": "string",
        "enum": ["memory", "redis", "memcached"],
        "description": "Cache backend type"
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "Cache server connection URL"
      },
      "host": {
        "type": "string",
        "default": "localhost",
        "description": "Cache server host"
      },
      "port": {
        "type": "integer",
        "minimum": 1,
        "maximum": 65535,
        "description": "Cache server port"
      },
      "password": {
        "type": "string",
        "description": "Cache server password"
      },
      "database": {
        "type": "integer",
        "minimum": 0,
        "default": 0,
        "description": "Redis database number"
      },
      "ttl": {
        "type": "integer",
        "minimum": 1,
        "default": 3600,
        "description": "Default TTL in seconds"
      },
      "maxSize": {
        "type": "integer",
        "minimum": 1,
        "description": "Maximum cache size (memory cache only)"
      },
      "compression": {
        "type": "boolean",
        "default": false,
        "description": "Enable cache value compression"
      },
      "serialization": {
        "type": "string",
        "enum": ["json", "msgpack"],
        "default": "json",
        "description": "Serialization format"
      }
    }
  }
}
```

## Security Configuration

Security-related settings including authentication, authorization, and protection mechanisms.

### Schema Definition

```typescript
interface SecurityConfig {
  authentication?: AuthConfig;
  authorization?: AuthzConfig;
  rateLimit?: RateLimitConfig;
  helmet?: HelmetConfig | boolean;
  csrf?: CSRFConfig | boolean;
  encryption?: EncryptionConfig;
  session?: SessionConfig;
}
```

### JSON Schema

```json
{
  "SecurityConfig": {
    "type": "object",
    "properties": {
      "authentication": { "$ref": "#/definitions/AuthConfig" },
      "authorization": { "$ref": "#/definitions/AuthzConfig" },
      "rateLimit": { "$ref": "#/definitions/RateLimitConfig" },
      "helmet": {
        "oneOf": [
          { "type": "boolean" },
          { "$ref": "#/definitions/HelmetConfig" }
        ],
        "default": true,
        "description": "Helmet security middleware configuration"
      },
      "csrf": {
        "oneOf": [
          { "type": "boolean" },
          { "$ref": "#/definitions/CSRFConfig" }
        ],
        "default": false,
        "description": "CSRF protection configuration"
      },
      "encryption": { "$ref": "#/definitions/EncryptionConfig" },
      "session": { "$ref": "#/definitions/SessionConfig" }
    }
  }
}
```

### Authentication Configuration

```typescript
interface AuthConfig {
  type: 'jwt' | 'session' | 'oauth' | 'custom';
  jwt?: JWTConfig;
  oauth?: OAuthConfig;
  providers?: AuthProviderConfig[];
  passwordPolicy?: PasswordPolicyConfig;
}
```

```json
{
  "AuthConfig": {
    "type": "object",
    "required": ["type"],
    "properties": {
      "type": {
        "type": "string",
        "enum": ["jwt", "session", "oauth", "custom"],
        "description": "Authentication type"
      },
      "jwt": { "$ref": "#/definitions/JWTConfig" },
      "oauth": { "$ref": "#/definitions/OAuthConfig" },
      "providers": {
        "type": "array",
        "items": { "$ref": "#/definitions/AuthProviderConfig" }
      },
      "passwordPolicy": { "$ref": "#/definitions/PasswordPolicyConfig" }
    }
  }
}
```

### JWT Configuration

```typescript
interface JWTConfig {
  secret: string;
  algorithm?: string;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
  refreshToken?: RefreshTokenConfig;
}
```

```json
{
  "JWTConfig": {
    "type": "object",
    "required": ["secret"],
    "properties": {
      "secret": {
        "type": "string",
        "minLength": 32,
        "description": "JWT signing secret (minimum 32 characters)"
      },
      "algorithm": {
        "type": "string",
        "enum": ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"],
        "default": "HS256",
        "description": "JWT signing algorithm"
      },
      "expiresIn": {
        "oneOf": [
          { "type": "string" },
          { "type": "integer" }
        ],
        "default": "1h",
        "description": "Token expiration time"
      },
      "issuer": {
        "type": "string",
        "description": "JWT issuer"
      },
      "audience": {
        "type": "string",
        "description": "JWT audience"
      },
      "refreshToken": { "$ref": "#/definitions/RefreshTokenConfig" }
    }
  }
}
```

### Rate Limiting Configuration

```typescript
interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  store?: RateLimitStoreConfig;
  keyGenerator?: string;
  skip?: string;
}
```

```json
{
  "RateLimitConfig": {
    "type": "object",
    "required": ["enabled", "windowMs", "max"],
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "Enable rate limiting"
      },
      "windowMs": {
        "type": "integer",
        "minimum": 1000,
        "description": "Time window in milliseconds"
      },
      "max": {
        "type": "integer",
        "minimum": 1,
        "description": "Maximum requests per window"
      },
      "message": {
        "type": "string",
        "default": "Too many requests",
        "description": "Rate limit exceeded message"
      },
      "standardHeaders": {
        "type": "boolean",
        "default": true,
        "description": "Include standard rate limit headers"
      },
      "store": { "$ref": "#/definitions/RateLimitStoreConfig" }
    }
  }
}
```

## Logging Configuration

Logging system settings for monitoring and debugging.

### Schema Definition

```typescript
interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  format?: 'json' | 'text' | 'combined';
  transports?: LogTransportConfig[];
  rotation?: LogRotationConfig;
  filters?: LogFilterConfig[];
  metadata?: boolean;
}
```

### JSON Schema

```json
{
  "LoggingConfig": {
    "type": "object",
    "required": ["level"],
    "properties": {
      "level": {
        "type": "string",
        "enum": ["error", "warn", "info", "debug", "trace"],
        "default": "info",
        "description": "Minimum log level"
      },
      "format": {
        "type": "string",
        "enum": ["json", "text", "combined"],
        "default": "json",
        "description": "Log output format"
      },
      "transports": {
        "type": "array",
        "items": { "$ref": "#/definitions/LogTransportConfig" },
        "description": "Log transport configurations"
      },
      "rotation": { "$ref": "#/definitions/LogRotationConfig" },
      "filters": {
        "type": "array",
        "items": { "$ref": "#/definitions/LogFilterConfig" }
      },
      "metadata": {
        "type": "boolean",
        "default": true,
        "description": "Include metadata in logs"
      }
    }
  }
}
```

### Log Transport Configuration

```typescript
interface LogTransportConfig {
  type: 'console' | 'file' | 'http' | 'database';
  level?: string;
  filename?: string;
  url?: string;
  options?: Record<string, any>;
}
```

```json
{
  "LogTransportConfig": {
    "type": "object",
    "required": ["type"],
    "properties": {
      "type": {
        "type": "string",
        "enum": ["console", "file", "http", "database"],
        "description": "Transport type"
      },
      "level": {
        "type": "string",
        "enum": ["error", "warn", "info", "debug", "trace"],
        "description": "Transport-specific log level"
      },
      "filename": {
        "type": "string",
        "description": "Log file path (file transport only)"
      },
      "url": {
        "type": "string",
        "format": "uri",
        "description": "HTTP endpoint (http transport only)"
      },
      "options": {
        "type": "object",
        "description": "Transport-specific options"
      }
    }
  }
}
```

## Plugin Configuration

Plugin system settings and individual plugin configurations.

### Schema Definition

```typescript
interface PluginConfig {
  name: string;
  enabled?: boolean;
  version?: string;
  config?: Record<string, any>;
  dependencies?: string[];
  priority?: number;
}
```

### JSON Schema

```json
{
  "PluginConfig": {
    "type": "object",
    "required": ["name"],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "description": "Plugin name"
      },
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Enable plugin"
      },
      "version": {
        "type": "string",
        "pattern": "^\\d+\\.\\d+\\.\\d+",
        "description": "Plugin version"
      },
      "config": {
        "type": "object",
        "description": "Plugin-specific configuration"
      },
      "dependencies": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Plugin dependencies"
      },
      "priority": {
        "type": "integer",
        "minimum": 0,
        "maximum": 100,
        "default": 50,
        "description": "Plugin loading priority (0-100)"
      }
    }
  }
}
```

## Performance Configuration

Performance optimization settings.

### Schema Definition

```typescript
interface PerformanceConfig {
  clustering?: ClusteringConfig;
  caching?: CachingConfig;
  compression?: CompressionConfig;
  monitoring?: MonitoringConfig;
  optimization?: OptimizationConfig;
}
```

### JSON Schema

```json
{
  "PerformanceConfig": {
    "type": "object",
    "properties": {
      "clustering": { "$ref": "#/definitions/ClusteringConfig" },
      "caching": { "$ref": "#/definitions/CachingConfig" },
      "compression": { "$ref": "#/definitions/CompressionConfig" },
      "monitoring": { "$ref": "#/definitions/MonitoringConfig" },
      "optimization": { "$ref": "#/definitions/OptimizationConfig" }
    }
  }
}
```

### Clustering Configuration

```typescript
interface ClusteringConfig {
  enabled: boolean;
  workers?: number | 'auto';
  strategy?: 'round-robin' | 'least-connections' | 'ip-hash';
  gracefulShutdown?: boolean;
  shutdownTimeout?: number;
}
```

```json
{
  "ClusteringConfig": {
    "type": "object",
    "required": ["enabled"],
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "Enable clustering"
      },
      "workers": {
        "oneOf": [
          { "type": "integer", "minimum": 1 },
          { "type": "string", "enum": ["auto"] }
        ],
        "default": "auto",
        "description": "Number of worker processes"
      },
      "strategy": {
        "type": "string",
        "enum": ["round-robin", "least-connections", "ip-hash"],
        "default": "round-robin",
        "description": "Load balancing strategy"
      },
      "gracefulShutdown": {
        "type": "boolean",
        "default": true,
        "description": "Enable graceful shutdown"
      },
      "shutdownTimeout": {
        "type": "integer",
        "minimum": 1000,
        "default": 30000,
        "description": "Shutdown timeout in milliseconds"
      }
    }
  }
}
```

## Development Configuration

Development-specific settings for debugging and testing.

### Schema Definition

```typescript
interface DevelopmentConfig {
  hotReload?: boolean;
  debugMode?: boolean;
  profiling?: ProfilingConfig;
  testing?: TestingConfig;
  mockData?: MockDataConfig;
}
```

### JSON Schema

```json
{
  "DevelopmentConfig": {
    "type": "object",
    "properties": {
      "hotReload": {
        "type": "boolean",
        "default": false,
        "description": "Enable hot reload in development"
      },
      "debugMode": {
        "type": "boolean",
        "default": false,
        "description": "Enable debug mode"
      },
      "profiling": { "$ref": "#/definitions/ProfilingConfig" },
      "testing": { "$ref": "#/definitions/TestingConfig" },
      "mockData": { "$ref": "#/definitions/MockDataConfig" }
    }
  }
}
```

## Environment Variables

Environment variables that can override configuration values.

### Server Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `IXP_PORT` | number | 3000 | Server port |
| `IXP_HOST` | string | localhost | Server host |
| `IXP_NODE_ENV` | string | development | Environment mode |

### Database Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `IXP_DB_URL` | string | - | Database connection URL |
| `IXP_DB_TYPE` | string | postgresql | Database type |
| `IXP_DB_HOST` | string | localhost | Database host |
| `IXP_DB_PORT` | number | 5432 | Database port |
| `IXP_DB_NAME` | string | - | Database name |
| `IXP_DB_USER` | string | - | Database username |
| `IXP_DB_PASSWORD` | string | - | Database password |

### Cache Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `IXP_CACHE_URL` | string | - | Cache connection URL |
| `IXP_CACHE_TYPE` | string | memory | Cache type |
| `IXP_CACHE_TTL` | number | 3600 | Default TTL in seconds |

### Security Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `IXP_JWT_SECRET` | string | - | JWT signing secret |
| `IXP_JWT_EXPIRES_IN` | string | 1h | JWT expiration time |
| `IXP_RATE_LIMIT_WINDOW` | number | 900000 | Rate limit window (ms) |
| `IXP_RATE_LIMIT_MAX` | number | 100 | Max requests per window |

## Configuration Validation

### Validation Function

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { configSchema } from './config-schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validateConfig = ajv.compile(configSchema);

export function validateConfiguration(config: any): {
  valid: boolean;
  errors?: string[];
} {
  const valid = validateConfig(config);
  
  if (!valid) {
    const errors = validateConfig.errors?.map(error => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message}`;
    }) || [];
    
    return { valid: false, errors };
  }
  
  return { valid: true };
}
```

### Custom Validation Rules

```typescript
// Add custom validation rules
ajv.addKeyword({
  keyword: 'isValidPort',
  type: 'number',
  schemaType: 'boolean',
  compile: () => (data: number) => {
    return data >= 1 && data <= 65535;
  }
});

ajv.addKeyword({
  keyword: 'isValidDatabaseUrl',
  type: 'string',
  schemaType: 'boolean',
  compile: () => (data: string) => {
    const validProtocols = ['postgresql://', 'mysql://', 'sqlite://', 'mongodb://'];
    return validProtocols.some(protocol => data.startsWith(protocol));
  }
});
```

## Configuration Examples

### Basic Configuration

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "cors": {
      "enabled": true,
      "origin": ["http://localhost:3000", "http://localhost:3001"]
    }
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "ixp_server",
    "username": "postgres",
    "password": "password"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

### Production Configuration

```json
{
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "cors": {
      "enabled": true,
      "origin": ["https://myapp.com"],
      "credentials": true
    },
    "compression": {
      "enabled": true,
      "level": 6
    }
  },
  "database": {
    "type": "postgresql",
    "url": "postgresql://user:pass@prod-db:5432/ixp_prod",
    "ssl": true,
    "pool": {
      "min": 5,
      "max": 20
    }
  },
  "cache": {
    "type": "redis",
    "url": "redis://prod-redis:6379",
    "ttl": 7200
  },
  "security": {
    "authentication": {
      "type": "jwt",
      "jwt": {
        "secret": "your-super-secret-key-here",
        "expiresIn": "15m",
        "refreshToken": {
          "enabled": true,
          "expiresIn": "7d"
        }
      }
    },
    "rateLimit": {
      "enabled": true,
      "windowMs": 900000,
      "max": 100
    },
    "helmet": true
  },
  "performance": {
    "clustering": {
      "enabled": true,
      "workers": "auto"
    }
  },
  "logging": {
    "level": "warn",
    "format": "json",
    "transports": [
      {
        "type": "console"
      },
      {
        "type": "file",
        "filename": "/var/log/ixp-server.log",
        "level": "error"
      }
    ]
  }
}
```

### Development Configuration

```json
{
  "server": {
    "port": 3000,
    "cors": {
      "enabled": true,
      "origin": true
    }
  },
  "database": {
    "type": "sqlite",
    "database": "./dev.db"
  },
  "cache": {
    "type": "memory",
    "maxSize": 1000
  },
  "security": {
    "authentication": {
      "type": "jwt",
      "jwt": {
        "secret": "dev-secret-key",
        "expiresIn": "24h"
      }
    }
  },
  "logging": {
    "level": "debug",
    "format": "text"
  },
  "development": {
    "hotReload": true,
    "debugMode": true,
    "mockData": {
      "enabled": true,
      "seed": 12345
    }
  }
}
```

This configuration schema reference provides comprehensive documentation for all available configuration options in the IXP Server SDK, ensuring proper setup and validation of server instances.