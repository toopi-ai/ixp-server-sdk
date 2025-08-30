# Building Intents Guide

This comprehensive guide covers how to build, manage, and optimize intents in the IXP Server SDK.

## Table of Contents

- [Intent Overview](#intent-overview)
- [Basic Intent Structure](#basic-intent-structure)
- [Intent Registration](#intent-registration)
- [Intent Matching](#intent-matching)
- [Context Management](#context-management)
- [Response Generation](#response-generation)
- [Intent Composition](#intent-composition)
- [Error Handling](#error-handling)
- [Testing Intents](#testing-intents)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

## Intent Overview

Intents in IXP Server represent user intentions or goals that the system can understand and respond to. They serve as the bridge between user input and system responses, encapsulating the logic needed to process requests and generate appropriate responses.

### Intent Lifecycle

1. **Registration**: Intent is registered with the server
2. **Matching**: User input is matched against intent patterns
3. **Execution**: Intent handler is executed with context
4. **Response**: Intent generates a response with components
5. **Cleanup**: Resources are cleaned up after execution

### Intent Types

- **Simple Intents**: Handle straightforward requests
- **Contextual Intents**: Maintain conversation context
- **Composite Intents**: Combine multiple sub-intents
- **Async Intents**: Handle long-running operations
- **Conditional Intents**: Execute based on conditions

## Basic Intent Structure

### Simple Intent

```typescript
import { Intent, IntentContext, IntentResponse } from 'ixp-server';

class GreetingIntent extends Intent {
  name = 'greeting';
  patterns = [
    'hello',
    'hi',
    'hey',
    'good morning',
    'good afternoon',
    'good evening'
  ];

  async execute(context: IntentContext): Promise<IntentResponse> {
    const { user, timestamp } = context;
    const hour = new Date(timestamp).getHours();
    
    let greeting = 'Hello';
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    return {
      text: `${greeting}, ${user.name || 'there'}! How can I help you today?`,
      components: [
        {
          type: 'greeting-card',
          props: {
            greeting,
            userName: user.name,
            timestamp
          }
        }
      ]
    };
  }
}

export default GreetingIntent;
```

### Parameterized Intent

```typescript
class WeatherIntent extends Intent {
  name = 'weather';
  patterns = [
    'what is the weather in {location}',
    'weather for {location}',
    'how is the weather in {location}',
    'tell me about weather in {location}',
    '{location} weather'
  ];

  parameters = {
    location: {
      type: 'string',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    }
  };

  async execute(context: IntentContext): Promise<IntentResponse> {
    const { parameters, services } = context;
    const { location } = parameters;

    try {
      const weatherData = await services.weather.getCurrentWeather(location);
      
      return {
        text: `The weather in ${location} is ${weatherData.condition} with a temperature of ${weatherData.temperature}°C.`,
        components: [
          {
            type: 'weather-card',
            props: {
              location: weatherData.location,
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              humidity: weatherData.humidity,
              windSpeed: weatherData.windSpeed,
              forecast: weatherData.forecast
            }
          }
        ]
      };
    } catch (error) {
      return {
        text: `Sorry, I couldn't get the weather information for ${location}. Please try again later.`,
        components: [
          {
            type: 'error-message',
            props: {
              message: 'Weather service unavailable',
              suggestion: 'Try again in a few minutes'
            }
          }
        ]
      };
    }
  }
}
```

### Complex Intent with Validation

```typescript
class BookFlightIntent extends Intent {
  name = 'book-flight';
  patterns = [
    'book a flight from {origin} to {destination} on {date}',
    'I want to fly from {origin} to {destination} on {date}',
    'find flights {origin} to {destination} {date}'
  ];

  parameters = {
    origin: {
      type: 'string',
      required: true,
      validation: {
        pattern: /^[A-Z]{3}$/, // IATA airport code
        message: 'Origin must be a valid 3-letter airport code'
      }
    },
    destination: {
      type: 'string',
      required: true,
      validation: {
        pattern: /^[A-Z]{3}$/,
        message: 'Destination must be a valid 3-letter airport code'
      }
    },
    date: {
      type: 'date',
      required: true,
      validation: {
        min: new Date(),
        max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        message: 'Date must be between today and one year from now'
      }
    },
    passengers: {
      type: 'number',
      required: false,
      default: 1,
      validation: {
        min: 1,
        max: 9,
        message: 'Number of passengers must be between 1 and 9'
      }
    }
  };

  async validate(context: IntentContext): Promise<boolean> {
    const { parameters, services } = context;
    const { origin, destination } = parameters;

    // Check if airports exist
    const [originExists, destinationExists] = await Promise.all([
      services.airports.exists(origin),
      services.airports.exists(destination)
    ]);

    if (!originExists) {
      throw new Error(`Airport ${origin} not found`);
    }

    if (!destinationExists) {
      throw new Error(`Airport ${destination} not found`);
    }

    if (origin === destination) {
      throw new Error('Origin and destination cannot be the same');
    }

    return true;
  }

  async execute(context: IntentContext): Promise<IntentResponse> {
    const { parameters, services, user } = context;
    const { origin, destination, date, passengers } = parameters;

    const searchResults = await services.flights.search({
      origin,
      destination,
      departureDate: date,
      passengers,
      userId: user.id
    });

    if (searchResults.flights.length === 0) {
      return {
        text: `Sorry, no flights found from ${origin} to ${destination} on ${date}.`,
        components: [
          {
            type: 'no-results',
            props: {
              searchCriteria: { origin, destination, date, passengers },
              suggestions: await services.flights.getSuggestions({ origin, destination })
            }
          }
        ]
      };
    }

    return {
      text: `Found ${searchResults.flights.length} flights from ${origin} to ${destination} on ${date}.`,
      components: [
        {
          type: 'flight-results',
          props: {
            flights: searchResults.flights,
            searchCriteria: { origin, destination, date, passengers },
            filters: searchResults.filters
          }
        }
      ]
    };
  }
}
```

## Intent Registration

### Basic Registration

```typescript
import { createIXPServer } from 'ixp-server';
import GreetingIntent from './intents/GreetingIntent';
import WeatherIntent from './intents/WeatherIntent';

const server = createIXPServer();

// Register individual intents
server.registerIntent(new GreetingIntent());
server.registerIntent(new WeatherIntent());

// Register with configuration
server.registerIntent(new BookFlightIntent(), {
  priority: 10,
  timeout: 30000, // 30 seconds
  retries: 3,
  cache: {
    enabled: true,
    ttl: 300 // 5 minutes
  }
});
```

### Bulk Registration

```typescript
import * as intents from './intents';

// Register all intents from a module
Object.values(intents).forEach(IntentClass => {
  server.registerIntent(new IntentClass());
});

// Or use a registration helper
const intentRegistry = [
  { intent: GreetingIntent, config: { priority: 1 } },
  { intent: WeatherIntent, config: { priority: 5 } },
  { intent: BookFlightIntent, config: { priority: 10, timeout: 30000 } }
];

intentRegistry.forEach(({ intent: IntentClass, config }) => {
  server.registerIntent(new IntentClass(), config);
});
```

### Conditional Registration

```typescript
// Register intents based on environment or configuration
if (process.env.NODE_ENV === 'development') {
  server.registerIntent(new DebugIntent());
}

if (config.features.weatherEnabled) {
  server.registerIntent(new WeatherIntent());
}

if (config.features.bookingEnabled) {
  server.registerIntent(new BookFlightIntent());
  server.registerIntent(new BookHotelIntent());
}
```

## Intent Matching

### Pattern Matching

```typescript
class SmartMatchingIntent extends Intent {
  name = 'smart-search';
  
  // Multiple pattern types
  patterns = [
    // Exact matches
    'search for products',
    
    // Parameter patterns
    'search for {query}',
    'find {query}',
    'look for {query}',
    
    // Optional parameters
    'search for {query} in {category?}',
    
    // Regular expressions
    /^search\s+(.+)$/i,
    
    // Complex patterns with multiple parameters
    'find {query} under ${maxPrice} in {category}'
  ];

  // Custom matching logic
  async match(input: string, context: IntentContext): Promise<number> {
    const baseScore = await super.match(input, context);
    
    // Boost score based on user history
    if (context.user.preferences?.searchHistory?.includes(input.toLowerCase())) {
      return Math.min(baseScore + 0.2, 1.0);
    }
    
    // Boost score for premium users
    if (context.user.tier === 'premium') {
      return Math.min(baseScore + 0.1, 1.0);
    }
    
    return baseScore;
  }
}
```

### Semantic Matching

```typescript
class SemanticIntent extends Intent {
  name = 'semantic-search';
  
  // Use semantic similarity instead of pattern matching
  async match(input: string, context: IntentContext): Promise<number> {
    const { services } = context;
    
    // Use NLP service for semantic matching
    const similarity = await services.nlp.getSimilarity(
      input,
      this.getTrainingExamples()
    );
    
    return similarity;
  }

  private getTrainingExamples(): string[] {
    return [
      'I want to buy something',
      'Show me products',
      'I need to purchase an item',
      'Help me find something to buy',
      'I\'m looking for merchandise'
    ];
  }
}
```

### Multi-stage Matching

```typescript
class MultiStageIntent extends Intent {
  name = 'multi-stage';
  
  async match(input: string, context: IntentContext): Promise<number> {
    // Stage 1: Basic pattern matching
    const patternScore = await this.matchPatterns(input);
    if (patternScore < 0.3) return 0;
    
    // Stage 2: Context validation
    const contextScore = await this.validateContext(context);
    if (contextScore < 0.5) return 0;
    
    // Stage 3: User intent analysis
    const intentScore = await this.analyzeIntent(input, context);
    
    // Combine scores
    return (patternScore * 0.4) + (contextScore * 0.3) + (intentScore * 0.3);
  }

  private async matchPatterns(input: string): Promise<number> {
    // Pattern matching logic
    return 0.8;
  }

  private async validateContext(context: IntentContext): Promise<number> {
    // Context validation logic
    return 0.9;
  }

  private async analyzeIntent(input: string, context: IntentContext): Promise<number> {
    // Intent analysis logic
    return 0.7;
  }
}
```

## Context Management

### Conversation Context

```typescript
class ContextualIntent extends Intent {
  name = 'contextual-response';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { conversation, user } = context;
    
    // Access previous messages
    const previousMessages = conversation.getHistory(5);
    const lastIntent = conversation.getLastIntent();
    
    // Store context for future use
    conversation.setContext('currentTopic', 'weather');
    conversation.setContext('userLocation', user.location);
    
    // Use context in response
    const currentTopic = conversation.getContext('currentTopic');
    
    return {
      text: `Continuing our conversation about ${currentTopic}...`,
      components: []
    };
  }
}
```

### Session Management

```typescript
class SessionAwareIntent extends Intent {
  name = 'session-aware';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { session } = context;
    
    // Track user actions in session
    const actionCount = session.get('actionCount', 0);
    session.set('actionCount', actionCount + 1);
    
    // Store temporary data
    session.set('lastSearchQuery', context.parameters.query);
    
    // Check session state
    if (session.has('onboardingCompleted')) {
      return this.handleExistingUser(context);
    } else {
      return this.handleNewUser(context);
    }
  }

  private async handleExistingUser(context: IntentContext): Promise<IntentResponse> {
    // Handle existing user
    return { text: 'Welcome back!', components: [] };
  }

  private async handleNewUser(context: IntentContext): Promise<IntentResponse> {
    // Handle new user
    context.session.set('onboardingCompleted', true);
    return { text: 'Welcome! Let me show you around.', components: [] };
  }
}
```

### State Persistence

```typescript
class PersistentStateIntent extends Intent {
  name = 'persistent-state';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { user, services } = context;
    
    // Load user state
    const userState = await services.storage.getUserState(user.id);
    
    // Update state
    userState.lastActivity = new Date();
    userState.intentCount = (userState.intentCount || 0) + 1;
    
    // Save state
    await services.storage.saveUserState(user.id, userState);
    
    return {
      text: `This is your ${userState.intentCount}th interaction with me.`,
      components: []
    };
  }
}
```

## Response Generation

### Dynamic Responses

```typescript
class DynamicResponseIntent extends Intent {
  name = 'dynamic-response';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { user, parameters } = context;
    
    // Generate personalized response
    const response = await this.generatePersonalizedResponse(user, parameters);
    
    // Add dynamic components based on context
    const components = await this.generateComponents(context);
    
    return {
      text: response.text,
      components,
      metadata: {
        personalized: true,
        generatedAt: new Date().toISOString(),
        userId: user.id
      }
    };
  }

  private async generatePersonalizedResponse(user: any, parameters: any): Promise<{ text: string }> {
    // Use user preferences to customize response
    const tone = user.preferences?.communicationStyle || 'friendly';
    const language = user.preferences?.language || 'en';
    
    // Generate response based on tone and language
    return {
      text: `Hello ${user.name}, here's your personalized response...`
    };
  }

  private async generateComponents(context: IntentContext): Promise<any[]> {
    const components = [];
    
    // Add components based on user tier
    if (context.user.tier === 'premium') {
      components.push({
        type: 'premium-features',
        props: { features: ['advanced-search', 'priority-support'] }
      });
    }
    
    // Add components based on time of day
    const hour = new Date().getHours();
    if (hour >= 18) {
      components.push({
        type: 'evening-suggestions',
        props: { suggestions: ['dinner-recommendations', 'entertainment'] }
      });
    }
    
    return components;
  }
}
```

### Conditional Responses

```typescript
class ConditionalResponseIntent extends Intent {
  name = 'conditional-response';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { user, parameters, services } = context;
    
    // Check multiple conditions
    const conditions = await this.evaluateConditions(context);
    
    if (conditions.isEmergency) {
      return this.handleEmergency(context);
    }
    
    if (conditions.isBusinessHours) {
      return this.handleBusinessHours(context);
    }
    
    if (conditions.isWeekend) {
      return this.handleWeekend(context);
    }
    
    return this.handleDefault(context);
  }

  private async evaluateConditions(context: IntentContext) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return {
      isEmergency: context.parameters.priority === 'urgent',
      isBusinessHours: hour >= 9 && hour <= 17 && day >= 1 && day <= 5,
      isWeekend: day === 0 || day === 6
    };
  }

  private async handleEmergency(context: IntentContext): Promise<IntentResponse> {
    return {
      text: 'This appears to be urgent. Connecting you to priority support...',
      components: [
        {
          type: 'emergency-contact',
          props: { contactMethod: 'phone', priority: 'high' }
        }
      ]
    };
  }

  private async handleBusinessHours(context: IntentContext): Promise<IntentResponse> {
    return {
      text: 'Our team is available now. How can we help?',
      components: [
        {
          type: 'live-chat',
          props: { available: true }
        }
      ]
    };
  }

  private async handleWeekend(context: IntentContext): Promise<IntentResponse> {
    return {
      text: 'We\'re currently closed, but you can leave a message.',
      components: [
        {
          type: 'contact-form',
          props: { urgency: 'normal' }
        }
      ]
    };
  }

  private async handleDefault(context: IntentContext): Promise<IntentResponse> {
    return {
      text: 'How can I assist you today?',
      components: []
    };
  }
}
```

## Intent Composition

### Composite Intents

```typescript
class CompositeIntent extends Intent {
  name = 'composite-travel-booking';
  
