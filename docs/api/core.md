# Core API Reference

The IXP Server SDK core API provides the main server class and essential interfaces for building intent-driven applications.

## Table of Contents

- [IXPServer](#ixpserver)
- [Configuration](#configuration)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Utility Functions](#utility-functions)

## IXPServer

The main server class that handles intent registration, component management, and HTTP request processing.

### Constructor

```typescript
new IXPServer(config?: IXPServerConfig)
```

**Parameters**:
- `config?: IXPServerConfig` - Optional server configuration

**Example**:
```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({
  port: 3000,
  host: 'localhost'
});
```

### Methods

#### `start()`

Starts the HTTP server and begins listening for requests.

```typescript
start(): Promise<void>
```

**Returns**: Promise that resolves when server starts successfully

**Example**:
```typescript
await server.start();
console.log('Server started on port 3000');
```

#### `stop()`

Stops the HTTP server gracefully.

```typescript
stop(): Promise<void>
```

**Returns**: Promise that resolves when server stops

**Example**:
```typescript
await server.stop();
console.log('Server stopped');
```

#### `registerIntent()`

Registers an intent definition with the server.

```typescript
registerIntent(intent: IntentDefinition): void
```

**Parameters**:
- `intent: IntentDefinition` - Intent definition object

**Example**:
```typescript
server.registerIntent({
  name: 'show_product',
  description: 'Display product information',
  parameters: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product identifier'
      }
    },
    required: ['productId']
  },
  component: 'ProductCard',
  version: '1.0.0'
});
```

#### `registerComponent()`

Registers a component definition with the server.

```typescript
registerComponent(component: ComponentDefinition): void
```

**Parameters**:
- `component: ComponentDefinition` - Component definition object

**Example**:
```typescript
server.registerComponent({
  name: 'ProductCard',
  description: 'Product display component',
  props: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' }
        }
      }
    }
  },
  render: async (props) => {
    const { product } = props;
    return {
      type: 'div',
      props: { className: 'product-card' },
      children: [
        {
          type: 'h3',
          children: [product.name]
        },
        {
          type: 'p',
          children: [`$${product.price}`]
        }
      ]
    };
  }
});
```

#### `render()`

Renders an intent with the given parameters.

```typescript
render(intentName: string, parameters: Record<string, any>): Promise<RenderResult>
```

**Parameters**:
- `intentName: string` - Name of the intent to render
- `parameters: Record<string, any>` - Intent parameters

**Returns**: Promise resolving to render result

**Example**:
```typescript
const result = await server.render('show_product', {
  productId: 'prod-123'
});

if (result.success) {
  console.log('Rendered:', result.result);
} else {
  console.error('Render failed:', result.error);
}
```

## Configuration

### `IXPServerConfig`

Main server configuration interface.

```typescript
interface IXPServerConfig {
  port?: number;
  host?: string;
  intents?: IntentDefinition[];
  components?: ComponentDefinition[];
  middleware?: MiddlewareFunction[];
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  logging?: LoggingOptions;
  health?: HealthOptions;
}
```

#### Properties

- `port?: number` - Server port (default: 3000)
- `host?: string` - Server host (default: 'localhost')
- `intents?: IntentDefinition[]` - Initial intents to register
- `components?: ComponentDefinition[]` - Initial components to register
- `middleware?: MiddlewareFunction[]` - Global middleware stack
- `cors?: CorsOptions` - CORS configuration
- `rateLimit?: RateLimitOptions` - Rate limiting configuration
- `logging?: LoggingOptions` - Logging configuration
- `health?: HealthOptions` - Health check configuration

**Example**:
```typescript
const config: IXPServerConfig = {
  port: 8080,
  host: '0.0.0.0',
  intents: [
    {
      name: 'greeting',
      description: 'Generate greeting message',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      component: 'GreetingCard'
    }
  ],
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
};
```

## Type Definitions

### Core Interfaces

#### `IntentDefinition`

Defines the structure of an intent.

```typescript
interface IntentDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  component: string;
  version?: string;
  crawlable?: boolean;
  metadata?: Record<string, any>;
}
```

#### `ComponentDefinition`

Defines the structure of a component.

```typescript
interface ComponentDefinition {
  name: string;
  description: string;
  props: JSONSchema;
  render: ComponentRenderer;
  version?: string;
  metadata?: Record<string, any>;
}
```

#### `IntentRequest`

Structure of an incoming intent request.

```typescript
interface IntentRequest {
  intent: {
    name: string;
    parameters: Record<string, any>;
  };
  context?: {
    userId?: string;
    sessionId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
  };
}
```

#### `IntentResponse`

Structure of an intent response.

```typescript
interface IntentResponse {
  success: boolean;
  result?: VirtualNode;
  error?: string;
  metadata?: {
    intent: string;
    component: string;
    renderTime: string;
    version?: string;
  };
}
```

### Function Types

```typescript
// Component renderer function
type ComponentRenderer = (props: Record<string, any>) => Promise<VirtualNode>;

// Middleware function
type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

// Validation function
type ValidationFunction = (data: any) => ValidationResult;
```

### Result Types

```typescript
interface RenderResult {
  success: boolean;
  result?: VirtualNode;
  error?: string;
  metadata?: {
    intent: string;
    component: string;
    renderTime: string;
  };
}

interface ValidationResult {
  success: boolean;
  errors: string[];
}
```

### Virtual DOM Types

```typescript
interface VirtualNode {
  type: string;
  props?: Record<string, any>;
  children?: (VirtualNode | string)[];
}
```

### JSON Schema Types

The SDK uses JSON Schema for parameter and prop validation:

```typescript
interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
  default?: any;
}
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
class IXPError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

class IntentNotFoundError extends IXPError {}
class ComponentNotFoundError extends IXPError {}
class ValidationError extends IXPError {}
class RenderError extends IXPError {}
```

### Example Error Handling

```typescript
try {
  const result = await server.render('unknown_intent', {});
} catch (error) {
  if (error instanceof IntentNotFoundError) {
    console.error('Intent not found:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Utility Functions

### `validateIntent()`

Validates an intent definition against the schema.

```typescript
function validateIntent(intent: IntentDefinition): ValidationResult
```

**Parameters**:
- `intent: IntentDefinition` - Intent to validate

**Returns**: Validation result with success status and errors

### `validateComponent()`

Validates a component definition against the schema.

```typescript
function validateComponent(component: ComponentDefinition): ValidationResult
```

**Parameters**:
- `component: ComponentDefinition` - Component to validate

**Returns**: Validation result with success status and errors

### `createMiddleware()`

Factory function for creating middleware.

```typescript
function createMiddleware(fn: MiddlewareFunction): Middleware
```

**Parameters**:
- `fn: MiddlewareFunction` - Middleware function

**Returns**: Middleware object

---

**Next**: [Intent System API](./intents.md) | [Component System API](./components.md)