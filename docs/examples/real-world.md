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
│   ├── server.ts
│   ├── services/
│   │   ├── product-service.ts
│   │   ├── order-service.ts
│   │   ├── cart-service.ts
│   │   └── user-service.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   └── analytics.ts
│   └── plugins/
│       ├── payment-processor.ts
│       ├── inventory-sync.ts
│       └── recommendation-engine.ts
├── config/
│   ├── development.json
│   ├── production.json
│   └── test.json
└── package.json
```

### Implementation

#### Main Server Setup

```typescript
// src/server.ts
import { IXPServer } from '@toopi/ixp-server-sdk';
import { ProductService } from './services/product-service';
import { OrderService } from './services/order-service';
import { CartService } from './services/cart-service';
import { UserService } from './services/user-service';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { analyticsMiddleware } from './middleware/analytics';

const server = new IXPServer({
  port: 3000,
  cors: {
    origin: ['http://localhost:3000', 'https://mystore.com'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
});

// Initialize services
const productService = new ProductService();
const orderService = new OrderService();
const cartService = new CartService();
const userService = new UserService();

// Add middleware
server.use(authMiddleware);
server.use(rateLimitMiddleware);
server.use(analyticsMiddleware);

// Register Product Search Intent
server.registerIntent({
  name: 'product-search',
  description: 'Search for products in the catalog',
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
  component: 'ProductGrid'
});

// Register Order Tracking Intent
server.registerIntent({
  name: 'order-tracking',
  description: 'Track order status and delivery information',
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
        description: 'Email associated with the order'
      }
    },
    required: ['orderId']
  },
  component: 'OrderStatus'
});

// Register Cart Management Intent
server.registerIntent({
  name: 'cart-management',
  description: 'Manage shopping cart items',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['add', 'remove', 'update', 'clear', 'view']
      },
      productId: {
        type: 'string',
        description: 'Product ID for cart operations'
      },
      quantity: {
        type: 'number',
        minimum: 1,
        description: 'Quantity of the product'
      }
    },
    required: ['action']
  },
  component: 'CartSummary'
});

// Register Customer Support Intent
server.registerIntent({
  name: 'customer-support',
  description: 'Handle customer support requests',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['general', 'order', 'product', 'billing', 'technical']
      },
      message: {
        type: 'string',
        description: 'Customer support message'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    },
    required: ['type', 'message']
  },
  component: 'SupportTicket'
});

// Register Product Grid Component
server.registerComponent({
  name: 'ProductGrid',
  description: 'Display products in a grid layout',
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
            description: { type: 'string' },
            price: { type: 'number' },
            originalPrice: { type: 'number' },
            currency: { type: 'string', default: 'USD' },
            imageUrl: { type: 'string' },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            reviewCount: { type: 'number' },
            inStock: { type: 'boolean' },
            category: { type: 'string' },
            brand: { type: 'string' }
          },
          required: ['id', 'name', 'price', 'imageUrl']
        }
      },
      recommendations: {
        type: 'array',
        items: { $ref: '#/properties/products/items' }
      },
      totalCount: { type: 'number' },
      query: { type: 'string' }
    },
    required: ['products']
  }
});

// Register Order Status Component
server.registerComponent({
  name: 'OrderStatus',
  description: 'Display order tracking information',
  props: {
    type: 'object',
    properties: {
      order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                name: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' }
              }
            }
          },
          total: { type: 'number' },
          estimatedDelivery: { type: 'string', format: 'date' },
          trackingNumber: { type: 'string' },
          shippingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' }
            }
          }
        },
        required: ['id', 'status', 'items', 'total']
      },
      trackingEvents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    },
    required: ['order']
  }
});

// Register Cart Summary Component
server.registerComponent({
  name: 'CartSummary',
  description: 'Display shopping cart summary',
  props: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'number' },
            imageUrl: { type: 'string' },
            inStock: { type: 'boolean' }
          }
        }
      },
      subtotal: { type: 'number' },
      tax: { type: 'number' },
      shipping: { type: 'number' },
      total: { type: 'number' },
      currency: { type: 'string', default: 'USD' },
      itemCount: { type: 'number' }
    },
    required: ['items', 'subtotal', 'total']
  }
});

// Register Support Ticket Component
server.registerComponent({
  name: 'SupportTicket',
  description: 'Display customer support ticket',
  props: {
    type: 'object',
    properties: {
      ticket: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          subject: { type: 'string' },
          status: {
            type: 'string',
            enum: ['open', 'in-progress', 'resolved', 'closed']
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent']
          },
          createdAt: { type: 'string', format: 'date-time' },
          estimatedResponse: { type: 'string' }
        },
        required: ['id', 'type', 'subject', 'status']
      },
      suggestedActions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            action: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    },
    required: ['ticket']
  }
});

