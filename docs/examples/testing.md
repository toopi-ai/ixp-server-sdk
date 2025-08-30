# Testing Guide

This guide provides comprehensive testing strategies and examples for IXP Server applications using the correct JSON-based SDK structures.

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
import { IXPServer } from '@toopi/ixp-server-sdk'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Redis from 'ioredis-mock'

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
}

// Setup test database
let mongoServer: MongoMemoryServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  process.env.TEST_DB_URL = mongoServer.getUri()
})

afterAll(async () => {
  await mongoServer.stop()
})

// Test utilities
export function createTestServer(config = {}) {
  return new IXPServer({
    ...global.testConfig,
    ...config,
    port: 0 // Use random port for tests
  })
}

export function mockUser(overrides = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    ...overrides
  }
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
  }
}
```

## Unit Testing

### Testing Intent Definitions

```typescript
// test/intents/product-search.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { createTestServer, mockContext } from '../setup'

// Mock external services
jest.mock('../../src/services/product-service')
jest.mock('../../src/services/analytics-service')

import { ProductService } from '../../src/services/product-service'
import { AnalyticsService } from '../../src/services/analytics-service'

const mockProductService = ProductService as jest.MockedClass<typeof ProductService>
const mockAnalyticsService = AnalyticsService as jest.MockedClass<typeof AnalyticsService>

describe('Product Search Intent', () => {
  let server: IXPServer
  let productService: jest.Mocked<ProductService>
  let analyticsService: jest.Mocked<AnalyticsService>
  
  beforeEach(() => {
    server = createTestServer()
    productService = new mockProductService() as jest.Mocked<ProductService>
    analyticsService = new mockAnalyticsService() as jest.Mocked<AnalyticsService>
    
    // Register the intent
    server.registerIntent({
      name: 'product-search',
      description: 'Search for products in the catalog',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          category: {
            type: 'string',
            enum: ['electronics', 'clothing', 'books', 'home'],
            description: 'Product category'
          },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            }
          },
          limit: {
            type: 'number',
            default: 20,
            maximum: 100
          }
        },
        required: ['query']
      },
      handler: async (params, context) => {
        // Validation
        if (!params.query) {
          throw new Error('Query parameter is required')
        }
        
        if (params.priceRange && params.priceRange.min > params.priceRange.max) {
          throw new Error('Invalid price range')
        }
        
        try {
          const products = await productService.search({
            query: params.query,
            category: params.category,
            priceRange: params.priceRange,
            limit: params.limit || 20,
            userId: context.user?.id
          })
          
          // Track analytics
          if (context.user) {
            await analyticsService.track('product_search', {
              query: params.query,
              category: params.category,
              resultsCount: products.length,
              userId: context.user.id
            })
          }
          
          return {
            success: true,
            data: {
              results: products,
              total: products.length,
              query: params.query
            },
            message: products.length > 0 
              ? `Found ${products.length} products` 
              : 'No products found for your search',
            components: [{
              name: 'product-grid',
              props: {
                products,
                showFilters: true,
                allowSorting: true
              }
            }]
          }
        } catch (error) {
          return {
            success: false,
            error: 'Failed to search products',
            components: [{
              name: 'error-message',
              props: {
                message: 'Search temporarily unavailable',
                retry: true
              }
            }]
          }
        }
      }
    })
    
    // Reset mocks
    jest.clearAllMocks()
  })
  
  describe('Parameter Validation', () => {
    it('should require query parameter', async () => {
      const params = {}
      const context = mockContext()
      
      const result = await server.render('product-search', params, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Query parameter is required')
    })
    
    it('should validate price range', async () => {
      const params = {
        query: 'laptop',
        priceRange: {
          min: 1000,
          max: 500 // Invalid: max < min
        }
      }
      const context = mockContext()
      
      const result = await server.render('product-search', params, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid price range')
    })
  })
  
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
      ]
      
      productService.search.mockResolvedValue(mockProducts)
      
      const params = {
        query: 'laptop',
        category: 'electronics',
        limit: 10
      }
      const context = mockContext()
      
      const result = await server.render('product-search', params, context)
      
      expect(result.success).toBe(true)
      expect(result.data.results).toEqual(mockProducts)
      expect(result.components).toHaveLength(1)
      expect(result.components[0].name).toBe('product-grid')
      
      // Verify service calls
      expect(productService.search).toHaveBeenCalledWith({
        query: 'laptop',
        category: 'electronics',
        limit: 10,
        userId: context.user.id
      })
      
      expect(analyticsService.track).toHaveBeenCalledWith('product_search', {
        query: 'laptop',
        category: 'electronics',
        resultsCount: 2,
        userId: context.user.id
      })
    })
    
    it('should handle empty search results', async () => {
      productService.search.mockResolvedValue([])
      
      const params = { query: 'nonexistent-product' }
      const context = mockContext()
      
      const result = await server.render('product-search', params, context)
      
      expect(result.success).toBe(true)
      expect(result.data.results).toEqual([])
      expect(result.message).toContain('No products found')
    })
    
    it('should handle service errors gracefully', async () => {
      productService.search.mockRejectedValue(new Error('Database connection failed'))
      
      const params = { query: 'laptop' }
      const context = mockContext()
      
      const result = await server.render('product-search', params, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to search products')
      expect(result.components[0].name).toBe('error-message')
    })
  })
})
```

### Testing Component Definitions

```typescript
// test/components/product-card.test.ts
import { describe, it, expect } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { createTestServer } from '../setup'

