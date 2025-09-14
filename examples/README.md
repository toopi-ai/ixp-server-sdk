# IXP Server SDK Examples

This directory contains practical examples demonstrating how to use the IXP Server SDK in different scenarios and with various frameworks.

## Available Examples

### 1. minimal-server.ts
**Perfect for getting started quickly**
- Simplest possible IXP server setup
- Single intent and component
- Minimal configuration
- Great for learning the basics

**Run:** `npx tsx examples/minimal-server.ts`  
**Port:** 3000

### 2. basic-server.ts
**Comprehensive foundation example**
- Intent definitions with proper TypeScript typing
- Component registry with React components
- Plugin integration (Swagger, health monitoring, metrics)
- Middleware usage (rate limiting, security, logging)
- Custom data providers for dynamic content
- Error handling and graceful shutdown
- Development server integration

**Run:** `npx tsx examples/basic-server.ts`  
**Port:** 3001

### 3. react-components-server.ts
**React-focused implementation**
- React-specific component definitions
- Component development workflow
- TypeScript support for React props
- Interactive components (UserProfile, InteractiveChart, FormBuilder)
- React dev server health checks

**Run:** `npx tsx examples/react-components-server.ts`  
**Port:** 3002

### 4. registry-example.ts
**Menu and intent registry functionality demonstration**
- Menu system with hierarchical navigation
- Intent registry with dynamic registration
- Component mapping and resolution
- Interactive menu components
- Registry management endpoints

**Run:** `npx tsx examples/registry-example.ts`  
**Port:** 3003

### 4. vue-components-server.ts
**Vue.js-optimized server**
- Vue-specific component definitions
- Composition API and Options API support
- Vue 3 features integration
- Interactive components (TodoList, DataTable, ImageGallery)
- Vue transitions and reactivity

**Run:** `npx tsx examples/vue-components-server.ts`  
**Port:** 3003

### 5. advanced-features-server.ts
**Enterprise-ready configuration**
- Complex intent validation with nested schemas
- Advanced data providers with error handling
- Comprehensive health monitoring
- Performance metrics and monitoring
- Advanced middleware stack
- Production-ready configurations

**Run:** `npx tsx examples/advanced-features-server.ts`  
**Port:** 3004

## Quick Start

1. **Build the SDK first:**
   ```bash
   npm run build
   ```

2. **Start with the minimal example:**
   ```bash
   npx tsx examples/minimal-server.ts
   ```

3. **Test the server:**
   ```bash
   curl -X POST http://localhost:3000/ixp/render \
     -H "Content-Type: application/json" \
     -d '{
        "intent": {
          "name": "hello_world",
          "parameters": { "name": "World" }
        }
      }'
   ```

## Running Examples

To run any example:

```bash
npx tsx examples/[example-name].ts
```

Or compile and run:

```bash
npm run build
node dist/examples/[example-name].js
```

## Registry System

The IXP Server now includes a comprehensive registry system for managing intents and menu items:

### Intent Registry Methods

```typescript
// Register a single intent with default parameters
server.registerIntent({
  name: 'search-products',
  description: 'Search for products',
  category: 'ecommerce',
  featured: true,
  parameters: { query: { type: 'string', required: true } }
});

// Register multiple intents at once
server.registerIntents([
  { name: 'intent1', description: 'First intent' },
  { name: 'intent2', description: 'Second intent' }
]);

// Get registered intents
const allIntents = server.getRegisteredIntents();
const featuredIntents = server.getFeaturedIntents();
const categoryIntents = server.getIntentsByCategory('ecommerce');
```

### Menu Registry Methods

```typescript
// Register menu items for a category
server.registerMenuCategory('main-nav', [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'products', label: 'Products', icon: 'box' }
]);

// Register menu items for specific intents
server.registerMenuItems('intent-name', [
  { id: 'action1', label: 'Quick Action', action: 'execute' }
]);

// Get menu information
const categories = server.getMenuCategories();
const navItems = server.getMenuItems('main-nav');
const allMenus = server.getAllMenuItems();
```

### Registry Initialization

```typescript
// Initialize with default configuration
server.initializeRegistry({
  defaultIntents: [
    { name: 'welcome', description: 'Welcome users', category: 'onboarding' }
  ],
  defaultMenuItems: {
    'quick-actions': [{ id: 'search', label: 'Search' }]
  },
  autoRegisterComponents: true
});
```

## Example Comparison

| Example | Complexity | Use Case | Components | Features |
|---------|------------|----------|------------|----------|
| **minimal-server** | ⭐ | Learning, prototyping | 1 | Basic setup |
| **basic-server** | ⭐⭐⭐ | General purpose | 2 | Full feature set |
| **react-components** | ⭐⭐⭐ | React apps | 3 | React-specific |
| **vue-components** | ⭐⭐⭐ | Vue apps | 3 | Vue-specific |
| **advanced-features** | ⭐⭐⭐⭐⭐ | Enterprise | 2 | Production-ready |

## Key Features Demonstrated

### Core Concepts
- **Intent System**: Define user intents with JSON Schema validation
- **Component Registry**: Manage React/Vue/Vanilla JS components
- **Server-Side Rendering**: Render components on the server
- **Data Providers**: Supply dynamic data to components

### Advanced Features
- **Plugin Architecture**: Extend functionality with plugins
- **Middleware Stack**: Add cross-cutting concerns
- **Health Monitoring**: Built-in health checks and metrics
- **API Documentation**: Auto-generated Swagger docs
- **Development Workflow**: Hot reload and component development
- **Security**: CORS, validation, and sandboxing
- **Performance**: Bundle optimization and caching