// Intent Processing Logic
server.use(async (req, res, next) => {
  const { intent, parameters } = req.body;
  
  try {
    switch (intent) {
      case 'product-search':
        const searchResults = await productService.search({
          query: parameters.query,
          category: parameters.category,
          priceRange: parameters.priceRange,
          sortBy: parameters.sortBy,
          limit: parameters.limit,
          userId: req.user?.id
        });
        
        const recommendations = req.user?.id 
          ? await productService.getRecommendations(req.user.id, 3)
          : [];
        
        req.componentProps = {
          products: searchResults,
          recommendations,
          totalCount: searchResults.length,
          query: parameters.query
        };
        break;
        
      case 'order-tracking':
        const order = await orderService.getOrder(parameters.orderId, parameters.email);
        const trackingEvents = await orderService.getTrackingEvents(parameters.orderId);
        
        req.componentProps = {
          order,
          trackingEvents
        };
        break;
        
      case 'cart-management':
        let cartData;
        
        switch (parameters.action) {
          case 'add':
            cartData = await cartService.addItem(req.user.id, parameters.productId, parameters.quantity);
            break;
          case 'remove':
            cartData = await cartService.removeItem(req.user.id, parameters.productId);
            break;
          case 'update':
            cartData = await cartService.updateQuantity(req.user.id, parameters.productId, parameters.quantity);
            break;
          case 'clear':
            cartData = await cartService.clearCart(req.user.id);
            break;
          case 'view':
          default:
            cartData = await cartService.getCart(req.user.id);
            break;
        }
        
        req.componentProps = cartData;
        break;
        
      case 'customer-support':
        const ticket = await userService.createSupportTicket({
          userId: req.user?.id,
          type: parameters.type,
          message: parameters.message,
          priority: parameters.priority
        });
        
        const suggestedActions = await userService.getSuggestedActions(parameters.type);
        
        req.componentProps = {
          ticket,
          suggestedActions
        };
        break;
    }
    
    next();
  } catch (error) {
    console.error(`Error processing ${intent}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start server
server.start().then(() => {
  console.log('E-commerce IXP Server started successfully');
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default server;
```

## Customer Support Bot

An intelligent customer support bot that handles common inquiries and escalates complex issues.

```typescript
// customer-support-bot/src/server.ts
import { IXPServer } from '@toopi/ixp-server-sdk';
import { KnowledgeBaseService } from './services/knowledge-base';
import { TicketingService } from './services/ticketing';
import { NLPService } from './services/nlp';

const server = new IXPServer({
  port: 3001,
  cors: { origin: '*' }
});

const knowledgeBase = new KnowledgeBaseService();
const ticketing = new TicketingService();
const nlp = new NLPService();

// FAQ Intent
server.registerIntent({
  name: 'faq-query',
  description: 'Answer frequently asked questions',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'User question or query'
      },
      category: {
        type: 'string',
        enum: ['billing', 'technical', 'account', 'product', 'shipping'],
        description: 'Question category'
      }
    },
    required: ['question']
  },
  component: 'FAQResponse'
});

// Ticket Creation Intent
server.registerIntent({
  name: 'create-ticket',
  description: 'Create a support ticket for complex issues',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'Ticket subject'
      },
      description: {
        type: 'string',
        description: 'Detailed description of the issue'
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      category: {
        type: 'string',
        enum: ['billing', 'technical', 'account', 'product', 'shipping']
      }
    },
    required: ['subject', 'description', 'category']
  },
  component: 'TicketConfirmation'
});

// Live Chat Intent
server.registerIntent({
  name: 'live-chat',
  description: 'Connect with a live support agent',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'Reason for requesting live chat'
      },
      urgency: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    },
    required: ['reason']
  },
  component: 'LiveChatQueue'
});

// Register Components
server.registerComponent({
  name: 'FAQResponse',
  description: 'Display FAQ answer with related articles',
  props: {
    type: 'object',
    properties: {
      answer: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          helpful: { type: 'boolean' }
        }
      },
      relatedArticles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            url: { type: 'string' }
          }
        }
      },
      escalationOptions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            action: { type: 'string' }
          }
        }
      }
    },
    required: ['answer']
  }
});

server.registerComponent({
  name: 'TicketConfirmation',
  description: 'Display ticket creation confirmation',
  props: {
    type: 'object',
    properties: {
      ticketId: { type: 'string' },
      estimatedResponse: { type: 'string' },
      status: { type: 'string' },
      nextSteps: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['ticketId', 'status']
  }
});

server.registerComponent({
  name: 'LiveChatQueue',
  description: 'Display live chat queue status',
  props: {
    type: 'object',
    properties: {
      queuePosition: { type: 'number' },
      estimatedWait: { type: 'string' },
      availableAgents: { type: 'number' },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            action: { type: 'string' }
          }
        }
      }
    },
    required: ['queuePosition', 'estimatedWait']
  }
});

// Processing middleware
server.use(async (req, res, next) => {
  const { intent, parameters } = req.body;
  
  try {
    switch (intent) {
      case 'faq-query':
        const answer = await knowledgeBase.searchFAQ(parameters.question, parameters.category);
        const relatedArticles = await knowledgeBase.getRelatedArticles(parameters.question, 3);
        
        req.componentProps = {
          answer,
          relatedArticles,
          escalationOptions: [
            { label: 'Create Ticket', action: 'create-ticket' },
            { label: 'Live Chat', action: 'live-chat' }
          ]
        };
        break;
        
      case 'create-ticket':
        const ticket = await ticketing.createTicket({
          subject: parameters.subject,
          description: parameters.description,
          priority: parameters.priority,
          category: parameters.category,
          userId: req.user?.id
        });
        
        req.componentProps = {
          ticketId: ticket.id,
          estimatedResponse: ticket.estimatedResponse,
          status: ticket.status,
          nextSteps: [
            'You will receive an email confirmation',
            'Our team will review your ticket',
            'Expect a response within the estimated timeframe'
          ]
        };
        break;
        
      case 'live-chat':
        const queueInfo = await ticketing.getLiveChatQueue();
        
        req.componentProps = {
          queuePosition: queueInfo.position,
          estimatedWait: queueInfo.estimatedWait,
          availableAgents: queueInfo.availableAgents,
          alternatives: [
            {
              type: 'FAQ',
              description: 'Search our knowledge base',
              action: 'faq-query'
            },
            {
              type: 'Ticket',
              description: 'Create a support ticket',
              action: 'create-ticket'
            }
          ]
        };
        break;
    }
    
    next();
  } catch (error) {
    console.error(`Error processing ${intent}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.start();
```

## Smart Home Controller

A smart home automation system that controls various IoT devices.

```typescript
// smart-home/src/server.ts
import { IXPServer } from '@toopi/ixp-server-sdk';
import { DeviceManager } from './services/device-manager';
import { SceneManager } from './services/scene-manager';
import { SecurityService } from './services/security';

const server = new IXPServer({
  port: 3002,
  cors: { origin: '*' }
});

const deviceManager = new DeviceManager();
const sceneManager = new SceneManager();
const security = new SecurityService();

// Device Control Intent
server.registerIntent({
  name: 'device-control',
  description: 'Control smart home devices',
  parameters: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Device identifier'
      },
      action: {
        type: 'string',
        enum: ['turn_on', 'turn_off', 'set_brightness', 'set_temperature', 'set_color']
      },
      value: {
        type: 'number',
        description: 'Value for the action (brightness, temperature, etc.)'
      },
      color: {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$',
        description: 'Hex color code'
      }
    },
    required: ['deviceId', 'action']
  },
  component: 'DeviceStatus'
});

// Scene Management Intent
server.registerIntent({
  name: 'scene-control',
  description: 'Activate or manage scenes',
  parameters: {
    type: 'object',
    properties: {
      sceneId: {
        type: 'string',
        description: 'Scene identifier'
      },
      action: {
        type: 'string',
        enum: ['activate', 'deactivate', 'create', 'delete', 'list']
      },
      sceneName: {
        type: 'string',
        description: 'Name for new scene'
      }
    },
    required: ['action']
  },
  component: 'SceneStatus'
});

// Security System Intent
server.registerIntent({
  name: 'security-control',
  description: 'Control security system',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['arm', 'disarm', 'status', 'history']
      },
      mode: {
        type: 'string',
        enum: ['home', 'away', 'night'],
        description: 'Security mode when arming'
      }
    },
    required: ['action']
  },
  component: 'SecurityStatus'
});

