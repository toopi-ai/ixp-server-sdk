---
id: examples
title: Examples
sidebar_label: Examples
sidebar_position: 8
description: Comprehensive examples and usage patterns for the IXP Server SDK
---

# Examples

This guide provides comprehensive examples of using the IXP Server SDK in various scenarios.

## Basic Examples

### Simple Server Setup

```typescript
// src/server.ts
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: [
    {
      name: 'hello_world',
      description: 'Display a hello world message',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'World' }
        }
      },
      component: 'HelloComponent',
      version: '1.0.0'
    }
  ],
  components: {
    HelloComponent: {
      name: 'HelloComponent',
      framework: 'react',
      remoteUrl: 'http://localhost:5173/Hello.js',
      exportName: 'Hello',
      propsSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['*']
    }
  },
  port: 3001
});

server.listen().then(() => {
  console.log('IXP Server running on port 3001');
});
```

### Using Configuration Files

```typescript
// src/server.ts
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001
});

server.listen();
```

```json
// config/intents.json
{
  "version": "1.0.0",
  "intents": [
    {
      "name": "show_weather",
      "description": "Display weather information",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "City name"
          },
          "units": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "default": "celsius"
          }
        },
        "required": ["city"]
      },
      "component": "WeatherWidget",
      "version": "1.0.0",
      "crawlable": true,
      "category": "weather"
    }
  ]
}
```

```json
// config/components.json
{
  "version": "1.0.0",
  "components": {
    "WeatherWidget": {
      "name": "WeatherWidget",
      "framework": "react",
      "remoteUrl": "https://cdn.myapp.com/WeatherWidget.js",
      "exportName": "WeatherWidget",
      "propsSchema": {
        "type": "object",
        "properties": {
          "city": { "type": "string" },
          "units": { "type": "string" }
        },
        "required": ["city"]
      },
      "version": "1.0.0",
      "allowedOrigins": ["https://myapp.com", "http://localhost:3000"],
      "bundleSize": "25KB",
      "performance": {
        "tti": "0.5s",
        "bundleSizeGzipped": "8KB"
      },
      "securityPolicy": {
        "allowEval": false,
        "maxBundleSize": "100KB",
        "sandboxed": true
      }
    }
  }
}
```

## E-commerce Example

### Product Catalog Server

```typescript
// src/ecommerce-server.ts
import { createIXPServer, ConfigBuilder } from 'ixp-server';

const config = ConfigBuilder.create()
  .port(3001)
  .intents([
    {
      name: 'show_products',
      description: 'Display product catalog with filtering and pagination',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Product category',
            enum: ['electronics', 'clothing', 'books', 'home']
          },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 }
            }
          },
          sortBy: {
            type: 'string',
            enum: ['price', 'rating', 'popularity', 'newest'],
            default: 'popularity'
          },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
        }
      },
      component: 'ProductGrid',
      version: '1.0.0',
      crawlable: true,
      category: 'ecommerce'
    },
    {
      name: 'show_product_details',
      description: 'Display detailed product information',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          variant: { type: 'string' }
        },
        required: ['productId']
      },
      component: 'ProductDetails',
      version: '1.0.0',
      crawlable: true,
      category: 'ecommerce'
    },
    {
      name: 'show_shopping_cart',
      description: 'Display shopping cart with items',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      component: 'ShoppingCart',
      version: '1.0.0',
      category: 'ecommerce'
    }
  ])
  .components({
    ProductGrid: {
      name: 'ProductGrid',
      framework: 'react',
      remoteUrl: 'https://cdn.mystore.com/components/ProductGrid.js',
      exportName: 'ProductGrid',
      propsSchema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          priceRange: { type: 'object' },
          sortBy: { type: 'string' },
          page: { type: 'number' },
          limit: { type: 'number' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['https://mystore.com'],
      bundleSize: '85KB',
      performance: {
        tti: '1.2s',
        bundleSizeGzipped: '28KB'
      },
      securityPolicy: {
        allowEval: false,
        maxBundleSize: '200KB',
        sandboxed: true
      }
    },
    ProductDetails: {
      name: 'ProductDetails',
      framework: 'react',
      remoteUrl: 'https://cdn.mystore.com/components/ProductDetails.js',
      exportName: 'ProductDetails',
      propsSchema: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          variant: { type: 'string' }
        },
        required: ['productId']
      },
      version: '1.0.0',
      allowedOrigins: ['https://mystore.com'],
      bundleSize: '65KB'
    },
    ShoppingCart: {
      name: 'ShoppingCart',
      framework: 'react',
      remoteUrl: 'https://cdn.mystore.com/components/ShoppingCart.js',
      exportName: 'ShoppingCart',
      propsSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      version: '1.0.0',
      allowedOrigins: ['https://mystore.com'],
      bundleSize: '45KB'
    }
  })
  .middleware(['rateLimit', 'validation', 'cors'])
  .plugins(['swagger', 'healthMonitoring', 'metrics'])
  .build();

const server = createIXPServer(config);

server.listen().then(() => {
  console.log('E-commerce IXP Server running on port 3001');
});
```

