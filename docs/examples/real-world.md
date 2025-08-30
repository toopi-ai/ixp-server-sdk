# Real-World Examples

This guide provides comprehensive real-world examples of IXP Server implementations across different industries and use cases.

## Table of Contents

- [E-commerce Assistant](#e-commerce-assistant)
- [Customer Support Bot](#customer-support-bot)
- [Smart Home Controller](#smart-home-controller)
- [Financial Services Assistant](#financial-services-assistant)
- [Healthcare Information System](#healthcare-information-system)
- [Educational Platform](#educational-platform)
- [Travel Booking Assistant](#travel-booking-assistant)
- [Restaurant Management System](#restaurant-management-system)

## E-commerce Assistant

A comprehensive e-commerce assistant that helps customers find products, track orders, and get support.

### Project Structure

```
e-commerce-assistant/
├── src/
│   ├── intents/
│   │   ├── product-search.ts
│   │   ├── order-tracking.ts
│   │   ├── cart-management.ts
│   │   └── customer-support.ts
│   ├── components/
│   │   ├── product-card.ts
│   │   ├── order-status.ts
│   │   ├── cart-summary.ts
│   │   └── support-ticket.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   └── analytics.ts
│   ├── plugins/
│   │   ├── payment-processor.ts
│   │   ├── inventory-sync.ts
│   │   └── recommendation-engine.ts
│   └── server.ts
├── config/
│   ├── development.json
│   ├── production.json
│   └── test.json
└── package.json
```

### Implementation

#### Product Search Intent

```typescript
// src/intents/product-search.ts
import { Intent, IntentHandler } from 'ixp-server';
import { ProductService } from '../services/product-service';
import { RecommendationEngine } from '../plugins/recommendation-engine';

export const productSearchIntent: Intent = {
  name: 'product-search',
  description: 'Search for products in the catalog',
  examples: [
    'Find me a red dress',
    'Show me laptops under $1000',
    'I need running shoes',
    'Search for wireless headphones'
  ],
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for products'
      },
      category: {
        type: 'string',
        description: 'Product category to filter by',
        enum: ['electronics', 'clothing', 'home', 'sports', 'books']
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
        enum: ['relevance', 'price-low', 'price-high', 'rating', 'newest'],
        default: 'relevance'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 50,
        default: 10
      }
    },
    required: ['query']
  },
  handler: async (params, context) => {
    const productService = new ProductService();
    const recommendationEngine = context.plugins.get('recommendation-engine') as RecommendationEngine;
    
    try {
      // Search products
      const searchResults = await productService.search({
        query: params.query,
        category: params.category,
        priceRange: params.priceRange,
        sortBy: params.sortBy,
        limit: params.limit,
        userId: context.user?.id
      });
      
      // Get personalized recommendations if user is logged in
      let recommendations = [];
      if (context.user?.id && searchResults.length > 0) {
        recommendations = await recommendationEngine.getRecommendations(
          context.user.id,
          searchResults[0].category,
          3
        );
      }
      
      // Track search analytics
      context.analytics.track('product_search', {
        query: params.query,
        category: params.category,
        resultsCount: searchResults.length,
        userId: context.user?.id
      });
      
      return {
        success: true,
        data: {
          results: searchResults,
          recommendations,
          totalCount: searchResults.length,
          query: params.query
        },
        components: [
          {
            name: 'product-grid',
            props: {
              products: searchResults,
              showRecommendations: recommendations.length > 0,
              recommendations
            }
          }
        ]
      };
    } catch (error) {
      console.error('Product search error:', error);
      
      return {
        success: false,
        error: 'Failed to search products. Please try again.',
        components: [
          {
            name: 'error-message',
            props: {
              message: 'Search temporarily unavailable',
              action: 'retry'
            }
          }
        ]
      };
    }
  }
};
```

#### Product Card Component

```typescript
// src/components/product-card.ts
import { Component } from 'ixp-server';

export const productCardComponent: Component = {
  name: 'product-card',
  description: 'Display product information in a card format',
  props: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          currency: { type: 'string', default: 'USD' },
          imageUrl: { type: 'string' },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          reviewCount: { type: 'number' },
          inStock: { type: 'boolean' },
          category: { type: 'string' },
          brand: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['id', 'name', 'price', 'imageUrl']
      },
      showAddToCart: {
        type: 'boolean',
        default: true
      },
      showWishlist: {
        type: 'boolean',
        default: true
      },
      compact: {
        type: 'boolean',
        default: false
      }
    },
    required: ['product']
  },
  render: (props) => {
    const { product, showAddToCart, showWishlist, compact } = props;
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
    
    return {
      type: 'card',
      style: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        maxWidth: compact ? '200px' : '300px'
      },
      children: [
        // Product Image
        {
          type: 'image',
          src: product.imageUrl,
          alt: product.name,
          style: {
            width: '100%',
            height: compact ? '120px' : '200px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '12px'
          }
        },
        
        // Discount Badge
        ...(hasDiscount ? [{
          type: 'badge',
          content: `-${discountPercent}%`,
          style: {
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        }] : []),
        
        // Product Info
        {
          type: 'container',
          style: { marginBottom: '12px' },
          children: [
            // Brand
            ...(product.brand ? [{
              type: 'text',
              content: product.brand,
              style: {
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }
            }] : []),
            
            // Product Name
            {
              type: 'text',
              content: product.name,
              style: {
                fontSize: compact ? '14px' : '16px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: compact ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }
            },
            
            // Description (non-compact only)
            ...(!compact && product.description ? [{
              type: 'text',
              content: product.description,
              style: {
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }
            }] : []),
            
            // Rating
            ...(product.rating ? [{
              type: 'container',
              style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              },
              children: [
                {
                  type: 'rating',
                  value: product.rating,
                  max: 5,
                  style: {
                    color: '#ffa500',
                    fontSize: '14px'
                  }
                },
                {
                  type: 'text',
                  content: `(${product.reviewCount || 0})`,
                  style: {
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: '8px'
                  }
                }
              ]
            }] : [])
          ]
        },
        
        // Price Section
        {
          type: 'container',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          },
          children: [
            {
              type: 'container',
              style: { display: 'flex', alignItems: 'center' },
              children: [
                {
                  type: 'text',
                  content: `${product.currency} ${product.price.toFixed(2)}`,
                  style: {
                    fontSize: compact ? '16px' : '18px',
                    fontWeight: 'bold',
                    color: '#333'
                  }
                },
                ...(hasDiscount ? [{
                  type: 'text',
                  content: `${product.currency} ${product.originalPrice.toFixed(2)}`,
                  style: {
                    fontSize: '14px',
                    color: '#999',
                    textDecoration: 'line-through',
                    marginLeft: '8px'
                  }
                }] : [])
              ]
            },
            
            // Stock Status
            {
              type: 'text',
              content: product.inStock ? 'In Stock' : 'Out of Stock',
              style: {
                fontSize: '12px',
                color: product.inStock ? '#28a745' : '#dc3545',
                fontWeight: '500'
              }
            }
          ]
        },
        
        // Action Buttons
        {
          type: 'container',
          style: {
            display: 'flex',
            gap: '8px',
            marginTop: 'auto'
          },
          children: [
            ...(showAddToCart ? [{
              type: 'button',
              content: product.inStock ? 'Add to Cart' : 'Notify Me',
              disabled: !product.inStock,
              style: {
                flex: 1,
                padding: '8px 16px',
                backgroundColor: product.inStock ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s ease'
              },
              onClick: {
                action: product.inStock ? 'add-to-cart' : 'notify-when-available',
                productId: product.id
              }
            }] : []),
            
            ...(showWishlist ? [{
              type: 'button',
              content: '♡',
              style: {
                padding: '8px',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              },
              onClick: {
                action: 'toggle-wishlist',
                productId: product.id
              }
            }] : [])
          ]
        },
        
        // Tags (non-compact only)
        ...(!compact && product.tags && product.tags.length > 0 ? [{
          type: 'container',
          style: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '8px'
          },
          children: product.tags.slice(0, 3).map(tag => ({
            type: 'badge',
            content: tag,
            style: {
              backgroundColor: '#f8f9fa',
              color: '#495057',
              padding: '2px 6px',
              borderRadius: '12px',
              fontSize: '10px',
              border: '1px solid #dee2e6'
            }
          }))
        }] : [])
      ]
    };
  }
};
```

#### Order Tracking Intent

```typescript
// src/intents/order-tracking.ts
import { Intent } from 'ixp-server';
import { OrderService } from '../services/order-service';
import { NotificationService } from '../services/notification-service';

export const orderTrackingIntent: Intent = {
  name: 'order-tracking',
  description: 'Track order status and delivery information',
  examples: [
    'Track my order',
    'Where is my package?',
    'Order status for #12345',
    'When will my order arrive?'
  ],
  parameters: {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to track'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address for guest orders'
      }
    },
    anyOf: [
      { required: ['orderId'] },
      { required: ['email'] }
    ]
  },
  handler: async (params, context) => {
    const orderService = new OrderService();
    const notificationService = new NotificationService();
    
    try {
      let orders = [];
      
      if (params.orderId) {
        // Track specific order
        const order = await orderService.getOrder(params.orderId, {
          userId: context.user?.id,
          email: params.email
        });
        
        if (!order) {
          return {
            success: false,
            error: 'Order not found. Please check your order ID.',
            components: [
              {
                name: 'error-message',
                props: {
                  message: 'Order not found',
                  suggestion: 'Please verify your order ID and try again'
                }
              }
            ]
          };
        }
        
        orders = [order];
      } else if (context.user?.id) {
        // Get recent orders for logged-in user
        orders = await orderService.getUserOrders(context.user.id, { limit: 5 });
      } else if (params.email) {
        // Get orders by email for guest users
        orders = await orderService.getOrdersByEmail(params.email, { limit: 5 });
      }
      
      if (orders.length === 0) {
        return {
          success: true,
          message: 'No orders found.',
          components: [
            {
              name: 'empty-state',
              props: {
                message: 'No orders to track',
                action: 'Start Shopping',
                actionUrl: '/products'
              }
            }
          ]
        };
      }
      
      // Check for delivery updates
      const updatedOrders = await Promise.all(
        orders.map(async (order) => {
          const trackingInfo = await orderService.getTrackingInfo(order.id);
          return { ...order, tracking: trackingInfo };
        })
      );
      
      // Send notifications for status changes
      for (const order of updatedOrders) {
        if (order.tracking?.statusChanged) {
          await notificationService.sendOrderUpdate(order, context.user);
        }
      }
      
      return {
        success: true,
        data: {
          orders: updatedOrders,
          totalCount: updatedOrders.length
        },
        components: [
          {
            name: 'order-list',
            props: {
              orders: updatedOrders,
              showTracking: true,
              allowReorder: true
            }
          }
        ]
      };
    } catch (error) {
      console.error('Order tracking error:', error);
      
      return {
        success: false,
        error: 'Unable to retrieve order information. Please try again later.',
        components: [
          {
            name: 'error-message',
            props: {
              message: 'Tracking service temporarily unavailable',
              action: 'retry'
            }
          }
        ]
      };
    }
  }
};
```

#### Payment Processor Plugin

```typescript
// src/plugins/payment-processor.ts
import { Plugin } from 'ixp-server';
import Stripe from 'stripe';
import PayPal from '@paypal/checkout-server-sdk';

export class PaymentProcessorPlugin implements Plugin {
  name = 'payment-processor';
  version = '1.0.0';
  description = 'Multi-provider payment processing';
  
  private stripe: Stripe;
  private paypal: any;
  private providers = new Map<string, PaymentProvider>();
  
  async install(config: any) {
    // Initialize Stripe
    if (config.stripe?.secretKey) {
      this.stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2023-10-16'
      });
      
      this.providers.set('stripe', new StripeProvider(this.stripe));
    }
    
    // Initialize PayPal
    if (config.paypal?.clientId && config.paypal?.clientSecret) {
      const environment = config.paypal.sandbox 
        ? new PayPal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret)
        : new PayPal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret);
      
      this.paypal = new PayPal.core.PayPalHttpClient(environment);
      this.providers.set('paypal', new PayPalProvider(this.paypal));
    }
    
    console.log(`Payment processor initialized with ${this.providers.size} providers`);
  }
  
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    const provider = this.providers.get(paymentData.provider);
    
    if (!provider) {
      throw new Error(`Payment provider '${paymentData.provider}' not available`);
    }
    
    try {
      // Validate payment data
      await this.validatePayment(paymentData);
      
      // Process payment
      const result = await provider.processPayment(paymentData);
      
      // Log transaction
      await this.logTransaction(paymentData, result);
      
      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Log failed transaction
      await this.logTransaction(paymentData, {
        success: false,
        error: error.message,
        transactionId: null
      });
      
      throw error;
    }
  }
  
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    // Find original transaction
    const transaction = await this.getTransaction(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    const provider = this.providers.get(transaction.provider);
    
    if (!provider) {
      throw new Error(`Payment provider '${transaction.provider}' not available`);
    }
    
    return provider.refundPayment(transactionId, amount);
  }
  
  private async validatePayment(paymentData: PaymentRequest): Promise<void> {
    // Validate amount
    if (paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    // Validate currency
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    if (!supportedCurrencies.includes(paymentData.currency)) {
      throw new Error(`Currency '${paymentData.currency}' not supported`);
    }
    
    // Additional validation based on provider
    const provider = this.providers.get(paymentData.provider);
    if (provider?.validate) {
      await provider.validate(paymentData);
    }
  }
  
  private async logTransaction(paymentData: PaymentRequest, result: PaymentResult): Promise<void> {
    // Log to database or external service
    console.log('Transaction logged:', {
      provider: paymentData.provider,
      amount: paymentData.amount,
      currency: paymentData.currency,
      success: result.success,
      transactionId: result.transactionId,
      timestamp: new Date().toISOString()
    });
  }
  
  private async getTransaction(transactionId: string): Promise<any> {
    // Retrieve transaction from database
    return null; // Placeholder
  }
}

class StripeProvider implements PaymentProvider {
  constructor(private stripe: Stripe) {}
  
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency.toLowerCase(),
      payment_method: paymentData.paymentMethodId,
      confirm: true,
      return_url: paymentData.returnUrl
    });
    
    return {
      success: paymentIntent.status === 'succeeded',
      transactionId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret
    };
  }
  
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    
    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    };
  }
}

class PayPalProvider implements PaymentProvider {
  constructor(private paypal: any) {}
  
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    // PayPal implementation
    const request = new PayPal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: paymentData.currency,
          value: paymentData.amount.toFixed(2)
        }
      }]
    });
    
    const order = await this.paypal.execute(request);
    
    return {
      success: order.statusCode === 201,
      transactionId: order.result.id,
      status: order.result.status,
      approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
    };
  }
  
  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    // PayPal refund implementation
    return {
      success: false,
      error: 'PayPal refund not implemented'
    };
  }
}

interface PaymentProvider {
  processPayment(paymentData: PaymentRequest): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
  validate?(paymentData: PaymentRequest): Promise<void>;
}

interface PaymentRequest {
  provider: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status?: string;
  clientSecret?: string;
  approvalUrl?: string;
  error?: string;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
}
```

### Server Configuration

```typescript
// src/server.ts
import { createIXPServer } from 'ixp-server';
import { productSearchIntent } from './intents/product-search';
import { orderTrackingIntent } from './intents/order-tracking';
import { cartManagementIntent } from './intents/cart-management';
import { customerSupportIntent } from './intents/customer-support';
import { productCardComponent } from './components/product-card';
import { orderStatusComponent } from './components/order-status';
import { cartSummaryComponent } from './components/cart-summary';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { analyticsMiddleware } from './middleware/analytics';
import { PaymentProcessorPlugin } from './plugins/payment-processor';
import { InventorySyncPlugin } from './plugins/inventory-sync';
import { RecommendationEnginePlugin } from './plugins/recommendation-engine';

const server = createIXPServer({
  name: 'E-commerce Assistant',
  version: '1.0.0',
  description: 'AI-powered e-commerce assistant',
  
  // Server configuration
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  // Security
  security: {
    helmet: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: [
      { type: 'console' },
      { type: 'file', filename: 'logs/app.log' }
    ]
  },
  
  // Database
  database: {
    type: 'postgresql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production'
  },
  
  // Cache
  cache: {
    type: 'redis',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    ttl: 3600 // 1 hour default TTL
  }
});

// Register middleware
server.use(authMiddleware);
server.use(rateLimitMiddleware);
server.use(analyticsMiddleware);

// Register intents
server.registerIntent(productSearchIntent);
server.registerIntent(orderTrackingIntent);
server.registerIntent(cartManagementIntent);
server.registerIntent(customerSupportIntent);

// Register components
server.registerComponent(productCardComponent);
server.registerComponent(orderStatusComponent);
server.registerComponent(cartSummaryComponent);

// Install plugins
server.installPlugin(new PaymentProcessorPlugin(), {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    sandbox: process.env.NODE_ENV !== 'production'
  }
});

server.installPlugin(new InventorySyncPlugin(), {
  syncInterval: 300000, // 5 minutes
  batchSize: 100
});

server.installPlugin(new RecommendationEnginePlugin(), {
  algorithm: 'collaborative-filtering',
  updateInterval: 3600000 // 1 hour
});

// Error handling
server.onError((error, context) => {
  console.error('Server error:', error);
  
  // Send error to monitoring service
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error);
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    components: [
      {
        name: 'error-message',
        props: {
          message: 'Service temporarily unavailable',
          action: 'retry'
        }
      }
    ]
  };
});

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Start server
server.start().then(() => {
  console.log('E-commerce Assistant server started successfully');
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default server;
```

## Customer Support Bot

A sophisticated customer support system with ticket management, knowledge base integration, and escalation workflows.

### Key Features

- **Intelligent Ticket Routing**: Automatically route tickets based on category and priority
- **Knowledge Base Integration**: Search and suggest relevant articles
- **Escalation Workflows**: Seamlessly escalate to human agents
- **Multi-channel Support**: Handle inquiries from web, email, and chat
- **Sentiment Analysis**: Monitor customer satisfaction in real-time

### Implementation Highlights

```typescript
// Customer Support Intent with NLP Integration
export const customerSupportIntent: Intent = {
  name: 'customer-support',
  description: 'Handle customer support inquiries and ticket management',
  examples: [
    'I need help with my account',
    'How do I return an item?',
    'My order is damaged',
    'I want to cancel my subscription'
  ],
  parameters: {
    type: 'object',
    properties: {
      issue: {
        type: 'string',
        description: 'Description of the customer issue'
      },
      category: {
        type: 'string',
        enum: ['account', 'billing', 'shipping', 'returns', 'technical', 'general']
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      orderId: {
        type: 'string',
        description: 'Related order ID if applicable'
      }
    },
    required: ['issue']
  },
  handler: async (params, context) => {
    const supportService = new CustomerSupportService();
    const nlpService = context.plugins.get('nlp-service');
    const knowledgeBase = context.plugins.get('knowledge-base');
    
    try {
      // Analyze sentiment and extract entities
      const analysis = await nlpService.analyze(params.issue);
      
      // Determine category if not provided
      const category = params.category || analysis.category;
      const priority = analysis.urgency || params.priority;
      
      // Search knowledge base for relevant articles
      const articles = await knowledgeBase.search(params.issue, {
        category,
        limit: 3
      });
      
      // Check if issue can be auto-resolved
      if (articles.length > 0 && analysis.confidence > 0.8) {
        return {
          success: true,
          data: {
            type: 'self-service',
            articles,
            sentiment: analysis.sentiment
          },
          components: [
            {
              name: 'knowledge-base-suggestions',
              props: {
                articles,
                issue: params.issue,
                showCreateTicket: true
              }
            }
          ]
        };
      }
      
      // Create support ticket
      const ticket = await supportService.createTicket({
        userId: context.user?.id,
        issue: params.issue,
        category,
        priority,
        orderId: params.orderId,
        sentiment: analysis.sentiment,
        metadata: {
          userAgent: context.request.headers['user-agent'],
          ip: context.request.ip,
          timestamp: new Date().toISOString()
        }
      });
      
      // Auto-assign to appropriate agent
      await supportService.autoAssignTicket(ticket.id, {
        category,
        priority,
        workload: true
      });
      
      return {
        success: true,
        data: {
          type: 'ticket-created',
          ticket,
          estimatedResponse: supportService.getEstimatedResponseTime(priority),
          articles: articles.slice(0, 2) // Show fewer articles
        },
        components: [
          {
            name: 'support-ticket',
            props: {
              ticket,
              showProgress: true,
              allowUpdates: true
            }
          }
        ]
      };
    } catch (error) {
      console.error('Customer support error:', error);
      
      return {
        success: false,
        error: 'Unable to process your request. Please try again.',
        components: [
          {
            name: 'fallback-contact',
            props: {
              phone: process.env.SUPPORT_PHONE,
              email: process.env.SUPPORT_EMAIL,
              hours: 'Mon-Fri 9AM-6PM EST'
            }
          }
        ]
      };
    }
  }
};
```

## Smart Home Controller

A comprehensive smart home management system with device control, automation, and energy monitoring.

### Architecture Overview

```typescript
// Device Management System
class SmartHomeController {
  private deviceRegistry = new Map<string, SmartDevice>();
  private automationEngine: AutomationEngine;
  private securityManager: SecurityManager;
  
  constructor() {
    this.automationEngine = new AutomationEngine();
    this.securityManager = new SecurityManager();
  }
  
  async registerDevice(device: SmartDevice): Promise<void> {
    // Validate device credentials
    await this.securityManager.validateDevice(device);
    
    // Add to registry
    this.deviceRegistry.set(device.id, device);
    
    // Initialize device
    await device.initialize();
    
    // Set up monitoring
    this.setupDeviceMonitoring(device);
    
    console.log(`Device registered: ${device.name} (${device.type})`);
  }
  
  async controlDevice(deviceId: string, command: DeviceCommand): Promise<DeviceResponse> {
    const device = this.deviceRegistry.get(deviceId);
    
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    // Check permissions
    await this.securityManager.checkPermissions(command.userId, device, command.action);
    
    // Execute command
    const response = await device.executeCommand(command);
    
    // Log activity
    await this.logDeviceActivity(device, command, response);
    
    // Trigger automations
    await this.automationEngine.processDeviceEvent(device, command, response);
    
    return response;
  }
  
  private setupDeviceMonitoring(device: SmartDevice): void {
    // Monitor device status
    setInterval(async () => {
      try {
        const status = await device.getStatus();
        
        if (status.offline) {
          await this.handleDeviceOffline(device);
        }
        
        // Update device state
        device.updateState(status);
        
        // Check for alerts
        await this.checkDeviceAlerts(device, status);
      } catch (error) {
        console.error(`Monitoring error for ${device.name}:`, error);
      }
    }, 30000); // Check every 30 seconds
  }
}
```

## Financial Services Assistant

A secure financial assistant for account management, transaction analysis, and investment advice.

### Security Implementation

```typescript
// Enhanced Security Middleware
class FinancialSecurityMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      // Multi-factor authentication
      const token = this.extractToken(req);
      const user = await this.verifyToken(token);
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity(user, req);
      
      // Validate session
      await this.validateSession(user, req);
      
      // Set security context
      req.user = user;
      req.securityContext = {
        riskLevel: await this.calculateRiskLevel(user, req),
        requiresAdditionalAuth: false
      };
      
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  }
  
  private async checkSuspiciousActivity(user: User, req: Request): Promise<void> {
    const indicators = [
      this.checkUnusualLocation(user, req),
      this.checkUnusualTime(user, req),
      this.checkDeviceFingerprint(user, req),
      this.checkVelocityLimits(user, req)
    ];
    
    const suspiciousCount = (await Promise.all(indicators))
      .filter(Boolean).length;
    
    if (suspiciousCount >= 2) {
      throw new Error('Suspicious activity detected');
    }
  }
}
```

This comprehensive real-world examples guide demonstrates how to build production-ready IXP Server applications across various industries, showcasing advanced patterns, security considerations, and scalability techniques.