describe('Product Card Component', () => {
  let server: IXPServer
  
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
  }
  
  beforeEach(() => {
    server = createTestServer()
    
    // Register the component
    server.registerComponent({
      name: 'product-card',
      description: 'Display product information in a card format',
      props: {
        type: 'object',
        properties: {
          product: {
            type: 'object',
            required: true,
            description: 'Product data'
          },
          showAddToCart: {
            type: 'boolean',
            default: true,
            description: 'Show add to cart button'
          },
          showWishlist: {
            type: 'boolean',
            default: true,
            description: 'Show wishlist button'
          },
          compact: {
            type: 'boolean',
            default: false,
            description: 'Render in compact mode'
          }
        },
        required: ['product']
      },
      render: (props) => {
        if (!props.product) {
          throw new Error('Product is required')
        }
        
        const { product, showAddToCart = true, showWishlist = true, compact = false } = props
        const discountPercent = product.originalPrice 
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : 0
        
        return {
          type: 'card',
          style: {
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          },
          children: [
            {
              type: 'image',
              src: product.imageUrl,
              alt: product.name,
              style: {
                width: '100%',
                height: compact ? '120px' : '200px',
                objectFit: 'cover'
              }
            },
            {
              type: 'text',
              content: product.name,
              style: {
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '8px 0'
              }
            },
            {
              type: 'container',
              style: { display: 'flex', alignItems: 'center', gap: '8px' },
              children: [
                {
                  type: 'text',
                  content: `$${product.price}`,
                  style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2196F3'
                  }
                },
                ...(product.originalPrice ? [{
                  type: 'text',
                  content: `$${product.originalPrice}`,
                  style: {
                    fontSize: '14px',
                    textDecoration: 'line-through',
                    color: '#666'
                  }
                }] : []),
                ...(discountPercent > 0 ? [{
                  type: 'badge',
                  content: `-${discountPercent}%`,
                  style: {
                    backgroundColor: '#f44336',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }
                }] : [])
              ]
            },
            {
              type: 'container',
              style: { display: 'flex', gap: '8px', marginTop: '12px' },
              children: [
                ...(product.inStock && showAddToCart ? [{
                  type: 'button',
                  content: 'Add to Cart',
                  style: {
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  },
                  onClick: {
                    action: 'add-to-cart',
                    productId: product.id
                  }
                }] : []),
                ...(!product.inStock ? [{
                  type: 'button',
                  content: 'Notify Me',
                  disabled: true,
                  style: {
                    backgroundColor: '#ccc',
                    color: '#666',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px'
                  }
                }] : []),
                ...(showWishlist ? [{
                  type: 'button',
                  content: '♡',
                  style: {
                    backgroundColor: 'transparent',
                    border: '1px solid #ddd',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  },
                  onClick: {
                    action: 'toggle-wishlist',
                    productId: product.id
                  }
                }] : [])
              ]
            }
          ]
        }
      }
    })
  })
  
  describe('Rendering', () => {
    it('should render product information correctly', async () => {
      const props = {
        product: mockProduct,
        showAddToCart: true,
        showWishlist: true
      }
      
      const result = await server.render('product-card', {}, {}, props)
      
      expect(result.type).toBe('card')
      expect(result.children).toBeDefined()
      
      // Check for product image
      const image = result.children.find(child => child.type === 'image')
      expect(image).toBeDefined()
      expect(image.src).toBe(mockProduct.imageUrl)
      expect(image.alt).toBe(mockProduct.name)
      
      // Check for product name
      const nameElement = findElementByContent(result, mockProduct.name)
      expect(nameElement).toBeDefined()
      
      // Check for price
      const priceElement = findElementByContent(result, '$99.99')
      expect(priceElement).toBeDefined()
    })
    
    it('should show discount badge when applicable', async () => {
      const props = { product: mockProduct }
      const result = await server.render('product-card', {}, {}, props)
      
      const discountBadge = result.children.find(
        child => child.type === 'badge' && child.content?.includes('%')
      )
      
      expect(discountBadge).toBeDefined()
      expect(discountBadge.content).toBe('-23%') // (129.99 - 99.99) / 129.99 * 100
    })
    
    it('should handle out of stock products', async () => {
      const outOfStockProduct = { ...mockProduct, inStock: false }
      const props = { product: outOfStockProduct }
      
      const result = await server.render('product-card', {}, {}, props)
      
      const addToCartButton = findButtonByContent(result, 'Add to Cart')
      expect(addToCartButton).toBeNull()
      
      const notifyButton = findButtonByContent(result, 'Notify Me')
      expect(notifyButton).toBeDefined()
      expect(notifyButton.disabled).toBe(true)
    })
    
    it('should render in compact mode', async () => {
      const props = {
        product: mockProduct,
        compact: true
      }
      
      const result = await server.render('product-card', {}, {}, props)
      
      // Check image height is smaller in compact mode
      const image = result.children.find(child => child.type === 'image')
      expect(image.style.height).toBe('120px')
    })
  })
  
  describe('Props Validation', () => {
    it('should validate required props', async () => {
      await expect(
        server.render('product-card', {}, {}, {})
      ).rejects.toThrow('Product is required')
    })
  })
  
  describe('Actions', () => {
    it('should generate correct add to cart action', async () => {
      const props = { product: mockProduct }
      const result = await server.render('product-card', {}, {}, props)
      
      const addToCartButton = findButtonByContent(result, 'Add to Cart')
      expect(addToCartButton.onClick).toEqual({
        action: 'add-to-cart',
        productId: mockProduct.id
      })
    })
    
    it('should generate correct wishlist action', async () => {
      const props = { product: mockProduct }
      const result = await server.render('product-card', {}, {}, props)
      
      const wishlistButton = result.children.find(
        child => child.type === 'button' && child.content === '♡'
      )
      
      expect(wishlistButton.onClick).toEqual({
        action: 'toggle-wishlist',
        productId: mockProduct.id
      })
    })
  })
})