## Advanced Features Example

### Server with Custom Middleware and Plugins

```typescript
// src/advanced-server.ts
import { 
  createIXPServer,
  createRateLimitMiddleware,
  createValidationMiddleware,
  createSwaggerPlugin,
  createMetricsPlugin
} from 'ixp-server';

// Custom authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Verify token (simplified)
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Custom logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001,
  
  // CORS configuration
  cors: {
    origins: ['https://myapp.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Security configuration
  security: {
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    componentSecurity: {
      maxBundleSize: '500KB',
      allowEval: false,
      sandboxed: true
    }
  },
  
  // Data providers
  dataProviders: [
    {
      name: 'products',
      type: 'rest',
      config: {
        baseUrl: 'https://api.mystore.com',
        headers: {
          'Authorization': `Bearer ${process.env.PRODUCTS_API_TOKEN}`
        },
        timeout: 5000
      }
    },
    {
      name: 'cache',
      type: 'redis',
      config: {
        host: 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD
      }
    }
  ],
  
  // Theme configuration
  theme: {
    name: 'corporate',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545'
    },
    typography: {
      fontFamily: 'Inter, sans-serif'
    }
  }
});

// Add custom middleware
server.use(requestLogger);
server.use('/api/protected', authMiddleware);
server.use(createRateLimitMiddleware({ max: 100, windowMs: 15 * 60 * 1000 }));
server.use(createValidationMiddleware({ strictMode: true }));

// Add plugins
server.plugin(createSwaggerPlugin({
  title: 'Advanced IXP Server API',
  version: '2.0.0',
  description: 'Advanced IXP server with authentication and monitoring'
}));

server.plugin(createMetricsPlugin({
  path: '/metrics',
  collectDefaultMetrics: true,
  customMetrics: [
    {
      name: 'user_sessions',
      help: 'Active user sessions',
      type: 'gauge'
    }
  ]
}));

server.listen().then(() => {
  console.log('Advanced IXP Server running on port 3001');
});
```

## Microservices Example

### Multiple Specialized Servers

```typescript
// src/user-service.ts
import { createIXPServer } from 'ixp-server';

const userService = createIXPServer({
  intents: [
    {
      name: 'show_user_profile',
      description: 'Display user profile information',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      component: 'UserProfile',
      version: '1.0.0'
    },
    {
      name: 'edit_user_profile',
      description: 'Edit user profile form',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      component: 'UserProfileEditor',
      version: '1.0.0'
    }
  ],
  components: {
    UserProfile: {
      name: 'UserProfile',
      framework: 'react',
      remoteUrl: 'https://cdn.users.myapp.com/UserProfile.js',
      exportName: 'UserProfile',
      propsSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      version: '1.0.0',
      allowedOrigins: ['https://myapp.com']
    },
    UserProfileEditor: {
      name: 'UserProfileEditor',
      framework: 'react',
      remoteUrl: 'https://cdn.users.myapp.com/UserProfileEditor.js',
      exportName: 'UserProfileEditor',
      propsSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      version: '1.0.0',
      allowedOrigins: ['https://myapp.com']
    }
  },
  port: 3002
});

userService.listen();
```

```typescript
// src/product-service.ts
import { createIXPServer } from 'ixp-server';

const productService = createIXPServer({
  intents: [
    {
      name: 'search_products',
      description: 'Search products with filters',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          filters: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              priceRange: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' }
                }
              }
            }
          }
        },
        required: ['query']
      },
      component: 'ProductSearch',
      version: '1.0.0'
    }
  ],
  components: {
    ProductSearch: {
      name: 'ProductSearch',
      framework: 'react',
      remoteUrl: 'https://cdn.products.myapp.com/ProductSearch.js',
      exportName: 'ProductSearch',
      propsSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          filters: { type: 'object' }
        },
        required: ['query']
      },
      version: '1.0.0',
      allowedOrigins: ['https://myapp.com']
    }
  },
  port: 3003
});

productService.listen();
```

## Development Server Example

### Hot Reload Development Setup

```typescript
// src/dev-server.ts
import { createDevServer } from 'ixp-server';
import chokidar from 'chokidar';

const devServer = await createDevServer({
  port: 3001,
  intents: './config/intents.json',
  components: './config/components.json',
  
  // Development features
  hotReload: true,
  debugMode: true,
  
  // File watching
  watchFiles: [
    './config/**/*.json',
    './src/**/*.ts',
    './components/**/*.js'
  ],
  
  // Mock data for development
  mockData: {
    enabled: true,
    path: './mocks',
    delay: 100 // Simulate network delay
  },
  
  // Proxy for external services
  proxy: {
    '/api/products': 'http://localhost:8080',
    '/api/users': 'http://localhost:8081'
  },
  
  // Development middleware
  middleware: [
    // CORS for development
    (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    },
    
    // Request logging
    (req, res, next) => {
      console.log(`[DEV] ${req.method} ${req.path}`);
      next();
    }
  ]
});

// Custom file watcher for component updates
chokidar.watch('./components/**/*.js').on('change', (path) => {
  console.log(`Component updated: ${path}`);
  devServer.reloadComponents();
});

console.log('Development server running on port 3001');
console.log('Hot reload enabled - changes will be automatically applied');
```

