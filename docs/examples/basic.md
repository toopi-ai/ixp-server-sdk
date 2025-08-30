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
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// Create a simple greeting intent
const greetingIntent = createIntent({
  name: 'greeting',
  description: 'Generate a personalized greeting',
  parameters: {
    name: { 
      type: 'string', 
      required: false, 
      default: 'World',
      description: 'Name to greet'
    }
  },
  handler: async (params) => {
    return {
      component: 'GreetingCard',
      props: { name: params.name }
    };
  }
});

// Create a greeting card component
const greetingCard = createComponent({
  name: 'GreetingCard',
  description: 'A simple greeting card',
  props: {
    name: { type: 'string', required: true }
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

// Create and start the server
const server = new IXPServer({
  port: 3000,
  intents: [greetingIntent],
  components: [greetingCard]
});

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
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// Weather intent
const weatherIntent = createIntent({
  name: 'weather',
  description: 'Get weather information',
  parameters: {
    city: { type: 'string', required: true, description: 'City name' },
    units: { type: 'string', required: false, default: 'celsius' }
  },
  handler: async (params) => {
    // Simulate weather API call
    const weatherData = {
      city: params.city,
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      units: params.units
    };
    
    return {
      component: 'WeatherCard',
      props: weatherData
    };
  }
});

// Time intent
const timeIntent = createIntent({
  name: 'current_time',
  description: 'Get current time',
  parameters: {
    timezone: { type: 'string', required: false, default: 'UTC' },
    format: { type: 'string', required: false, default: '24h' }
  },
  handler: async (params) => {
    const now = new Date();
    const timeString = params.format === '12h' 
      ? now.toLocaleTimeString('en-US', { hour12: true })
      : now.toLocaleTimeString('en-US', { hour12: false });
    
    return {
      component: 'TimeDisplay',
      props: {
        time: timeString,
        timezone: params.timezone,
        format: params.format
      }
    };
  }
});

// Calculator intent
const calculatorIntent = createIntent({
  name: 'calculate',
  description: 'Perform basic calculations',
  parameters: {
    operation: { type: 'string', required: true },
    a: { type: 'number', required: true },
    b: { type: 'number', required: true }
  },
  handler: async (params) => {
    let result: number;
    
    switch (params.operation) {
      case 'add':
        result = params.a + params.b;
        break;
      case 'subtract':
        result = params.a - params.b;
        break;
      case 'multiply':
        result = params.a * params.b;
        break;
      case 'divide':
        result = params.b !== 0 ? params.a / params.b : NaN;
        break;
      default:
        throw new Error(`Unsupported operation: ${params.operation}`);
    }
    
    return {
      component: 'CalculatorResult',
      props: {
        operation: params.operation,
        a: params.a,
        b: params.b,
        result
      }
    };
  }
});

// Weather card component
const weatherCard = createComponent({
  name: 'WeatherCard',
  description: 'Weather information display',
  props: {
    city: { type: 'string', required: true },
    temperature: { type: 'number', required: true },
    condition: { type: 'string', required: true },
    units: { type: 'string', required: true }
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
const timeDisplay = createComponent({
  name: 'TimeDisplay',
  description: 'Current time display',
  props: {
    time: { type: 'string', required: true },
    timezone: { type: 'string', required: true },
    format: { type: 'string', required: true }
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
const calculatorResult = createComponent({
  name: 'CalculatorResult',
  description: 'Calculator result display',
  props: {
    operation: { type: 'string', required: true },
    a: { type: 'number', required: true },
    b: { type: 'number', required: true },
    result: { type: 'number', required: true }
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

// Create server with multiple intents
const server = new IXPServer({
  port: 3000,
  intents: [weatherIntent, timeIntent, calculatorIntent],
  components: [weatherCard, timeDisplay, calculatorResult]
});

server.start().then(() => {
  console.log('🚀 Multi-intent server running on http://localhost:3000');
  console.log('Available intents: weather, current_time, calculate');
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

Components that render different content based on props and conditions.

```typescript
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// User profile intent
const userProfileIntent = createIntent({
  name: 'user_profile',
  description: 'Display user profile information',
  parameters: {
    userId: { type: 'string', required: true },
    includeStats: { type: 'boolean', required: false, default: false },
    theme: { type: 'string', required: false, default: 'light' }
  },
  handler: async (params) => {
    // Simulate user data fetch
    const userData = {
      id: params.userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://via.placeholder.com/100',
      joinDate: '2023-01-15',
      stats: {
        posts: 42,
        followers: 128,
        following: 89
      },
      isVerified: Math.random() > 0.5,
      status: ['online', 'offline', 'away'][Math.floor(Math.random() * 3)]
    };
    
    return {
      component: 'UserProfile',
      props: {
        user: userData,
        includeStats: params.includeStats,
        theme: params.theme
      }
    };
  }
});

// Dynamic user profile component
const userProfile = createComponent({
  name: 'UserProfile',
  description: 'Dynamic user profile display',
  props: {
    user: { type: 'object', required: true },
    includeStats: { type: 'boolean', required: false, default: false },
    theme: { type: 'string', required: false, default: 'light' }
  },
  render: async (props) => {
    const { user, includeStats, theme } = props;
    const themeClass = `profile-${theme}`;
    
    // Status indicator
    const statusIndicator = {
      type: 'span',
      props: { 
        className: `status-indicator status-${user.status}`,
        title: `User is ${user.status}`
      },
      children: ['●']
    };
    
    // Verification badge (conditional)
    const verificationBadge = user.isVerified ? {
      type: 'span',
      props: { className: 'verification-badge', title: 'Verified user' },
      children: ['✓']
    } : null;
    
    // Stats section (conditional)
    const statsSection = includeStats ? {
      type: 'div',
      props: { className: 'user-stats' },
      children: [
        {
          type: 'div',
          props: { className: 'stat-item' },
          children: [
            { type: 'span', props: { className: 'stat-value' }, children: [user.stats.posts.toString()] },
            { type: 'span', props: { className: 'stat-label' }, children: ['Posts'] }
          ]
        },
        {
          type: 'div',
          props: { className: 'stat-item' },
          children: [
            { type: 'span', props: { className: 'stat-value' }, children: [user.stats.followers.toString()] },
            { type: 'span', props: { className: 'stat-label' }, children: ['Followers'] }
          ]
        },
        {
          type: 'div',
          props: { className: 'stat-item' },
          children: [
            { type: 'span', props: { className: 'stat-value' }, children: [user.stats.following.toString()] },
            { type: 'span', props: { className: 'stat-label' }, children: ['Following'] }
          ]
        }
      ]
    } : null;
    
    return {
      type: 'div',
      props: { className: `user-profile ${themeClass}` },
      children: [
        // Header section
        {
          type: 'div',
          props: { className: 'profile-header' },
          children: [
            {
              type: 'img',
              props: {
                src: user.avatar,
                alt: `${user.name}'s avatar`,
                className: 'user-avatar'
              }
            },
            {
              type: 'div',
              props: { className: 'user-info' },
              children: [
                {
                  type: 'h2',
                  props: { className: 'user-name' },
                  children: [
                    user.name,
                    verificationBadge,
                    statusIndicator
                  ].filter(Boolean)
                },
                {
                  type: 'p',
                  props: { className: 'user-email' },
                  children: [user.email]
                },
                {
                  type: 'p',
                  props: { className: 'join-date' },
                  children: [`Joined ${new Date(user.joinDate).toLocaleDateString()}`]
                }
              ]
            }
          ]
        },
        // Stats section (conditional)
        statsSection
      ].filter(Boolean)
    };
  }
});

// Create server
const server = new IXPServer({
  port: 3000,
  intents: [userProfileIntent],
  components: [userProfile]
});

server.start().then(() => {
  console.log('🚀 Dynamic components server running on http://localhost:3000');
});
```

### Testing Dynamic Components

```bash
# Basic profile
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "user_profile",
      "parameters": {
        "userId": "123"
      }
    }
  }'

# Profile with stats and dark theme
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "user_profile",
      "parameters": {
        "userId": "123",
        "includeStats": true,
        "theme": "dark"
      }
    }
  }'
```

## Parameter Validation

Implementing custom validation for intent parameters.

```typescript
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// Email validation intent with custom validation
const emailIntent = createIntent({
  name: 'send_email',
  description: 'Send an email with validation',
  parameters: {
    to: { 
      type: 'string', 
      required: true,
      description: 'Recipient email address',
      validation: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }
    },
    subject: { 
      type: 'string', 
      required: true,
      description: 'Email subject',
      validation: (value: string) => {
        return value.length >= 3 && value.length <= 100;
      }
    },
    body: { 
      type: 'string', 
      required: true,
      description: 'Email body',
      validation: (value: string) => {
        return value.length >= 10 && value.length <= 1000;
      }
    },
    priority: {
      type: 'string',
      required: false,
      default: 'normal',
      description: 'Email priority',
      validation: (value: string) => {
        return ['low', 'normal', 'high', 'urgent'].includes(value);
      }
    }
  },
  handler: async (params) => {
    // Simulate email sending
    const emailId = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    
    return {
      component: 'EmailConfirmation',
      props: {
        emailId,
        to: params.to,
        subject: params.subject,
        priority: params.priority,
        timestamp,
        status: 'sent'
      }
    };
  }
});

