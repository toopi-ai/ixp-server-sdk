# IXP Server SDK

[![npm version](https://badge.fury.io/js/ixp-server.svg)](https://badge.fury.io/js/ixp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-57%20passing-brightgreen.svg)](https://github.com/your-org/ixp-server-sdk)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://github.com/your-org/ixp-server-sdk)

A comprehensive SDK for building Intent Exchange Protocol (IXP) servers with ease. This SDK provides everything you need to create IXP-compliant servers that can handle intent-driven component rendering, including built-in support for crawler content, health monitoring, metrics collection, and extensive middleware capabilities.

**Latest Version: 1.1.1** - Now available on npm! 🎉

## 🚀 Quick Start

### Installation

```bash
npm install ixp-server
# or
yarn add ixp-server
# or
pnpm add ixp-server
```

### Basic Usage

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001,
  cors: { origins: ['http://localhost:3000'] }
});

server.listen();
```

### CLI Quick Start

```bash
# Install globally
npm install -g ixp-server

# Create a new project
ixp-server create my-ixp-server
cd my-ixp-server
npm install
npm run dev

# Or try our examples
git clone https://github.com/your-org/ixp-server-sdk.git
cd ixp-server-sdk
npm install
npx tsx examples/minimal-server.ts
```

## 📖 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Plugins](#-plugins)
- [Middleware](#-middleware)
- [CLI Tools](#-cli-tools)
- [Examples](#-examples)
- [Testing](#-testing)
- [Contributing](#-contributing)

## ✨ Features

- **Easy Setup**: Get started with a single function call
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Plugin System**: Extensible architecture with built-in plugins (Swagger, Health Monitoring, Metrics)
- **Middleware Support**: 8+ built-in middleware factories for rate limiting, validation, security, and more
- **Hot Reload**: Development mode with file watching and hot reload
- **Validation**: Built-in parameter validation using Zod schemas with JSON Schema conversion
- **Crawler Content**: Built-in `/ixp/crawler_content` endpoint for SEO and search engine indexing
- **CLI Tools**: Command-line tools for scaffolding and management
- **Health Checks**: Comprehensive health monitoring with custom checks
- **Documentation**: Auto-generated OpenAPI/Swagger documentation with interactive UI
- **Security**: Built-in security headers, CORS, rate limiting, and origin validation
- **Intent Resolution Pipeline**: Advanced intent resolution with parameter validation and component mapping
- **Data Provider Interface**: Flexible data integration with custom resolver functions
- **Production Ready**: Published on npm with 57 passing tests and 95%+ coverage
- **Four Example Servers**: Minimal, React, Vue, and Advanced Features examples included

## 🛠 Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- TypeScript 4.5+ (for development)

### Package Installation

```bash
# Install as dependency
npm install ixp-server

# Or install with yarn
yarn add ixp-server

# Or install with pnpm
pnpm add ixp-server
```

### Global CLI Installation

```bash
# Install CLI globally
npm install -g ixp-server

# Verify installation
ixp-server --version
# Output: 1.1.1

# Get help
ixp-server --help
```

## 📚 API Reference

### Core API Endpoints

The IXP Server SDK automatically provides these standard endpoints:

- **`GET /ixp/intents`** - Intent Discovery: Returns all available intents
- **`GET /ixp/components`** - Component Registry: Returns all registered components  
- **`POST /ixp/render`** - Component Resolution: Resolves intent requests to component descriptors
- **`GET /ixp/crawler_content`** - Crawler Content: Returns crawlable public content for SEO
- **`GET /ixp/health`** - Health Check: Returns server health status
- **`GET /ixp/metrics`** - Metrics: Returns server performance metrics

### createIXPServer(config)

Creates a new IXP server instance.

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json', // or IntentDefinition[]
  components: './config/components.json', // or Record<string, ComponentDefinition>
  port: 3001,
  cors: {
    origins: ['http://localhost:3000'],
    credentials: true
  },
  logging: {
    level: 'info',
    format: 'text'
  },
  dataProvider: {
    async getCrawlerContent(options) {
      // Custom crawler content implementation
      return { contents: [], pagination: { nextCursor: null, hasMore: false }, lastUpdated: new Date().toISOString() };
    },
    async resolveIntentData(intent, context) {
      // Custom intent data resolution
      return {};
    }
  },
  plugins: [/* plugins */],
  middleware: [/* middleware */]
});
```

