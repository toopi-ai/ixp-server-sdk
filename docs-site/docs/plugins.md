---
id: plugins
title: Plugins
sidebar_label: Plugins
sidebar_position: 5
description: Explore built-in plugins and learn how to create custom plugins for your IXP Server
---

# Plugins Guide

Plugins extend the functionality of your IXP Server with additional features like API documentation, health monitoring, metrics collection, and more.

## Overview

Plugins are modular extensions that can:
- Add new endpoints and routes
- Integrate with external services
- Provide monitoring and analytics
- Enhance developer experience
- Add custom functionality

## Built-in Plugins

### Swagger Plugin

Generates OpenAPI documentation for your IXP Server API.

```typescript
import { createSwaggerPlugin } from 'ixp-server';

const swaggerPlugin = createSwaggerPlugin({
  title: 'My IXP Server API',
  version: '1.0.0',
  description: 'API documentation for my IXP server',
  path: '/api-docs',
  ui: true,
  json: true,
  yaml: true,
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.myapp.com',
      description: 'Production server'
    }
  ],
  contact: {
    name: 'API Support',
    email: 'support@myapp.com',
    url: 'https://myapp.com/support'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  },
  tags: [
    {
      name: 'Intents',
      description: 'Intent resolution endpoints'
    },
    {
      name: 'Components',
      description: 'Component registry endpoints'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
});
```

**Configuration Options:**
- `title`: API title
- `version`: API version
- `description`: API description
- `path`: Documentation endpoint path
- `ui`: Enable Swagger UI
- `json`: Enable JSON endpoint
- `yaml`: Enable YAML endpoint
- `servers`: API server definitions
- `contact`: Contact information
- `license`: License information
- `tags`: API tags for organization
- `security`: Security schemes

**Generated Endpoints:**
- `GET /api-docs` - Swagger UI
- `GET /api-docs.json` - OpenAPI JSON
- `GET /api-docs.yaml` - OpenAPI YAML

### Health Monitoring Plugin

Provides comprehensive health checks and monitoring.

```typescript
import { createHealthMonitoringPlugin } from 'ixp-server';

const healthPlugin = createHealthMonitoringPlugin({
  path: '/health',
  detailed: true,
  checks: {
    database: {
      check: async () => {
        // Check database connectivity
        const result = await db.ping();
        return {
          status: result ? 'healthy' : 'unhealthy',
          message: result ? 'Database connected' : 'Database unreachable',
          responseTime: Date.now() - start
        };
      },
      timeout: 5000,
      interval: 30000
    },
    redis: {
      check: async () => {
        // Check Redis connectivity
        const result = await redis.ping();
        return {
          status: result === 'PONG' ? 'healthy' : 'unhealthy',
          message: result === 'PONG' ? 'Redis connected' : 'Redis unreachable'
        };
      },
      timeout: 3000,
      interval: 60000
    },
    externalApi: {
      check: async () => {
        // Check external API
        try {
          const response = await fetch('https://api.external.com/health');
          return {
            status: response.ok ? 'healthy' : 'unhealthy',
            message: `External API returned ${response.status}`,
            responseTime: response.headers.get('x-response-time')
          };
        } catch (error) {
          return {
            status: 'unhealthy',
            message: error.message
          };
        }
      },
      timeout: 10000,
      interval: 120000
    }
  },
  thresholds: {
    responseTime: 1000, // ms
    errorRate: 0.05, // 5%
    memoryUsage: 0.8 // 80%
  },
  notifications: {
    webhook: {
      url: 'https://hooks.slack.com/services/...',
      events: ['unhealthy', 'recovered']
    },
    email: {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'alerts@myapp.com',
          pass: process.env.SMTP_PASSWORD
        }
      },
      to: ['admin@myapp.com'],
      events: ['unhealthy']
    }
  }
});
```

**Configuration Options:**
- `path`: Health check endpoint path
- `detailed`: Include detailed health information
- `checks`: Custom health checks
- `thresholds`: Health thresholds
- `notifications`: Alert configurations

**Generated Endpoints:**
- `GET /health` - Overall health status
- `GET /health/detailed` - Detailed health information
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Metrics Plugin

Collects and exposes performance metrics.

