# Testing Guide

This comprehensive guide covers testing strategies, best practices, and tools for IXP Server applications.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Testing Utilities](#testing-utilities)
- [Mocking and Stubbing](#mocking-and-stubbing)
- [Test Data Management](#test-data-management)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

## Testing Overview

Testing is crucial for ensuring the reliability, performance, and security of IXP Server applications. A comprehensive testing strategy includes multiple levels of testing, from unit tests to end-to-end tests.

### Testing Pyramid

```
    /\     E2E Tests (Few)
   /  \    
  /____\   Integration Tests (Some)
 /______\  Unit Tests (Many)
```

### Testing Types

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance under load
5. **Security Tests**: Test for security vulnerabilities
6. **Contract Tests**: Test API contracts between services

## Testing Strategy

### Test Planning

```typescript
// test-strategy.ts
export interface TestStrategy {
  unitTests: {
    coverage: number; // Target coverage percentage
    frameworks: string[];
    patterns: string[];
  };
  integrationTests: {
    scope: string[];
    environment: string;
    dataStrategy: 'fixtures' | 'factories' | 'seeds';
  };
  e2eTests: {
    criticalPaths: string[];
    browsers: string[];
    environments: string[];
  };
  performanceTests: {
    scenarios: string[];
    thresholds: PerformanceThresholds;
  };
}

interface PerformanceThresholds {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUsage: {
    cpu: number;
    memory: number;
  };
}

const testStrategy: TestStrategy = {
  unitTests: {
    coverage: 80,
    frameworks: ['jest', 'vitest'],
    patterns: ['**/*.test.ts', '**/*.spec.ts']
  },
  integrationTests: {
    scope: ['api', 'database', 'external-services'],
    environment: 'test',
    dataStrategy: 'factories'
  },
  e2eTests: {
    criticalPaths: ['user-registration', 'order-processing', 'payment-flow'],
    browsers: ['chrome', 'firefox', 'safari'],
    environments: ['staging', 'production']
  },
  performanceTests: {
    scenarios: ['normal-load', 'peak-load', 'stress-test'],
    thresholds: {
      responseTime: 200, // ms
      throughput: 1000, // requests/second
      errorRate: 0.01, // 1%
      resourceUsage: {
        cpu: 80, // %
        memory: 512 // MB
      }
    }
  }
};
```

### Test Environment Setup

```typescript
// test-setup.ts
import { createTestServer, TestServerOptions } from 'ixp-server/testing';
import { DatabaseTestHelper } from './helpers/DatabaseTestHelper';
import { CacheTestHelper } from './helpers/CacheTestHelper';

export class TestEnvironment {
  private server: any;
  private dbHelper: DatabaseTestHelper;
  private cacheHelper: CacheTestHelper;
  
  async setup(): Promise<void> {
    // Setup test database
    this.dbHelper = new DatabaseTestHelper();
    await this.dbHelper.setup();
    
    // Setup test cache
    this.cacheHelper = new CacheTestHelper();
    await this.cacheHelper.setup();
    
    // Create test server
    const options: TestServerOptions = {
      database: this.dbHelper.getConfig(),
      cache: this.cacheHelper.getConfig(),
      logging: { level: 'error' }, // Reduce noise in tests
      plugins: this.getTestPlugins()
    };
    
    this.server = createTestServer(options);
    await this.server.start();
  }
  
  async teardown(): Promise<void> {
    if (this.server) {
      await this.server.stop();
    }
    
    if (this.cacheHelper) {
      await this.cacheHelper.teardown();
    }
    
    if (this.dbHelper) {
      await this.dbHelper.teardown();
    }
  }
  
  getServer(): any {
    return this.server;
  }
  
  private getTestPlugins(): any[] {
    return [
      // Test-specific plugins
    ];
  }
}

// Global test setup
let testEnv: TestEnvironment;

beforeAll(async () => {
  testEnv = new TestEnvironment();
  await testEnv.setup();
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.teardown();
  }
});

export { testEnv };
```

## Unit Testing

### Testing Intents

```typescript
// intents/WeatherIntent.test.ts
import { WeatherIntent } from '../WeatherIntent';
import { createMockContext } from 'ixp-server/testing';
import { WeatherService } from '../services/WeatherService';

// Mock external dependencies
jest.mock('../services/WeatherService');

describe('WeatherIntent', () => {
  let intent: WeatherIntent;
  let mockWeatherService: jest.Mocked<WeatherService>;
  let mockContext: any;

  beforeEach(() => {
    mockWeatherService = new WeatherService() as jest.Mocked<WeatherService>;
    intent = new WeatherIntent(mockWeatherService);
    mockContext = createMockContext();
  });

  describe('canHandle', () => {
    it('should handle weather-related queries', () => {
      const queries = [
        'What is the weather like?',
        'Tell me the weather in New York',
        'Is it raining today?'
      ];

      queries.forEach(query => {
        expect(intent.canHandle(query, mockContext)).toBe(true);
      });
    });

    it('should not handle non-weather queries', () => {
      const queries = [
        'What time is it?',
        'How do I cook pasta?',
        'What is 2 + 2?'
      ];

      queries.forEach(query => {
        expect(intent.canHandle(query, mockContext)).toBe(false);
      });
    });
  });

  describe('handle', () => {
    it('should return weather information for valid location', async () => {
      const mockWeatherData = {
        location: 'New York',
        temperature: 22,
        condition: 'Sunny',
        humidity: 65
      };

      mockWeatherService.getWeather.mockResolvedValue(mockWeatherData);

      const result = await intent.handle('weather in New York', mockContext);

      expect(result).toEqual({
        type: 'weather',
        data: mockWeatherData,
        components: ['WeatherCard']
      });

      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('New York');
    });

    it('should handle weather service errors gracefully', async () => {
      mockWeatherService.getWeather.mockRejectedValue(
        new Error('Weather service unavailable')
      );

      const result = await intent.handle('weather in London', mockContext);

      expect(result).toEqual({
        type: 'error',
        message: 'Unable to fetch weather information',
        components: ['ErrorMessage']
      });
    });

    it('should extract location from query', async () => {
      const queries = [
        { query: 'weather in Paris', expectedLocation: 'Paris' },
        { query: 'What is the weather like in Tokyo?', expectedLocation: 'Tokyo' },
        { query: 'Is it sunny in Berlin today?', expectedLocation: 'Berlin' }
      ];

      mockWeatherService.getWeather.mockResolvedValue({
        location: 'Test',
        temperature: 20,
        condition: 'Clear'
      });

      for (const { query, expectedLocation } of queries) {
        await intent.handle(query, mockContext);
        expect(mockWeatherService.getWeather).toHaveBeenCalledWith(expectedLocation);
      }
    });
  });

  describe('extractLocation', () => {
    it('should extract location from various query formats', () => {
      const testCases = [
        { query: 'weather in New York', expected: 'New York' },
        { query: 'What is the weather like in San Francisco?', expected: 'San Francisco' },
        { query: 'Tell me about London weather', expected: 'London' },
        { query: 'Is it raining in Seattle today?', expected: 'Seattle' }
      ];

      testCases.forEach(({ query, expected }) => {
        const location = intent.extractLocation(query);
        expect(location).toBe(expected);
      });
    });

    it('should return null for queries without location', () => {
      const queries = [
        'What is the weather?',
        'Tell me the weather',
        'Is it sunny?'
      ];

      queries.forEach(query => {
        const location = intent.extractLocation(query);
        expect(location).toBeNull();
      });
    });
  });
});
```

### Testing Components

```typescript
// components/WeatherCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeatherCard } from '../WeatherCard';

describe('WeatherCard', () => {
  const mockWeatherData = {
    location: 'New York',
    temperature: 22,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 10,
    icon: 'sunny'
  };

  it('should render weather information correctly', () => {
    render(<WeatherCard data={mockWeatherData} />);

    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('22°C')).toBeInTheDocument();
    expect(screen.getByText('Sunny')).toBeInTheDocument();
    expect(screen.getByText('Humidity: 65%')).toBeInTheDocument();
    expect(screen.getByText('Wind: 10 km/h')).toBeInTheDocument();
  });

  it('should display weather icon', () => {
    render(<WeatherCard data={mockWeatherData} />);

    const icon = screen.getByRole('img', { name: /weather icon/i });
    expect(icon).toHaveAttribute('src', expect.stringContaining('sunny'));
  });

  it('should handle missing optional data', () => {
    const minimalData = {
      location: 'London',
      temperature: 15,
      condition: 'Cloudy'
    };

    render(<WeatherCard data={minimalData} />);

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('15°C')).toBeInTheDocument();
    expect(screen.getByText('Cloudy')).toBeInTheDocument();
    
    // Optional fields should not be displayed
    expect(screen.queryByText(/Humidity/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Wind/)).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    const { container } = render(<WeatherCard data={mockWeatherData} />);
    
    expect(container.firstChild).toHaveClass('weather-card');
    expect(container.querySelector('.weather-condition')).toHaveClass('sunny');
  });
});
```

### Testing Middleware

```typescript
// middleware/AuthMiddleware.test.ts
import { AuthMiddleware } from '../AuthMiddleware';
import { createMockContext } from 'ixp-server/testing';
import { TokenService } from '../services/TokenService';

jest.mock('../services/TokenService');

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockContext: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockTokenService = new TokenService() as jest.Mocked<TokenService>;
    middleware = new AuthMiddleware(mockTokenService);
    mockContext = createMockContext();
    nextFn = jest.fn();
  });

  describe('process', () => {
    it('should allow requests with valid token', async () => {
      const validToken = 'valid-jwt-token';
      const userData = { id: 'user123', email: 'test@example.com' };
      
      mockContext.request.headers.authorization = `Bearer ${validToken}`;
      mockTokenService.verifyToken.mockResolvedValue(userData);

      await middleware.process(mockContext, nextFn);

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(validToken);
      expect(mockContext.user).toEqual(userData);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should reject requests without token', async () => {
      await expect(middleware.process(mockContext, nextFn))
        .rejects.toThrow('Authentication required');

      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      const invalidToken = 'invalid-token';
      
      mockContext.request.headers.authorization = `Bearer ${invalidToken}`;
      mockTokenService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      await expect(middleware.process(mockContext, nextFn))
        .rejects.toThrow('Invalid authentication token');

      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', async () => {
      mockContext.request.headers.authorization = 'InvalidFormat';

      await expect(middleware.process(mockContext, nextFn))
        .rejects.toThrow('Invalid authorization header format');

      expect(nextFn).not.toHaveBeenCalled();
    });
  });
});
```

### Testing Plugins

```typescript
// plugins/EmailPlugin.test.ts
import { EmailPlugin } from '../EmailPlugin';
import { createMockPluginContext } from 'ixp-server/testing';

describe('EmailPlugin', () => {
  let plugin: EmailPlugin;
  let mockContext: any;
  let mockConfig: any;

  beforeEach(() => {
    plugin = new EmailPlugin();
    mockContext = createMockPluginContext();
    mockConfig = {
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'password'
        }
      },
      defaultFrom: 'noreply@test.com'
    };
  });

  describe('initialize', () => {
    it('should initialize with valid configuration', async () => {
      await expect(plugin.initialize(mockContext, mockConfig))
        .resolves.not.toThrow();
    });

    it('should validate configuration', async () => {
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.smtp.host;

      await expect(plugin.initialize(mockContext, invalidConfig))
        .rejects.toThrow('Invalid SMTP configuration');
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await plugin.initialize(mockContext, mockConfig);
    });

    it('should register email service', async () => {
      await plugin.start();

      expect(mockContext.serviceRegistry.register)
        .toHaveBeenCalledWith('email', expect.any(Object));
    });

    it('should register event handlers', async () => {
      await plugin.start();

      expect(mockContext.eventBus.on)
        .toHaveBeenCalledWith('email.send', expect.any(Function));
    });
  });

  describe('health', () => {
    beforeEach(async () => {
      await plugin.initialize(mockContext, mockConfig);
      await plugin.start();
    });

    it('should return healthy status when SMTP is working', async () => {
      // Mock successful SMTP verification
      jest.spyOn(plugin as any, 'verifySmtpConnection')
        .mockResolvedValue(true);

      const health = await plugin.health();

      expect(health.status).toBe('healthy');
      expect(health.message).toBe('SMTP connection is working');
    });

    it('should return unhealthy status when SMTP fails', async () => {
      // Mock failed SMTP verification
      jest.spyOn(plugin as any, 'verifySmtpConnection')
        .mockRejectedValue(new Error('Connection failed'));

      const health = await plugin.health();

      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('SMTP connection failed');
    });
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// tests/integration/api.test.ts
import { testEnv } from '../setup/TestEnvironment';
import { UserFactory } from '../factories/UserFactory';
import { OrderFactory } from '../factories/OrderFactory';

describe('API Integration Tests', () => {
  let server: any;
  let userFactory: UserFactory;
  let orderFactory: OrderFactory;

  beforeAll(() => {
    server = testEnv.getServer();
    userFactory = new UserFactory();
    orderFactory = new OrderFactory();
  });

  beforeEach(async () => {
    // Clean database before each test
    await server.database.clean();
  });

  describe('User Management', () => {
    it('should create and retrieve user', async () => {
      const userData = userFactory.build();
      
      // Create user
      const createResponse = await server.request({
        method: 'POST',
        url: '/api/users',
        body: userData
      });
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toMatchObject({
        email: userData.email,
        name: userData.name
      });
      
      const userId = createResponse.body.data.id;
      
      // Retrieve user
      const getResponse = await server.request({
        method: 'GET',
        url: `/api/users/${userId}`
      });
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toMatchObject({
        id: userId,
        email: userData.email,
        name: userData.name
      });
    });

    it('should handle user creation validation errors', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: '' // Empty name
      };
      
      const response = await server.request({
        method: 'POST',
        url: '/api/users',
        body: invalidUserData
      });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'name' })
        ])
      );
    });
  });

  describe('Order Processing', () => {
    it('should process complete order workflow', async () => {
      // Create user
      const user = await userFactory.create();
      
      // Create order
      const orderData = orderFactory.build({ userId: user.id });
      
      const createOrderResponse = await server.request({
        method: 'POST',
        url: '/api/orders',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: orderData
      });
      
      expect(createOrderResponse.status).toBe(201);
      
      const orderId = createOrderResponse.body.data.id;
      
      // Process payment
      const paymentResponse = await server.request({
        method: 'POST',
        url: `/api/orders/${orderId}/payment`,
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: {
          paymentMethod: 'credit_card',
          cardToken: 'test_card_token'
        }
      });
      
      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body.data.status).toBe('paid');
      
      // Verify order status
      const orderStatusResponse = await server.request({
        method: 'GET',
        url: `/api/orders/${orderId}`,
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      expect(orderStatusResponse.status).toBe(200);
      expect(orderStatusResponse.body.data.status).toBe('processing');
    });
  });

  describe('Intent Processing', () => {
    it('should process weather intent', async () => {
      const user = await userFactory.create();
      
      const response = await server.request({
        method: 'POST',
        url: '/api/intents/process',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: {
          query: 'What is the weather like in New York?'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        type: 'weather',
        data: expect.objectContaining({
          location: 'New York',
          temperature: expect.any(Number),
          condition: expect.any(String)
        }),
        components: ['WeatherCard']
      });
    });
  });
});
```

### Database Integration Tests

```typescript
// tests/integration/database.test.ts
import { testEnv } from '../setup/TestEnvironment';
import { UserRepository } from '../../src/repositories/UserRepository';
import { OrderRepository } from '../../src/repositories/OrderRepository';

describe('Database Integration Tests', () => {
  let userRepo: UserRepository;
  let orderRepo: OrderRepository;
  let database: any;

  beforeAll(() => {
    database = testEnv.getServer().database;
    userRepo = new UserRepository(database);
    orderRepo = new OrderRepository(database);
  });

  beforeEach(async () => {
    await database.clean();
  });

  describe('User Repository', () => {
    it('should create and find user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      };
      
      const createdUser = await userRepo.create(userData);
      
      expect(createdUser).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name,
        createdAt: expect.any(Date)
      });
      
      const foundUser = await userRepo.findById(createdUser.id);
      expect(foundUser).toEqual(createdUser);
    });

    it('should handle unique constraint violations', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      };
      
      await userRepo.create(userData);
      
      await expect(userRepo.create(userData))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('Order Repository', () => {
    it('should create order with items', async () => {
      const user = await userRepo.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      });
      
      const orderData = {
        userId: user.id,
        items: [
          { productId: 'prod1', quantity: 2, price: 10.99 },
          { productId: 'prod2', quantity: 1, price: 25.50 }
        ],
        total: 47.48
      };
      
      const createdOrder = await orderRepo.create(orderData);
      
      expect(createdOrder).toMatchObject({
        id: expect.any(String),
        userId: user.id,
        total: 47.48,
        status: 'pending'
      });
      
      const orderWithItems = await orderRepo.findByIdWithItems(createdOrder.id);
      expect(orderWithItems.items).toHaveLength(2);
    });
  });

  describe('Transactions', () => {
    it('should rollback transaction on error', async () => {
      const user = await userRepo.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      });
      
      await expect(database.transaction(async (trx: any) => {
        await orderRepo.create({
          userId: user.id,
          items: [{ productId: 'prod1', quantity: 1, price: 10.99 }],
          total: 10.99
        }, trx);
        
        // Simulate error
        throw new Error('Transaction error');
      })).rejects.toThrow('Transaction error');
      
      // Verify order was not created
      const orders = await orderRepo.findByUserId(user.id);
      expect(orders).toHaveLength(0);
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup

```typescript
// tests/e2e/setup.ts
import { chromium, Browser, Page } from 'playwright';
import { testEnv } from '../setup/TestEnvironment';

export class E2ETestSetup {
  private browser: Browser;
  private page: Page;
  private baseUrl: string;
  
  async setup(): Promise<void> {
    // Start test server
    await testEnv.setup();
    this.baseUrl = testEnv.getServer().getUrl();
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.CI !== 'true' ? 100 : 0
    });
    
    this.page = await this.browser.newPage();
    
    // Setup page defaults
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Setup request/response logging
    this.page.on('request', request => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', response => {
      console.log(`← ${response.status()} ${response.url()}`);
    });
  }
  
  async teardown(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    await testEnv.teardown();
  }
  
  getPage(): Page {
    return this.page;
  }
  
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
```

### E2E Test Examples

```typescript
// tests/e2e/user-journey.test.ts
import { E2ETestSetup } from './setup';
import { UserFactory } from '../factories/UserFactory';

describe('User Journey E2E Tests', () => {
  let testSetup: E2ETestSetup;
  let page: any;
  let baseUrl: string;
  let userFactory: UserFactory;

  beforeAll(async () => {
    testSetup = new E2ETestSetup();
    await testSetup.setup();
    page = testSetup.getPage();
    baseUrl = testSetup.getBaseUrl();
    userFactory = new UserFactory();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('User Registration and Login', () => {
    it('should complete user registration flow', async () => {
      const userData = userFactory.build();
      
      // Navigate to registration page
      await page.goto(`${baseUrl}/register`);
      
      // Fill registration form
      await page.fill('[data-testid="name-input"]', userData.name);
      await page.fill('[data-testid="email-input"]', userData.email);
      await page.fill('[data-testid="password-input"]', userData.password);
      await page.fill('[data-testid="confirm-password-input"]', userData.password);
      
      // Submit form
      await page.click('[data-testid="register-button"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify redirect to dashboard
      await page.waitForURL(`${baseUrl}/dashboard`);
      
      // Verify user is logged in
      const userMenu = await page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toContainText(userData.name);
    });

    it('should handle registration validation errors', async () => {
      await page.goto(`${baseUrl}/register`);
      
      // Submit empty form
      await page.click('[data-testid="register-button"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="name-error"]'))
        .toContainText('Name is required');
      await expect(page.locator('[data-testid="email-error"]'))
        .toContainText('Email is required');
      await expect(page.locator('[data-testid="password-error"]'))
        .toContainText('Password is required');
    });
  });

  describe('Chat Interface', () => {
    beforeEach(async () => {
      // Login user
      const user = await userFactory.create();
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL(`${baseUrl}/dashboard`);
    });

    it('should process weather query', async () => {
      // Navigate to chat
      await page.click('[data-testid="chat-tab"]');
      
      // Send weather query
      const query = 'What is the weather like in New York?';
      await page.fill('[data-testid="chat-input"]', query);
      await page.click('[data-testid="send-button"]');
      
      // Wait for response
      await page.waitForSelector('[data-testid="weather-card"]');
      
      // Verify weather card content
      const weatherCard = page.locator('[data-testid="weather-card"]');
      await expect(weatherCard).toContainText('New York');
      await expect(weatherCard).toContainText('°C');
      
      // Verify chat history
      const chatHistory = page.locator('[data-testid="chat-history"]');
      await expect(chatHistory).toContainText(query);
    });

    it('should handle multiple queries in conversation', async () => {
      await page.click('[data-testid="chat-tab"]');
      
      const queries = [
        'What is the weather in London?',
        'How about Paris?',
        'Is it raining in Tokyo?'
      ];
      
      for (const query of queries) {
        await page.fill('[data-testid="chat-input"]', query);
        await page.click('[data-testid="send-button"]');
        
        // Wait for response
        await page.waitForSelector(`[data-testid="message-${queries.indexOf(query) + 1}"]`);
      }
      
      // Verify all messages are in history
      const messages = await page.locator('[data-testid^="message-"]').count();
      expect(messages).toBe(queries.length * 2); // User messages + bot responses
    });
  });

  describe('Order Processing', () => {
    beforeEach(async () => {
      // Setup authenticated user
      const user = await userFactory.create();
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL(`${baseUrl}/dashboard`);
    });

    it('should complete order checkout flow', async () => {
      // Navigate to products
      await page.click('[data-testid="products-tab"]');
      
      // Add items to cart
      await page.click('[data-testid="add-to-cart-1"]');
      await page.click('[data-testid="add-to-cart-2"]');
      
      // Go to cart
      await page.click('[data-testid="cart-button"]');
      
      // Verify cart contents
      const cartItems = await page.locator('[data-testid="cart-item"]').count();
      expect(cartItems).toBe(2);
      
      // Proceed to checkout
      await page.click('[data-testid="checkout-button"]');
      
      // Fill shipping information
      await page.fill('[data-testid="shipping-address"]', '123 Test St');
      await page.fill('[data-testid="shipping-city"]', 'Test City');
      await page.fill('[data-testid="shipping-zip"]', '12345');
      
      // Fill payment information
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      // Submit order
      await page.click('[data-testid="place-order-button"]');
      
      // Wait for confirmation
      await page.waitForSelector('[data-testid="order-confirmation"]');
      
      // Verify order details
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      expect(orderNumber).toMatch(/^ORD-\d+$/);
    });
  });
});
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test user registration
  let registrationResponse = http.post(`${BASE_URL}/api/users`, {
    name: `User ${Math.random()}`,
    email: `user${Math.random()}@example.com`,
    password: 'password123'
  });
  
  check(registrationResponse, {
    'registration status is 201': (r) => r.status === 201,
    'registration response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  if (registrationResponse.status === 201) {
    const user = JSON.parse(registrationResponse.body).data;
    
    // Test login
    let loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
      email: user.email,
      password: 'password123'
    });
    
    check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 100ms': (r) => r.timings.duration < 100,
    });
    
    if (loginResponse.status === 200) {
      const token = JSON.parse(loginResponse.body).data.token;
      
      // Test intent processing
      let intentResponse = http.post(`${BASE_URL}/api/intents/process`, 
        {
          query: 'What is the weather like today?'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      check(intentResponse, {
        'intent status is 200': (r) => r.status === 200,
        'intent response time < 300ms': (r) => r.timings.duration < 300,
        'intent returns weather data': (r) => {
          const body = JSON.parse(r.body);
          return body.data && body.data.type === 'weather';
        },
      });
    }
  }
  
  sleep(1);
}
```

### Stress Testing

```typescript
// tests/performance/stress.test.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to normal load
    { duration: '2m', target: 100 },   // Stay at normal load
    { duration: '1m', target: 300 },   // Ramp up to high load
    { duration: '2m', target: 300 },   // Stay at high load
    { duration: '1m', target: 600 },   // Ramp up to stress load
    { duration: '2m', target: 600 },   // Stay at stress load
    { duration: '1m', target: 1000 },  // Ramp up to breaking point
    { duration: '2m', target: 1000 },  // Stay at breaking point
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Simulate heavy API usage
  const endpoints = [
    '/api/intents/process',
    '/api/users/profile',
    '/api/orders',
    '/api/analytics/events'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  let response = http.get(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': 'Bearer test-token'
    }
  });
  
  check(response, {
    'status is not 5xx': (r) => r.status < 500,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });
}
```

## Security Testing

### Security Test Suite

```typescript
// tests/security/security.test.ts
import { testEnv } from '../setup/TestEnvironment';
import { UserFactory } from '../factories/UserFactory';