// Helper functions
function findElementByContent(element: any, content: string): any {
  if (element.content === content) return element
  
  if (element.children) {
    for (const child of element.children) {
      const found = findElementByContent(child, content)
      if (found) return found
    }
  }
  
  return null
}

function findButtonByContent(element: any, content: string): any {
  if (element.type === 'button' && element.content === content) {
    return element
  }
  
  if (element.children) {
    for (const child of element.children) {
      const found = findButtonByContent(child, content)
      if (found) return found
    }
  }
  
  return null
}
```

### Testing Middleware

```typescript
// test/middleware/auth.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { createTestServer, mockContext } from '../setup'

// Mock JWT service
jest.mock('../../src/services/jwt-service')
import { JWTService } from '../../src/services/jwt-service'
const mockJWTService = JWTService as jest.MockedClass<typeof JWTService>

describe('Auth Middleware', () => {
  let server: IXPServer
  let jwtService: jest.Mocked<JWTService>
  
  beforeEach(() => {
    server = createTestServer()
    jwtService = new mockJWTService() as jest.Mocked<JWTService>
    
    // Register auth middleware
    server.use(async (req, res, next) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          })
        }
        
        const user = await jwtService.verifyToken(token)
        req.user = user
        next()
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        })
      }
    })
    
    jest.clearAllMocks()
  })
  
  describe('Token Validation', () => {
    it('should validate valid JWT token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user']
      }
      
      jwtService.verifyToken.mockResolvedValue(mockUser)
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer valid-token'
          }
        }
      })
      
      // Test by making a request through the server
      const response = await server.render('test-intent', {}, context)
      
      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token')
      expect(context.user).toEqual(mockUser)
    })
    
    it('should reject invalid token', async () => {
      jwtService.verifyToken.mockRejectedValue(new Error('Invalid token'))
      
      const context = mockContext({
        request: {
          headers: {
            authorization: 'Bearer invalid-token'
          }
        }
      })
      
      const response = await server.render('test-intent', {}, context)
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Invalid token')
    })
    
    it('should reject missing token', async () => {
      const context = mockContext({
        request: {
          headers: {}
        }
      })
      
      const response = await server.render('test-intent', {}, context)
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Authentication required')
    })
  })
})
```

## Integration Testing

### Testing Server Integration

```typescript
// test/integration/server.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { createTestServer } from '../setup'