```typescript
import { createMetricsPlugin } from 'ixp-server';

const metricsPlugin = createMetricsPlugin({
  path: '/metrics',
  format: 'prometheus', // 'prometheus' | 'json'
  collectDefaultMetrics: true,
  prefix: 'ixp_server_',
  labels: {
    service: 'ixp-server',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  },
  customMetrics: [
    {
      name: 'intent_resolution_duration',
      help: 'Time taken to resolve intents',
      type: 'histogram',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      labels: ['intent_name', 'component_name', 'status']
    },
    {
      name: 'component_load_duration',
      help: 'Time taken to load components',
      type: 'histogram',
      buckets: [0.1, 0.5, 1, 2, 5],
      labels: ['component_name', 'framework']
    },
    {
      name: 'active_connections',
      help: 'Number of active connections',
      type: 'gauge'
    },
    {
      name: 'intent_requests_total',
      help: 'Total number of intent requests',
      type: 'counter',
      labels: ['intent_name', 'status']
    }
  ],
  sampling: {
    rate: 1.0, // Sample 100% of requests
    maxSamples: 10000
  },
  retention: {
    duration: '7d', // Keep metrics for 7 days
    aggregation: 'avg' // Aggregation method
  }
});
```

**Configuration Options:**
- `path`: Metrics endpoint path
- `format`: Metrics format (Prometheus or JSON)
- `collectDefaultMetrics`: Collect Node.js default metrics
- `prefix`: Metric name prefix
- `labels`: Default labels for all metrics
- `customMetrics`: Custom metric definitions
- `sampling`: Sampling configuration
- `retention`: Data retention settings

**Generated Endpoints:**
- `GET /metrics` - Prometheus metrics
- `GET /metrics.json` - JSON metrics (if enabled)

### Logging Plugin

Enhanced logging with structured output and multiple transports.

```typescript
import { createLoggingPlugin } from 'ixp-server';

const loggingPlugin = createLoggingPlugin({
  level: 'info',
  format: 'json',
  transports: [
    {
      type: 'console',
      options: {
        colorize: true,
        timestamp: true,
        level: 'debug'
      }
    },
    {
      type: 'file',
      options: {
        filename: 'logs/ixp-server.log',
        maxSize: '10MB',
        maxFiles: 5,
        rotate: true,
        level: 'info'
      }
    },
    {
      type: 'http',
      options: {
        host: 'logs.myapp.com',
        port: 443,
        path: '/logs',
        ssl: true,
        level: 'error'
      }
    }
  ],
  requestLogging: {
    enabled: true,
    includeBody: false,
    includeHeaders: false,
    excludePaths: ['/health', '/metrics'],
    sanitize: {
      headers: ['authorization', 'cookie'],
      body: ['password', 'token']
    }
  },
  errorLogging: {
    enabled: true,
    includeStack: true,
    includeRequest: true
  }
});
```

### Cache Plugin

Provides response caching capabilities.

```typescript
import { createCachePlugin } from 'ixp-server';

const cachePlugin = createCachePlugin({
  type: 'redis', // 'memory' | 'redis'
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    db: 1
  },
  defaultTTL: 300, // 5 minutes
  keyPrefix: 'ixp:cache:',
  rules: [
    {
      path: '/ixp/intents',
      methods: ['GET'],
      ttl: 3600, // 1 hour
      varyBy: ['user-agent']
    },
    {
      path: '/ixp/components',
      methods: ['GET'],
      ttl: 1800, // 30 minutes
    },
    {
      path: '/ixp/render',
      methods: ['POST'],
      ttl: 60, // 1 minute
      varyBy: ['intent.name', 'context.userId']
    }
  ],
  compression: true,
  maxSize: '1MB'
});
```

### Analytics Plugin

Collects usage analytics and insights.

```typescript
import { createAnalyticsPlugin } from 'ixp-server';

const analyticsPlugin = createAnalyticsPlugin({
  providers: [
    {
      name: 'google-analytics',
      config: {
        trackingId: 'GA_TRACKING_ID',
        anonymizeIp: true
      }
    },
    {
      name: 'mixpanel',
      config: {
        token: 'MIXPANEL_TOKEN',
        apiSecret: 'MIXPANEL_SECRET'
      }
    }
  ],
  events: {
    intentResolved: {
      track: true,
      properties: ['intentName', 'componentName', 'userId', 'responseTime']
    },
    componentLoaded: {
      track: true,
      properties: ['componentName', 'framework', 'loadTime']
    },
    errorOccurred: {
      track: true,
      properties: ['errorType', 'errorMessage', 'path']
    }
  },
  sampling: {
    rate: 0.1, // Sample 10% of events
    rules: [
      {
        event: 'errorOccurred',
        rate: 1.0 // Always track errors
      }
    ]
  },
  privacy: {
    anonymizeIps: true,
    excludeHeaders: ['authorization', 'cookie'],
    gdprCompliant: true
  }
});
```

