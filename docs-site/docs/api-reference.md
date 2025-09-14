---
id: api-reference
title: API Reference
sidebar_label: API Reference
sidebar_position: 6
description: Complete API documentation for all classes, functions, and types in the IXP Server SDK
---

# API Reference

Complete API documentation for the IXP Server SDK.

## Core Functions

### createIXPServer(config)

Creates and configures an IXP server instance.

**Parameters:**
- `config` (IXPServerConfig): Server configuration object

**Returns:** `IXPServer` - Configured server instance

**Example:**
```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001,
  middleware: [
    'rateLimit',
    'validation',
    'cors'
  ],
  plugins: [
    'swagger',
    'healthMonitoring',
    'metrics'
  ]
});
```

### createIXPApp(config)

Creates an Express application with IXP routes configured.

**Parameters:**
- `config` (IXPServerConfig): Server configuration object

**Returns:** `Express.Application` - Configured Express app

**Example:**
```typescript
import { createIXPApp } from 'ixp-server';
import express from 'express';

const app = express();
const ixpApp = createIXPApp({
  intents: './config/intents.json',
  components: './config/components.json'
});

app.use('/api/ixp', ixpApp);
app.listen(3000);
```

### quickStart(options)

Quick setup function for development and testing.

**Parameters:**
- `options` (QuickStartOptions): Quick start configuration

**Returns:** `Promise<IXPServer>` - Running server instance

**Example:**
```typescript
import { quickStart } from 'ixp-server';

const server = await quickStart({
  port: 3001,
  intents: [
    {
      name: 'hello_world',
      description: 'Say hello',
      parameters: { type: 'object', properties: {} },
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
      propsSchema: { type: 'object', properties: {} },
      version: '1.0.0',
      allowedOrigins: ['*']
    }
  }
});
```

### createDevServer(config)

Creates a development server with hot reload and debugging features.

**Parameters:**
- `config` (DevServerConfig): Development server configuration

**Returns:** `Promise<DevServer>` - Development server instance

**Example:**
```typescript
import { createDevServer } from 'ixp-server';

const devServer = await createDevServer({
  port: 3001,
  watchFiles: ['./config/**/*.json'],
  hotReload: true,
  debugMode: true
});
```

## Core Classes

### IXPServer

Main server class that manages intents, components, and request handling.

#### Methods

##### listen(port?, callback?)

Starts the server on the specified port.

**Parameters:**
- `port` (number, optional): Port number (defaults to config port)
- `callback` (function, optional): Callback when server starts

**Returns:** `Promise<void>`

##### stop()

Stops the server gracefully.

**Returns:** `Promise<void>`

##### registerIntent(intent)

Registers a new intent definition.

**Parameters:**
- `intent` (IntentDefinition): Intent to register

**Returns:** `void`

##### registerComponent(component)

Registers a new component definition.

**Parameters:**
- `component` (ComponentDefinition): Component to register

**Returns:** `void`

##### use(middleware)

Adds middleware to the request processing pipeline.

**Parameters:**
- `middleware` (MiddlewareFunction): Middleware function

**Returns:** `IXPServer` - For method chaining

##### plugin(plugin)

Installs a plugin.

**Parameters:**
- `plugin` (PluginFunction): Plugin function

**Returns:** `IXPServer` - For method chaining

### ConfigBuilder

Builder class for creating server configurations.

#### Methods

##### static create()

Creates a new ConfigBuilder instance.

**Returns:** `ConfigBuilder`

##### port(port)

Sets the server port.

**Parameters:**
- `port` (number): Port number

**Returns:** `ConfigBuilder`

##### intents(intents)

Sets intent definitions.

**Parameters:**
- `intents` (IntentDefinition[] | string): Intent array or file path

**Returns:** `ConfigBuilder`

##### components(components)

Sets component definitions.

**Parameters:**
- `components` (ComponentRegistry | string): Component registry or file path

**Returns:** `ConfigBuilder`

##### middleware(middleware)

Adds middleware.

**Parameters:**
- `middleware` (string[] | MiddlewareFunction[]): Middleware array

**Returns:** `ConfigBuilder`

##### plugins(plugins)

Adds plugins.

**Parameters:**
- `plugins` (string[] | PluginFunction[]): Plugin array

**Returns:** `ConfigBuilder`

##### build()

Builds the final configuration.

**Returns:** `IXPServerConfig`

**Example:**
```typescript
import { ConfigBuilder } from 'ixp-server';

const config = ConfigBuilder.create()
  .port(3001)
  .intents('./config/intents.json')
  .components('./config/components.json')
  .middleware(['rateLimit', 'validation'])
  .plugins(['swagger', 'metrics'])
  .build();
```

## Type Definitions

### IXPServerConfig

Main server configuration interface.

```typescript
interface IXPServerConfig {
  port?: number;
  intents: IntentDefinition[] | string;
  components: ComponentRegistry | string;
  middleware?: (string | MiddlewareFunction)[];
  plugins?: (string | PluginFunction)[];
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  security?: SecurityOptions;
  logging?: LoggingOptions;
  dataProviders?: DataProviderConfig[];
  theme?: ThemeConfig;
  crawler?: CrawlerConfig;
}
```

### IntentDefinition

Defines an intent that can be resolved to a component.