### createIXPApp(config, mountPath)

Creates an Express app with IXP server mounted.

```typescript
import { createIXPApp } from 'ixp-server';

const app = createIXPApp({
  intents: './config/intents.json',
  components: './config/components.json'
}, '/ixp'); // mount path

app.listen(3001);
```

### quickStart(options)

Quick start function for simple use cases.

```typescript
import { quickStart } from 'ixp-server';

await quickStart({
  intents: './intents.json',
  components: './components.json',
  port: 3001,
  cors: ['http://localhost:3000']
});
```

### createDevServer(config)

Creates a development server with debugging features.

```typescript
import { createDevServer } from 'ixp-server';

const devServer = createDevServer({
  intents: './config/intents.json',
  components: './config/components.json'
});

await devServer.listen();
```

### ConfigBuilder

Fluent configuration builder for complex setups.

```typescript
import { ConfigBuilder } from 'ixp-server';

const config = new ConfigBuilder()
  .intents('./intents.json')
  .components('./components.json')
  .port(3001)
  .cors(['http://localhost:3000'])
  .logging('debug', 'json')
  .metrics(true)
  .dataProvider({
    async getCrawlerContent(options) {
      return { contents: [], pagination: { nextCursor: null, hasMore: false }, lastUpdated: new Date().toISOString() };
    }
  })
  .build();

const server = createIXPServer(config);
```

### Crawler Content Endpoint

The `/ixp/crawler_content` endpoint provides crawlable public content for search engines and indexing services.

#### Request Parameters

```typescript
GET /ixp/crawler_content?cursor=abc123&limit=100&lastUpdated=2024-01-01T00:00:00Z&format=json&type=intent
```

- **`cursor`** (optional): Pagination cursor for retrieving next batch of results
- **`limit`** (optional): Maximum number of items to return (1-1000, default: 100)
- **`lastUpdated`** (optional): ISO timestamp to get only content updated after this date
- **`format`** (optional): Response format ('json' only currently supported)
- **`type`** (optional): Content type filter ('intent', 'component', etc.)

#### Response Format

```typescript
{
  "contents": [
    {
      "type": "intent",
      "id": "show_products",
      "title": "Product Display",
      "description": "Display a list of products with filtering options",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "metadata": {
        "category": "e-commerce",
        "crawlable": true
      }
    }
  ],
  "pagination": {
    "nextCursor": "def456",
    "hasMore": true
  },
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

#### Custom Implementation

```typescript
const server = createIXPServer({
  // ... other config
  dataProvider: {
    async getCrawlerContent(options) {
      const { cursor, limit = 100, lastUpdated, type } = options;
      
      // Your custom logic to fetch crawlable content
      const contents = await fetchCrawlableContent({ cursor, limit, lastUpdated, type });
      
      return {
        contents: contents.map(item => ({
          type: item.type,
          id: item.id,
          title: item.title,
          description: item.description,
          lastUpdated: item.updatedAt,
          metadata: item.metadata
        })),
        pagination: {
          nextCursor: contents.length === limit ? generateNextCursor(contents) : null,
          hasMore: contents.length === limit
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }
});
```

## ⚙️ Configuration

### DataProvider Interface

The DataProvider interface allows you to customize data resolution and crawler content:

```typescript
interface DataProvider {
  getCrawlerContent?(options: CrawlerContentOptions): Promise<CrawlerContentResponse>;
  resolveIntentData?(intent: IntentRequest, context: any): Promise<Record<string, any>>;
}

interface CrawlerContentOptions {
  cursor?: string;
  limit?: number;
  lastUpdated?: string;
  format?: string;
  type?: string;
}

interface CrawlerContentResponse {
  contents: ContentItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  lastUpdated: string;
}
```

### Intent Definition

```json
{
  "intents": [
    {
      "name": "show_products",
      "description": "Display a list of products",
      "parameters": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "limit": { "type": "number" }
        },
        "required": ["category"]
      },
      "component": "ProductGrid",
      "version": "1.0.0",
      "crawlable": true
    }
  ]
}
```

### Component Definition

```json
{
  "components": {
    "ProductGrid": {
      "framework": "react",
      "remoteUrl": "http://localhost:5173/ProductGrid.js",
      "exportName": "ProductGrid",
      "propsSchema": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "limit": { "type": "number" }
        }
      },
      "version": "1.0.0",
      "allowedOrigins": ["http://localhost:3000"],
      "bundleSize": "45KB",
      "performance": {
        "tti": "0.8s",
        "bundleSizeGzipped": "15KB"
      },
      "securityPolicy": {
        "allowEval": false,
        "maxBundleSize": "200KB",
        "sandboxed": true
      }
    }
  }
}
```

## 🔌 Plugins

### Built-in Plugins

The SDK includes 3 powerful built-in plugins:

```typescript
import { PluginFactory } from 'ixp-server';