## Using Plugins

### Configuration-based

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  plugins: [
    'swagger',
    'healthMonitoring',
    'metrics',
    'logging',
    'cache',
    'analytics'
  ]
});
```

### Programmatic

```typescript
import { 
  createIXPServer,
  createSwaggerPlugin,
  createMetricsPlugin
} from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json'
});

// Add plugins programmatically
server.plugin(createSwaggerPlugin({ title: 'My API' }));
server.plugin(createMetricsPlugin({ path: '/metrics' }));
```

### With Options

```typescript
const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  plugins: [
    {
      name: 'swagger',
      options: {
        title: 'My IXP Server API',
        version: '1.0.0',
        path: '/docs'
      }
    },
    {
      name: 'metrics',
      options: {
        path: '/metrics',
        collectDefaultMetrics: true
      }
    }
  ]
});
```

## Custom Plugins

### Basic Plugin Structure

```typescript
import { PluginFunction, IXPServer } from 'ixp-server';

interface MyPluginOptions {
  enabled: boolean;
  path: string;
  customOption: string;
}

function createMyPlugin(options: MyPluginOptions): PluginFunction {
  return (server: IXPServer) => {
    if (!options.enabled) {
      return;
    }
    
    // Add custom routes
    server.app.get(options.path, (req, res) => {
      res.json({
        message: 'Hello from my plugin!',
        customOption: options.customOption
      });
    });
    
    // Add middleware
    server.use((req, res, next) => {
      req.myPlugin = {
        timestamp: Date.now(),
        customData: options.customOption
      };
      next();
    });
    
    // Listen to server events
    server.on('intent:resolved', (data) => {
      console.log('Plugin: Intent resolved', data);
    });
    
    // Plugin initialization
    console.log('My plugin initialized with options:', options);
  };
}

// Usage
const myPlugin = createMyPlugin({
  enabled: true,
  path: '/my-plugin',
  customOption: 'Hello World'
});

server.plugin(myPlugin);
```

### Advanced Plugin with Database

```typescript
import { PluginFunction, IXPServer } from 'ixp-server';
import { Database } from 'sqlite3';

interface AuditPluginOptions {
  dbPath: string;
  logRequests: boolean;
  logResponses: boolean;
  retentionDays: number;
}

function createAuditPlugin(options: AuditPluginOptions): PluginFunction {
  return async (server: IXPServer) => {
    // Initialize database
    const db = new Database(options.dbPath);
    
    // Create tables
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          method TEXT,
          path TEXT,
          status_code INTEGER,
          response_time INTEGER,
          user_id TEXT,
          request_body TEXT,
          response_body TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    // Add audit middleware
    server.use((req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;
      let responseBody = '';
      
      // Capture response
      res.send = function(body) {
        responseBody = body;
        return originalSend.call(this, body);
      };
      
      // Log after response
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        
        const logEntry = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          userId: req.user?.id || null,
          requestBody: options.logRequests ? JSON.stringify(req.body) : null,
          responseBody: options.logResponses ? responseBody : null
        };
        
        // Insert into database
        db.run(`
          INSERT INTO audit_log 
          (method, path, status_code, response_time, user_id, request_body, response_body)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          logEntry.method,
          logEntry.path,
          logEntry.statusCode,
          logEntry.responseTime,
          logEntry.userId,
          logEntry.requestBody,
          logEntry.responseBody
        ]);
      });
      
      next();
    });
    
    // Add audit API endpoints
    server.app.get('/audit/logs', (req, res) => {
      const { limit = 100, offset = 0 } = req.query;
      
      db.all(`
        SELECT * FROM audit_log 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ logs: rows });
      });
    });
    
    server.app.get('/audit/stats', (req, res) => {
      db.all(`
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM audit_log 
        WHERE timestamp >= datetime('now', '-24 hours')
      `, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(rows[0]);
      });
    });
    
    // Cleanup old logs
    setInterval(() => {
      db.run(`
        DELETE FROM audit_log 
        WHERE timestamp < datetime('now', '-${options.retentionDays} days')
      `);
    }, 24 * 60 * 60 * 1000); // Run daily
    
    console.log('Audit plugin initialized');
  };
}
```

### Plugin with External Service Integration

```typescript
interface SlackPluginOptions {
  webhookUrl: string;
  channel: string;
  events: string[];
  username?: string;
  iconEmoji?: string;
}