  private subIntents = {
    flight: new BookFlightIntent(),
    hotel: new BookHotelIntent(),
    car: new BookCarIntent()
  };

  async execute(context: IntentContext): Promise<IntentResponse> {
    const { parameters } = context;
    const results = [];
    
    // Execute sub-intents in parallel
    const promises = [];
    
    if (parameters.needsFlight) {
      promises.push(this.executeSubIntent('flight', context));
    }
    
    if (parameters.needsHotel) {
      promises.push(this.executeSubIntent('hotel', context));
    }
    
    if (parameters.needsCar) {
      promises.push(this.executeSubIntent('car', context));
    }
    
    const subResults = await Promise.allSettled(promises);
    
    // Combine results
    const components = [];
    let text = 'Here are your travel booking options:\n';
    
    subResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        components.push(...result.value.components);
        text += `\n${result.value.text}`;
      } else {
        text += `\nSorry, there was an issue with one of your bookings.`;
      }
    });
    
    return {
      text,
      components,
      metadata: {
        composite: true,
        subIntents: Object.keys(this.subIntents)
      }
    };
  }

  private async executeSubIntent(intentName: string, context: IntentContext): Promise<IntentResponse> {
    const subIntent = this.subIntents[intentName];
    return await subIntent.execute({
      ...context,
      parameters: this.extractSubParameters(intentName, context.parameters)
    });
  }

  private extractSubParameters(intentName: string, parameters: any): any {
    // Extract relevant parameters for each sub-intent
    switch (intentName) {
      case 'flight':
        return {
          origin: parameters.origin,
          destination: parameters.destination,
          date: parameters.departureDate
        };
      case 'hotel':
        return {
          location: parameters.destination,
          checkIn: parameters.checkInDate,
          checkOut: parameters.checkOutDate
        };
      case 'car':
        return {
          location: parameters.destination,
          pickupDate: parameters.checkInDate,
          returnDate: parameters.checkOutDate
        };
      default:
        return {};
    }
  }
}
```

### Intent Chaining

```typescript
class ChainedIntent extends Intent {
  name = 'chained-workflow';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    const { conversation } = context;
    