// Swagger Documentation - Auto-generates OpenAPI docs with interactive UI
server.addPlugin(PluginFactory.swagger({
  title: 'My IXP API',
  version: '1.0.0',
  description: 'Intent Exchange Protocol Server API Documentation',
  endpoint: '/api-docs.json', // JSON spec endpoint
  uiEndpoint: '/api-docs' // Interactive Swagger UI
}));
// Accessible at: http://localhost:3001/ixp/api-docs

// Health Monitoring - Comprehensive health checks with custom validators
server.addPlugin(PluginFactory.healthMonitoring({
  endpoint: '/health/detailed',
  checks: {
    database: async () => ({ 
      status: 'pass', 
      message: 'Database connection healthy',
      duration: 45 
    }),
    externalAPI: async () => {
      try {
        await fetch('https://api.example.com/health');
        return { status: 'pass', message: 'External API reachable' };
      } catch (error) {
        return { status: 'fail', message: 'External API unreachable' };
      }
    }
  }
}));
// Returns detailed health status with individual check results

// Metrics Collection - Detailed performance and system metrics
server.addPlugin(PluginFactory.metrics({
  endpoint: '/metrics/detailed',
  format: 'json', // 'json' or 'prometheus'
  includeSystemMetrics: true // Include memory, CPU, uptime
}));
// Provides metrics in JSON or Prometheus format for monitoring tools
```

### Custom Plugins

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install: async (server) => {
    server.app.get('/my-endpoint', (req, res) => {
      res.json({ message: 'Hello from my plugin!' });
    });
  },
  uninstall: async (server) => {
    // Cleanup logic
  }
};

server.addPlugin(myPlugin);
```

## 🛡️ Middleware

### Built-in Middleware

The SDK provides 8 built-in middleware factories for common functionality:

```typescript
import { MiddlewareFactory } from 'ixp-server';

// Rate Limiting - Prevents abuse by limiting requests per IP
server.addMiddleware(MiddlewareFactory.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}));

// Request Validation - Validates request format and content
server.addMiddleware(MiddlewareFactory.validation({
  maxBodySize: '10mb',
  allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded'],
  requireContentType: true
}));

// Origin Validation - Validates request origins for CORS
server.addMiddleware(MiddlewareFactory.originValidation({
  allowedOrigins: ['http://localhost:3000', 'https://myapp.com'],
  allowCredentials: true
}));

// Request Timeout - Prevents hanging requests
server.addMiddleware(MiddlewareFactory.timeout({
  timeout: 30000, // 30 seconds
  message: 'Request timeout'
}));

// Request ID - Adds unique ID to each request for tracing
server.addMiddleware(MiddlewareFactory.requestId({
  headerName: 'X-Request-ID',
  generator: () => Math.random().toString(36).substring(2, 15)
}));

// Security Headers - Adds security-related HTTP headers
server.addMiddleware(MiddlewareFactory.securityHeaders({
  hsts: true,
  noSniff: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  frameOptions: 'DENY'
}));

// Component Access Control - Controls access to component rendering
server.addMiddleware(MiddlewareFactory.componentAccess({
  checkOrigin: true,
  checkUserAgent: false,
  allowedUserAgents: []
}));

// Request Logging - Logs request details for debugging
server.addMiddleware(MiddlewareFactory.logging({
  logLevel: 'info',
  includeBody: false,
  includeHeaders: false,
  maxBodyLength: 1000
}));
```

### Custom Middleware