// Age validation intent
const ageVerificationIntent = createIntent({
  name: 'age_verification',
  description: 'Verify user age with validation',
  parameters: {
    birthDate: {
      type: 'string',
      required: true,
      description: 'Birth date in YYYY-MM-DD format',
      validation: (value: string) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) return false;
        
        const date = new Date(value);
        const now = new Date();
        return date <= now && date.getFullYear() >= 1900;
      }
    },
    country: {
      type: 'string',
      required: false,
      default: 'US',
      description: 'Country code for age verification',
      validation: (value: string) => {
        const countryCodes = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'];
        return countryCodes.includes(value.toUpperCase());
      }
    }
  },
  handler: async (params) => {
    const birthDate = new Date(params.birthDate);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;
    
    const legalAge = params.country === 'US' ? 21 : 18;
    const isLegal = actualAge >= legalAge;
    
    return {
      component: 'AgeVerificationResult',
      props: {
        age: actualAge,
        legalAge,
        isLegal,
        country: params.country,
        birthDate: params.birthDate
      }
    };
  }
});

// Email confirmation component
const emailConfirmation = createComponent({
  name: 'EmailConfirmation',
  description: 'Email sending confirmation',
  props: {
    emailId: { type: 'string', required: true },
    to: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    priority: { type: 'string', required: true },
    timestamp: { type: 'string', required: true },
    status: { type: 'string', required: true }
  },
  render: async (props) => {
    const priorityColors = {
      low: '#28a745',
      normal: '#007bff',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    
    return {
      type: 'div',
      props: { className: 'email-confirmation' },
      children: [
        {
          type: 'h2',
          props: { className: 'confirmation-title' },
          children: ['Email Sent Successfully']
        },
        {
          type: 'div',
          props: { className: 'email-details' },
          children: [
            {
              type: 'p',
              props: {},
              children: [`Email ID: ${props.emailId}`]
            },
            {
              type: 'p',
              props: {},
              children: [`To: ${props.to}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Subject: ${props.subject}`]
            },
            {
              type: 'p',
              props: {},
              children: [
                'Priority: ',
                {
                  type: 'span',
                  props: { 
                    style: `color: ${priorityColors[props.priority as keyof typeof priorityColors]}; font-weight: bold;`
                  },
                  children: [props.priority.toUpperCase()]
                }
              ]
            },
            {
              type: 'p',
              props: { className: 'timestamp' },
              children: [`Sent at: ${new Date(props.timestamp).toLocaleString()}`]
            }
          ]
        }
      ]
    };
  }
});

// Age verification result component
const ageVerificationResult = createComponent({
  name: 'AgeVerificationResult',
  description: 'Age verification result display',
  props: {
    age: { type: 'number', required: true },
    legalAge: { type: 'number', required: true },
    isLegal: { type: 'boolean', required: true },
    country: { type: 'string', required: true },
    birthDate: { type: 'string', required: true }
  },
  render: async (props) => {
    return {
      type: 'div',
      props: { className: `age-verification ${props.isLegal ? 'verified' : 'denied'}` },
      children: [
        {
          type: 'h2',
          props: { className: 'verification-title' },
          children: [props.isLegal ? 'Age Verified ✓' : 'Age Verification Failed ✗']
        },
        {
          type: 'div',
          props: { className: 'verification-details' },
          children: [
            {
              type: 'p',
              props: {},
              children: [`Your age: ${props.age} years`]
            },
            {
              type: 'p',
              props: {},
              children: [`Required age in ${props.country}: ${props.legalAge} years`]
            },
            {
              type: 'p',
              props: {},
              children: [`Birth date: ${props.birthDate}`]
            },
            {
              type: 'div',
              props: { 
                className: `status-message ${props.isLegal ? 'success' : 'error'}`,
                style: `color: ${props.isLegal ? '#28a745' : '#dc3545'}; font-weight: bold;`
              },
              children: [
                props.isLegal 
                  ? 'You meet the age requirements!' 
                  : 'You do not meet the minimum age requirements.'
              ]
            }
          ]
        }
      ]
    };
  }
});

// Create server with validation
const server = new IXPServer({
  port: 3000,
  intents: [emailIntent, ageVerificationIntent],
  components: [emailConfirmation, ageVerificationResult]
});

server.start().then(() => {
  console.log('🚀 Validation server running on http://localhost:3000');
  console.log('Try invalid parameters to see validation in action!');
});
```

### Testing Parameter Validation

```bash
# Valid email
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "send_email",
      "parameters": {
        "to": "user@example.com",
        "subject": "Test Email",
        "body": "This is a test email message.",
        "priority": "high"
      }
    }
  }'