## Testing Examples

### Unit Tests

```typescript
// tests/server.test.ts
import request from 'supertest';
import { createIXPApp } from 'ixp-server';

describe('IXP Server', () => {
  let app;
  
  beforeEach(() => {
    app = createIXPApp({
      intents: [
        {
          name: 'test_intent',
          description: 'Test intent',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
          remoteUrl: 'http://localhost:5173/TestComponent.js',
          exportName: 'TestComponent',
          propsSchema: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          version: '1.0.0',
          allowedOrigins: ['*']
        }
      }
    });
  });
  
  describe('GET /ixp/intents', () => {
    it('should return list of intents', async () => {
      const response = await request(app)
        .get('/ixp/intents')
        .expect(200);
      
      expect(response.body.intents).toHaveLength(1);
      expect(response.body.intents[0].name).toBe('test_intent');
    });
  });
  
  describe('POST /ixp/render', () => {
    it('should resolve intent to component', async () => {
      const response = await request(app)
        .post('/ixp/render')
        .send({
          intent: {
            name: 'test_intent',
            parameters: {
              message: 'Hello World'
            }
          }
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.component.name).toBe('TestComponent');
      expect(response.body.component.props.message).toBe('Hello World');
    });
    
    it('should return error for unknown intent', async () => {
      const response = await request(app)
        .post('/ixp/render')
        .send({
          intent: {
            name: 'unknown_intent',
            parameters: {}
          }
        })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTENT_NOT_FOUND');
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { createIXPServer } from 'ixp-server';
import request from 'supertest';

describe('Integration Tests', () => {
  let server;
  let app;
  
  beforeAll(async () => {
    server = createIXPServer({
      intents: './test-config/intents.json',
      components: './test-config/components.json',
      port: 0 // Use random port
    });
    
    app = server.app;
    await server.listen();
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  it('should handle complete intent resolution flow', async () => {
    // Test intent listing
    const intentsResponse = await request(app)
      .get('/ixp/intents')
      .expect(200);
    
    expect(intentsResponse.body.intents.length).toBeGreaterThan(0);
    
    // Test component listing
    const componentsResponse = await request(app)
      .get('/ixp/components')
      .expect(200);
    
    expect(componentsResponse.body.components).toBeDefined();
    
    // Test intent resolution
    const renderResponse = await request(app)
      .post('/ixp/render')
      .send({
        intent: {
          name: intentsResponse.body.intents[0].name,
          parameters: {}
        }
      })
      .expect(200);
    
    expect(renderResponse.body.success).toBe(true);
    expect(renderResponse.body.component).toBeDefined();
  });
  
  it('should handle health checks', async () => {
    const response = await request(app)
      .get('/ixp/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
  });
});
```

## Deployment Examples

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/ixp/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ixp-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - IXP_PORT=3001
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ixp-server
  labels:
    app: ixp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ixp-server
  template:
    metadata:
      labels:
        app: ixp-server
    spec:
      containers:
      - name: ixp-server
        image: myregistry.com/ixp-server:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: IXP_PORT
          value: "3001"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ixp-server-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /ixp/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ixp/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ixp-server-service
spec:
  selector:
    app: ixp-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

## Performance Optimization Examples

### Caching and Performance

```typescript
// src/optimized-server.ts
import { createIXPServer, createCachePlugin } from 'ixp-server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001,
  
  // Performance optimizations
  middleware: [
    'compression', // Enable gzip compression
    'rateLimit',   // Prevent abuse
    'cache'        // Response caching
  ],
  
  plugins: [
    createCachePlugin({
      type: 'redis',
      redis: {
        host: 'localhost',
        port: 6379
      },
      defaultTTL: 300, // 5 minutes
      rules: [
        {
          path: '/ixp/intents',
          methods: ['GET'],
          ttl: 3600 // Cache for 1 hour
        },
        {
          path: '/ixp/components',
          methods: ['GET'],
          ttl: 1800 // Cache for 30 minutes
        }
      ]
    })
  ]
});

// Custom caching middleware for intent resolution
server.use('/ixp/render', async (req, res, next) => {
  const cacheKey = `render:${JSON.stringify(req.body)}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send to cache response
  res.send = function(body) {
    // Cache successful responses
    if (res.statusCode === 200) {
      redis.setex(cacheKey, 60, body); // Cache for 1 minute
    }
    return originalSend.call(this, body);
  };
  
  next();
});

server.listen();
```

These examples demonstrate the flexibility and power of the IXP Server SDK across various use cases, from simple setups to complex production deployments with advanced features like caching, monitoring, and microservices architecture.