```typescript
const authMiddleware = {
  name: 'auth',
  priority: 100,
  handler: (req, res, next) => {
    // Authentication logic
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
};

server.addMiddleware(authMiddleware);
```

## 🔄 Intent Resolution Pipeline

The IXP Server SDK includes a sophisticated Intent Resolution Pipeline that handles the complete flow from intent requests to component descriptors:

### Pipeline Components

1. **IntentResolver** - Main orchestrator that coordinates the resolution process
2. **ParameterValidator** - Converts JSON Schema to Zod schemas and validates parameters
3. **ComponentRegistry** - Manages component definitions and retrieval
4. **IntentRegistry** - Manages intent definitions and discovery

### Resolution Flow

```typescript
// 1. Intent Request comes in
const request = {
  intent: {
    name: 'show_products',
    parameters: { category: 'electronics', limit: 10 }
  },
  options: { theme: 'dark' }
};

// 2. Intent Resolution Pipeline processes the request:
// - Finds intent definition in registry
// - Validates parameters against JSON Schema using Zod
// - Resolves component definition
// - Generates component descriptor

// 3. Response with component descriptor
const response = {
  record: {
    moduleUrl: 'http://localhost:5173/ProductGrid.js',
    exportName: 'ProductGrid',
    props: { category: 'electronics', limit: 10, theme: 'dark' }
  },
  component: { /* component definition */ },
  ttl: 300
};
```

### Parameter Validation

The SDK automatically converts JSON Schema definitions to Zod schemas for runtime validation:

```typescript
// Intent definition with JSON Schema
{
  "name": "show_products",
  "parameters": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["electronics", "clothing"] },
      "limit": { "type": "number", "minimum": 1, "maximum": 100 },
      "priceRange": {
        "type": "object",
        "properties": {
          "min": { "type": "number" },
          "max": { "type": "number" }
        }
      }
    },
    "required": ["category"]
  }
}

// Automatically converted to Zod schema for validation:
// z.object({
//   category: z.enum(['electronics', 'clothing']),
//   limit: z.number().min(1).max(100).optional(),
//   priceRange: z.object({
//     min: z.number().optional(),
//     max: z.number().optional()
//   }).optional()
// })
```

### Error Handling

The pipeline includes comprehensive error handling with standardized error responses:

```typescript
// Validation errors
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parameter validation failed",
    "timestamp": "2024-01-15T10:30:00Z",
    "details": {
      "field": "limit",
      "expected": "number between 1 and 100",
      "received": "150"
    }
  }
}

// Intent not found errors
{
  "error": {
    "code": "INTENT_NOT_FOUND",
    "message": "Intent 'unknown_intent' not found",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```
```

## 🖥️ CLI Tools

### Project Creation

```bash
# Create new project
ixp-server create my-project

# Create with specific template
ixp-server create my-project --template advanced

# Skip interactive prompts
ixp-server create my-project --yes
```

### Project Initialization

```bash
# Initialize in current directory
ixp-server init

# With specific template
ixp-server init --template basic
```

### Code Generation

```bash
# Generate intent
ixp-server generate:intent show_products --description "Display products" --component ProductGrid

# Generate component
ixp-server generate:component ProductGrid --framework react --url "http://localhost:5173/ProductGrid.js"
```

### Validation

```bash
# Validate configuration files
ixp-server validate

# Validate specific files
ixp-server validate --intents ./my-intents.json --components ./my-components.json
```

## 📝 Examples

The SDK includes four comprehensive examples demonstrating different use cases:

1. **Minimal Server** (`examples/minimal-server.ts`) - Basic IXP server with hello world intent
2. **React Components Server** (`examples/react-components-server.ts`) - React component integration
3. **Vue Components Server** (`examples/vue-components-server.ts`) - Vue.js component integration  
4. **Advanced Features Server** (`examples/advanced-features-server.ts`) - Full-featured server with plugins, middleware, and analytics

### Running Examples

```bash
# Clone the repository
git clone https://github.com/your-org/ixp-server-sdk.git
cd ixp-server-sdk
npm install

# Run minimal example
npx tsx examples/minimal-server.ts
# Server starts at http://localhost:3000

# Test the server
curl http://localhost:3000/ixp/intents
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{"intent": {"name": "hello_world", "parameters": {"name": "World"}}}'

