# Your First IXP Server

This guide walks you through creating your first IXP (Intent Exchange Protocol) server from scratch. You'll learn the fundamental concepts while building a practical weather information server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Basic Server Structure](#basic-server-structure)
- [Creating Your First Intent](#creating-your-first-intent)
- [Adding Components](#adding-components)
- [Testing Your Server](#testing-your-server)
- [Adding More Features](#adding-more-features)
- [Best Practices](#best-practices)
- [Next Steps](#next-steps)

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Basic knowledge of JavaScript/TypeScript
- IXP Server SDK installed (see [Installation Guide](./installation.md))
- A text editor or IDE

## Project Setup

### 1. Create Project Directory

```bash
mkdir my-first-ixp-server
cd my-first-ixp-server
```

### 2. Initialize npm Project

```bash
npm init -y
```

### 3. Install Dependencies

```bash
# Install IXP Server SDK
npm install ixp-server@1.1.1

# Install development dependencies
npm install --save-dev typescript @types/node tsx
```

### 4. Setup TypeScript

```bash
npx tsc --init
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. Create Project Structure

```bash
mkdir -p src/{intents,components}
touch src/index.ts
touch src/intents/weather.ts
touch src/components/weather-card.ts
```

Your project structure should look like:

```
my-first-ixp-server/
├── src/
│   ├── index.ts
│   ├── intents/
│   │   └── weather.ts
│   └── components/
│       └── weather-card.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Basic Server Structure

### 1. Create the Main Server File

Edit `src/index.ts`:

```typescript
import { createIXPServer } from 'ixp-server';

// Create server instance
const server = createIXPServer({
  name: 'my-first-ixp-server',
  version: '1.0.0',
  description: 'My first IXP server for weather information',
  port: 3000,
  host: 'localhost'
});

// Add basic middleware for logging
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
server.addRoute('GET', '/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: server.config.version
  });
});

// Start the server
async function startServer() {
  try {
    await server.start();
    console.log(`🚀 Server running at http://localhost:${server.config.port}`);
    console.log(`📖 API Documentation: http://localhost:${server.config.port}/docs`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await server.stop();
  process.exit(0);
});

// Start the server
startServer();
```

### 2. Add Package Scripts

Update `package.json`:

```json
{
  "name": "my-first-ixp-server",
  "version": "1.0.0",
  "description": "My first IXP server",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "ixp-server": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "tsx": "^4.0.0",
    "typescript": "^4.5.0"
  }
}
```

### 3. Test Basic Server

```bash
# Start development server
npm run dev
```

Open your browser and visit:
- `http://localhost:3000/health` - Should show health status
- `http://localhost:3000/docs` - Should show API documentation

## Creating Your First Intent

Intents define what your server can understand and respond to. Let's create a weather intent.

### 1. Define the Weather Intent

Edit `src/intents/weather.ts`:

```typescript
import { Intent, IntentHandler } from 'ixp-server';

// Define the weather intent
export const weatherIntent: Intent = {
  name: 'get_weather',
  description: 'Get current weather information for a location',
  examples: [
    'What\'s the weather in New York?',
    'Show me the weather for London',
    'Current weather in Tokyo',
    'Weather forecast for Paris'
  ],
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city or location to get weather for',
        examples: ['New York', 'London', 'Tokyo', 'Paris']
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    required: ['location']
  }
};

// Mock weather data (in real app, you'd call a weather API)
const mockWeatherData = {
  'new york': { temp: 22, condition: 'Sunny', humidity: 65, wind: '10 km/h' },
  'london': { temp: 15, condition: 'Cloudy', humidity: 80, wind: '15 km/h' },
  'tokyo': { temp: 28, condition: 'Partly Cloudy', humidity: 70, wind: '8 km/h' },
  'paris': { temp: 18, condition: 'Rainy', humidity: 85, wind: '12 km/h' }
};

// Intent handler
export const weatherHandler: IntentHandler = async (params, context) => {
  const { location, units = 'celsius' } = params;
  
  // Normalize location for lookup
  const normalizedLocation = location.toLowerCase();
  
  // Get weather data (mock)
  const weatherData = mockWeatherData[normalizedLocation];
  
  if (!weatherData) {
    return {
      success: false,
      error: `Weather data not available for ${location}`,
      component: 'error-message',
      data: {
        message: `Sorry, I don't have weather data for ${location}. Try New York, London, Tokyo, or Paris.`
      }
    };
  }
  
  // Convert temperature if needed
  let temperature = weatherData.temp;
  let tempUnit = '°C';
  
  if (units === 'fahrenheit') {
    temperature = Math.round((temperature * 9/5) + 32);
    tempUnit = '°F';
  }
  
  return {
    success: true,
    component: 'weather-card',
    data: {
      location: location,
      temperature: `${temperature}${tempUnit}`,
      condition: weatherData.condition,
      humidity: `${weatherData.humidity}%`,
      wind: weatherData.wind,
      timestamp: new Date().toISOString()
    }
  };
};
```

### 2. Register the Intent

Update `src/index.ts` to register the intent:

```typescript
import { createIXPServer } from 'ixp-server';
import { weatherIntent, weatherHandler } from './intents/weather';