describe('IXP Server Integration', () => {
  let server: IXPServer
  let app: any
  
  beforeEach(async () => {
    server = createTestServer({
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    
    // Register test intent
    server.registerIntent({
      name: 'hello',
      description: 'Simple greeting intent',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name to greet'
          }
        }
      },
      handler: async (params) => {
        return {
          success: true,
          message: `Hello, ${params.name || 'World'}!`,
          components: [{
            name: 'greeting',
            props: { name: params.name || 'World' }
          }]
        }
      }
    })
    
    // Register test component
    server.registerComponent({
      name: 'greeting',
      description: 'Display a greeting message',
      props: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      render: (props) => ({
        type: 'text',
        content: `Hello, ${props.name}!`,
        style: { fontSize: '18px', color: '#333' }
      })
    })
    
    await server.start()
    app = server.app
  })
  
  afterEach(async () => {
    await server.stop()
  })
  
  describe('Intent Processing', () => {
    it('should process intent via POST request', async () => {
      const response = await request(app)
        .post('/render')
        .send({
          intent: 'hello',
          params: { name: 'Alice' }
        })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Hello, Alice!')
      expect(response.body.components).toHaveLength(1)
      expect(response.body.components[0].name).toBe('greeting')
    })
    
    it('should handle missing intent', async () => {
      const response = await request(app)
        .post('/render')
        .send({
          intent: 'nonexistent',
          params: {}
        })
        .expect(404)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Intent not found')
    })
    
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/render')
        .send({})
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Intent name is required')
    })
  })
  
  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/render')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200)
      
      expect(response.headers['access-control-allow-origin']).toBe('*')
      expect(response.headers['access-control-allow-methods']).toContain('POST')
    })
  })
})
```

## End-to-End Testing

### Testing Complete Workflows

```typescript
// test/e2e/ecommerce-workflow.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { setupEcommerceServer } from '../../src/server'
import { seedTestData, cleanupTestData } from '../helpers/database'

