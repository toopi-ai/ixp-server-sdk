# Server API Reference

The IXP Server SDK provides a powerful server implementation for handling intents and rendering components. This document covers the core server functionality and configuration options.

## Table of Contents

- [IXPServer](#ixpserver)
- [Configuration](#configuration)
- [Methods](#methods)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Examples](#examples)

## IXPServer

The main server class that handles intent registration, component registration, and request processing.

### Constructor

```typescript
const server = new IXPServer(config?: IXPServerConfig)
```

#### Parameters

- `config` (optional): Server configuration object

#### Example

```typescript
import { IXPServer } from '@toopi/ixp-server-sdk'

const server = new IXPServer({
  port: 3000,
  host: 'localhost',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  middleware: [
    // Custom middleware functions
  ]
})
```

## Configuration

### IXPServerConfig

Configuration interface for the IXP Server.

```typescript
interface IXPServerConfig {
  port?: number
  host?: string
  cors?: CorsOptions
  middleware?: MiddlewareFunction[]
  errorHandler?: ErrorHandler
  logger?: Logger
  maxRequestSize?: string
  timeout?: number
  rateLimit?: RateLimitConfig
}
```

#### Properties

- `port` (number, optional): Server port (default: 3000)
- `host` (string, optional): Server host (default: 'localhost')
- `cors` (CorsOptions, optional): CORS configuration
- `middleware` (MiddlewareFunction[], optional): Array of middleware functions
- `errorHandler` (ErrorHandler, optional): Custom error handler
- `logger` (Logger, optional): Custom logger instance
- `maxRequestSize` (string, optional): Maximum request size (default: '10mb')
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `rateLimit` (RateLimitConfig, optional): Rate limiting configuration

### CorsOptions

```typescript
interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
}
```

### RateLimitConfig

```typescript
interface RateLimitConfig {
  windowMs?: number
  max?: number
  message?: string
}
```

## Methods

### start()

Starts the IXP server.

```typescript
async start(): Promise<void>
```

#### Example

```typescript
const server = new IXPServer({ port: 3000 })

try {
  await server.start()
  console.log('Server started on port 3000')
} catch (error) {
  console.error('Failed to start server:', error)
}
```

### stop()

Stops the IXP server gracefully.

```typescript
async stop(): Promise<void>
```

#### Example

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down server...')
  await server.stop()
  process.exit(0)
})
```

### registerIntent()

Registers an intent definition with the server.

```typescript
registerIntent(intentDefinition: IntentDefinition): void
```

#### Parameters

- `intentDefinition`: JSON object defining the intent structure

#### Example

```typescript
server.registerIntent({
  name: 'weather',
  description: 'Get weather information for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The location to get weather for'
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    required: ['location']
  },
  component: 'WeatherCard',
  version: '1.0.0'
})
```

### registerComponent()

Registers a component definition with the server.

```typescript
registerComponent(componentDefinition: ComponentDefinition): void
```

#### Parameters

- `componentDefinition`: JSON object defining the component structure

#### Example

```typescript
server.registerComponent({
  name: 'WeatherCard',
  description: 'Displays weather information',
  props: {
    type: 'object',
    properties: {
      temperature: { type: 'number' },
      condition: { type: 'string' },
      location: { type: 'string' },
      humidity: { type: 'number' },
      windSpeed: { type: 'number' }
    },
    required: ['temperature', 'condition', 'location']
  },
  version: '1.0.0'
})
```

### render()

Renders a component with the provided props.

```typescript
async render(componentName: string, props: Record<string, any>): Promise<RenderResult>
```

#### Parameters

- `componentName`: Name of the component to render
- `props`: Properties to pass to the component

#### Returns

- `Promise<RenderResult>`: Rendered component result

#### Example

```typescript
const result = await server.render('WeatherCard', {
  temperature: 22,
  condition: 'sunny',
  location: 'New York',
  humidity: 65,
  windSpeed: 10
})

console.log(result.html) // Rendered HTML
console.log(result.css)  // Component styles
console.log(result.js)   // Component JavaScript
```

### use()

Adds middleware to the server.

```typescript
use(middleware: MiddlewareFunction): void
```

#### Parameters

- `middleware`: Middleware function to add

#### Example

```typescript
// Custom logging middleware
server.use(async (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  await next()
})

// Authentication middleware
server.use(async (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  await next()
})
```

## Middleware

### MiddlewareFunction

Middleware functions can modify requests, responses, or perform side effects.

```typescript
type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void
```

### Built-in Middleware

The server includes several built-in middleware:

- **CORS**: Cross-origin resource sharing
- **Body Parser**: JSON and URL-encoded body parsing
- **Rate Limiting**: Request rate limiting
- **Error Handler**: Global error handling
- **Logger**: Request logging

## Error Handling

### Error Types

The server defines several error types:

```typescript
class IXPError extends Error {
  code: string
  statusCode: number
}

class IntentNotFoundError extends IXPError {
  constructor(intentName: string)
}

class ComponentNotFoundError extends IXPError {
  constructor(componentName: string)
}

class ValidationError extends IXPError {
  constructor(message: string, details?: any)
}

class RenderError extends IXPError {
  constructor(componentName: string, error: Error)
}
```

### Custom Error Handler

```typescript
const server = new IXPServer({
  errorHandler: (error, req, res, next) => {
    console.error('Server error:', error)
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        details: error.details
      })
    } else if (error instanceof IntentNotFoundError) {
      res.status(404).json({
        error: 'Intent not found',
        message: error.message
      })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      })
    }
  }
})
```

## Examples

### Basic Server Setup

```typescript
import { IXPServer } from '@toopi/ixp-server-sdk'

const server = new IXPServer({
  port: 3000,
  cors: { origin: '*' }
})

// Register intent
server.registerIntent({
  name: 'greeting',
  description: 'Generate a personalized greeting',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  },
  component: 'GreetingCard'
})

// Register component
server.registerComponent({
  name: 'GreetingCard',
  description: 'Displays a greeting message',
  props: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['name', 'message']
  }
})

// Start server
server.start().then(() => {
  console.log('Server running on http://localhost:3000')
})
```

### Advanced Server with Middleware

```typescript
import { IXPServer } from '@toopi/ixp-server-sdk'

const server = new IXPServer({
  port: 3000,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
})

// Authentication middleware
server.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const apiKey = req.headers['x-api-key']
    if (!apiKey || !isValidApiKey(apiKey)) {
      res.status(401).json({ error: 'Invalid API key' })
      return
    }
  }
  await next()
})

// Request logging middleware
server.use(async (req, res, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)
})

function isValidApiKey(key: string): boolean {
  // Implement your API key validation logic
  return key === 'your-secret-api-key'
}

server.start()
```

### Production Server Setup

```typescript
import { IXPServer } from '@toopi/ixp-server-sdk'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

const server = new IXPServer({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || '0.0.0.0',
  logger,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 1000
  },
  errorHandler: (error, req, res, next) => {
    logger.error('Server error', { error: error.message, stack: error.stack })
    
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Internal server error' })
    } else {
      res.status(500).json({ error: error.message, stack: error.stack })
    }
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  await server.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully')
  await server.stop()
  process.exit(0)
})

server.start().then(() => {
  logger.info(`Server started on ${server.config.host}:${server.config.port}`)
}).catch((error) => {
  logger.error('Failed to start server', error)
  process.exit(1)
})
```

## Related Documentation

- [Core API Reference](./core.md)
- [Intents API Reference](./intents.md)
- [Components API Reference](./components.md)
- [Middleware Guide](../guides/middleware.md)
- [Deployment Guide](../guides/deployment.md)