# Testing Guide

This guide provides comprehensive testing strategies and examples for IXP Server applications.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Testing Best Practices](#testing-best-practices)
- [Continuous Integration](#continuous-integration)

## Testing Overview

### Testing Strategy

IXP Server applications require a multi-layered testing approach:

1. **Unit Tests**: Test individual intents, components, and middleware
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test scalability and response times
5. **Security Tests**: Test authentication, authorization, and data protection

### Test Environment Setup

```typescript
// test/setup.ts
import { createIXPServer } from 'ixp-server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Redis from 'ioredis-mock';

// Global test configuration
global.testConfig = {
  database: {
    type: 'memory'
  },
  cache: {
    type: 'memory'
  },
  logging: {
    level: 'error' // Reduce noise in tests
  }
};

// Setup test database
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.TEST_DB_URL = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});

// Test utilities
export function createTestServer(config = {}) {
  return createIXPServer({
    ...global.testConfig,
    ...config,
    port: 0 // Use random port for tests
  });
}

export function mockUser(overrides = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    ...overrides
  };
}

export function mockContext(overrides = {}) {
  return {
    user: mockUser(),
    request: {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    },
    ...overrides
  };
}
```

## Unit Testing

### Testing Intents

```typescript
// test/intents/product-search.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { productSearchIntent } from '../../src/intents/product-search';
import { mockContext } from '../setup';

// Mock external services
jest.mock('../../src/services/product-service');
jest.mock('../../src/services/analytics-service');

import { ProductService } from '../../src/services/product-service';
import { AnalyticsService } from '../../src/services/analytics-service';

const mockProductService = ProductService as jest.MockedClass<typeof ProductService>;
const mockAnalyticsService = AnalyticsService as jest.MockedClass<typeof AnalyticsService>;

describe('Product Search Intent', () => {
  let productService: jest.Mocked<ProductService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  
  beforeEach(() => {
    productService = new mockProductService() as jest.Mocked<ProductService>;
    analyticsService = new mockAnalyticsService() as jest.Mocked<AnalyticsService>;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('Parameter Validation', () => {
    it('should require query parameter', async () => {
      const params = {};
      const context = mockContext();
      
      await expect(
        productSearchIntent.handler(params, context)
      ).rejects.toThrow('Query parameter is required');
    });
    
    it('should validate price range', async () => {
      const params = {
        query: 'laptop',
        priceRange: {
          min: 1000,
          max: 500 // Invalid: max < min
        }
      };
      const context = mockContext();
      
      await expect(
        productSearchIntent.handler(params, context)
      ).rejects.toThrow('Invalid price range');
    });
    
    it('should validate category enum', async () => {
      const params = {
        query: 'laptop',
        category: 'invalid-category'
      };
      const context = mockContext();
      
      await expect(
        productSearchIntent.handler(params, context)
      ).rejects.toThrow('Invalid category');
    });
  });
  
  describe('Search Functionality', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'MacBook Pro',
          price: 1299,
          category: 'electronics',
          inStock: true
        },
        {
          id: '2',
          name: 'Dell XPS',
          price: 999,
          category: 'electronics',
          inStock: true
        }
      ];
      
      productService.search.mockResolvedValue(mockProducts);
      
      const params = {
        query: 'laptop',
        category: 'electronics',
        limit: 10
      };
      const context = mockContext();
      
      const result = await productSearchIntent.handler(params, context);
      
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockProducts);
      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe('product-grid');
      
      // Verify service calls
      expect(productService.search).toHaveBeenCalledWith({
        query: 'laptop',
        category: 'electronics',
        limit: 10,
        userId: context.user.id
      });
      
      expect(analyticsService.track).toHaveBeenCalledWith('product_search', {
        query: 'laptop',
        category: 'electronics',
        resultsCount: 2,
        userId: context.user.id
      });
    });
    
    it('should handle empty search results', async () => {
      productService.search.mockResolvedValue([]);
      
      const params = { query: 'nonexistent-product' };
      const context = mockContext();
      
      const result = await productSearchIntent.handler(params, context);
      
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual([]);
      expect(result.message).toContain('No products found');
    });
    
    it('should handle service errors gracefully', async () => {
      productService.search.mockRejectedValue(new Error('Database connection failed'));
      
      const params = { query: 'laptop' };
      const context = mockContext();
      
      const result = await productSearchIntent.handler(params, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to search products');
      expect(result.components[0].name).toBe('error-message');
    });
  });
  
  describe('Personalization', () => {
    it('should include recommendations for logged-in users', async () => {
      const mockProducts = [{ id: '1', name: 'Product 1', category: 'electronics' }];
      const mockRecommendations = [{ id: '2', name: 'Recommended Product' }];
      
      productService.search.mockResolvedValue(mockProducts);
      
      const mockRecommendationEngine = {
        getRecommendations: jest.fn().mockResolvedValue(mockRecommendations)
      };
      
      const context = mockContext({
        plugins: new Map([['recommendation-engine', mockRecommendationEngine]])
      });
      
      const params = { query: 'laptop' };
      const result = await productSearchIntent.handler(params, context);
      
      expect(result.data.recommendations).toEqual(mockRecommendations);
      expect(mockRecommendationEngine.getRecommendations).toHaveBeenCalledWith(
        context.user.id,
        'electronics',
        3
      );
    });
    
    it('should not include recommendations for guest users', async () => {
      const mockProducts = [{ id: '1', name: 'Product 1' }];
      productService.search.mockResolvedValue(mockProducts);
      
      const context = mockContext({ user: null });
      const params = { query: 'laptop' };
      
      const result = await productSearchIntent.handler(params, context);
      
      expect(result.data.recommendations).toEqual([]);
    });
  });
});
```

### Testing Components

```typescript
// test/components/product-card.test.ts
import { describe, it, expect } from '@jest/globals';
import { productCardComponent } from '../../src/components/product-card';

describe('Product Card Component', () => {
  const mockProduct = {
    id: 'prod-123',
    name: 'Test Product',
    price: 99.99,
    originalPrice: 129.99,
    currency: 'USD',
    imageUrl: 'https://example.com/image.jpg',
    rating: 4.5,
    reviewCount: 42,
    inStock: true,
    category: 'electronics',
    brand: 'TestBrand',
    tags: ['popular', 'sale']
  };
  
  describe('Rendering', () => {
    it('should render product information correctly', () => {
      const props = {
        product: mockProduct,
        showAddToCart: true,
        showWishlist: true
      };
      
      const rendered = productCardComponent.render(props);
      
      expect(rendered.type).toBe('card');
      expect(rendered.children).toBeDefined();
      
      // Check for product image
      const image = rendered.children.find(child => child.type === 'image');
      expect(image).toBeDefined();
      expect(image.src).toBe(mockProduct.imageUrl);
      expect(image.alt).toBe(mockProduct.name);
      
      // Check for product name
      const nameElement = findElementByContent(rendered, mockProduct.name);
      expect(nameElement).toBeDefined();
      
      // Check for price
      const priceElement = findElementByContent(rendered, '$99.99');
      expect(priceElement).toBeDefined();
    });
    
    it('should show discount badge when applicable', () => {
      const props = { product: mockProduct };
      const rendered = productCardComponent.render(props);
      
      const discountBadge = rendered.children.find(
        child => child.type === 'badge' && child.content?.includes('%')
      );
      
      expect(discountBadge).toBeDefined();
      expect(discountBadge.content).toBe('-23%'); // (129.99 - 99.99) / 129.99 * 100
    });
    
    it('should handle out of stock products', () => {
      const outOfStockProduct = { ...mockProduct, inStock: false };
      const props = { product: outOfStockProduct };
      
      const rendered = productCardComponent.render(props);
      
      const addToCartButton = findButtonByContent(rendered, 'Add to Cart');
      expect(addToCartButton).toBeNull();
      
      const notifyButton = findButtonByContent(rendered, 'Notify Me');
      expect(notifyButton).toBeDefined();
      expect(notifyButton.disabled).toBe(true);
    });
    
    it('should render in compact mode', () => {
      const props = {
        product: mockProduct,
        compact: true
      };
      
      const rendered = productCardComponent.render(props);
      
      // Check image height is smaller in compact mode
      const image = rendered.children.find(child => child.type === 'image');
      expect(image.style.height).toBe('120px');
      
      // Check that description is not shown in compact mode
      const description = findElementByContent(rendered, mockProduct.description);
      expect(description).toBeUndefined();
    });
  });
  
  describe('Props Validation', () => {
    it('should validate required props', () => {
      expect(() => {
        productCardComponent.render({});
      }).toThrow('Product is required');
    });
    
    it('should use default values for optional props', () => {
      const props = { product: mockProduct };
      const rendered = productCardComponent.render(props);
      
      // Should show add to cart by default
      const addToCartButton = findButtonByContent(rendered, 'Add to Cart');
      expect(addToCartButton).toBeDefined();
      
      // Should show wishlist by default
      const wishlistButton = rendered.children.find(
        child => child.type === 'button' && child.content === '♡'
      );
      expect(wishlistButton).toBeDefined();
    });
  });
  
  describe('Actions', () => {
    it('should generate correct add to cart action', () => {
      const props = { product: mockProduct };
      const rendered = productCardComponent.render(props);
      
      const addToCartButton = findButtonByContent(rendered, 'Add to Cart');
      expect(addToCartButton.onClick).toEqual({
        action: 'add-to-cart',
        productId: mockProduct.id
      });
    });
    
    it('should generate correct wishlist action', () => {
      const props = { product: mockProduct };
      const rendered = productCardComponent.render(props);
      
      const wishlistButton = rendered.children.find(
        child => child.type === 'button' && child.content === '♡'
      );
      
      expect(wishlistButton.onClick).toEqual({
        action: 'toggle-wishlist',
        productId: mockProduct.id
      });
    });
  });
});

// Helper functions
function findElementByContent(element: any, content: string): any {
  if (element.content === content) return element;
  
  if (element.children) {
    for (const child of element.children) {
      const found = findElementByContent(child, content);
      if (found) return found;
    }
  }
  
  return null;
}

function findButtonByContent(element: any, content: string): any {
  if (element.type === 'button' && element.content === content) {
    return element;
  }
  
  if (element.children) {
    for (const child of element.children) {
      const found = findButtonByContent(child, content);
      if (found) return found;
    }
  }
  
  return null;
}
```

### Testing Middleware

```typescript
// test/middleware/auth.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { authMiddleware } from '../../src/middleware/auth';
import { mockContext } from '../setup';

// Mock JWT service
jest.mock('../../src/services/jwt-service');
import { JWTService } from '../../src/services/jwt-service';
const mockJWTService = JWTService as jest.MockedClass<typeof JWTService>;

describe('Auth Middleware', () => {
  let jwtService: jest.Mocked<JWTService>;
  
  beforeEach(() => {
    jwtService = new mockJWTService() as jest.Mocked<JWTService>;
    jest.clearAllMocks();
  });
  
  describe('Token Validation', () => {
    it('should validate valid JWT token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user']
      };
      
      jwtService.verifyToken.mockResolvedValue(mockUser);
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer valid-token'
          }
        }
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(true);
      expect(context.user).toEqual(mockUser);
      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token');
    });
    
    it('should reject invalid token', async () => {
      jwtService.verifyToken.mockRejectedValue(new Error('Invalid token'));
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer invalid-token'
          }
        }
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(context.user).toBeUndefined();
    });
    
    it('should handle missing authorization header', async () => {
      const context = mockContext({
        request: {
          headers: {}
        }
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authorization header required');
    });
    
    it('should handle malformed authorization header', async () => {
      const context = mockContext({
        request: {
          headers: {
            authorization: 'InvalidFormat'
          }
        }
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid authorization format');
    });
  });
  
  describe('Role-based Access', () => {
    it('should allow access for authorized roles', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        roles: ['admin', 'user']
      };
      
      jwtService.verifyToken.mockResolvedValue(mockUser);
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer admin-token'
          }
        },
        requiredRoles: ['admin']
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(true);
      expect(context.user).toEqual(mockUser);
    });
    
    it('should deny access for insufficient roles', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        roles: ['user']
      };
      
      jwtService.verifyToken.mockResolvedValue(mockUser);
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer user-token'
          }
        },
        requiredRoles: ['admin']
      });
      
      const result = await authMiddleware.handler(context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });
  });
});
```

## Integration Testing

### Testing Server Integration

```typescript
// test/integration/server.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestServer } from '../setup';
import { productSearchIntent } from '../../src/intents/product-search';
import { productCardComponent } from '../../src/components/product-card';

describe('Server Integration Tests', () => {
  let server: any;
  let app: any;
  
  beforeAll(async () => {
    server = createTestServer();
    
    // Register test intents and components
    server.registerIntent(productSearchIntent);
    server.registerComponent(productCardComponent);
    
    app = await server.start();
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  describe('Intent Processing', () => {
    it('should process intent via HTTP API', async () => {
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({
          query: 'laptop',
          category: 'electronics'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.components).toBeDefined();
    });
    
    it('should handle invalid intent names', async () => {
      const response = await request(app)
        .post('/api/intent/nonexistent-intent')
        .send({})
        .expect(404);
      
      expect(response.body.error).toContain('Intent not found');
    });
    
    it('should validate intent parameters', async () => {
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({
          // Missing required 'query' parameter
          category: 'electronics'
        })
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
  });
  
  describe('Authentication Integration', () => {
    it('should require authentication for protected intents', async () => {
      const response = await request(app)
        .post('/api/intent/user-profile')
        .send({})
        .expect(401);
      
      expect(response.body.error).toContain('Authentication required');
    });
    
    it('should accept valid authentication', async () => {
      const token = 'valid-test-token'; // Mock token
      
      const response = await request(app)
        .post('/api/intent/user-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Simulate server error by sending malformed JSON
      const response = await request(app)
        .post('/api/intent/product-search')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
    
    it('should handle database connection errors', async () => {
      // Mock database failure
      const originalEnv = process.env.TEST_DB_URL;
      process.env.TEST_DB_URL = 'invalid-connection-string';
      
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({ query: 'laptop' })
        .expect(500);
      
      expect(response.body.error).toContain('Database error');
      
      // Restore environment
      process.env.TEST_DB_URL = originalEnv;
    });
  });
});
```

### Testing Plugin Integration

```typescript
// test/integration/plugins.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestServer } from '../setup';
import { PaymentProcessorPlugin } from '../../src/plugins/payment-processor';
import { AnalyticsPlugin } from '../../src/plugins/analytics';

describe('Plugin Integration Tests', () => {
  let server: any;
  
  beforeEach(async () => {
    server = createTestServer();
  });
  
  describe('Plugin Installation', () => {
    it('should install plugins successfully', async () => {
      const paymentPlugin = new PaymentProcessorPlugin();
      const analyticsPlugin = new AnalyticsPlugin();
      
      await server.installPlugin(paymentPlugin, {
        stripe: {
          secretKey: 'test-key'
        }
      });
      
      await server.installPlugin(analyticsPlugin, {
        trackingId: 'test-tracking-id'
      });
      
      const installedPlugins = server.getInstalledPlugins();
      expect(installedPlugins).toHaveLength(2);
      expect(installedPlugins.map(p => p.name)).toContain('payment-processor');
      expect(installedPlugins.map(p => p.name)).toContain('analytics');
    });
    
    it('should handle plugin installation errors', async () => {
      const faultyPlugin = {
        name: 'faulty-plugin',
        install: async () => {
          throw new Error('Installation failed');
        }
      };
      
      await expect(
        server.installPlugin(faultyPlugin)
      ).rejects.toThrow('Installation failed');
    });
  });
  
  describe('Plugin Communication', () => {
    it('should allow plugins to communicate', async () => {
      const plugin1 = {
        name: 'plugin1',
        install: async (config: any, context: any) => {
          context.eventBus.on('test-event', (data: any) => {
            context.eventBus.emit('response-event', { received: data });
          });
        }
      };
      
      const plugin2 = {
        name: 'plugin2',
        install: async (config: any, context: any) => {
          // Plugin 2 will emit an event that plugin 1 listens to
          setTimeout(() => {
            context.eventBus.emit('test-event', { message: 'hello' });
          }, 100);
        }
      };
      
      await server.installPlugin(plugin1);
      await server.installPlugin(plugin2);
      
      // Wait for event communication
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify communication occurred (this would depend on your event system)
      // expect(/* some verification */).toBe(true);
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup with Playwright

```typescript
// test/e2e/setup.ts
import { test as base, expect } from '@playwright/test';
import { createTestServer } from '../setup';

// Extend base test with custom fixtures
export const test = base.extend<{
  ixpServer: any;
  apiUrl: string;
}>({
  ixpServer: async ({}, use) => {
    const server = createTestServer();
    await server.start();
    
    await use(server);
    
    await server.stop();
  },
  
  apiUrl: async ({ ixpServer }, use) => {
    const port = ixpServer.getPort();
    await use(`http://localhost:${port}`);
  }
});

export { expect };
```

### E2E Test Examples

```typescript
// test/e2e/chat-interface.spec.ts
import { test, expect } from './setup';

test.describe('Chat Interface E2E', () => {
  test('should handle complete chat workflow', async ({ page, apiUrl }) => {
    // Navigate to chat interface
    await page.goto(`${apiUrl}/chat`);
    
    // Wait for chat interface to load
    await expect(page.locator('.chat-interface')).toBeVisible();
    
    // Send a message
    const messageInput = page.locator('input[placeholder="Type your message..."]');
    await messageInput.fill('Find me a laptop under $1000');
    await page.click('button:has-text("Send")');
    
    // Wait for response
    await expect(page.locator('.message-assistant')).toBeVisible();
    
    // Check for product components
    await expect(page.locator('.product-card')).toBeVisible();
    
    // Interact with product card
    await page.click('.product-card button:has-text("Add to Cart")');
    
    // Verify cart update message
    await expect(page.locator('.message-assistant:last-child')).toContainText('added to cart');
  });
  
  test('should handle error states gracefully', async ({ page, apiUrl }) => {
    // Navigate to chat interface
    await page.goto(`${apiUrl}/chat`);
    
    // Simulate network error by intercepting requests
    await page.route('**/api/intent/**', route => {
      route.abort('failed');
    });
    
    // Send a message
    const messageInput = page.locator('input[placeholder="Type your message..."]');
    await messageInput.fill('test message');
    await page.click('button:has-text("Send")');
    
    // Check for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('error');
  });
  
  test('should support authentication flow', async ({ page, apiUrl }) => {
    // Navigate to protected page
    await page.goto(`${apiUrl}/dashboard`);
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify authenticated content
    await expect(page.locator('.user-profile')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# test/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  payload:
    path: "./test-data.csv"
    fields:
      - "query"
      - "category"

scenarios:
  - name: "Product Search"
    weight: 70
    flow:
      - post:
          url: "/api/intent/product-search"
          json:
            query: "{{ query }}"
            category: "{{ category }}"
          capture:
            - json: "$.data.results[0].id"
              as: "productId"
      - think: 2
      - post:
          url: "/api/intent/product-details"
          json:
            productId: "{{ productId }}"
  
  - name: "User Authentication"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/api/intent/user-profile"
          headers:
            Authorization: "Bearer {{ authToken }}"
  
  - name: "Health Check"
    weight: 10
    flow:
      - get:
          url: "/health"
```

### Performance Test Runner

```typescript
// test/performance/performance.test.ts
import { describe, it, expect } from '@jest/globals';
import { spawn } from 'child_process';
import { createTestServer } from '../setup';

describe('Performance Tests', () => {
  let server: any;
  
  beforeAll(async () => {
    server = createTestServer({
      // Performance test configuration
      cache: {
        type: 'redis',
        ttl: 3600
      },
      database: {
        pool: {
          min: 5,
          max: 20
        }
      }
    });
    
    await server.start();
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 100;
    const requests = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        fetch(`http://localhost:${server.getPort()}/api/intent/product-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `test query ${i}` })
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    const avgResponseTime = duration / concurrentRequests;
    
    // Verify all requests succeeded
    expect(responses.every(r => r.ok)).toBe(true);
    
    // Verify performance requirements
    expect(avgResponseTime).toBeLessThan(500); // Average response time < 500ms
    expect(duration).toBeLessThan(5000); // Total time < 5 seconds
  });
  
  it('should maintain performance under memory pressure', async () => {
    // Create memory pressure by processing large datasets
    const largeDataRequests = [];
    
    for (let i = 0; i < 50; i++) {
      largeDataRequests.push(
        server.processIntent('data-processing', {
          dataset: new Array(10000).fill(0).map((_, idx) => ({ id: idx, value: Math.random() }))
        })
      );
    }
    
    const startMemory = process.memoryUsage();
    await Promise.all(largeDataRequests);
    const endMemory = process.memoryUsage();
    
    // Verify memory usage didn't grow excessively
    const memoryGrowth = endMemory.heapUsed - startMemory.heapUsed;
    expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
  });
});
```

## Security Testing

### Security Test Suite

```typescript
// test/security/security.test.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createTestServer } from '../setup';

describe('Security Tests', () => {
  let server: any;
  let app: any;
  
  beforeAll(async () => {
    server = createTestServer({
      security: {
        helmet: true,
        rateLimit: {
          windowMs: 60000,
          max: 10
        }
      }
    });
    
    app = await server.start();
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  describe('Input Validation', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({ query: maliciousInput })
        .expect(400);
      
      expect(response.body.error).toContain('Invalid input');
    });
    
    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({ query: xssPayload })
        .expect(400);
      
      expect(response.body.error).toContain('Invalid input');
    });
    
    it('should validate input size limits', async () => {
      const oversizedInput = 'a'.repeat(10000);
      
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({ query: oversizedInput })
        .expect(413);
      
      expect(response.body.error).toContain('Payload too large');
    });
  });
  
  describe('Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
      const requests = [];
      
      // Attempt multiple failed logins
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrong-password'
            })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // Should start rate limiting after several attempts
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
    
    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'Bearer malformed-token',
        ''
      ];
      
      for (const token of invalidTokens) {
        const response = await request(app)
          .post('/api/intent/user-profile')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(401);
      }
    });
  });
  
  describe('Data Protection', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      // Should not include password or other sensitive fields
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.secretKey).toBeUndefined();
    });
    
    it('should sanitize error messages', async () => {
      // Trigger a database error
      const response = await request(app)
        .post('/api/intent/product-search')
        .send({ query: 'test' })
        .expect(500);
      
      // Error message should not expose internal details
      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('connection string');
      expect(response.body.error).not.toContain('stack trace');
    });
  });
});
```

## Testing Best Practices

### Test Organization

```typescript
// test/utils/test-helpers.ts
export class TestDataBuilder {
  static user(overrides = {}) {
    return {
      id: 'test-user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      createdAt: new Date(),
      ...overrides
    };
  }
  
  static product(overrides = {}) {
    return {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Product',
      price: 99.99,
      category: 'electronics',
      inStock: true,
      ...overrides
    };
  }
  
  static order(overrides = {}) {
    return {
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-123',
      status: 'pending',
      total: 99.99,
      items: [this.product()],
      createdAt: new Date(),
      ...overrides
    };
  }
}

export class MockServices {
  static createProductService() {
    return {
      search: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
  }
  
  static createUserService() {
    return {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      authenticate: jest.fn()
    };
  }
}

export function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}
```

### Test Configuration

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts'
  ],
  testTimeout: 30000,
  maxWorkers: '50%',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    services:
      postgres:
        image: postgres:13
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
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        TEST_DB_URL: postgresql://postgres:postgres@localhost:5432/test_db
        TEST_REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        TEST_DB_URL: postgresql://postgres:postgres@localhost:5432/test_db
        TEST_REDIS_URL: redis://localhost:6379
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NODE_ENV: test
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Run security audit
      run: npm audit --audit-level moderate
```

This comprehensive testing guide provides a solid foundation for testing IXP Server applications across all layers, ensuring reliability, security, and performance in production environments.