describe('E-commerce Workflow E2E', () => {
  let server: IXPServer
  
  beforeAll(async () => {
    server = setupEcommerceServer()
    await server.start()
    await seedTestData()
  })
  
  afterAll(async () => {
    await cleanupTestData()
    await server.stop()
  })
  
  describe('Product Discovery to Purchase', () => {
    it('should complete full purchase workflow', async () => {
      // Step 1: Search for products
      const searchResult = await server.render('product-search', {
        query: 'laptop',
        category: 'electronics'
      })
      
      expect(searchResult.success).toBe(true)
      expect(searchResult.data.results.length).toBeGreaterThan(0)
      
      const product = searchResult.data.results[0]
      
      // Step 2: View product details
      const detailsResult = await server.render('product-details', {
        productId: product.id
      })
      
      expect(detailsResult.success).toBe(true)
      expect(detailsResult.data.product.id).toBe(product.id)
      
      // Step 3: Add to cart
      const addToCartResult = await server.render('add-to-cart', {
        productId: product.id,
        quantity: 1
      })
      
      expect(addToCartResult.success).toBe(true)
      expect(addToCartResult.data.cartItems.length).toBe(1)
      
      // Step 4: View cart
      const cartResult = await server.render('view-cart', {})
      
      expect(cartResult.success).toBe(true)
      expect(cartResult.data.items.length).toBe(1)
      expect(cartResult.data.total).toBeGreaterThan(0)
      
      // Step 5: Checkout
      const checkoutResult = await server.render('checkout', {
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345'
        }
      })
      
      expect(checkoutResult.success).toBe(true)
      expect(checkoutResult.data.orderId).toBeDefined()
      expect(checkoutResult.data.status).toBe('confirmed')
    })
  })
})
```

## Performance Testing

### Load Testing

```typescript
// test/performance/load.test.ts
import { describe, it, expect } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import { performance } from 'perf_hooks'

describe('Performance Tests', () => {
  let server: IXPServer
  
  beforeEach(async () => {
    server = new IXPServer()
    
    // Register performance test intent
    server.registerIntent({
      name: 'performance-test',
      description: 'Test intent for performance measurement',
      parameters: {
        type: 'object',
        properties: {
          delay: { type: 'number', default: 0 }
        }
      },
      handler: async (params) => {
        if (params.delay) {
          await new Promise(resolve => setTimeout(resolve, params.delay))
        }
        
        return {
          success: true,
          message: 'Performance test completed',
          data: { timestamp: Date.now() }
        }
      }
    })
    
    await server.start()
  })
  
  afterEach(async () => {
    await server.stop()
  })
  
  describe('Response Time', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = performance.now()
      
      const result = await server.render('performance-test', {})
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(responseTime).toBeLessThan(100) // Should respond within 100ms
    })
    
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10
      const startTime = performance.now()
      
      const promises = Array(concurrentRequests).fill(null).map(() => 
        server.render('performance-test', {})
      )
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(results.every(r => r.success)).toBe(true)
      expect(totalTime).toBeLessThan(500) // All requests should complete within 500ms
    })
  })
  
  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Make many requests
      for (let i = 0; i < 1000; i++) {
        await server.render('performance-test', {})
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
})
```

## Security Testing

### Authentication and Authorization

```typescript
// test/security/auth.test.ts
import { describe, it, expect } from '@jest/globals'
import { IXPServer } from '@toopi/ixp-server-sdk'
import request from 'supertest'