### Framework-Specific
- **React Integration**: Props validation, TypeScript support
- **Vue Integration**: Composition API, reactivity, transitions
- **Component Lifecycle**: Registration, building, rendering

## Testing the Examples

Each example includes specific test commands in their console output. Here are some common patterns:

### Basic Rendering Test
```bash
curl -X POST http://localhost:PORT/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "INTENT_NAME",
      "parameters": { /* intent parameters */ }
    }
  }'
```

### Health Check
```bash
curl http://localhost:PORT/ixp/health
```

### API Documentation
Open `http://localhost:PORT/ixp/api-docs` in your browser

### Available Endpoints
All examples provide these standard endpoints:
- `GET /ixp/intents` - List all intents
- `GET /ixp/components` - List all components
- `POST /ixp/render` - Render a component
- `GET /ixp/health` - Health status
- `GET /ixp/metrics` - Performance metrics
- `GET /ixp/api-docs` - Interactive API documentation

## Development Workflow

1. **Start with minimal-server.ts** to understand the basics
2. **Explore basic-server.ts** for comprehensive features
3. **Choose framework-specific examples** (React or Vue) for your stack
4. **Study advanced-features-server.ts** for production patterns
5. **Adapt examples** for your specific use case

### Server Configuration

The example demonstrates comprehensive server configuration:

```typescript
const server = createIXPServer({
  intents,           // Intent definitions
  components,        // Component registry
  port: 3001,        // Server port
  cors: {            // CORS configuration
    origins: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },
  logging: {         // Logging configuration
    level: 'info',
    format: 'text'
  },
  metrics: {         // Metrics configuration
    enabled: true,
    endpoint: '/metrics'
  },
  dataProvider: {    // Custom data provider
    async getCrawlerContent(options) { /* ... */ },
    async resolveIntentData(intent, context) { /* ... */ }
  }
});
```

### Plugin Integration

The example shows how to add plugins for extended functionality:

```typescript
// Swagger API documentation
server.addPlugin(createSwaggerPlugin({
  title: 'Basic IXP Server API',
  version: '1.0.0',
  description: 'A basic example of an IXP server using the SDK'
}));

// Health monitoring with custom checks
server.addPlugin(createHealthMonitoringPlugin({
  checks: {
    database: async () => ({ status: 'pass', message: 'Database OK' }),
    externalApi: async () => ({ status: 'pass', message: 'API reachable' })
  }
}));

// Metrics collection
server.addPlugin(createMetricsPlugin({
  format: 'json',
  includeSystemMetrics: true
}));
```

### Middleware Stack

The example demonstrates a comprehensive middleware stack:

```typescript
// Rate limiting
server.addMiddleware(createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Request ID tracking
server.addMiddleware(createRequestIdMiddleware({}));

// Request validation
server.addMiddleware(createValidationMiddleware({
  maxBodySize: '10mb',
  allowedContentTypes: ['application/json'],
  requireContentType: true
}));

// Origin validation
server.addMiddleware(createOriginValidationMiddleware({
  allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  allowCredentials: true
}));
```

### Available Endpoints

Once running, the server provides these endpoints:

- **GET /ixp/intents** - List all available intents
- **GET /ixp/components** - List all registered components
- **POST /ixp/render** - Render a component for an intent
- **GET /ixp/crawler_content** - Get crawlable content for SEO
- **GET /ixp/health** - Basic health check
- **GET /ixp/health/detailed** - Detailed health check with custom checks
- **GET /ixp/metrics** - Basic metrics
- **GET /ixp/metrics/detailed** - Detailed metrics
- **GET /ixp/api-docs** - Swagger API documentation

### Intent Definitions

The example includes two sample intents:

1. **show_welcome** - A welcome message with personalization
2. **show_products** - A product listing with filtering

Each intent includes:
- Parameter schema with validation
- Component mapping
- Version information
- Crawlability settings

### Component Definitions

Components are defined with comprehensive metadata:

- **Framework**: React (extensible to other frameworks)
- **Remote URL**: Where the component bundle is hosted
- **Props Schema**: TypeScript-compatible parameter validation
- **Security Policy**: Sandbox settings and bundle size limits
- **Performance Metrics**: Time-to-interactive and bundle size information
- **Version Management**: Semantic versioning support

### Data Provider

The example includes a custom data provider that:

- Provides mock crawler content for SEO
- Resolves additional data based on intent context
- Demonstrates integration with external data sources

### Error Handling

The server includes comprehensive error handling:

- Graceful startup with validation
- Detailed error logging with stack traces
- Graceful shutdown on SIGINT/SIGTERM
- Proper HTTP error responses

### Development Features

- Enhanced logging with request/response details
- Configuration validation before startup
- Comprehensive endpoint documentation
- Example curl commands for testing

## Next Steps

1. **Customize Intents**: Modify the intent definitions to match your use case
2. **Add Components**: Register your own React components
3. **Extend Plugins**: Add custom plugins for your specific needs
4. **Configure Middleware**: Adjust middleware settings for your security requirements
5. **Integrate Data**: Connect to your actual data sources via the data provider
6. **Deploy**: Use the built server in your production environment

## SDK Documentation

For complete SDK documentation, see the main README and TypeScript definitions in the `src/` directory.