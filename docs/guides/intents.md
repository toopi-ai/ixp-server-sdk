# Building Intents Guide

This comprehensive guide covers how to define, configure, and manage intents in the IXP Server SDK.

## Table of Contents

- [Intent Overview](#intent-overview)
- [Intent Definition Structure](#intent-definition-structure)
- [Creating Intent Definitions](#creating-intent-definitions)
- [Parameter Schemas](#parameter-schemas)
- [Server Configuration](#server-configuration)
- [Data Resolution](#data-resolution)
- [Crawler Integration](#crawler-integration)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Intent Overview

Intents in the IXP Server SDK are JSON-based definitions that specify what actions your server can perform and how users can interact with your application. Unlike traditional pattern-matching systems, IXP intents are declarative configurations that define:

- What the intent does (description)
- What parameters it accepts (JSON Schema)
- Which component renders the response
- Whether it's crawlable by search engines

### Intent Lifecycle

1. **Definition**: Intent is defined as a JSON object
2. **Registration**: Intent is loaded into the server's intent registry
3. **Resolution**: User requests are matched to intents by name
4. **Data Resolution**: Server resolves data for the intent using DataProvider
5. **Component Rendering**: Associated component renders the response

## Intent Definition Structure

Intents are defined using the `IntentDefinition` interface:

```typescript
interface IntentDefinition {
  name: string;                    // Unique identifier
  description: string;             // Human-readable description
  parameters: {                    // JSON Schema for parameters
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  component: string;               // Component name to render
  version: string;                 // Intent version
  deprecated?: boolean;            // Whether intent is deprecated
  crawlable?: boolean;             // Include in crawler content
}
```

## Creating Intent Definitions

### Basic Intent

```typescript
const greetingIntent: IntentDefinition = {
  name: 'greeting',
  description: 'Display a personalized greeting message',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the person to greet'
      }
    }
  },
  component: 'GreetingCard',
  version: '1.0.0'
};
```

### Intent with Required Parameters

```typescript
const weatherIntent: IntentDefinition = {
  name: 'show_weather',
  description: 'Display current weather information for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates',
        minLength: 2,
        maxLength: 100
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature units',
        default: 'celsius'
      }
    },
    required: ['location']
  },
  component: 'WeatherWidget',
  version: '1.1.0',
  crawlable: true
};
```

### Complex Intent with Nested Parameters

```typescript
const bookFlightIntent: IntentDefinition = {
  name: 'book_flight',
  description: 'Search and book flights between destinations',
  parameters: {
    type: 'object',
    properties: {
      origin: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        description: 'Origin airport code (IATA)'
      },
      destination: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        description: 'Destination airport code (IATA)'
      },
      dates: {
        type: 'object',
        properties: {
          departure: {
            type: 'string',
            format: 'date',
            description: 'Departure date'
          },
          return: {
            type: 'string',
            format: 'date',
            description: 'Return date (optional)'
          }
        },
        required: ['departure']
      },
      passengers: {
        type: 'object',
        properties: {
          adults: {
            type: 'number',
            minimum: 1,
            maximum: 9,
            default: 1
          },
          children: {
            type: 'number',
            minimum: 0,
            maximum: 8,
            default: 0
          }
        }
      },
      class: {
        type: 'string',
        enum: ['economy', 'premium', 'business', 'first'],
        default: 'economy'
      }
    },
    required: ['origin', 'destination', 'dates']
  },
  component: 'FlightBooking',
  version: '2.0.0',
  crawlable: false
};
```

## Parameter Schemas

Intent parameters use JSON Schema for validation and documentation:

### Basic Types

```typescript
// String parameter
{
  type: 'string',
  description: 'User input text',
  minLength: 1,
  maxLength: 255
}

// Number parameter
{
  type: 'number',
  description: 'Numeric value',
  minimum: 0,
  maximum: 100
}

// Boolean parameter
{
  type: 'boolean',
  description: 'True/false flag',
  default: false
}

// Enum parameter
{
  type: 'string',
  enum: ['option1', 'option2', 'option3'],
  description: 'Select from predefined options'
}
```

### Array Parameters

```typescript
// Array of strings
{
  type: 'array',
  items: {
    type: 'string'
  },
  minItems: 1,
  maxItems: 10,
  description: 'List of tags'
}

// Array of objects
{
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' }
    },
    required: ['id', 'name']
  },
  description: 'List of items'
}
```

### Object Parameters

```typescript
// Nested object
{
  type: 'object',
  properties: {
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zipCode: { type: 'string', pattern: '^\\d{5}$' }
      },
      required: ['street', 'city']
    }
  }
}
```

## Server Configuration

### Loading Intents from Array

```typescript
import { createIXPServer, type IntentDefinition } from 'ixp-server';

const intents: IntentDefinition[] = [
  greetingIntent,
  weatherIntent,
  bookFlightIntent
];

const server = createIXPServer({
  intents,
  components: {
    // Component definitions
  },
  port: 3000
});
```

### Loading Intents from File

```typescript
// intents.json
{
  "intents": [
    {
      "name": "greeting",
      "description": "Display a personalized greeting",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name to greet"
          }
        }
      },
      "component": "GreetingCard",
      "version": "1.0.0"
    }
  ]
}
```

```typescript
const server = createIXPServer({
  intents: './config/intents.json',
  components: {
    // Component definitions
  },
  port: 3000
});
```

## Data Resolution

The IXP Server resolves data for intents using the `DataProvider` interface:

```typescript
import { type DataProvider, type IntentRequest } from 'ixp-server';

const dataProvider: DataProvider = {
  async resolveIntentData(request: IntentRequest, context?: any) {
    const { name, parameters } = request;
    
    switch (name) {
      case 'show_weather':
        const weatherData = await fetchWeatherData(parameters.location);
        return {
          temperature: weatherData.temp,
          condition: weatherData.condition,
          location: parameters.location,
          units: parameters.units || 'celsius'
        };
        
      case 'book_flight':
        const flights = await searchFlights({
          origin: parameters.origin,
          destination: parameters.destination,
          departureDate: parameters.dates.departure,
          returnDate: parameters.dates.return,
          passengers: parameters.passengers
        });
        return {
          flights,
          searchCriteria: parameters
        };
        
      default:
        return {};
    }
  }
};

const server = createIXPServer({
  intents,
  components,
  dataProvider,
  port: 3000
});
```

## Crawler Integration

Intents marked with `crawlable: true` are included in the `/ixp/crawler_content` endpoint:

```typescript
const searchIntent: IntentDefinition = {
  name: 'product_search',
  description: 'Search for products in our catalog',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      category: { type: 'string' },
      limit: { type: 'number', default: 20 }
    }
  },
  component: 'ProductList',
  version: '1.0.0',
  crawlable: true  // This intent will be discoverable by crawlers
};
```

Implement `getCrawlerContent` in your DataProvider to provide crawlable data:

```typescript
const dataProvider: DataProvider = {
  async getCrawlerContent(options) {
    const products = await getProducts({
      limit: options.limit || 50,
      cursor: options.cursor
    });
    
    return {
      contents: products.map(product => ({
        type: 'product',
        id: product.id,
        title: product.name,
        description: product.description,
        lastUpdated: product.updatedAt,
        url: `/view/ProductList?query=${encodeURIComponent(product.name)}`,
        price: product.price,
        category: product.category
      })),
      pagination: {
        nextCursor: products.nextCursor,
        hasMore: products.hasMore
      },
      lastUpdated: new Date().toISOString()
    };
  }
};
```

## Best Practices

### Intent Design

1. **Clear Naming**: Use descriptive, action-oriented names
   - Good: `search_products`, `show_weather`, `book_appointment`
   - Bad: `handler1`, `data`, `component`

2. **Comprehensive Descriptions**: Write clear, detailed descriptions
   ```typescript
   {
     name: 'search_products',
     description: 'Search for products by name, category, or tags with filtering and sorting options'
   }
   ```

3. **Proper Versioning**: Use semantic versioning for intents
   - `1.0.0` - Initial version
   - `1.1.0` - New optional parameters
   - `2.0.0` - Breaking changes to parameters

### Parameter Design

1. **Validation**: Always include appropriate validation
   ```typescript
   {
     type: 'string',
     minLength: 1,
     maxLength: 100,
     pattern: '^[a-zA-Z0-9\\s]+$'
   }
   ```

2. **Default Values**: Provide sensible defaults
   ```typescript
   {
     type: 'number',
     minimum: 1,
     maximum: 100,
     default: 10
   }
   ```

3. **Clear Descriptions**: Document each parameter
   ```typescript
   {
     type: 'string',
     description: 'Search query for finding products by name or description'
   }
   ```

### Performance

1. **Efficient Data Resolution**: Optimize data fetching in DataProvider
2. **Caching**: Implement caching for frequently accessed data
3. **Pagination**: Use pagination for large datasets
4. **Lazy Loading**: Load data only when needed

### Security

1. **Input Validation**: Always validate parameters using JSON Schema
2. **Sanitization**: Sanitize user inputs before processing
3. **Authorization**: Check permissions in DataProvider
4. **Rate Limiting**: Implement rate limiting for expensive operations

## Examples

### E-commerce Intent

```typescript
const productSearchIntent: IntentDefinition = {
  name: 'search_products',
  description: 'Search for products with advanced filtering options',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for product name or description',
        minLength: 1,
        maxLength: 200
      },
      category: {
        type: 'string',
        description: 'Filter by product category'
      },
      priceRange: {
        type: 'object',
        properties: {
          min: { type: 'number', minimum: 0 },
          max: { type: 'number', minimum: 0 }
        }
      },
      sortBy: {
        type: 'string',
        enum: ['relevance', 'price_asc', 'price_desc', 'rating', 'newest'],
        default: 'relevance'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20
      }
    },
    required: ['query']
  },
  component: 'ProductSearchResults',
  version: '1.2.0',
  crawlable: true
};
```

### Analytics Intent

```typescript
const analyticsIntent: IntentDefinition = {
  name: 'show_analytics',
  description: 'Display analytics dashboard with customizable metrics',
  parameters: {
    type: 'object',
    properties: {
      dateRange: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date' },
          end: { type: 'string', format: 'date' }
        },
        required: ['start', 'end']
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['revenue', 'users', 'sessions', 'conversions', 'bounce_rate']
        },
        minItems: 1,
        maxItems: 5
      },
      granularity: {
        type: 'string',
        enum: ['hour', 'day', 'week', 'month'],
        default: 'day'
      }
    },
    required: ['dateRange', 'metrics']
  },
  component: 'AnalyticsDashboard',
  version: '1.0.0',
  crawlable: false
};
```

This guide provides a comprehensive foundation for building robust, scalable intents with the IXP Server SDK. The JSON-based approach ensures consistency, validation, and easy integration with the IXP ecosystem.