describe('Security Tests', () => {
  let server: IXPServer
  let app: any
  
  beforeEach(async () => {
    server = new IXPServer()
    
    // Add authentication middleware
    server.use(async (req, res, next) => {
      const token = req.headers.authorization
      if (!token || token !== 'Bearer valid-token') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      next()
    })
    
    server.registerIntent({
      name: 'protected-intent',
      description: 'Protected intent requiring authentication',
      parameters: { type: 'object' },
      handler: async () => ({
        success: true,
        message: 'Access granted'
      })
    })
    
    await server.start()
    app = server.app
  })
  
  afterEach(async () => {
    await server.stop()
  })
  
  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/render')
        .send({ intent: 'protected-intent', params: {} })
        .expect(401)
      
      expect(response.body.error).toBe('Unauthorized')
    })
    
    it('should accept requests with valid authentication', async () => {
      const response = await request(app)
        .post('/render')
        .set('Authorization', 'Bearer valid-token')
        .send({ intent: 'protected-intent', params: {} })
        .expect(200)
      
      expect(response.body.success).toBe(true)
    })
  })
  
  describe('Input Validation', () => {
    it('should sanitize malicious input', async () => {
      server.registerIntent({
        name: 'input-test',
        description: 'Test input validation',
        parameters: {
          type: 'object',
          properties: {
            userInput: { type: 'string' }
          }
        },
        handler: async (params) => {
          // Simulate input sanitization
          const sanitized = params.userInput?.replace(/<script>/g, '')
          return {
            success: true,
            data: { sanitized }
          }
        }
      })
      
      const response = await request(app)
        .post('/render')
        .set('Authorization', 'Bearer valid-token')
        .send({
          intent: 'input-test',
          params: { userInput: '<script>alert("xss")</script>' }
        })
        .expect(200)
      
      expect(response.body.data.sanitized).not.toContain('<script>')
    })
  })
})
```

## Testing Best Practices

### 1. Test Organization

- **Separate test types**: Unit, integration, and E2E tests in different directories
- **Mirror source structure**: Test files should mirror your source code structure
- **Descriptive names**: Use clear, descriptive test and describe block names

### 2. Test Data Management

```typescript
// test/helpers/fixtures.ts
export const testProducts = [
  {
    id: 'prod-1',
    name: 'Test Laptop',
    price: 999.99,
    category: 'electronics',
    inStock: true
  },
  {
    id: 'prod-2',
    name: 'Test Phone',
    price: 599.99,
    category: 'electronics',
    inStock: false
  }
]

export const testUsers = [
  {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user']
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['admin']
  }
]
```

### 3. Mock Management

```typescript
// test/helpers/mocks.ts
import { jest } from '@jest/globals'

export function createMockService<T>(methods: (keyof T)[]) {
  const mock = {} as jest.Mocked<T>
  
  methods.forEach(method => {
    mock[method] = jest.fn() as any
  })
  
  return mock
}

export function resetAllMocks() {
  jest.clearAllMocks()
  jest.resetAllMocks()
}
```

### 4. Test Configuration

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000
}
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
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
      redis:
        image: redis:6.2
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
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        MONGODB_URL: mongodb://localhost:27017/test
        REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        MONGODB_URL: mongodb://localhost:27017/test
        REDIS_URL: redis://localhost:6379
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NODE_ENV: test
        MONGODB_URL: mongodb://localhost:27017/test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Key Takeaways

1. **Comprehensive Testing**: Test intents, components, middleware, and integrations
2. **Proper Mocking**: Mock external dependencies and services
3. **Test Data**: Use consistent test fixtures and data
4. **Performance**: Include performance and load testing
5. **Security**: Test authentication, authorization, and input validation
6. **CI/CD**: Automate testing in your deployment pipeline
7. **Coverage**: Maintain high test coverage for critical code paths
8. **Documentation**: Document test scenarios and expected behaviors

By following these testing practices, you can ensure your IXP Server applications are reliable, secure, and performant in production environments.