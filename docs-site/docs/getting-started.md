---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
sidebar_position: 2
description: Quick start guide to get up and running with the IXP Server SDK
---

# Getting Started

This guide will help you get up and running with the IXP Server SDK quickly.

## Installation

### Using npm

```bash
npm install ixp-server
```

### Using yarn

```bash
yarn add ixp-server
```

## Quick Start

### 1. Create a New Project

The fastest way to get started is using the CLI:

```bash
# Create a new project
npx ixp-server create my-ixp-server

# Navigate to the project
cd my-ixp-server

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Manual Setup

If you prefer to set up manually:

```typescript
// src/index.ts
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: [
    {
      name: 'show_welcome',
      description: 'Display a welcome message',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      },
      component: 'WelcomeMessage',
      version: '1.0.0'
    }
  ],
  components: {
    WelcomeMessage: {
      name: 'WelcomeMessage',
      framework: 'react',
      remoteUrl: 'http://localhost:5173/WelcomeMessage.js',
      exportName: 'WelcomeMessage',
      propsSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      },
      version: '1.0.0',
      allowedOrigins: ['*'],
      bundleSize: '5KB',
      performance: {
        tti: '0.2s',
        bundleSizeGzipped: '2KB'
      },
      securityPolicy: {
        allowEval: false,
        maxBundleSize: '50KB',
        sandboxed: true
      }
    }
  },
  port: 3001
});

server.listen().then(() => {
  console.log('IXP Server is running on port 3001');
});
```

## Core Concepts

### Intents

Intents represent user actions or requests that need to be fulfilled by UI components:

```typescript
interface IntentDefinition {
  name: string;                    // Unique intent identifier
  description: string;             // Human-readable description
  parameters: JSONSchema;          // Expected parameters schema
  component: string;               // Component to render
  version: string;                 // Intent version
  deprecated?: boolean;            // Mark as deprecated
  crawlable?: boolean;            // Expose to search engines
}
```

### Components

Components are remote UI components that render intents:

```typescript
interface ComponentDefinition {
  name: string;                    // Component identifier
  framework: string;               // 'react', 'vue', 'vanilla'
  remoteUrl: string;               // URL to component bundle
  exportName: string;              // Export name from bundle
  propsSchema: JSONSchema;         // Props validation schema
  version: string;                 // Component version
  allowedOrigins: string[];        // CORS origins
  bundleSize: string;              // Bundle size info
  performance: PerformanceMetrics; // Performance characteristics
  securityPolicy: SecurityPolicy; // Security constraints
}
```

## Configuration Files

### Intents Configuration (config/intents.json)

```json
{
  "version": "1.0.0",
  "intents": [
    {
      "name": "show_products",
      "description": "Display a list of products",
      "parameters": {
        "type": "object",
        "properties": {
          "category": {
            "type": "string",
            "description": "Product category"
          },
          "limit": {
            "type": "number",
            "minimum": 1,
            "maximum": 50
          }
        }
      },
      "component": "ProductGrid",
      "version": "1.0.0",
      "crawlable": true
    }
  ]
}
```

### Components Configuration (config/components.json)

```json
{
  "version": "1.0.0",
  "components": {
    "ProductGrid": {
      "name": "ProductGrid",
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
      "allowedOrigins": ["*"],
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

## API Endpoints

Once your server is running, these endpoints are available:

- `GET /ixp/intents` - List all available intents
- `GET /ixp/components` - List all registered components
- `POST /ixp/render` - Resolve intent to component
- `GET /ixp/crawler_content` - Get crawlable content
- `GET /ixp/health` - Health check
- `GET /ixp/metrics` - Server metrics (if enabled)

## Testing Your Server

### Using curl

```bash
# List intents
curl http://localhost:3001/ixp/intents

# Render an intent
curl -X POST http://localhost:3001/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "show_welcome",
      "parameters": { "name": "World" }
    }
  }'
```

### Using the CLI

```bash
# Run built-in tests
npx ixp-server test --port 3001

# Validate configuration
npx ixp-server validate
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes** - Edit intents, components, or server configuration

3. **Hot Reload** - Changes are automatically detected and applied

4. **Test Changes**
   ```bash
   npx ixp-server test
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## Next Steps

- [Configuration Guide](./configuration.md) - Learn about all configuration options
- [API Reference](./api-reference.md) - Detailed API documentation
- [Examples](./examples.md) - More complex usage examples
- [Middleware](./middleware.md) - Add custom request processing
- [Plugins](./plugins.md) - Extend server functionality

## Common Issues

### Port Already in Use

```bash
# Use a different port
npx ixp-server dev --port 3002
```

### CORS Issues

Add allowed origins to your configuration:

```typescript
const server = createIXPServer({
  // ... other config
  cors: {
    origins: ['http://localhost:3000', 'https://myapp.com'],
    credentials: true
  }
});
```

### Component Loading Errors

Ensure your component URLs are accessible and return valid JavaScript modules:

```javascript
// Component should export as ES module
export const MyComponent = (props) => {
  return React.createElement('div', null, 'Hello ' + props.name);
};
```