// Register Components
server.registerComponent({
  name: 'DeviceStatus',
  description: 'Display device status and controls',
  props: {
    type: 'object',
    properties: {
      device: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          isOnline: { type: 'boolean' },
          battery: { type: 'number' },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      availableActions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            label: { type: 'string' },
            parameters: { type: 'object' }
          }
        }
      }
    },
    required: ['device']
  }
});

server.registerComponent({
  name: 'SceneStatus',
  description: 'Display scene information and controls',
  props: {
    type: 'object',
    properties: {
      scenes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            isActive: { type: 'boolean' },
            deviceCount: { type: 'number' },
            lastActivated: { type: 'string', format: 'date-time' }
          }
        }
      },
      activeScene: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          activatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
});

server.registerComponent({
  name: 'SecurityStatus',
  description: 'Display security system status',
  props: {
    type: 'object',
    properties: {
      system: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['armed', 'disarmed', 'triggered', 'maintenance']
          },
          mode: {
            type: 'string',
            enum: ['home', 'away', 'night']
          },
          lastChanged: { type: 'string', format: 'date-time' },
          sensors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string' },
                battery: { type: 'number' }
              }
            }
          }
        }
      },
      recentEvents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            type: { type: 'string' },
            description: { type: 'string' },
            sensorId: { type: 'string' }
          }
        }
      }
    },
    required: ['system']
  }
});

