# Intents API Reference

Intents are the core building blocks of the IXP Server SDK. They define what actions your server can perform and how users can interact with your application.

## Table of Contents

- [Overview](#overview)
- [Intent Definition](#intent-definition)
- [Intent Registry](#intent-registry)
- [Intent Resolution](#intent-resolution)
- [Parameters and Validation](#parameters-and-validation)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

An intent represents a user's goal or desired action. In the IXP Server SDK, intents are defined as JSON objects that specify:

- What the intent does (description)
- What parameters it accepts
- Which component renders the response
- Whether it's crawlable by search engines

## Intent Definition

### Basic Structure

```typescript
interface IntentDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
  component: string;
  version: string;
  crawlable?: boolean;
  metadata?: Record<string, any>;
}
```

### Properties

#### `name` (required)
- **Type:** `string`
- **Description:** Unique identifier for the intent
- **Example:** `"show_weather"`, `"book_flight"`

#### `description` (required)
- **Type:** `string`
- **Description:** Human-readable description of what the intent does
- **Example:** `"Display current weather information for a location"`

#### `parameters` (required)
- **Type:** `object`
- **Description:** JSON Schema defining the parameters this intent accepts
- **Example:**
```json
{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "City name or coordinates"
    },
    "units": {
      "type": "string",
      "enum": ["celsius", "fahrenheit"],
      "default": "celsius"
    }
  },
  "required": ["location"]
}
```

#### `component` (required)
- **Type:** `string`
- **Description:** Name of the component that renders this intent
- **Example:** `"WeatherWidget"`

#### `version` (required)
- **Type:** `string`
- **Description:** Version of the intent definition
- **Example:** `"1.1.1"`

#### `crawlable` (optional)
- **Type:** `boolean`
- **Description:** Whether this intent should be included in crawler content
- **Default:** `false`

#### `metadata` (optional)
- **Type:** `Record<string, any>`
- **Description:** Additional metadata for the intent

## Intent Registry

The Intent Registry manages all available intents in your server.

### Creating an Intent Registry

```typescript
import { IntentRegistry } from 'ixp-server';

const registry = new IntentRegistry();
```

### Loading Intents from File

```typescript
// Load from JSON file
await registry.loadFromFile('./config/intents.json');

// Load from object
const intents = {
  intents: [
    {
      name: 'greeting',
      description: 'Show a greeting message',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      component: 'GreetingCard',
      version: '1.1.1'
    }
  ]
};

registry.loadFromObject(intents);
```

### Registry Methods

#### `getIntent(name: string): IntentDefinition | null`
Retrieve a specific intent by name.

```typescript
const intent = registry.getIntent('greeting');
if (intent) {
  console.log(intent.description);
}
```

#### `getAllIntents(): IntentDefinition[]`
Get all registered intents.

```typescript
const allIntents = registry.getAllIntents();
console.log(`Total intents: ${allIntents.length}`);
```

#### `hasIntent(name: string): boolean`
Check if an intent exists.

```typescript
if (registry.hasIntent('greeting')) {
  // Intent exists
}
```

#### `validateIntent(intent: IntentDefinition): ValidationResult`
Validate an intent definition.

```typescript
const result = registry.validateIntent(intent);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Intent Resolution

The Intent Resolver matches user requests to appropriate intents.

### Creating a Resolver

```typescript
import { IntentResolver } from 'ixp-server';

const resolver = new IntentResolver(registry);
```

### Resolving Intents

```typescript
const request = {
  intent: 'greeting',
  parameters: { name: 'Alice' }
};

const result = await resolver.resolve(request);
if (result.success) {
  console.log('Resolved intent:', result.intent);
  console.log('Validated parameters:', result.parameters);
} else {
  console.error('Resolution failed:', result.error);
}
```

## Parameters and Validation

### Parameter Types

Supported JSON Schema types:

- `string` - Text values
- `number` - Numeric values
- `integer` - Integer values
- `boolean` - True/false values
- `array` - Lists of values
- `object` - Nested objects

### Validation Rules

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "preferences": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["news", "sports", "weather"]
      },
      "minItems": 1,
      "maxItems": 3
    }
  },
  "required": ["email"]
}
```

### Custom Validation

```typescript
class CustomIntentRegistry extends IntentRegistry {
  validateParameters(intent: IntentDefinition, parameters: any): ValidationResult {
    const result = super.validateParameters(intent, parameters);
    
    // Add custom validation logic
    if (intent.name === 'booking' && parameters.date) {
      const bookingDate = new Date(parameters.date);
      if (bookingDate < new Date()) {
        result.valid = false;
        result.errors.push('Booking date cannot be in the past');
      }
    }
    
    return result;
  }
}
```

## Examples

### Simple Intent

```json
{
  "name": "hello_world",
  "description": "Display a hello world message",
  "parameters": {
    "type": "object",
    "properties": {}
  },
  "component": "HelloWorld",
  "version": "1.1.1",
  "crawlable": true
}
```

### Complex Intent with Validation

```json
{
  "name": "search_products",
  "description": "Search for products in the catalog",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "Search query"
      },
      "category": {
        "type": "string",
        "enum": ["electronics", "clothing", "books", "home"],
        "description": "Product category"
      },
      "price_range": {
        "type": "object",
        "properties": {
          "min": { "type": "number", "minimum": 0 },
          "max": { "type": "number", "minimum": 0 }
        }
      },
      "sort_by": {
        "type": "string",
        "enum": ["relevance", "price_low", "price_high", "rating"],
        "default": "relevance"
      }
    },
    "required": ["query"]
  },
  "component": "ProductSearchResults",
  "version": "1.1.1",
  "metadata": {
    "category": "e-commerce",
    "tags": ["search", "products", "catalog"]
  }
}
```

### Intent with File Configuration

**config/intents.json:**
```json
{
  "intents": [
    {
      "name": "user_profile",
      "description": "Display user profile information",
      "parameters": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9_-]+$",
            "description": "Unique user identifier"
          },
          "include_private": {
            "type": "boolean",
            "default": false,
            "description": "Include private profile information"
          }
        },
        "required": ["user_id"]
      },
      "component": "UserProfileCard",
      "version": "1.1.1",
      "crawlable": false
    }
  ]
}
```

## Best Practices

### 1. Naming Conventions
- Use descriptive, action-oriented names
- Use snake_case for consistency
- Avoid abbreviations unless widely understood

```json
// Good
"show_weather_forecast"
"book_restaurant_table"
"send_email_notification"

// Avoid
"weather"
"book"
"email"
```

### 2. Parameter Design
- Always provide descriptions for parameters
- Use appropriate validation rules
- Set sensible defaults where possible
- Group related parameters in objects

### 3. Versioning
- Use semantic versioning (major.minor.patch)
- Update version when changing parameter schema
- Maintain backward compatibility when possible

### 4. Documentation
- Write clear, concise descriptions
- Include examples in parameter descriptions
- Document any side effects or requirements

### 5. Error Handling
- Validate all parameters thoroughly
- Provide meaningful error messages
- Handle edge cases gracefully

```typescript
// Example error handling
try {
  const result = await resolver.resolve(request);
  if (!result.success) {
    return {
      error: 'INVALID_PARAMETERS',
      message: result.error,
      details: result.validationErrors
    };
  }
} catch (error) {
  return {
    error: 'INTENT_RESOLUTION_FAILED',
    message: 'Failed to resolve intent',
    details: error.message
  };
}
```

### 6. Performance Considerations
- Keep parameter validation lightweight
- Cache frequently accessed intents
- Use appropriate data types for parameters
- Avoid deeply nested parameter structures

## Related Documentation

- [Components API](./components.md) - Learn about component definitions
- [Core API](./core.md) - Understand the core server functionality
- [Configuration Guide](../guides/configuration.md) - Configure your server
- [Examples](../examples/basic.md) - See practical examples
