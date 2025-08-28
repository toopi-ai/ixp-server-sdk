# IXP Server SDK

[![npm version](https://badge.fury.io/js/ixp-server.svg)](https://badge.fury.io/js/ixp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A comprehensive SDK for building Intent Exchange Protocol (IXP) servers with ease. This SDK provides everything you need to create IXP-compliant servers that can handle intent-driven component rendering.

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
- **Plugin System**: Extensible architecture with built-in plugins
- **Middleware Support**: Custom middleware for authentication, logging, etc.
- **Hot Reload**: Development mode with file watching and hot reload
- **Validation**: Built-in parameter validation using Zod schemas
- **CLI Tools**: Command-line tools for scaffolding and management
- **Health Checks**: Built-in health monitoring and metrics
- **Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Security**: Built-in security features and CORS support

## 🛠 Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm 7.0.0 or higher

### Package Installation

```bash
npm install ixp-server
```

### Global CLI Installation

```bash
npm install -g ixp-server
```

## 📚 API Reference

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
  .build();

const server = createIXPServer(config);
```

## ⚙️ Configuration

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

```typescript
import { PluginFactory } from 'ixp-server';

// Swagger Documentation
server.addPlugin(PluginFactory.swagger({
  title: 'My IXP API',
  version: '1.0.0',
  endpoint: '/api-docs.json',
  uiEndpoint: '/api-docs'
}));

// Health Monitoring
server.addPlugin(PluginFactory.healthMonitoring({
  endpoint: '/health/detailed',
  checks: {
    database: async () => ({ status: 'pass', message: 'Connected' })
  }
}));

// Metrics Collection
server.addPlugin(PluginFactory.metrics({
  endpoint: '/metrics/detailed',
  format: 'json', // or 'prometheus'
  includeSystemMetrics: true
}));
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

```typescript
import { MiddlewareFactory } from 'ixp-server';

// Rate Limiting
server.addMiddleware(MiddlewareFactory.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Request Validation
server.addMiddleware(MiddlewareFactory.validation({
  maxBodySize: '10mb',
  allowedContentTypes: ['application/json']
}));

// Security Headers
server.addMiddleware(MiddlewareFactory.securityHeaders({
  hsts: true,
  noSniff: true,
  xssProtection: true
}));

// Request Logging
server.addMiddleware(MiddlewareFactory.logging({
  logLevel: 'info',
  includeBody: false
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

### Basic E-commerce Server

```typescript
import { createIXPServer, PluginFactory } from 'ixp-server';

const server = createIXPServer({
  intents: [
    {
      name: 'show_products',
      description: 'Display products with optional filtering',
      parameters: {
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
      },
      component: 'ProductGrid',
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
          priceRange: { type: 'object' }
        }
      },
      version: '1.0.0',
      allowedOrigins: ['*'],
      bundleSize: '45KB',
      performance: { tti: '0.8s', bundleSizeGzipped: '15KB' },
      securityPolicy: { allowEval: false, maxBundleSize: '200KB', sandboxed: true }
    }
  },
  dataProvider: {
    async getCrawlerContent(options) {
      // Return your crawlable content
      return {
        contents: [],
        pagination: { nextCursor: null, hasMore: false },
        lastUpdated: new Date().toISOString()
      };
    },
    async resolveIntentData(intent, context) {
      // Resolve additional data for intents
      return {};
    }
  }
});

// Add plugins
server.addPlugin(PluginFactory.swagger({ title: 'E-commerce API' }));
server.addPlugin(PluginFactory.healthMonitoring({}));

server.listen();
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

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

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

MIT © [IXP Team](https://github.com/toopi-ai/ixp-server-sdk)

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