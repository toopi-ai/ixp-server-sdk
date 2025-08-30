# Core API Reference

The IXP Server SDK provides a comprehensive set of APIs for building intent-driven servers. This document covers the core classes, functions, and interfaces.

## Table of Contents

- [IXPServer](#ixpserver)
- [Intent System](#intent-system)
- [Component System](#component-system)
- [Configuration](#configuration)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)

## IXPServer

The main server class that orchestrates intent handling and component rendering.

### Constructor

```typescript
class IXPServer {
  constructor(config: IXPServerConfig)
}
```

#### Parameters

- `config: IXPServerConfig` - Server configuration object

#### Example

```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({
  port: 3000,
  host: 'localhost',
  intents: [],
  components: [],
  middleware: [],
  plugins: []
});
```

### Methods

#### `start()`

Starts the IXP server.

```typescript
async start(): Promise<void>
```

**Returns**: Promise that resolves when server is started

**Example**:
```typescript
await server.start();
console.log('Server started successfully');
```

#### `stop()`

Stops the IXP server gracefully.

```typescript
async stop(): Promise<void>
```

**Returns**: Promise that resolves when server is stopped

**Example**:
```typescript
await server.stop();
console.log('Server stopped');
```

#### `registerIntent()`

Registers a new intent with the server.

```typescript
registerIntent(intent: Intent): void
```

**Parameters**:
- `intent: Intent` - Intent configuration object

**Example**:
```typescript
server.registerIntent({
  name: 'user_profile',
  description: 'Get user profile information',
  parameters: {
    userId: { type: 'string', required: true }
  },
  handler: async (params) => {
    return {
      component: 'UserProfile',
      props: { userId: params.userId }
    };
  }
});
```

#### `registerComponent()`

Registers a new component with the server.

```typescript
registerComponent(component: Component): void
```

**Parameters**:
- `component: Component` - Component configuration object

**Example**:
```typescript
server.registerComponent({
  name: 'UserProfile',
  description: 'User profile display component',
  props: {
    userId: { type: 'string', required: true },
    showEmail: { type: 'boolean', required: false, default: false }
  },
  render: async (props) => {
    const user = await getUserById(props.userId);
    return {
      type: 'div',
      props: { className: 'user-profile' },
      children: [
        { type: 'h2', props: {}, children: [user.name] },
        props.showEmail && { type: 'p', props: {}, children: [user.email] }
      ].filter(Boolean)
    };
  }
});
```

#### `render()`

Renders an intent with the given parameters.

```typescript
async render(intentName: string, parameters: Record<string, any>): Promise<RenderResult>
```

**Parameters**:
- `intentName: string` - Name of the intent to render
- `parameters: Record<string, any>` - Intent parameters

**Returns**: Promise resolving to render result

**Example**:
```typescript
const result = await server.render('user_profile', { userId: '123' });
console.log(result.component); // Rendered component tree
```

## Intent System

### `createIntent()`

Factory function for creating intent configurations.

```typescript
function createIntent(config: IntentConfig): Intent
```

**Parameters**:
- `config: IntentConfig` - Intent configuration

**Returns**: Intent object

**Example**:
```typescript
import { createIntent } from 'ixp-server';

const searchIntent = createIntent({
  name: 'search_products',
  description: 'Search for products',
  parameters: {
    query: { type: 'string', required: true },
    category: { type: 'string', required: false },
    limit: { type: 'number', required: false, default: 10 }
  },
  handler: async (params) => {
    const products = await searchProducts(params.query, {
      category: params.category,
      limit: params.limit
    });
    
    return {
      component: 'ProductList',
      props: { products }
    };
  }
});
```

### Intent Configuration

```typescript
interface IntentConfig {
  name: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  handler: IntentHandler;
  middleware?: MiddlewareFunction[];
  validation?: ValidationFunction;
}
```

#### Properties

- `name: string` - Unique intent identifier
- `description: string` - Human-readable description
- `parameters: Record<string, ParameterDefinition>` - Parameter definitions
- `handler: IntentHandler` - Intent execution function
- `middleware?: MiddlewareFunction[]` - Optional middleware stack
- `validation?: ValidationFunction` - Optional custom validation

## Component System

### `createComponent()`

Factory function for creating component configurations.

```typescript
function createComponent(config: ComponentConfig): Component
```

**Parameters**:
- `config: ComponentConfig` - Component configuration

**Returns**: Component object

**Example**:
```typescript
import { createComponent } from 'ixp-server';

const productCard = createComponent({
  name: 'ProductCard',
  description: 'Product display card',
  props: {
    product: { type: 'object', required: true },
    showPrice: { type: 'boolean', required: false, default: true },
    variant: { type: 'string', required: false, default: 'default' }
  },
  render: async (props) => {
    const { product, showPrice, variant } = props;
    
    return {
      type: 'div',
      props: { 
        className: `product-card product-card--${variant}`,
        'data-product-id': product.id
      },
      children: [
        {
          type: 'img',
          props: {
            src: product.image,
            alt: product.name,
            className: 'product-card__image'
          }
        },
        {
          type: 'div',
          props: { className: 'product-card__content' },
          children: [
            {
              type: 'h3',
              props: { className: 'product-card__title' },
              children: [product.name]
            },
            showPrice && {
              type: 'p',
              props: { className: 'product-card__price' },
              children: [`$${product.price}`]
            }
          ].filter(Boolean)
        }
      ]
    };
  }
});
```

### Component Configuration

```typescript
interface ComponentConfig {
  name: string;
  description: string;
  props: Record<string, PropDefinition>;
  render: ComponentRenderer;
  middleware?: MiddlewareFunction[];
  validation?: ValidationFunction;
}
```

#### Properties

- `name: string` - Unique component identifier
- `description: string` - Human-readable description
- `props: Record<string, PropDefinition>` - Prop definitions
- `render: ComponentRenderer` - Component render function
- `middleware?: MiddlewareFunction[]` - Optional middleware stack
- `validation?: ValidationFunction` - Optional custom validation

## Configuration

### `IXPServerConfig`

Main server configuration interface.

```typescript
interface IXPServerConfig {
  port?: number;
  host?: string;
  intents?: Intent[];
  components?: Component[];
  middleware?: MiddlewareFunction[];
  plugins?: Plugin[];
  cors?: CorsOptions;
  rateLimit?: RateLimitOptions;
  logging?: LoggingOptions;
  swagger?: SwaggerOptions;
  health?: HealthOptions;
}
```

#### Properties

- `port?: number` - Server port (default: 3000)
- `host?: string` - Server host (default: 'localhost')
- `intents?: Intent[]` - Initial intents to register
- `components?: Component[]` - Initial components to register
- `middleware?: MiddlewareFunction[]` - Global middleware stack
- `plugins?: Plugin[]` - Plugins to load
- `cors?: CorsOptions` - CORS configuration
- `rateLimit?: RateLimitOptions` - Rate limiting configuration
- `logging?: LoggingOptions` - Logging configuration
- `swagger?: SwaggerOptions` - Swagger documentation configuration
- `health?: HealthOptions` - Health check configuration

## Utility Functions

### `validateIntent()`

Validates an intent configuration.

```typescript
function validateIntent(intent: Intent): ValidationResult
```

**Parameters**:
- `intent: Intent` - Intent to validate

**Returns**: Validation result with success status and errors

### `validateComponent()`

Validates a component configuration.

```typescript
function validateComponent(component: Component): ValidationResult
```

**Parameters**:
- `component: Component` - Component to validate

**Returns**: Validation result with success status and errors

### `createMiddleware()`

Factory function for creating middleware.

```typescript
function createMiddleware(fn: MiddlewareFunction): Middleware
```

**Parameters**:
- `fn: MiddlewareFunction` - Middleware function

**Returns**: Middleware object

## Type Definitions

### Core Types

```typescript
// Intent handler function
type IntentHandler = (parameters: Record<string, any>) => Promise<IntentResult>;

// Component renderer function
type ComponentRenderer = (props: Record<string, any>) => Promise<VirtualNode>;

// Middleware function
type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

// Validation function
type ValidationFunction = (data: any) => ValidationResult;
```

### Result Types

```typescript
interface IntentResult {
  component: string;
  props: Record<string, any>;
  metadata?: Record<string, any>;
}

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
  props: Record<string, any>;
  children?: (VirtualNode | string)[];
}
```

### Parameter & Prop Definitions

```typescript
interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  description?: string;
  validation?: (value: any) => boolean;
}

interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  description?: string;
  validation?: (value: any) => boolean;
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

---

**Next**: [Intent System API](./intents.md) | [Component System API](./components.md)