    // Check if this is part of a chain
    const chainState = conversation.getContext('chainState');
    
    if (!chainState) {
      return this.startChain(context);
    }
    
    switch (chainState.step) {
      case 'collect-info':
        return this.collectInformation(context);
      case 'confirm-details':
        return this.confirmDetails(context);
      case 'process-request':
        return this.processRequest(context);
      default:
        return this.completeChain(context);
    }
  }

  private async startChain(context: IntentContext): Promise<IntentResponse> {
    context.conversation.setContext('chainState', {
      step: 'collect-info',
      data: {}
    });
    
    return {
      text: 'Let\'s start by collecting some information. What\'s your name?',
      components: [
        {
          type: 'input-form',
          props: {
            fields: [{ name: 'userName', type: 'text', required: true }]
          }
        }
      ]
    };
  }

  private async collectInformation(context: IntentContext): Promise<IntentResponse> {
    const chainState = context.conversation.getContext('chainState');
    chainState.data.userName = context.parameters.userName;
    chainState.step = 'confirm-details';
    
    context.conversation.setContext('chainState', chainState);
    
    return {
      text: `Thank you, ${chainState.data.userName}. Please confirm your details.`,
      components: [
        {
          type: 'confirmation',
          props: {
            data: chainState.data,
            actions: ['confirm', 'edit']
          }
        }
      ]
    };
  }

  private async confirmDetails(context: IntentContext): Promise<IntentResponse> {
    if (context.parameters.action === 'confirm') {
      const chainState = context.conversation.getContext('chainState');
      chainState.step = 'process-request';
      context.conversation.setContext('chainState', chainState);
      
      return this.processRequest(context);
    } else {
      return this.startChain(context); // Go back to start
    }
  }

  private async processRequest(context: IntentContext): Promise<IntentResponse> {
    const chainState = context.conversation.getContext('chainState');
    
    // Process the request with collected data
    const result = await this.performProcessing(chainState.data);
    
    // Clear chain state
    context.conversation.removeContext('chainState');
    
    return {
      text: 'Your request has been processed successfully!',
      components: [
        {
          type: 'success-message',
          props: {
            result,
            nextSteps: ['view-status', 'start-new']
          }
        }
      ]
    };
  }

  private async completeChain(context: IntentContext): Promise<IntentResponse> {
    context.conversation.removeContext('chainState');
    return {
      text: 'Workflow completed.',
      components: []
    };
  }

  private async performProcessing(data: any): Promise<any> {
    // Simulate processing
    return { id: 'REQ-123', status: 'completed' };
  }
}
```

## Error Handling

### Graceful Error Handling

```typescript
class RobustIntent extends Intent {
  name = 'robust-intent';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    try {
      return await this.performMainLogic(context);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  private async performMainLogic(context: IntentContext): Promise<IntentResponse> {
    // Main intent logic that might throw errors
    const result = await context.services.externalAPI.getData();
    
    return {
      text: 'Success!',
      components: [{ type: 'result', props: { data: result } }]
    };
  }

  private handleError(error: Error, context: IntentContext): IntentResponse {
    // Log error for debugging
    context.logger.error('Intent execution failed', {
      error: error.message,
      stack: error.stack,
      userId: context.user.id,
      intentName: this.name
    });

    // Return user-friendly error response
    if (error.name === 'NetworkError') {
      return {
        text: 'Sorry, I\'m having trouble connecting to our services. Please try again in a moment.',
        components: [
          {
            type: 'retry-button',
            props: {
              action: 'retry',
              delay: 5000
            }
          }
        ]
      };
    }

    if (error.name === 'ValidationError') {
      return {
        text: 'There seems to be an issue with the information provided. Please check and try again.',
        components: [
          {
            type: 'error-details',
            props: {
              errors: error.details || [],
              suggestion: 'Please correct the highlighted fields'
            }
          }
        ]
      };
    }

    // Generic error response
    return {
      text: 'I apologize, but something went wrong. Our team has been notified.',
      components: [
        {
          type: 'error-message',
          props: {
            message: 'Unexpected error occurred',
            supportContact: 'support@example.com'
          }
        }
      ]
    };
  }
}
```

### Retry Logic

```typescript
class RetryableIntent extends Intent {
  name = 'retryable-intent';
  
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  async execute(context: IntentContext): Promise<IntentResponse> {
    return this.executeWithRetry(context, 0);
  }

