# Quick Start Guide

Get your IXP server up and running in just 5 minutes!

## Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm
- TypeScript 4.5+ (recommended)

## Installation

```bash
# Install the SDK
npm install ixp-server

# Or with yarn
yarn add ixp-server

# Or with pnpm
pnpm add ixp-server
```

## Your First Server

Create a new file `server.ts` (or `server.js` for JavaScript):

```typescript
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// Create a simple intent
const helloIntent = createIntent({
  name: 'hello_world',
  description: 'A simple hello world intent',
  parameters: {
    name: { type: 'string', required: false, default: 'World' }
  },
  handler: async (params) => {
    return {
      component: 'HelloComponent',
      props: { name: params.name }
    };
  }
});

// Create a simple component
const helloComponent = createComponent({
  name: 'HelloComponent',
  description: 'A hello world component',
  props: {
    name: { type: 'string', required: true }
  },
  render: async (props) => {
    return {
      type: 'div',
      props: { className: 'hello-container' },
      children: [
        {
          type: 'h1',
          props: {},
          children: [`Hello, ${props.name}!`]
        },
        {
          type: 'p',
          props: {},
          children: ['Welcome to IXP Server SDK!']
        }
      ]
    };
  }
});

// Create and start the server
const server = new IXPServer({
  port: 3000,
  intents: [helloIntent],
  components: [helloComponent]
});

server.start().then(() => {
  console.log('🚀 IXP Server running on http://localhost:3000');
  console.log('📋 Available endpoints:');
  console.log('  GET  /ixp/health     - Health check');
  console.log('  GET  /ixp/intents    - List intents');
  console.log('  GET  /ixp/components - List components');
  console.log('  POST /ixp/render     - Render intent');
});
```

## Run Your Server

```bash
# With TypeScript (recommended)
npx tsx server.ts

# Or compile first
npx tsc server.ts
node server.js

# Or with ts-node
npx ts-node server.ts
```

## Test Your Server

Once your server is running, test it with these commands:

```bash
# Check server health
curl http://localhost:3000/ixp/health

# List available intents
curl http://localhost:3000/ixp/intents

# List available components
curl http://localhost:3000/ixp/components

# Render the hello world intent
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "hello_world",
      "parameters": {
        "name": "Developer"
      }
    }
  }'
```

## Expected Response

The render endpoint should return:

```json
{
  "success": true,
  "result": {
    "type": "div",
    "props": {
      "className": "hello-container"
    },
    "children": [
      {
        "type": "h1",
        "props": {},
        "children": ["Hello, Developer!"]
      },
      {
        "type": "p",
        "props": {},
        "children": ["Welcome to IXP Server SDK!"]
      }
    ]
  },
  "metadata": {
    "intent": "hello_world",
    "component": "HelloComponent",
    "renderTime": "2ms"
  }
}
```

## Using the CLI

The SDK also provides a CLI for quick project setup:

```bash
# Install CLI globally
npm install -g ixp-server

# Create a new project
ixp-server init my-ixp-project
cd my-ixp-project

# Start development server
npm run dev

# Validate your configuration
ixp-server validate
```

## Next Steps

Congratulations! You've created your first IXP server. Here's what to explore next:

### 🏗️ Build More Components
- [Component Development Guide](./components.md)
- [React Integration](../examples/frameworks.md#react)
- [Vue Integration](../examples/frameworks.md#vue)

### 🎯 Advanced Intent Handling
- [Intent Patterns](./intents.md)
- [Parameter Validation](../api/intents.md#validation)
- [Async Intent Handlers](../api/intents.md#async-handlers)

### 🔧 Add Middleware & Plugins
- [Built-in Middleware](../api/middleware.md)
- [Custom Middleware](./middleware.md)
- [Available Plugins](../api/plugins.md)

### 🚀 Production Deployment
- [Deployment Guide](./deployment.md)
- [Performance Optimization](./performance.md)
- [Monitoring & Logging](../api/plugins.md#monitoring)

### 📚 Explore Examples
- [Basic Examples](../examples/basic.md)
- [Advanced Examples](../examples/advanced.md)
- [Real-world Applications](../examples/real-world.md)

## Troubleshooting

### Common Issues

**Port already in use?**
```typescript
const server = new IXPServer({ port: 3001 }); // Try a different port
```

**TypeScript errors?**
```bash
npm install -D typescript @types/node tsx
```

**Module not found?**
```bash
npm install ixp-server  # Make sure it's installed
```

### Getting Help

- 📖 [Full Documentation](../README.md)
- ❓ [FAQ](../reference/faq.md)
- 🐛 [Error Codes](../reference/error-codes.md)
- 💬 [GitHub Discussions](https://github.com/toopi-ai/ixp-server-sdk/discussions)
- 🚨 [Issue Tracker](https://github.com/toopi-ai/ixp-server-sdk/issues)

---

**Next**: [Installation Guide](./installation.md) | [Configuration](./configuration.md)