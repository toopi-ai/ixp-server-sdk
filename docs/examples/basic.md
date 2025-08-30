# Basic Examples

This guide provides simple, practical examples to help you get started with the IXP Server SDK. Each example builds upon the previous one, introducing new concepts gradually.

## Table of Contents

- [Hello World Server](#hello-world-server)
- [Multi-Intent Server](#multi-intent-server)
- [Dynamic Components](#dynamic-components)
- [Parameter Validation](#parameter-validation)
- [Error Handling](#error-handling)
- [Middleware Integration](#middleware-integration)

## Hello World Server

The simplest possible IXP server with a single intent and component.

```typescript
import { IXPServer } from 'ixp-server';

// Create the server
const server = new IXPServer({
  port: 3000
});

// Register a simple greeting intent
server.registerIntent({
  name: 'greeting',
  description: 'Generate a personalized greeting',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet',
        default: 'World'
      }
    }
  },
  component: 'GreetingCard',
  version: '1.0.0'
});

// Register a greeting card component
server.registerComponent({
  name: 'GreetingCard',
  description: 'A simple greeting card',
  props: {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  },
  render: async (props) => {
    return {
      type: 'div',
      props: { className: 'greeting-card' },
      children: [
        {
          type: 'h1',
          props: { className: 'greeting-title' },
          children: [`Hello, ${props.name}!`]
        },
        {
          type: 'p',
          props: { className: 'greeting-message' },
          children: ['Welcome to IXP Server SDK!']
        }
      ]
    };
  }
});

// Start the server
server.start().then(() => {
  console.log('🚀 Hello World server running on http://localhost:3000');
});
```

### Testing the Server

```bash
# Start the server
npx tsx hello-world.ts

# Test the greeting intent
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "greeting",
      "parameters": {
        "name": "Alice"
      }
    }
  }'
```

## Multi-Intent Server

A server with multiple intents demonstrating different use cases.

```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({ port: 3000 });

// Weather intent
server.registerIntent({
  name: 'weather',
  description: 'Get weather information',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name'
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    required: ['city']
  },
  component: 'WeatherCard',
  version: '1.0.0'
});

// Time intent
server.registerIntent({
  name: 'current_time',
  description: 'Get current time',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone identifier',
        default: 'UTC'
      },
      format: {
        type: 'string',
        description: 'Time format',
        enum: ['12h', '24h'],
        default: '24h'
      }
    }
  },
  component: 'TimeDisplay',
  version: '1.0.0'
});

// Calculator intent
server.registerIntent({
  name: 'calculate',
  description: 'Perform basic calculations',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'Mathematical operation',
        enum: ['add', 'subtract', 'multiply', 'divide']
      },
      a: {
        type: 'number',
        description: 'First number'
      },
      b: {
        type: 'number',
        description: 'Second number'
      }
    },
    required: ['operation', 'a', 'b']
  },
  component: 'CalculatorResult',
  version: '1.0.0'
});

// Weather card component
server.registerComponent({
  name: 'WeatherCard',
  description: 'Weather information display',
  props: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      temperature: { type: 'number' },
      condition: { type: 'string' },
      units: { type: 'string' }
    },
    required: ['city', 'temperature', 'condition', 'units']
  },
  render: async (props) => {
    const tempUnit = props.units === 'fahrenheit' ? '°F' : '°C';
    
    return {
      type: 'div',
      props: { className: 'weather-card' },
      children: [
        {
          type: 'h2',
          props: { className: 'weather-city' },
          children: [props.city]
        },
        {
          type: 'div',
          props: { className: 'weather-info' },
          children: [
            {
              type: 'span',
              props: { className: 'weather-temp' },
              children: [`${props.temperature}${tempUnit}`]
            },
            {
              type: 'span',
              props: { className: 'weather-condition' },
              children: [props.condition]
            }
          ]
        }
      ]
    };
  }
});

// Time display component
server.registerComponent({
  name: 'TimeDisplay',
  description: 'Current time display',
  props: {
    type: 'object',
    properties: {
      time: { type: 'string' },
      timezone: { type: 'string' },
      format: { type: 'string' }
    },
    required: ['time', 'timezone', 'format']
  },
  render: async (props) => {
    return {
      type: 'div',
      props: { className: 'time-display' },
      children: [
        {
          type: 'h2',
          props: { className: 'current-time' },
          children: [props.time]
        },
        {
          type: 'p',
          props: { className: 'time-info' },
          children: [`${props.timezone} (${props.format} format)`]
        }
      ]
    };
  }
});

// Calculator result component
server.registerComponent({
  name: 'CalculatorResult',
  description: 'Calculator result display',
  props: {
    type: 'object',
    properties: {
      operation: { type: 'string' },
      a: { type: 'number' },
      b: { type: 'number' },
      result: { type: 'number' }
    },
    required: ['operation', 'a', 'b', 'result']
  },
  render: async (props) => {
    const operationSymbols = {
      add: '+',
      subtract: '-',
      multiply: '×',
      divide: '÷'
    };
    
    const symbol = operationSymbols[props.operation as keyof typeof operationSymbols] || props.operation;
    
    return {
      type: 'div',
      props: { className: 'calculator-result' },
      children: [
        {
          type: 'div',
          props: { className: 'calculation' },
          children: [`${props.a} ${symbol} ${props.b} = ${props.result}`]
        },
        {
          type: 'p',
          props: { className: 'operation-type' },
          children: [`Operation: ${props.operation}`]
        }
      ]
    };
  }
});

// Start the server
server.start().then(() => {
  console.log('🚀 Multi-intent server running on http://localhost:3000');
});
```

### Testing Multiple Intents

```bash
# Test weather intent
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "weather",
      "parameters": {
        "city": "New York",
        "units": "fahrenheit"
      }
    }
  }'

# Test time intent
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "current_time",
      "parameters": {
        "timezone": "America/New_York",
        "format": "12h"
      }
    }
  }'

# Test calculator intent
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "calculate",
      "parameters": {
        "operation": "multiply",
        "a": 15,
        "b": 7
      }
    }
  }'
```

## Dynamic Components

Components that adapt their rendering based on props and conditions.

```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({ port: 3000 });

// Product listing intent
server.registerIntent({
  name: 'product_list',
  description: 'Display a list of products',
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Product category'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of products',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      sortBy: {
        type: 'string',
        description: 'Sort criteria',
        enum: ['name', 'price', 'rating'],
        default: 'name'
      }
    }
  },
  component: 'ProductGrid',
  version: '1.0.0'
});

// Dynamic product grid component
server.registerComponent({
  name: 'ProductGrid',
  description: 'Responsive product grid',
  props: {
    type: 'object',
    properties: {
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            rating: { type: 'number' },
            image: { type: 'string' },
            inStock: { type: 'boolean' }
          }
        }
      },
      category: { type: 'string' },
      sortBy: { type: 'string' }
    },
    required: ['products']
  },
  render: async (props) => {
    const { products, category, sortBy } = props;
    
    return {
      type: 'div',
      props: { className: 'product-grid' },
      children: [
        {
          type: 'header',
          props: { className: 'grid-header' },
          children: [
            {
              type: 'h2',
              children: [category ? `${category} Products` : 'All Products']
            },
            {
              type: 'p',
              props: { className: 'sort-info' },
              children: [`Sorted by: ${sortBy}`]
            }
          ]
        },
        {
          type: 'div',
          props: { className: 'products' },
          children: products.map((product: any) => ({
            type: 'div',
            props: {
              className: `product-card ${!product.inStock ? 'out-of-stock' : ''}`,
              'data-product-id': product.id
            },
            children: [
              {
                type: 'img',
                props: {
                  src: product.image,
                  alt: product.name,
                  className: 'product-image'
                }
              },
              {
                type: 'div',
                props: { className: 'product-info' },
                children: [
                  {
                    type: 'h3',
                    props: { className: 'product-name' },
                    children: [product.name]
                  },
                  {
                    type: 'p',
                    props: { className: 'product-price' },
                    children: [`$${product.price.toFixed(2)}`]
                  },
                  {
                    type: 'div',
                    props: { className: 'product-rating' },
                    children: [`★`.repeat(Math.floor(product.rating)) + ` (${product.rating})`]
                  },
                  !product.inStock && {
                    type: 'span',
                    props: { className: 'out-of-stock-label' },
                    children: ['Out of Stock']
                  }
                ].filter(Boolean)
              }
            ]
          }))
        }
      ]
    };
  }
});

server.start().then(() => {
  console.log('🚀 Dynamic components server running on http://localhost:3000');
});
```

## Parameter Validation

Advanced parameter validation using JSON Schema.

```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({ port: 3000 });

// User registration intent with complex validation
server.registerIntent({
  name: 'user_registration',
  description: 'Register a new user',
  parameters: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
        description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special character)'
      },
      age: {
        type: 'number',
        minimum: 13,
        maximum: 120,
        description: 'User age'
      },
      preferences: {
        type: 'object',
        properties: {
          newsletter: { type: 'boolean', default: false },
          theme: {
            type: 'string',
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
          },
          language: {
            type: 'string',
            pattern: '^[a-z]{2}(-[A-Z]{2})?$',
            default: 'en-US'
          }
        }
      }
    },
    required: ['email', 'password', 'age'],
    additionalProperties: false
  },
  component: 'RegistrationForm',
  version: '1.0.0'
});

// Registration form component
server.registerComponent({
  name: 'RegistrationForm',
  description: 'User registration form',
  props: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      age: { type: 'number' },
      preferences: { type: 'object' }
    },
    required: ['email', 'age']
  },
  render: async (props) => {
    return {
      type: 'div',
      props: { className: 'registration-form' },
      children: [
        {
          type: 'h2',
          children: ['Registration Successful!']
        },
        {
          type: 'div',
          props: { className: 'user-info' },
          children: [
            {
              type: 'p',
              children: [`Email: ${props.email}`]
            },
            {
              type: 'p',
              children: [`Age: ${props.age}`]
            },
            props.preferences && {
              type: 'div',
              props: { className: 'preferences' },
              children: [
                {
                  type: 'h3',
                  children: ['Preferences:']
                },
                {
                  type: 'ul',
                  children: Object.entries(props.preferences).map(([key, value]) => ({
                    type: 'li',
                    children: [`${key}: ${value}`]
                  }))
                }
              ]
            }
          ].filter(Boolean)
        }
      ]
    };
  }
});

server.start().then(() => {
  console.log('🚀 Parameter validation server running on http://localhost:3000');
});
```

## Error Handling

Proper error handling and validation feedback.

```typescript
import { IXPServer } from 'ixp-server';

const server = new IXPServer({ port: 3000 });

// File processing intent
server.registerIntent({
  name: 'process_file',
  description: 'Process uploaded file',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        pattern: '^[a-zA-Z0-9._-]+\\.(jpg|jpeg|png|gif|pdf|txt|doc|docx)$',
        description: 'Valid filename with supported extension'
      },
      fileSize: {
        type: 'number',
        minimum: 1,
        maximum: 10485760, // 10MB
        description: 'File size in bytes'
      },
      processType: {
        type: 'string',
        enum: ['compress', 'convert', 'analyze'],
        description: 'Type of processing to perform'
      }
    },
    required: ['filename', 'fileSize', 'processType']
  },
  component: 'FileProcessor',
  version: '1.0.0'
});

// File processor component with error states
server.registerComponent({
  name: 'FileProcessor',
  description: 'File processing status display',
  props: {
    type: 'object',
    properties: {
      filename: { type: 'string' },
      fileSize: { type: 'number' },
      processType: { type: 'string' },
      status: {
        type: 'string',
        enum: ['processing', 'completed', 'error'],
        default: 'processing'
      },
      error: { type: 'string' }
    },
    required: ['filename', 'fileSize', 'processType']
  },
  render: async (props) => {
    const { filename, fileSize, processType, status = 'processing', error } = props;
    
    const formatFileSize = (bytes: number) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      if (bytes === 0) return '0 Bytes';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    return {
      type: 'div',
      props: { className: `file-processor status-${status}` },
      children: [
        {
          type: 'div',
          props: { className: 'file-info' },
          children: [
            {
              type: 'h3',
              children: ['File Processing']
            },
            {
              type: 'p',
              children: [`File: ${filename}`]
            },
            {
              type: 'p',
              children: [`Size: ${formatFileSize(fileSize)}`]
            },
            {
              type: 'p',
              children: [`Process: ${processType}`]
            }
          ]
        },
        {
          type: 'div',
          props: { className: 'status-indicator' },
          children: [
            status === 'processing' && {
              type: 'div',
              props: { className: 'spinner' },
              children: ['Processing...']
            },
            status === 'completed' && {
              type: 'div',
              props: { className: 'success' },
              children: ['✅ Processing completed successfully!']
            },
            status === 'error' && {
              type: 'div',
              props: { className: 'error' },
              children: [
                '❌ Processing failed',
                error && {
                  type: 'p',
                  props: { className: 'error-message' },
                  children: [error]
                }
              ].filter(Boolean)
            }
          ].filter(Boolean)
        }
      ]
    };
  }
});

server.start().then(() => {
  console.log('🚀 Error handling server running on http://localhost:3000');
});
```

## Middleware Integration

Using middleware for authentication, logging, and request processing.

```typescript
import { IXPServer } from 'ixp-server';
import { Request, Response, NextFunction } from 'express';

// Authentication middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Simulate token validation
  const token = authHeader.substring(7);
  if (token !== 'valid-token-123') {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  // Add user info to request
  (req as any).user = { id: 'user123', name: 'John Doe' };
  next();
};

// Logging middleware
const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

const server = new IXPServer({
  port: 3000,
  middleware: [loggingMiddleware, authMiddleware]
});

// Protected user profile intent
server.registerIntent({
  name: 'user_profile',
  description: 'Get user profile information',
  parameters: {
    type: 'object',
    properties: {
      includePrivate: {
        type: 'boolean',
        description: 'Include private information',
        default: false
      }
    }
  },
  component: 'UserProfile',
  version: '1.0.0'
});

// User profile component
server.registerComponent({
  name: 'UserProfile',
  description: 'User profile display',
  props: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' }
        }
      },
      includePrivate: { type: 'boolean' }
    },
    required: ['user']
  },
  render: async (props) => {
    const { user, includePrivate } = props;
    
    return {
      type: 'div',
      props: { className: 'user-profile' },
      children: [
        {
          type: 'h2',
          children: ['User Profile']
        },
        {
          type: 'div',
          props: { className: 'profile-info' },
          children: [
            {
              type: 'p',
              children: [`Name: ${user.name}`]
            },
            {
              type: 'p',
              children: [`ID: ${user.id}`]
            },
            includePrivate && {
              type: 'p',
              props: { className: 'private-info' },
              children: [`Email: ${user.email || 'Not provided'}`]
            }
          ].filter(Boolean)
        }
      ]
    };
  }
});

server.start().then(() => {
  console.log('🚀 Middleware server running on http://localhost:3000');
  console.log('Use Authorization: Bearer valid-token-123 header for requests');
});
```

### Testing with Authentication

```bash
# Test without authentication (should fail)
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "user_profile",
      "parameters": {}
    }
  }'

# Test with valid authentication
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer valid-token-123" \
  -d '{
    "intent": {
      "name": "user_profile",
      "parameters": {
        "includePrivate": true
      }
    }
  }'
```

---

**Next**: [Advanced Examples](./advanced.md) | [Framework Integration](./frameworks.md)