  private async executeWithRetry(context: IntentContext, attempt: number): Promise<IntentResponse> {
    try {
      return await this.performOperation(context);
    } catch (error) {
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        context.logger.warn(`Intent execution failed, retrying (${attempt + 1}/${this.maxRetries})`, {
          error: error.message,
          attempt: attempt + 1
        });
        
        // Wait before retrying
        await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        
        return this.executeWithRetry(context, attempt + 1);
      }
      
      throw error; // Re-throw if not retryable or max retries reached
    }
  }

  private isRetryableError(error: Error): boolean {
    // Define which errors are retryable
    const retryableErrors = ['NetworkError', 'TimeoutError', 'ServiceUnavailableError'];
    return retryableErrors.includes(error.name);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async performOperation(context: IntentContext): Promise<IntentResponse> {
    // Operation that might fail
    const result = await context.services.unreliableService.getData();
    
    return {
      text: 'Operation completed successfully',
      components: [{ type: 'result', props: { data: result } }]
    };
  }
}
```

## Testing Intents

### Unit Testing

```typescript
import { createMockContext, createTestServer } from 'ixp-server/testing';
import WeatherIntent from '../WeatherIntent';

describe('WeatherIntent', () => {
  let intent: WeatherIntent;
  let mockContext: any;

  beforeEach(() => {
    intent = new WeatherIntent();
    mockContext = createMockContext({
      parameters: { location: 'New York' },
      services: {
        weather: {
          getCurrentWeather: jest.fn()
        }
      }
    });
  });

  describe('pattern matching', () => {
    it('should match weather queries', async () => {
      const testCases = [
        'what is the weather in London',
        'weather for Paris',
        'how is the weather in Tokyo'
      ];

      for (const input of testCases) {
        const score = await intent.match(input, mockContext);
        expect(score).toBeGreaterThan(0.8);
      }
    });

    it('should not match non-weather queries', async () => {
      const testCases = [
        'hello there',
        'book a flight',
        'what time is it'
      ];

      for (const input of testCases) {
        const score = await intent.match(input, mockContext);
        expect(score).toBeLessThan(0.3);
      }
    });
  });

  describe('execution', () => {
    it('should return weather information', async () => {
      const mockWeatherData = {
        location: 'New York',
        temperature: 25,
        condition: 'Sunny',
        humidity: 60
      };

      mockContext.services.weather.getCurrentWeather.mockResolvedValue(mockWeatherData);

      const response = await intent.execute(mockContext);

      expect(response.text).toContain('New York');
      expect(response.text).toContain('25°C');
      expect(response.components).toHaveLength(1);
      expect(response.components[0].type).toBe('weather-card');
    });

    it('should handle service errors gracefully', async () => {
      mockContext.services.weather.getCurrentWeather.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await intent.execute(mockContext);

      expect(response.text).toContain('Sorry');
      expect(response.components[0].type).toBe('error-message');
    });
  });

  describe('parameter validation', () => {
    it('should validate required parameters', async () => {
      const invalidContext = createMockContext({
        parameters: {} // Missing location
      });

      await expect(intent.execute(invalidContext)).rejects.toThrow('Location is required');
    });
  });
});
```

### Integration Testing

```typescript
import { createTestServer } from 'ixp-server/testing';

describe('Intent Integration', () => {
  let server: any;

  beforeEach(async () => {
    server = createTestServer({
      intents: [WeatherIntent, GreetingIntent],
      services: {
        weather: new MockWeatherService()
      }
    });
    
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should process weather intent end-to-end', async () => {
    const response = await server.processInput('what is the weather in London', {
      userId: 'test-user'
    });

    expect(response.intent).toBe('weather');
    expect(response.text).toContain('London');
    expect(response.components).toHaveLength(1);
  });

  it('should handle intent conflicts', async () => {
    // Test when multiple intents might match
    const response = await server.processInput('hello weather', {
      userId: 'test-user'
    });

    // Should choose the intent with higher confidence
    expect(response.intent).toBe('greeting'); // Assuming greeting has higher confidence
  });
});
```

## Performance Optimization

### Caching

```typescript
class CachedIntent extends Intent {
  name = 'cached-intent';
  