```typescript
interface IntentDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  component: string;
  version: string;
  deprecated?: boolean;
  crawlable?: boolean;
  category?: string;
  tags?: string[];
  examples?: IntentExample[];
}
```

### ComponentDefinition

Defines a remote component that can render intents.

```typescript
interface ComponentDefinition {
  name: string;
  framework: 'react' | 'vue' | 'vanilla' | 'angular';
  remoteUrl: string;
  exportName: string;
  propsSchema: JSONSchema;
  version: string;
  allowedOrigins: string[];
  bundleSize?: string;
  performance?: PerformanceMetrics;
  securityPolicy?: SecurityPolicy;
  dependencies?: ComponentDependency[];
  fallback?: ComponentFallback;
}
```

### IntentRequest

Request to resolve an intent.

```typescript
interface IntentRequest {
  intent: {
    name: string;
    parameters: Record<string, any>;
    version?: string;
  };
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    locale?: string;
    theme?: string;
    [key: string]: any;
  };
  options?: {
    timeout?: number;
    fallback?: boolean;
    cache?: boolean;
    [key: string]: any;
  };
}
```

### IntentResponse

Response from intent resolution.

```typescript
interface IntentResponse {
  success: boolean;
  component?: {
    name: string;
    framework: string;
    remoteUrl: string;
    exportName: string;
    props: Record<string, any>;
    version: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    resolvedAt: string;
    processingTime: number;
    cacheHit?: boolean;
    [key: string]: any;
  };
}
```

## Middleware Functions

### createRateLimitMiddleware(options)

Creates rate limiting middleware.

**Parameters:**
- `options` (RateLimitOptions): Rate limit configuration

**Returns:** `MiddlewareFunction`

**Example:**
```typescript
import { createRateLimitMiddleware } from 'ixp-server';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### createValidationMiddleware(options)

Creates request validation middleware.

**Parameters:**
- `options` (ValidationOptions): Validation configuration

**Returns:** `MiddlewareFunction`

**Example:**
```typescript
import { createValidationMiddleware } from 'ixp-server';

const validationMiddleware = createValidationMiddleware({
  validateIntentParameters: true,
  validateComponentProps: true,
  strictMode: true
});
```

### createOriginValidationMiddleware(options)

Creates origin validation middleware for CORS.

**Parameters:**
- `options` (OriginValidationOptions): Origin validation configuration

**Returns:** `MiddlewareFunction`

### createTimeoutMiddleware(options)

Creates request timeout middleware.

**Parameters:**
- `options` (TimeoutOptions): Timeout configuration

**Returns:** `MiddlewareFunction`

### createRequestIdMiddleware(options)

Creates request ID tracking middleware.

**Parameters:**
- `options` (RequestIdOptions): Request ID configuration

**Returns:** `MiddlewareFunction`

## Plugin Functions

### createSwaggerPlugin(options)

Creates Swagger/OpenAPI documentation plugin.

**Parameters:**
- `options` (SwaggerOptions): Swagger configuration

**Returns:** `PluginFunction`

**Example:**
```typescript
import { createSwaggerPlugin } from 'ixp-server';

const swaggerPlugin = createSwaggerPlugin({
  title: 'My IXP Server API',
  version: '1.0.0',
  description: 'API documentation for my IXP server',
  path: '/api-docs'
});
```

### createHealthMonitoringPlugin(options)

Creates health monitoring plugin.

**Parameters:**
- `options` (HealthMonitoringOptions): Health monitoring configuration

**Returns:** `PluginFunction`

### createMetricsPlugin(options)

Creates metrics collection plugin.

**Parameters:**
- `options` (MetricsOptions): Metrics configuration

**Returns:** `PluginFunction`

## Utility Functions

### validateIntentDefinition(intent)

Validates an intent definition against the schema.

**Parameters:**
- `intent` (IntentDefinition): Intent to validate

**Returns:** `ValidationResult`

### validateComponentDefinition(component)

Validates a component definition against the schema.

**Parameters:**
- `component` (ComponentDefinition): Component to validate

**Returns:** `ValidationResult`

### resolveIntent(request, registry)

Resolves an intent request to a component.

**Parameters:**
- `request` (IntentRequest): Intent request
- `registry` (ComponentRegistry): Component registry

**Returns:** `Promise<IntentResponse>`

## Error Classes

### IXPError

Base error class for IXP-related errors.

```typescript
class IXPError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}
```

### IntentNotFoundError

Thrown when an intent is not found.

### ComponentNotFoundError

Thrown when a component is not found.

### ValidationError

Thrown when validation fails.

### SecurityError

Thrown when security policies are violated.

## Constants

### DEFAULT_PORT

Default server port (3001).

### API_VERSION

Current API version.

### SUPPORTED_FRAMEWORKS

Array of supported component frameworks.

```typescript
const SUPPORTED_FRAMEWORKS = ['react', 'vue', 'vanilla', 'angular'];
```

## Events

The IXPServer class extends EventEmitter and emits the following events:

- `server:started` - Server has started
- `server:stopped` - Server has stopped
- `intent:registered` - New intent registered
- `component:registered` - New component registered
- `intent:resolved` - Intent successfully resolved
- `error` - Error occurred

**Example:**
```typescript
server.on('intent:resolved', (data) => {
  console.log(`Intent ${data.intentName} resolved to ${data.componentName}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
```