describe('Security Tests', () => {
  let server: any;
  let userFactory: UserFactory;

  beforeAll(() => {
    server = testEnv.getServer();
    userFactory = new UserFactory();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      const response = await server.request({
        method: 'GET',
        url: '/api/users/profile'
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject requests with invalid tokens', async () => {
      const response = await server.request({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid authentication token');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'expired-jwt-token'; // Mock expired token
      
      const response = await server.request({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expired');
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await server.request({
        method: 'POST',
        url: '/api/users',
        body: {
          name: maliciousInput,
          email: 'test@example.com',
          password: 'password123'
        }
      });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await server.request({
        method: 'POST',
        url: '/api/users',
        body: {
          name: xssPayload,
          email: 'test@example.com',
          password: 'password123'
        }
      });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should sanitize user input', async () => {
      const user = await userFactory.create();
      
      const response = await server.request({
        method: 'POST',
        url: '/api/intents/process',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: {
          query: '<script>alert("test")</script>What is the weather?'
        }
      });
      
      expect(response.status).toBe(200);
      // Verify that script tags are removed or escaped
      expect(response.body.data.query).not.toContain('<script>');
    });
  });

  describe('Authorization Security', () => {
    it('should prevent unauthorized access to user data', async () => {
      const user1 = await userFactory.create();
      const user2 = await userFactory.create();
      
      const response = await server.request({
        method: 'GET',
        url: `/api/users/${user2.id}`,
        headers: {
          'Authorization': `Bearer ${user1.token}`
        }
      });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should prevent privilege escalation', async () => {
      const regularUser = await userFactory.create({ role: 'user' });
      
      const response = await server.request({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          'Authorization': `Bearer ${regularUser.token}`
        }
      });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient privileges');
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits', async () => {
      const user = await userFactory.create();
      
      // Make requests up to the limit
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          server.request({
            method: 'POST',
            url: '/api/intents/process',
            headers: {
              'Authorization': `Bearer ${user.token}`
            },
            body: { query: `Test query ${i}` }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Check that some requests were rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Security', () => {
    it('should not expose sensitive data in responses', async () => {
      const user = await userFactory.create();
      
      const response = await server.request({
        method: 'GET',
        url: '/api/users/profile',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should encrypt sensitive data at rest', async () => {
      // This would test database encryption
      // Implementation depends on your database setup
    });
  });
});
```

## Testing Utilities

### Test Factories

```typescript
// tests/factories/UserFactory.ts
export class UserFactory {
  private static counter = 0;
  
  build(overrides: Partial<User> = {}): User {
    UserFactory.counter++;
    
    return {
      name: `Test User ${UserFactory.counter}`,
      email: `user${UserFactory.counter}@example.com`,
      password: 'password123',
      role: 'user',
      ...overrides
    };
  }
  
  async create(overrides: Partial<User> = {}): Promise<User> {
    const userData = this.build(overrides);
    
    // Create user in database
    const response = await testEnv.getServer().request({
      method: 'POST',
      url: '/api/users',
      body: userData
    });
    
    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.body.error}`);
    }
    
    return {
      ...response.body.data,
      password: userData.password // Keep original password for testing
    };
  }
  
  buildMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
  
  async createMany(count: number, overrides: Partial<User> = {}): Promise<User[]> {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    
    return users;
  }
}
```

### Test Helpers

```typescript
// tests/helpers/TestHelpers.ts
export class TestHelpers {
  static async waitFor(
    condition: () => Promise<boolean> | boolean,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
  
  static async waitForElement(
    page: any,
    selector: string,
    timeout = 5000
  ): Promise<any> {
    return page.waitForSelector(selector, { timeout });
  }
  
  static async waitForText(
    page: any,
    text: string,
    timeout = 5000
  ): Promise<void> {
    await page.waitForFunction(
      (text) => document.body.textContent.includes(text),
      text,
      { timeout }
    );
  }
  
  static generateRandomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  static generateRandomEmail(): string {
    return `${this.generateRandomString(8)}@example.com`;
  }
  
  static async takeScreenshot(
    page: any,
    name: string,
    options: any = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshots/${name}-${timestamp}.png`;
    
    await page.screenshot({
      path: filename,
      fullPage: true,
      ...options
    });
    
    console.log(`Screenshot saved: ${filename}`);
  }
}
```

## Mocking and Stubbing

### Service Mocks

```typescript
// tests/mocks/WeatherServiceMock.ts
export class WeatherServiceMock {
  private responses = new Map<string, any>();
  private callCount = 0;
  
  mockResponse(location: string, response: any): void {
    this.responses.set(location.toLowerCase(), response);
  }
  
  async getWeather(location: string): Promise<any> {
    this.callCount++;
    
    const response = this.responses.get(location.toLowerCase());
    
    if (!response) {
      throw new Error(`No mock response configured for location: ${location}`);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return response;
  }
  
  getCallCount(): number {
    return this.callCount;
  }
  
  reset(): void {
    this.responses.clear();
    this.callCount = 0;
  }
}

// Usage in tests
const weatherMock = new WeatherServiceMock();

beforeEach(() => {
  weatherMock.reset();
  weatherMock.mockResponse('new york', {
    location: 'New York',
    temperature: 22,
    condition: 'Sunny'
  });
});
```

### HTTP Mocks

```typescript
// tests/mocks/HttpMock.ts
import nock from 'nock';

export class HttpMock {
  private scope: nock.Scope;
  
  constructor(baseUrl: string) {
    this.scope = nock(baseUrl);
  }
  
  mockGet(path: string, response: any, statusCode = 200): this {
    this.scope.get(path).reply(statusCode, response);
    return this;
  }
  
  mockPost(path: string, response: any, statusCode = 200): this {
    this.scope.post(path).reply(statusCode, response);
    return this;
  }
  
  mockError(path: string, error: Error): this {
    this.scope.get(path).replyWithError(error);
    return this;
  }
  
  mockDelay(path: string, response: any, delay: number): this {
    this.scope.get(path).delay(delay).reply(200, response);
    return this;
  }
  
  verify(): void {
    if (!this.scope.isDone()) {
      throw new Error('Not all HTTP mocks were called');
    }
  }
  
  cleanup(): void {
    nock.cleanAll();
  }
}

// Usage in tests
const httpMock = new HttpMock('https://api.weather.com');

beforeEach(() => {
  httpMock
    .mockGet('/weather/new-york', {
      temperature: 22,
      condition: 'Sunny'
    })
    .mockError('/weather/invalid', new Error('Location not found'));
});

afterEach(() => {
  httpMock.verify();
  httpMock.cleanup();
});
```

## Test Data Management

### Database Seeding

```typescript
// tests/seeds/DatabaseSeeder.ts
export class DatabaseSeeder {
  private database: any;
  
  constructor(database: any) {
    this.database = database;
  }
  
  async seed(): Promise<void> {
    await this.seedUsers();
    await this.seedProducts();
    await this.seedOrders();
  }
  
  async clean(): Promise<void> {
    // Clean in reverse order to respect foreign key constraints
    await this.database.query('DELETE FROM order_items');
    await this.database.query('DELETE FROM orders');
    await this.database.query('DELETE FROM products');
    await this.database.query('DELETE FROM users');
  }
  
  private async seedUsers(): Promise<void> {
    const users = [
      {
        id: 'user1',
        name: 'Test User 1',
        email: 'user1@example.com',
        password: 'hashedpassword1',
        role: 'user'
      },
      {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashedpassword2',
        role: 'admin'
      }
    ];
    
    for (const user of users) {
      await this.database.query(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password, user.role]
      );
    }
  }
  
  private async seedProducts(): Promise<void> {
    const products = [
      {
        id: 'prod1',
        name: 'Test Product 1',
        price: 10.99,
        description: 'A test product'
      },
      {
        id: 'prod2',
        name: 'Test Product 2',
        price: 25.50,
        description: 'Another test product'
      }
    ];
    
    for (const product of products) {
      await this.database.query(
        'INSERT INTO products (id, name, price, description) VALUES (?, ?, ?, ?)',
        [product.id, product.name, product.price, product.description]
      );
    }
  }
  
  private async seedOrders(): Promise<void> {
    // Seed test orders
  }
}
```

### Fixtures

```typescript
// tests/fixtures/index.ts
export const fixtures = {
  users: {
    regularUser: {
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user"
    },
    adminUser: {
      id: "admin1",
      name: "Admin User",
      email: "admin@example.com",
      password: "adminpass123",
      role: "admin"
    }
  },
  products: {
    basicProduct: {
      id: "prod1",
      name: "Basic Product",
      price: 10.99,
      description: "A basic test product"
    },
    premiumProduct: {
      id: "prod2",
      name: "Premium Product",
      price: 99.99,
      description: "A premium test product"
    }
  },
  orders: {
    basicOrder: {
      id: "order1",
      userId: "user1",
      status: "pending",
      total: 10.99,
      items: [
        {
          productId: "prod1",
          quantity: 1,
          price: 10.99
        }
      ]
    }
  },
  intents: {
    weatherQuery: {
      query: "What is the weather like in New York?",
      expectedType: "weather",
      expectedLocation: "New York"
    },
    orderQuery: {
      query: "Show me my recent orders",
      expectedType: "orders",
      requiresAuth: true
    }
  }
};

// Fixture loader utility
export class FixtureLoader {
  static load(fixturePath: string): any {
    const keys = fixturePath.split('.');
    let current = fixtures;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        throw new Error(`Fixture not found: ${fixturePath}`);
      }
      current = current[key];
    }
    
    return JSON.parse(JSON.stringify(current)); // Deep clone
  }
  
  static loadMany(fixturePaths: string[]): any[] {
    return fixturePaths.map(path => this.load(path));
  }
}

// Usage in tests
const user = FixtureLoader.load('users.regularUser');
const products = FixtureLoader.loadMany(['products.basicProduct', 'products.premiumProduct']);
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unit
        name: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: integration
        name: integration-tests

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      env:
        NODE_ENV: test
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      env:
        NODE_ENV: production
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: performance-report/
        retention-days: 30
```

### Test Scripts Configuration

```json
// package.json (scripts section)
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --config jest.unit.config.js",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "playwright test",
    "test:performance": "k6 run tests/performance/load.test.ts",
    "test:security": "jest --config jest.security.config.js",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Best Practices

### Test Organization

1. **Follow the AAA Pattern**:
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the code being tested
   - **Assert**: Verify the results

2. **Use Descriptive Test Names**:
   ```typescript
   // Good
   it('should return weather data when valid location is provided')
   
   // Bad
   it('should work')
   ```

3. **Group Related Tests**:
   ```typescript
   describe('WeatherIntent', () => {
     describe('canHandle', () => {
       // Tests for canHandle method
     });
     
     describe('handle', () => {
       // Tests for handle method
     });
   });
   ```

### Test Data Management

1. **Use Factories for Dynamic Data**:
   ```typescript
   const user = userFactory.build({ email: 'specific@example.com' });
   ```

2. **Use Fixtures for Static Data**:
   ```typescript
   const weatherResponse = FixtureLoader.load('weather.sunny');
   ```

3. **Clean Up After Tests**:
   ```typescript
   afterEach(async () => {
     await database.clean();
     await cache.flush();
   });
   ```

### Mocking Guidelines

1. **Mock External Dependencies**:
   ```typescript
   jest.mock('../services/WeatherService');
   ```

2. **Use Dependency Injection**:
   ```typescript
   const intent = new WeatherIntent(mockWeatherService);
   ```

3. **Verify Mock Interactions**:
   ```typescript
   expect(mockService.method).toHaveBeenCalledWith(expectedArgs);
   ```

### Performance Testing

1. **Set Realistic Thresholds**:
   ```typescript
   thresholds: {
     http_req_duration: ['p(95)<500'], // 95th percentile under 500ms
     http_req_failed: ['rate<0.01'],   // Less than 1% error rate
   }
   ```

2. **Test Different Load Patterns**:
   - Normal load
   - Peak load
   - Stress testing
   - Spike testing

3. **Monitor Resource Usage**:
   - CPU utilization
   - Memory consumption
   - Database connections
   - Cache hit rates

### Security Testing

1. **Test Authentication and Authorization**:
   - Invalid tokens
   - Expired tokens
   - Privilege escalation
   - Cross-user data access

2. **Validate Input Sanitization**:
   - SQL injection
   - XSS attacks
   - Command injection
   - Path traversal

3. **Test Rate Limiting**:
   - API rate limits
   - Login attempt limits
   - Resource consumption limits

### Continuous Integration

1. **Run Tests in Parallel**:
   - Separate unit, integration, and E2E tests
   - Use matrix builds for multiple Node.js versions
   - Parallelize test execution

2. **Fail Fast**:
   - Run unit tests first
   - Stop on first failure in CI
   - Provide quick feedback

3. **Collect Metrics**:
   - Code coverage
   - Test execution time
   - Performance benchmarks
   - Security scan results

### Test Maintenance

1. **Keep Tests Simple**:
   - One assertion per test when possible
   - Clear test setup and teardown
   - Minimal test dependencies

2. **Regular Test Review**:
   - Remove obsolete tests
   - Update test data
   - Refactor duplicate code

3. **Monitor Test Health**:
   - Track flaky tests
   - Monitor test execution time
   - Review test coverage trends

## Conclusion

A comprehensive testing strategy is essential for building reliable IXP Server applications. By implementing unit tests, integration tests, end-to-end tests, performance tests, and security tests, you can ensure your application works correctly under various conditions and loads.

Key takeaways:

- **Test at Multiple Levels**: Use the testing pyramid approach
- **Automate Everything**: Set up CI/CD pipelines for continuous testing
- **Mock External Dependencies**: Isolate your code for reliable testing
- **Test Real User Scenarios**: Use E2E tests for critical user journeys
- **Monitor Performance**: Set thresholds and test under load
- **Secure by Default**: Include security testing in your strategy
- **Maintain Test Quality**: Keep tests simple, fast, and reliable

For more information on specific testing tools and frameworks, refer to their respective documentation and the IXP Server SDK examples.