# IXP Server SDK Examples

This directory contains comprehensive examples demonstrating how to use the IXP Server SDK to build Intent Exchange Protocol servers.

## Basic Server Example

The `basic-server.ts` file demonstrates a complete IXP server implementation using the SDK with:

### Features Demonstrated

- **Intent Definitions**: How to define intents with parameters, validation, and component mapping
- **Component Registry**: Registering React components with security policies and performance metrics
- **Plugin System**: Integration with Swagger documentation, health monitoring, and metrics collection
- **Middleware Stack**: Rate limiting, request validation, origin validation, and request ID tracking
- **Data Providers**: Custom data sources for dynamic content and crawler support
- **Error Handling**: Comprehensive error handling and graceful shutdown
- **Development Features**: Enhanced logging and debugging capabilities

### Quick Start

1. **Build the SDK**:
   ```bash
   npm run build
   ```

2. **Run the example**:
   ```bash
   node examples/basic-server.ts
   ```

3. **Test the server**:
   ```bash
   # Check server health
   curl http://localhost:3001/ixp/health
   
   # Get available intents
   curl http://localhost:3001/ixp/intents
   
   # Render a component
   curl -X POST http://localhost:3001/ixp/render \
     -H "Content-Type: application/json" \
     -d '{
       "intent": {
         "name": "show_welcome",
         "parameters": { "name": "World", "theme": "light" }
       }
     }'
   ```

4. **View API Documentation**:
   Open http://localhost:3001/ixp/api-docs in your browser

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