function createSlackPlugin(options: SlackPluginOptions): PluginFunction {
  return (server: IXPServer) => {
    const sendSlackMessage = async (message: string, color?: string) => {
      try {
        await fetch(options.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: options.channel,
            username: options.username || 'IXP Server',
            icon_emoji: options.iconEmoji || ':robot_face:',
            attachments: [{
              color: color || 'good',
              text: message,
              ts: Math.floor(Date.now() / 1000)
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send Slack message:', error);
      }
    };
    
    // Listen to server events
    if (options.events.includes('server:started')) {
      server.on('server:started', () => {
        sendSlackMessage('🚀 IXP Server started successfully', 'good');
      });
    }
    
    if (options.events.includes('error')) {
      server.on('error', (error) => {
        sendSlackMessage(`❌ Server error: ${error.message}`, 'danger');
      });
    }
    
    if (options.events.includes('intent:resolved')) {
      server.on('intent:resolved', (data) => {
        sendSlackMessage(
          `✅ Intent resolved: ${data.intentName} → ${data.componentName}`,
          'good'
        );
      });
    }
  };
}
```

## Plugin Factory Pattern

```typescript
class PluginFactory {
  static swagger = createSwaggerPlugin;
  static healthMonitoring = createHealthMonitoringPlugin;
  static metrics = createMetricsPlugin;
  static logging = createLoggingPlugin;
  static cache = createCachePlugin;
  static analytics = createAnalyticsPlugin;
  
  // Custom plugins
  static audit = createAuditPlugin;
  static slack = createSlackPlugin;
  
  // Plugin combinations
  static monitoring(options: MonitoringOptions) {
    return [
      this.healthMonitoring(options.health),
      this.metrics(options.metrics),
      this.logging(options.logging)
    ];
  }
  
  static production(options: ProductionOptions) {
    return [
      this.healthMonitoring(options.health),
      this.metrics(options.metrics),
      this.cache(options.cache),
      this.analytics(options.analytics)
    ];
  }
}

// Usage
const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  plugins: [
    ...PluginFactory.monitoring({
      health: { path: '/health' },
      metrics: { path: '/metrics' },
      logging: { level: 'info' }
    }),
    PluginFactory.slack({
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts',
      events: ['error', 'server:started']
    })
  ]
});
```

## Testing Plugins

```typescript
import request from 'supertest';
import { createIXPApp } from 'ixp-server';
import { createMyPlugin } from './my-plugin';

describe('My Plugin', () => {
  let app;
  
  beforeEach(() => {
    app = createIXPApp({
      intents: [],
      components: {},
      plugins: [
        createMyPlugin({
          enabled: true,
          path: '/test-plugin',
          customOption: 'test'
        })
      ]
    });
  });
  
  it('should add custom endpoint', async () => {
    const response = await request(app)
      .get('/test-plugin')
      .expect(200);
    
    expect(response.body.message).toBe('Hello from my plugin!');
    expect(response.body.customOption).toBe('test');
  });
  
  it('should add middleware', async () => {
    const response = await request(app)
      .get('/ixp/health')
      .expect(200);
    
    // Test that middleware was applied
    // This would depend on how your middleware modifies the request/response
  });
});
```

## Best Practices

1. **Single Responsibility** - Each plugin should have a focused purpose
2. **Configuration** - Make plugins configurable with sensible defaults
3. **Error Handling** - Handle errors gracefully and don't crash the server
4. **Performance** - Avoid blocking operations in plugin initialization
5. **Testing** - Write comprehensive tests for plugin functionality
6. **Documentation** - Document plugin options and behavior
7. **Versioning** - Version your plugins and handle compatibility
8. **Security** - Validate all inputs and follow security best practices
9. **Cleanup** - Properly clean up resources when the server shuts down
10. **Logging** - Use structured logging for debugging and monitoring

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Check plugin registration and configuration
2. **Route conflicts**: Ensure plugin routes don't conflict with existing routes
3. **Memory leaks**: Properly clean up event listeners and timers
4. **Performance issues**: Profile plugin code and optimize bottlenecks
5. **Configuration errors**: Validate plugin configuration on startup

### Debugging

```typescript
const debugPlugin: PluginFunction = (server) => {
  console.log('Available routes:', server.app._router.stack.map(layer => layer.route?.path));
  console.log('Registered plugins:', server.plugins.map(p => p.name));
  
  server.on('plugin:loaded', (plugin) => {
    console.log('Plugin loaded:', plugin.name);
  });
};
```