// Processing middleware
server.use(async (req, res, next) => {
  const { intent, parameters } = req.body;
  
  try {
    switch (intent) {
      case 'device-control':
        const device = await deviceManager.controlDevice(
          parameters.deviceId,
          parameters.action,
          { value: parameters.value, color: parameters.color }
        );
        
        const availableActions = await deviceManager.getAvailableActions(parameters.deviceId);
        
        req.componentProps = {
          device,
          availableActions
        };
        break;
        
      case 'scene-control':
        let sceneData;
        
        switch (parameters.action) {
          case 'activate':
            sceneData = await sceneManager.activateScene(parameters.sceneId);
            break;
          case 'deactivate':
            sceneData = await sceneManager.deactivateScene(parameters.sceneId);
            break;
          case 'create':
            sceneData = await sceneManager.createScene(parameters.sceneName);
            break;
          case 'delete':
            sceneData = await sceneManager.deleteScene(parameters.sceneId);
            break;
          case 'list':
          default:
            sceneData = await sceneManager.listScenes();
            break;
        }
        
        const activeScene = await sceneManager.getActiveScene();
        
        req.componentProps = {
          scenes: sceneData,
          activeScene
        };
        break;
        
      case 'security-control':
        let securityData;
        
        switch (parameters.action) {
          case 'arm':
            securityData = await security.armSystem(parameters.mode);
            break;
          case 'disarm':
            securityData = await security.disarmSystem();
            break;
          case 'status':
          default:
            securityData = await security.getSystemStatus();
            break;
        }
        
        const recentEvents = await security.getRecentEvents(10);
        
        req.componentProps = {
          system: securityData,
          recentEvents
        };
        break;
    }
    
    next();
  } catch (error) {
    console.error(`Error processing ${intent}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.start();
```

## Financial Services Assistant

A financial services assistant for account management and transaction processing.

```typescript
// financial-services/src/server.ts
import { IXPServer } from '@toopi/ixp-server-sdk';
import { AccountService } from './services/account-service';
import { TransactionService } from './services/transaction-service';
import { InvestmentService } from './services/investment-service';
import { securityMiddleware } from './middleware/security';

const server = new IXPServer({
  port: 3003,
  cors: { origin: 'https://secure-bank.com' },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 50 // Stricter rate limiting for financial services
  }
});

const accountService = new AccountService();
const transactionService = new TransactionService();
const investmentService = new InvestmentService();

// Add security middleware
server.use(securityMiddleware);

// Account Balance Intent
server.registerIntent({
  name: 'account-balance',
  description: 'Check account balance and recent transactions',
  parameters: {
    type: 'object',
    properties: {
      accountId: {
        type: 'string',
        description: 'Account identifier'
      },
      includeTransactions: {
        type: 'boolean',
        default: true,
        description: 'Include recent transactions'
      }
    },
    required: ['accountId']
  },
  component: 'AccountSummary'
});

// Transfer Money Intent
server.registerIntent({
  name: 'transfer-money',
  description: 'Transfer money between accounts',
  parameters: {
    type: 'object',
    properties: {
      fromAccount: {
        type: 'string',
        description: 'Source account ID'
      },
      toAccount: {
        type: 'string',
        description: 'Destination account ID'
      },
      amount: {
        type: 'number',
        minimum: 0.01,
        description: 'Transfer amount'
      },
      description: {
        type: 'string',
        description: 'Transfer description'
      }
    },
    required: ['fromAccount', 'toAccount', 'amount']
  },
  component: 'TransferConfirmation'
});

// Investment Portfolio Intent
server.registerIntent({
  name: 'investment-portfolio',
  description: 'View investment portfolio and performance',
  parameters: {
    type: 'object',
    properties: {
      portfolioId: {
        type: 'string',
        description: 'Portfolio identifier'
      },
      timeframe: {
        type: 'string',
        enum: ['1d', '1w', '1m', '3m', '1y', 'all'],
        default: '1m',
        description: 'Performance timeframe'
      }
    },
    required: ['portfolioId']
  },
  component: 'PortfolioSummary'
});

// Register Components
server.registerComponent({
  name: 'AccountSummary',
  description: 'Display account balance and transaction history',
  props: {
    type: 'object',
    properties: {
      account: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          balance: { type: 'number' },
          currency: { type: 'string' },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string', format: 'date' },
            description: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string' },
            balance: { type: 'number' }
          }
        }
      }
    },
    required: ['account']
  }
});

server.registerComponent({
  name: 'TransferConfirmation',
  description: 'Display transfer confirmation details',
  props: {
    type: 'object',
    properties: {
      transfer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fromAccount: { type: 'string' },
          toAccount: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          status: { type: 'string' },
          processedAt: { type: 'string', format: 'date-time' },
          confirmationNumber: { type: 'string' }
        }
      },
      fees: {
        type: 'object',
        properties: {
          transferFee: { type: 'number' },
          totalAmount: { type: 'number' }
        }
      }
    },
    required: ['transfer']
  }
});

server.registerComponent({
  name: 'PortfolioSummary',
  description: 'Display investment portfolio performance',
  props: {
    type: 'object',
    properties: {
      portfolio: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          totalValue: { type: 'number' },
          dayChange: { type: 'number' },
          dayChangePercent: { type: 'number' },
          totalReturn: { type: 'number' },
          totalReturnPercent: { type: 'number' }
        }
      },
      holdings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            name: { type: 'string' },
            shares: { type: 'number' },
            currentPrice: { type: 'number' },
            marketValue: { type: 'number' },
            dayChange: { type: 'number' },
            dayChangePercent: { type: 'number' }
          }
        }
      },
      performance: {
        type: 'object',
        properties: {
          timeframe: { type: 'string' },
          startValue: { type: 'number' },
          endValue: { type: 'number' },
          return: { type: 'number' },
          returnPercent: { type: 'number' }
        }
      }
    },
    required: ['portfolio', 'holdings']
  }
});

// Processing middleware
server.use(async (req, res, next) => {
  const { intent, parameters } = req.body;
  
  try {
    switch (intent) {
      case 'account-balance':
        const account = await accountService.getAccount(parameters.accountId, req.user.id);
        const transactions = parameters.includeTransactions 
          ? await transactionService.getRecentTransactions(parameters.accountId, 10)
          : [];
        
        req.componentProps = {
          account,
          transactions
        };
        break;
        
      case 'transfer-money':
        const transfer = await transactionService.transferMoney({
          fromAccount: parameters.fromAccount,
          toAccount: parameters.toAccount,
          amount: parameters.amount,
          description: parameters.description,
          userId: req.user.id
        });
        
        const fees = await transactionService.calculateFees(parameters.amount);
        
        req.componentProps = {
          transfer,
          fees
        };
        break;
        
      case 'investment-portfolio':
        const portfolio = await investmentService.getPortfolio(parameters.portfolioId, req.user.id);
        const holdings = await investmentService.getHoldings(parameters.portfolioId);
        const performance = await investmentService.getPerformance(
          parameters.portfolioId,
          parameters.timeframe
        );
        
        req.componentProps = {
          portfolio,
          holdings,
          performance
        };
        break;
    }
    
    next();
  } catch (error) {
    console.error(`Error processing ${intent}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.start();
```

These real-world examples demonstrate how to build production-ready IXP Server applications across different industries. Each example includes:

- **Proper Intent Definitions**: Using JSON schema for parameter validation
- **Component Specifications**: Detailed component props with type safety
- **Service Integration**: Connecting with external services and databases
- **Security Considerations**: Authentication, authorization, and rate limiting
- **Error Handling**: Comprehensive error management
- **Middleware Usage**: Custom middleware for cross-cutting concerns
- **Industry-Specific Features**: Tailored functionality for each domain

## Key Takeaways

1. **Structure**: Organize your IXP server with clear separation of concerns
2. **Validation**: Use JSON schema for robust parameter validation
3. **Security**: Implement appropriate security measures for your domain
4. **Error Handling**: Provide meaningful error messages and fallbacks
5. **Performance**: Consider caching, rate limiting, and optimization
6. **Monitoring**: Add logging and analytics for production deployments
7. **Testing**: Write comprehensive tests for your intents and components
8. **Documentation**: Document your APIs and provide clear examples

These patterns can be adapted and extended for your specific use cases and requirements.