# Run advanced example
npx tsx examples/advanced-features-server.ts
# Server starts at http://localhost:3001 with full features
```

### Basic E-commerce Server

```typescript
import { createIXPServer, PluginFactory, MiddlewareFactory } from 'ixp-server';

const server = createIXPServer({
  intents: [
    {
      name: 'show_products',
      description: 'Display products with optional filtering',
      parameters: {
        type: 'object',
        properties: {
          category: { 
            type: 'string', 
            enum: ['electronics', 'clothing', 'books'] 
          },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 }
            }
          },
          limit: { 
            type: 'number', 
            minimum: 1, 
            maximum: 100, 
            default: 20 
          }
        },
        required: ['category']
      },
      component: 'ProductGrid',
      version: '1.0.0',
      crawlable: true
    },
    {
      name: 'show_product_details',
      description: 'Display detailed information for a specific product',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          includeReviews: { type: 'boolean', default: true }
        },
        required: ['productId']
      },
      component: 'ProductDetails',
      version: '1.0.0',
      crawlable: true
    }
  ],
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
          priceRange: { type: 'object' },
          limit: { type: 'number' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['http://localhost:3000', 'https://mystore.com'],
      bundleSize: '45KB',
      performance: { tti: '0.8s', bundleSizeGzipped: '15KB' },
      securityPolicy: { allowEval: false, maxBundleSize: '200KB', sandboxed: true }
    },
    ProductDetails: {
      name: 'ProductDetails',
      framework: 'react',
      remoteUrl: 'http://localhost:5173/ProductDetails.js',
      exportName: 'ProductDetails',
      propsSchema: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          includeReviews: { type: 'boolean' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['http://localhost:3000', 'https://mystore.com'],
      bundleSize: '32KB',
      performance: { tti: '0.6s', bundleSizeGzipped: '12KB' },
      securityPolicy: { allowEval: false, maxBundleSize: '150KB', sandboxed: true }
    }
  },
  port: 3001,
  cors: {
    origins: ['http://localhost:3000', 'https://mystore.com'],
    credentials: true
  },
  logging: {
    level: 'info',
    format: 'json'
  },
  dataProvider: {
    async getCrawlerContent(options) {
      const { cursor, limit = 100, type } = options;
      
      // Fetch products and intents for crawling
      const products = await getProductsForCrawling({ cursor, limit });
      const intents = await getIntentsForCrawling();
      
      const contents = [
        ...products.map(product => ({
          type: 'product',
          id: product.id,
          title: product.name,
          description: product.description,
          lastUpdated: product.updatedAt,
          metadata: {
            category: product.category,
            price: product.price,
            crawlable: true
          }
        })),
        ...intents.map(intent => ({
          type: 'intent',
          id: intent.name,
          title: intent.description,
          description: `Intent for ${intent.description}`,
          lastUpdated: new Date().toISOString(),
          metadata: {
            component: intent.component,
            crawlable: intent.crawlable
          }
        }))
      ];
      
      return {
        contents,
        pagination: {
          nextCursor: products.length === limit ? generateNextCursor(products) : null,
          hasMore: products.length === limit
        },
        lastUpdated: new Date().toISOString()
      };
    },
    async resolveIntentData(intent, context) {
      // Add additional context data based on intent
      if (intent.name === 'show_products') {
        return {
          availableCategories: await getAvailableCategories(),
          featuredProducts: await getFeaturedProducts()
        };
      }
      return {};
    }
  }
});

// Add comprehensive middleware stack
server.addMiddleware(MiddlewareFactory.requestId());
server.addMiddleware(MiddlewareFactory.securityHeaders());
server.addMiddleware(MiddlewareFactory.rateLimit({ max: 1000, windowMs: 15 * 60 * 1000 }));
server.addMiddleware(MiddlewareFactory.validation());
server.addMiddleware(MiddlewareFactory.logging({ logLevel: 'info' }));

// Add plugins for monitoring and documentation
server.addPlugin(PluginFactory.swagger({ 
  title: 'E-commerce IXP API',
  description: 'Intent Exchange Protocol API for e-commerce components'
}));
server.addPlugin(PluginFactory.healthMonitoring({
  checks: {
    database: async () => ({ status: 'pass', message: 'Database connected' }),
    productService: async () => ({ status: 'pass', message: 'Product service healthy' })
  }
}));
server.addPlugin(PluginFactory.metrics({ includeSystemMetrics: true }));