// Create server instance
const server = createIXPServer({
  name: 'my-first-ixp-server',
  version: '1.0.0',
  description: 'My first IXP server for weather information',
  port: 3000,
  host: 'localhost'
});

// Register the weather intent
server.registerIntent(weatherIntent, weatherHandler);

// Add basic middleware for logging
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
server.addRoute('GET', '/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: server.config.version,
    intents: server.getRegisteredIntents().map(intent => intent.name)
  });
});

// Start the server
async function startServer() {
  try {
    await server.start();
    console.log(`🚀 Server running at http://localhost:${server.config.port}`);
    console.log(`📖 API Documentation: http://localhost:${server.config.port}/docs`);
    console.log(`🎯 Registered intents: ${server.getRegisteredIntents().map(i => i.name).join(', ')}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await server.stop();
  process.exit(0);
});

// Start the server
startServer();
```

## Adding Components

Components define how your server's responses are rendered. Let's create a weather card component.

### 1. Create Weather Card Component

Edit `src/components/weather-card.ts`:

```typescript
import { Component } from 'ixp-server';

export const weatherCardComponent: Component = {
  name: 'weather-card',
  description: 'Displays weather information in a card format',
  props: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The location name'
      },
      temperature: {
        type: 'string',
        description: 'Temperature with unit (e.g., "22°C")'
      },
      condition: {
        type: 'string',
        description: 'Weather condition (e.g., "Sunny")'
      },
      humidity: {
        type: 'string',
        description: 'Humidity percentage'
      },
      wind: {
        type: 'string',
        description: 'Wind speed and direction'
      },
      timestamp: {
        type: 'string',
        description: 'When the data was retrieved'
      }
    },
    required: ['location', 'temperature', 'condition']
  },
  render: (props) => {
    const { location, temperature, condition, humidity, wind, timestamp } = props;
    
    // Get weather emoji based on condition
    const getWeatherEmoji = (condition: string): string => {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('sunny')) return '☀️';
      if (conditionLower.includes('cloudy')) return '☁️';
      if (conditionLower.includes('rainy') || conditionLower.includes('rain')) return '🌧️';
      if (conditionLower.includes('snow')) return '❄️';
      if (conditionLower.includes('storm')) return '⛈️';
      return '🌤️'; // Default
    };
    
    const emoji = getWeatherEmoji(condition);
    const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
    
    return {
      type: 'card',
      title: `Weather in ${location}`,
      content: {
        type: 'container',
        children: [
          {
            type: 'header',
            content: {
              type: 'row',
              children: [
                {
                  type: 'text',
                  content: emoji,
                  style: { fontSize: '48px', marginRight: '16px' }
                },
                {
                  type: 'column',
                  children: [
                    {
                      type: 'text',
                      content: temperature,
                      style: { fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }
                    },
                    {
                      type: 'text',
                      content: condition,
                      style: { fontSize: '16px', color: '#6b7280' }
                    }
                  ]
                }
              ]
            }
          },
          {
            type: 'divider',
            style: { margin: '16px 0' }
          },
          {
            type: 'grid',
            columns: 2,
            children: [
              {
                type: 'info-item',
                label: 'Humidity',
                value: humidity || 'N/A',
                icon: '💧'
              },
              {
                type: 'info-item',
                label: 'Wind',
                value: wind || 'N/A',
                icon: '💨'
              }
            ]
          },
          ...(formattedTime ? [{
            type: 'footer',
            content: {
              type: 'text',
              content: `Updated at ${formattedTime}`,
              style: { fontSize: '12px', color: '#9ca3af', textAlign: 'center' }
            }
          }] : [])
        ]
      },
      style: {
        maxWidth: '400px',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb'
      }
    };
  }
};
```

### 2. Create Error Message Component

Add to `src/components/weather-card.ts`:

```typescript
export const errorMessageComponent: Component = {
  name: 'error-message',
  description: 'Displays error messages in a user-friendly format',
  props: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The error message to display'
      },
      type: {
        type: 'string',
        description: 'Error type',
        enum: ['error', 'warning', 'info'],
        default: 'error'
      }
    },
    required: ['message']
  },
  render: (props) => {
    const { message, type = 'error' } = props;
    
    const getErrorStyle = (type: string) => {
      switch (type) {
        case 'warning':
          return {
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b',
            color: '#92400e',
            icon: '⚠️'
          };
        case 'info':
          return {
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            color: '#1e40af',
            icon: 'ℹ️'
          };
        default:
          return {
            backgroundColor: '#fee2e2',
            borderColor: '#ef4444',
            color: '#dc2626',
            icon: '❌'
          };
      }
    };
    
    const style = getErrorStyle(type);
    
    return {
      type: 'card',
      content: {
        type: 'row',
        children: [
          {
            type: 'text',
            content: style.icon,
            style: { fontSize: '24px', marginRight: '12px' }
          },
          {
            type: 'text',
            content: message,
            style: { fontSize: '16px', lineHeight: '1.5' }
          }
        ]
      },
      style: {
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        color: style.color,
        maxWidth: '400px'
      }
    };
  }
};
```

### 3. Register Components

Update `src/index.ts` to register components:

```typescript
import { createIXPServer } from 'ixp-server';
import { weatherIntent, weatherHandler } from './intents/weather';
import { weatherCardComponent, errorMessageComponent } from './components/weather-card';

// Create server instance
const server = createIXPServer({
  name: 'my-first-ixp-server',
  version: '1.0.0',
  description: 'My first IXP server for weather information',
  port: 3000,
  host: 'localhost'
});

// Register components
server.registerComponent(weatherCardComponent);
server.registerComponent(errorMessageComponent);

// Register the weather intent
server.registerIntent(weatherIntent, weatherHandler);

// Add basic middleware for logging
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
server.addRoute('GET', '/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: server.config.version,
    intents: server.getRegisteredIntents().map(intent => intent.name),
    components: server.getRegisteredComponents().map(comp => comp.name)
  });
});

// Start the server
async function startServer() {
  try {
    await server.start();
    console.log(`🚀 Server running at http://localhost:${server.config.port}`);
    console.log(`📖 API Documentation: http://localhost:${server.config.port}/docs`);
    console.log(`🎯 Registered intents: ${server.getRegisteredIntents().map(i => i.name).join(', ')}`);
    console.log(`🧩 Registered components: ${server.getRegisteredComponents().map(c => c.name).join(', ')}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await server.stop();
  process.exit(0);
});

// Start the server
startServer();
```

## Testing Your Server

### 1. Start the Server

```bash
npm run dev
```

You should see output like:

```
🚀 Server running at http://localhost:3000
📖 API Documentation: http://localhost:3000/docs
🎯 Registered intents: get_weather
🧩 Registered components: weather-card, error-message
```

### 2. Test with curl

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test weather intent
curl -X POST http://localhost:3000/intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "get_weather",
    "parameters": {
      "location": "New York"
    }
  }'

# Test with different units
curl -X POST http://localhost:3000/intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "get_weather",
    "parameters": {
      "location": "London",
      "units": "fahrenheit"
    }
  }'

# Test error case
curl -X POST http://localhost:3000/intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "get_weather",
    "parameters": {
      "location": "Unknown City"
    }
  }'
```

### 3. Test with Browser

Visit `http://localhost:3000/docs` to see the interactive API documentation and test your intents directly in the browser.

### 4. Expected Responses

**Successful weather request:**
```json
{
  "success": true,
  "component": "weather-card",
  "data": {
    "location": "New York",
    "temperature": "22°C",
    "condition": "Sunny",
    "humidity": "65%",
    "wind": "10 km/h",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Weather data not available for Unknown City",
  "component": "error-message",
  "data": {
    "message": "Sorry, I don't have weather data for Unknown City. Try New York, London, Tokyo, or Paris."
  }
}
```

## Adding More Features

### 1. Add Weather Forecast Intent

Create `src/intents/forecast.ts`:

```typescript
import { Intent, IntentHandler } from 'ixp-server';

export const forecastIntent: Intent = {
  name: 'get_forecast',
  description: 'Get weather forecast for a location',
  examples: [
    'Weather forecast for New York',
    'Show me the 5-day forecast for London',
    'What will the weather be like in Tokyo this week?'
  ],
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city or location to get forecast for'
      },
      days: {
        type: 'number',
        description: 'Number of days to forecast',
        minimum: 1,
        maximum: 7,
        default: 5
      }
    },
    required: ['location']
  }
};

export const forecastHandler: IntentHandler = async (params, context) => {
  const { location, days = 5 } = params;
  
  // Mock forecast data
  const mockForecast = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(20 + Math.random() * 15),
      low: Math.round(10 + Math.random() * 10),
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
    };
  });
  
  return {
    success: true,
    component: 'forecast-card',
    data: {
      location,
      days,
      forecast: mockForecast
    }
  };
};
```

### 2. Add Input Validation Middleware

Create `src/middleware/validation.ts`:

```typescript
import { Middleware } from 'ixp-server';

export const validationMiddleware: Middleware = {
  name: 'validation',
  type: 'request',
  handler: async (req, res, next) => {
    // Validate intent requests
    if (req.url === '/intent' && req.method === 'POST') {
      const body = req.body;
      
      if (!body.intent) {
        return res.status(400).json({
          success: false,
          error: 'Intent name is required',
          code: 'MISSING_INTENT'
        });
      }
      
      if (!body.parameters || typeof body.parameters !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Parameters object is required',
          code: 'INVALID_PARAMETERS'
        });
      }
    }
    
    next();
  }
};
```

### 3. Add Rate Limiting

Create `src/middleware/rate-limit.ts`:

```typescript
import { Middleware } from 'ixp-server';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware: Middleware = {
  name: 'rate-limit',
  type: 'request',
  handler: async (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute
    
    const clientData = requestCounts.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize counter
      requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      // Increment counter
      clientData.count++;
      
      if (clientData.count > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - (clientData?.count || 0)));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientData?.resetTime || now) / 1000));
    
    next();
  }
};
```

## Best Practices

### 1. Error Handling

```typescript
// Always handle errors gracefully
export const safeWeatherHandler: IntentHandler = async (params, context) => {
  try {
    // Your intent logic here
    return await weatherHandler(params, context);
  } catch (error) {
    console.error('Weather handler error:', error);
    
    return {
      success: false,
      error: 'An unexpected error occurred',
      component: 'error-message',
      data: {
        message: 'Sorry, something went wrong while getting the weather data. Please try again later.',
        type: 'error'
      }
    };
  }
};
```

### 2. Input Validation

```typescript
// Validate and sanitize inputs
export const validateLocation = (location: string): string => {
  if (!location || typeof location !== 'string') {
    throw new Error('Location must be a non-empty string');
  }
  
  // Sanitize input
  return location.trim().toLowerCase().replace(/[^a-z\s]/g, '');
};
```

### 3. Configuration Management

Create `src/config/index.ts`:

```typescript
export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    name: process.env.SERVER_NAME || 'my-first-ixp-server'
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    defaultUnits: process.env.DEFAULT_UNITS || 'celsius',
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000') // 5 minutes
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};
```

### 4. Testing

Create `src/tests/weather.test.ts`:

```typescript
import { weatherHandler } from '../intents/weather';

describe('Weather Intent', () => {
  test('should return weather data for valid location', async () => {
    const result = await weatherHandler(
      { location: 'New York', units: 'celsius' },
      {}
    );
    
    expect(result.success).toBe(true);
    expect(result.component).toBe('weather-card');
    expect(result.data.location).toBe('New York');
    expect(result.data.temperature).toContain('°C');
  });
  
  test('should return error for invalid location', async () => {
    const result = await weatherHandler(
      { location: 'Invalid City' },
      {}
    );
    
    expect(result.success).toBe(false);
    expect(result.component).toBe('error-message');
  });
});
```

## Next Steps

Congratulations! You've built your first IXP server. Here's what you can do next:

### 1. Enhance Your Server

- **Add Real Weather API**: Replace mock data with a real weather service like OpenWeatherMap
- **Add More Intents**: Create intents for news, jokes, calculations, etc.
- **Improve Components**: Add more interactive and visually appealing components
- **Add Authentication**: Secure your server with API keys or JWT tokens

### 2. Learn Advanced Features

- **Middleware**: Learn about [middleware](../api/middleware.md) for cross-cutting concerns
- **Plugins**: Explore [plugins](../api/plugins.md) for extending functionality
- **Configuration**: Read the [configuration guide](./configuration.md) for advanced setup
- **Testing**: Check out the [testing guide](../examples/testing.md) for comprehensive testing strategies

### 3. Deploy Your Server

- **Production Setup**: Follow the [installation guide](./installation.md#production-setup) for production deployment
- **Docker**: Use the Docker configuration from the installation guide
- **Monitoring**: Add health checks, logging, and monitoring

### 4. Explore Examples

- **Real-world Examples**: Check out [real-world examples](../examples/real-world.md)
- **Framework Integration**: Learn about [framework integration](../examples/frameworks.md)
- **Advanced Patterns**: Explore [advanced patterns](./advanced.md)

## Troubleshooting

### Common Issues

1. **Server won't start**: Check if port 3000 is already in use
2. **Intent not found**: Ensure intents are properly registered
3. **Component not rendering**: Verify component registration and data structure
4. **TypeScript errors**: Check your tsconfig.json and type definitions

### Getting Help

- Check the [FAQ](../reference/faq.md)
- Review the [API documentation](../api/core.md)
- Look at [example implementations](../examples/basic.md)
- Search or create issues on GitHub

## Summary

In this guide, you've learned how to:

- ✅ Set up a new IXP server project
- ✅ Create and register intents
- ✅ Build reusable components
- ✅ Handle errors gracefully
- ✅ Test your server functionality
- ✅ Apply best practices

Your weather server demonstrates the core concepts of IXP: intents define what your server understands, handlers process the requests, and components render the responses. This foundation will serve you well as you build more complex applications.

Happy coding! 🚀