  private cache = new Map<string, any>();
  private cacheTTL = 300000; // 5 minutes

  async execute(context: IntentContext): Promise<IntentResponse> {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      context.logger.debug('Returning cached response', { cacheKey });
      return cached;
    }

    const response = await this.performExpensiveOperation(context);
    
    this.setCache(cacheKey, response);
    
    return response;
  }

  private generateCacheKey(context: IntentContext): string {
    const { parameters, user } = context;
    return `${this.name}:${user.id}:${JSON.stringify(parameters)}`;
  }

  private getFromCache(key: string): IntentResponse | null {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.response;
    }
    
    // Remove expired cache entry
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, response: IntentResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  private async performExpensiveOperation(context: IntentContext): Promise<IntentResponse> {
    // Expensive operation here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      text: 'Expensive operation completed',
      components: []
    };
  }
}
```

### Lazy Loading

```typescript
class LazyLoadedIntent extends Intent {
  name = 'lazy-loaded';
  
  private heavyDependency: any = null;

  async execute(context: IntentContext): Promise<IntentResponse> {
    // Load heavy dependency only when needed
    if (!this.heavyDependency) {
      this.heavyDependency = await this.loadHeavyDependency();
    }

    return this.heavyDependency.process(context);
  }

  private async loadHeavyDependency(): Promise<any> {
    // Dynamically import heavy module
    const { HeavyProcessor } = await import('./heavy-processor');
    return new HeavyProcessor();
  }
}
```

### Parallel Processing

```typescript
class ParallelProcessingIntent extends Intent {
  name = 'parallel-processing';