# Invalid email (should fail validation)
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "send_email",
      "parameters": {
        "to": "invalid-email",
        "subject": "Hi",
        "body": "Short"
      }
    }
  }'

# Age verification
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "age_verification",
      "parameters": {
        "birthDate": "1990-05-15",
        "country": "US"
      }
    }
  }'
```

## Error Handling

Proper error handling and user-friendly error messages.

```typescript
import { IXPServer, createIntent, createComponent } from 'ixp-server';

// File processing intent with error handling
const fileProcessingIntent = createIntent({
  name: 'process_file',
  description: 'Process a file with error handling',
  parameters: {
    filename: { type: 'string', required: true },
    operation: { type: 'string', required: true },
    options: { type: 'object', required: false, default: {} }
  },
  handler: async (params) => {
    try {
      // Simulate file processing with potential errors
      const { filename, operation, options } = params;
      
      // Validate file extension
      const allowedExtensions = ['.txt', '.json', '.csv', '.xml'];
      const extension = filename.substring(filename.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(extension)) {
        throw new Error(`Unsupported file type: ${extension}. Allowed types: ${allowedExtensions.join(', ')}`);
      }
      
      // Validate operation
      const allowedOperations = ['parse', 'validate', 'transform', 'compress'];
      if (!allowedOperations.includes(operation)) {
        throw new Error(`Unsupported operation: ${operation}. Allowed operations: ${allowedOperations.join(', ')}`);
      }
      
      // Simulate processing time and potential failure
      const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Simulate random failures (20% chance)
      if (Math.random() < 0.2) {
        throw new Error(`Processing failed: Unable to ${operation} file ${filename}`);
      }
      
      // Success case
      const result = {
        filename,
        operation,
        status: 'completed',
        processingTime: Math.round(processingTime),
        size: Math.floor(Math.random() * 10000) + 1000, // Random file size
        checksum: Math.random().toString(36).substr(2, 16)
      };
      
      return {
        component: 'FileProcessingResult',
        props: { result, error: null }
      };
      
    } catch (error) {
      // Handle errors gracefully
      return {
        component: 'FileProcessingResult',
        props: {
          result: null,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            filename: params.filename,
            operation: params.operation,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }
});

// API call intent with network error handling
const apiCallIntent = createIntent({
  name: 'api_call',
  description: 'Make API call with error handling',
  parameters: {
    endpoint: { type: 'string', required: true },
    method: { type: 'string', required: false, default: 'GET' },
    timeout: { type: 'number', required: false, default: 5000 }
  },
  handler: async (params) => {
    try {
      // Simulate API call with various error scenarios
      const { endpoint, method, timeout } = params;
      
      // Validate URL format
      try {
        new URL(endpoint);
      } catch {
        throw new Error('Invalid URL format');
      }
      
      // Simulate network delay
      const delay = Math.random() * timeout;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate various HTTP errors
      const errorScenarios = [
        { chance: 0.1, status: 404, message: 'Endpoint not found' },
        { chance: 0.05, status: 500, message: 'Internal server error' },
        { chance: 0.03, status: 403, message: 'Access forbidden' },
        { chance: 0.02, status: 429, message: 'Rate limit exceeded' }
      ];
      
      for (const scenario of errorScenarios) {
        if (Math.random() < scenario.chance) {
          throw new Error(`HTTP ${scenario.status}: ${scenario.message}`);
        }
      }
      
      // Simulate timeout
      if (delay > timeout * 0.9) {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      // Success case
      const response = {
        endpoint,
        method,
        status: 200,
        responseTime: Math.round(delay),
        data: {
          message: 'API call successful',
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substr(2, 12)
        }
      };
      
      return {
        component: 'ApiCallResult',
        props: { response, error: null }
      };
      
    } catch (error) {
      return {
        component: 'ApiCallResult',
        props: {
          response: null,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            endpoint: params.endpoint,
            method: params.method,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }
});

// File processing result component
const fileProcessingResult = createComponent({
  name: 'FileProcessingResult',
  description: 'File processing result with error handling',
  props: {
    result: { type: 'object', required: false },
    error: { type: 'object', required: false }
  },
  render: async (props) => {
    if (props.error) {
      // Error state
      return {
        type: 'div',
        props: { className: 'file-processing-error' },
        children: [
          {
            type: 'h2',
            props: { className: 'error-title' },
            children: ['❌ File Processing Failed']
          },
          {
            type: 'div',
            props: { className: 'error-details' },
            children: [
              {
                type: 'p',
                props: { className: 'error-message' },
                children: [props.error.message]
              },
              {
                type: 'p',
                props: {},
                children: [`File: ${props.error.filename}`]
              },
              {
                type: 'p',
                props: {},
                children: [`Operation: ${props.error.operation}`]
              },
              {
                type: 'p',
                props: { className: 'error-timestamp' },
                children: [`Error occurred at: ${new Date(props.error.timestamp).toLocaleString()}`]
              }
            ]
          },
          {
            type: 'div',
            props: { className: 'error-suggestions' },
            children: [
              {
                type: 'h3',
                props: {},
                children: ['Suggestions:']
              },
              {
                type: 'ul',
                props: {},
                children: [
                  { type: 'li', props: {}, children: ['Check if the file exists and is accessible'] },
                  { type: 'li', props: {}, children: ['Verify the file format is supported'] },
                  { type: 'li', props: {}, children: ['Try a different operation'] },
                  { type: 'li', props: {}, children: ['Contact support if the problem persists'] }
                ]
              }
            ]
          }
        ]
      };
    }
    
    // Success state
    const result = props.result;
    return {
      type: 'div',
      props: { className: 'file-processing-success' },
      children: [
        {
          type: 'h2',
          props: { className: 'success-title' },
          children: ['✅ File Processing Completed']
        },
        {
          type: 'div',
          props: { className: 'result-details' },
          children: [
            {
              type: 'p',
              props: {},
              children: [`File: ${result.filename}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Operation: ${result.operation}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Processing time: ${result.processingTime}ms`]
            },
            {
              type: 'p',
              props: {},
              children: [`File size: ${result.size} bytes`]
            },
            {
              type: 'p',
              props: {},
              children: [`Checksum: ${result.checksum}`]
            }
          ]
        }
      ]
    };
  }
});

// API call result component
const apiCallResult = createComponent({
  name: 'ApiCallResult',
  description: 'API call result with error handling',
  props: {
    response: { type: 'object', required: false },
    error: { type: 'object', required: false }
  },
  render: async (props) => {
    if (props.error) {
      // Error state
      return {
        type: 'div',
        props: { className: 'api-call-error' },
        children: [
          {
            type: 'h2',
            props: { className: 'error-title' },
            children: ['🚫 API Call Failed']
          },
          {
            type: 'div',
            props: { className: 'error-details' },
            children: [
              {
                type: 'p',
                props: { className: 'error-message' },
                children: [props.error.message]
              },
              {
                type: 'p',
                props: {},
                children: [`Endpoint: ${props.error.endpoint}`]
              },
              {
                type: 'p',
                props: {},
                children: [`Method: ${props.error.method}`]
              },
              {
                type: 'p',
                props: { className: 'error-timestamp' },
                children: [`Failed at: ${new Date(props.error.timestamp).toLocaleString()}`]
              }
            ]
          }
        ]
      };
    }
    
    // Success state
    const response = props.response;
    return {
      type: 'div',
      props: { className: 'api-call-success' },
      children: [
        {
          type: 'h2',
          props: { className: 'success-title' },
          children: ['✅ API Call Successful']
        },
        {
          type: 'div',
          props: { className: 'response-details' },
          children: [
            {
              type: 'p',
              props: {},
              children: [`Endpoint: ${response.endpoint}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Method: ${response.method}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Status: ${response.status}`]
            },
            {
              type: 'p',
              props: {},
              children: [`Response time: ${response.responseTime}ms`]
            },
            {
              type: 'div',
              props: { className: 'response-data' },
              children: [
                {
                  type: 'h3',
                  props: {},
                  children: ['Response Data:']
                },
                {
                  type: 'pre',
                  props: { className: 'json-data' },
                  children: [JSON.stringify(response.data, null, 2)]
                }
              ]
            }
          ]
        }
      ]
    };
  }
});

// Create server with error handling
const server = new IXPServer({
  port: 3000,
  intents: [fileProcessingIntent, apiCallIntent],
  components: [fileProcessingResult, apiCallResult]
});

server.start().then(() => {
  console.log('🚀 Error handling server running on http://localhost:3000');
  console.log('Try different parameters to see error handling in action!');
});
```

### Testing Error Handling

```bash
# Valid file processing
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "process_file",
      "parameters": {
        "filename": "data.json",
        "operation": "parse"
      }
    }
  }'

# Invalid file type (should show error)
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "process_file",
      "parameters": {
        "filename": "image.png",
        "operation": "parse"
      }
    }
  }'

# Valid API call
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "api_call",
      "parameters": {
        "endpoint": "https://api.example.com/data",
        "method": "GET"
      }
    }
  }'

# Invalid URL (should show error)
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "name": "api_call",
      "parameters": {
        "endpoint": "not-a-valid-url",
        "method": "GET"
      }
    }
  }'
```

## Next Steps

These basic examples demonstrate the core concepts of the IXP Server SDK. To continue learning:

1. **[Advanced Examples](./advanced.md)** - Complex patterns and real-world scenarios
2. **[Framework Integration](./frameworks.md)** - React, Vue, and Express integration
3. **[Middleware Guide](../guides/middleware.md)** - Adding custom middleware
4. **[Plugin Development](../guides/plugins.md)** - Creating custom plugins
5. **[Testing Guide](../guides/testing.md)** - Testing strategies and best practices

---

**Next**: [Advanced Examples](./advanced.md) | [Framework Integration](./frameworks.md)