server.listen();
console.log('🚀 E-commerce IXP Server running on http://localhost:3001');
console.log('📚 API Documentation: http://localhost:3001/ixp/api-docs');
console.log('🏥 Health Check: http://localhost:3001/ixp/health');
console.log('🕷️ Crawler Content: http://localhost:3001/ixp/crawler_content');
```

### Development Server with Hot Reload

```typescript
import { createDevServer } from 'ixp-server';

const devServer = createDevServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001,
  logging: { level: 'debug' }
});

// File watching is automatically enabled in dev mode
await devServer.listen();
```

## 🧪 Testing

The SDK includes comprehensive test coverage with 57 passing tests:

```bash
# Run all tests (57 tests)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage (95%+ coverage)
npm run test:coverage

# Run specific test suites
npm test -- --testNamePattern="render"
npm test -- --testNamePattern="component"
npm test -- --testNamePattern="intent"
```

### Test Coverage

- **Core Functionality**: 100% coverage of main SDK functions
- **Render Pipeline**: Complete testing of intent resolution and component rendering
- **Middleware**: All 8 built-in middleware factories tested
- **Plugins**: Swagger, health monitoring, and metrics plugins tested
- **CLI Tools**: Project scaffolding and validation commands tested
- **Integration Tests**: End-to-end server functionality tested

### Manual Testing

```bash
# Start a test server
npx tsx examples/minimal-server.ts

# Test endpoints
curl http://localhost:3000/ixp/health
curl http://localhost:3000/ixp/intents
curl http://localhost:3000/ixp/components
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{"intent": {"name": "hello_world", "parameters": {"name": "Test"}}}'
```

### Running Tests

### Writing Tests

```typescript
import { createIXPServer } from 'ixp-server';
import request from 'supertest';

describe('IXP Server', () => {
  let server;
  
  beforeEach(() => {
    server = createIXPServer({
      intents: [/* test intents */],
      components: {/* test components */}
    });
  });
  
  test('should return intents', async () => {
    const response = await request(server.app)
      .get('/intents')
      .expect(200);
    
    expect(response.body.intents).toBeDefined();
  });
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/toopi-ai/ixp-server-sdk.git
cd ixp-server-sdk
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm run test:coverage
```

### Building

```bash
npm run build
```

## 📄 License

MIT © [Toopi AI Team](https://github.com/toopi-ai/ixp-server-sdk)

## 📋 Changelog

### v1.0.2 (Latest)
- ✅ Added `/ixp/crawler_content` endpoint for SEO and search engine indexing
- ✅ Enhanced middleware system with 8 built-in factories
- ✅ Improved plugin system with Swagger, Health Monitoring, and Metrics plugins
- ✅ Added comprehensive Intent Resolution Pipeline with Zod validation
- ✅ Enhanced DataProvider interface for custom data resolution
- ✅ Improved error handling with standardized error responses
- ✅ Added comprehensive TypeScript type definitions
- ✅ Enhanced security features and CORS support

### v1.0.1
- ✅ Initial stable release
- ✅ Core IXP endpoints implementation
- ✅ Basic plugin and middleware support
- ✅ CLI tools for project scaffolding

### v1.0.0
- ✅ Initial release
- ✅ Basic IXP server functionality

## 🔗 Links

- [IXP Specification](https://github.com/toopi-ai/ixp-server-sdk/specification)
- [Documentation](https://ixp-server-sdk.toopi.ai)
- [Examples](https://github.com/toopi-ai/ixp-server-sdk/examples)
- [Issues](https://github.com/toopi-ai/ixp-server-sdk/issues)
- [Discussions](https://github.com/toopi-ai/ixp-server-sdk/discussions)

## 📊 Roadmap

- [ ] GraphQL support
- [ ] WebSocket support for real-time updates
- [ ] Built-in caching layer
- [ ] Database integrations
- [ ] Monitoring dashboard
- [ ] Performance optimization tools
- [ ] Multi-tenant support

---

**Made with ❤️ by the Toopi ai Team**