  async execute(context: IntentContext): Promise<IntentResponse> {
    const { parameters, services } = context;

    // Execute multiple operations in parallel
    const [userData, preferences, history] = await Promise.all([
      services.users.getUser(context.user.id),
      services.preferences.getPreferences(context.user.id),
      services.history.getHistory(context.user.id, { limit: 10 })
    ]);

    // Process results
    const response = this.combineResults(userData, preferences, history);

    return response;
  }

  private combineResults(userData: any, preferences: any, history: any): IntentResponse {
    return {
      text: 'Combined data processed successfully',
      components: [
        {
          type: 'user-dashboard',
          props: {
            user: userData,
            preferences,
            recentActivity: history
          }
        }
      ]
    };
  }
}
```

## Best Practices

### Intent Design

1. **Single Responsibility**: Each intent should handle one specific user goal
2. **Clear Naming**: Use descriptive names that reflect the intent's purpose
3. **Comprehensive Patterns**: Cover various ways users might express the same intent
4. **Parameter Validation**: Always validate and sanitize input parameters
5. **Error Handling**: Implement robust error handling and recovery

### Performance

1. **Caching**: Cache expensive operations and API calls
2. **Lazy Loading**: Load heavy dependencies only when needed
3. **Parallel Processing**: Execute independent operations in parallel
4. **Resource Cleanup**: Properly clean up resources after execution
5. **Monitoring**: Monitor intent performance and optimize bottlenecks

### User Experience

1. **Consistent Responses**: Maintain consistent tone and format
2. **Helpful Errors**: Provide actionable error messages
3. **Context Awareness**: Use conversation context to improve responses
4. **Personalization**: Customize responses based on user preferences
5. **Accessibility**: Ensure responses are accessible to all users

### Security

1. **Input Sanitization**: Sanitize all user inputs
2. **Authorization**: Check user permissions before executing sensitive operations
3. **Data Privacy**: Respect user privacy and data protection regulations
4. **Audit Logging**: Log important actions for security auditing
5. **Rate Limiting**: Implement rate limiting to prevent abuse

### Testing

1. **Unit Tests**: Test individual intent methods in isolation
2. **Integration Tests**: Test intent interactions with services
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test intent performance under load
5. **Security Tests**: Test for security vulnerabilities

This guide provides a comprehensive foundation for building robust, scalable, and user-friendly intents with the IXP Server SDK. For more advanced patterns and examples, refer to the [Examples](../examples/) section of the documentation.