/**
 * E-commerce IXP Server Example
 *
 * This example demonstrates how to create an e-commerce IXP server using the SDK.
 * It showcases:
 * - E-commerce specific intents (product search, cart management, checkout)
 * - React component integration
 * - Mock API data for products, categories, and orders
 * - RESTful API endpoints alongside IXP functionality
 */

import express from 'express';
import { createIXPApp, type IntentDefinition, type ComponentDefinition, type IntentRequest, type CrawlerContentOptions } from '@ixp/server-sdk';
import { v4 as uuidv4 } from 'uuid';
import { mockProducts, mockCategories, mockCarts, getProductById, getProductsByCategory, getCategoryById, searchProducts, getCartByUserId } from './src/data/mockData.js';

// Define e-commerce specific intents
const intents: IntentDefinition[] = [
  {
    name: 'product_search',
    description: 'Search for products by name, category, or tags',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for products'
        },
        category: {
          type: 'string',
          description: 'Filter by category ID'
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 50,
          description: 'Maximum number of products to return'
        }
      }
    },
    component: 'ProductList',
    version: '1.0.0',
    crawlable: true
  },
  {
    name: 'show_categories',
    description: 'Display available product categories',
    parameters: {
      type: 'object',
      properties: {}
    },
    component: 'CategoryGrid',
    version: '1.0.0',
    crawlable: true
  },
  {
    name: 'show_cart',
    description: 'Display shopping cart contents',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to fetch cart for'
        }
      },
      required: ['userId']
    },
    component: 'ShoppingCart',
    version: '1.0.0',
    crawlable: false
  }
];

// Define React components
const components: Record<string, ComponentDefinition> = {
  ProductList: {
    name: 'ProductList',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/ProductList.js',
    exportName: 'ProductList',
    propsSchema: {
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
              image: { type: 'string' },
              category: { type: 'string' },
              inStock: { type: 'boolean' },
              rating: { type: 'number' }
            }
          }
        },
        loading: { type: 'boolean' }
      }
    },
    version: '1.0.0',
    allowedOrigins: ['*'],
    bundleSize: '25KB',
    performance: {
      tti: '0.5s',
      bundleSizeGzipped: '8KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '100KB',
      sandboxed: true
    }
  },
  CategoryGrid: {
    name: 'CategoryGrid',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/CategoryGrid.js',
    exportName: 'CategoryGrid',
    propsSchema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              image: { type: 'string' },
              productCount: { type: 'number' }
            }
          }
        }
      }
    },
    version: '1.0.0',
    allowedOrigins: ['*'],
    bundleSize: '15KB',
    performance: {
      tti: '0.3s',
      bundleSizeGzipped: '5KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '50KB',
      sandboxed: true
    }
  },
  ShoppingCart: {
    name: 'ShoppingCart',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/ShoppingCart.js',
    exportName: 'ShoppingCart',
    propsSchema: {
      type: 'object',
      properties: {
        cart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            items: { type: 'array' },
            total: { type: 'number' }
          }
        }
      }
    },
    version: '1.0.0',
    allowedOrigins: ['*'],
    bundleSize: '20KB',
    performance: {
      tti: '0.4s',
      bundleSizeGzipped: '7KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '75KB',
      sandboxed: true
    }
  },
  ProductCard: {
    name: 'ProductCard',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/ProductCard.js',
    exportName: 'ProductCard',
    propsSchema: {
      type: 'object',
      properties: {
        product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            image: { type: 'string' },
            category: { type: 'string' },
            inStock: { type: 'boolean' },
            rating: { type: 'number' }
          }
        }
      }
    },
    version: '1.0.0',
    allowedOrigins: ['*'],
    bundleSize: '10KB',
    performance: {
      tti: '0.2s',
      bundleSizeGzipped: '3KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '30KB',
      sandboxed: true
    }
  }
};

// Create data provider for e-commerce intents
const ecommerceDataProvider = {
  async resolveIntentData(intent: IntentRequest, _context?: any) {
    console.log(`🔍 Resolving data for intent: ${intent.name}`, intent.parameters);
    
    switch (intent.name) {
      case 'product_search': {
        const { query, category, limit = 10 } = intent.parameters;
        let products = [];
        
        if (query) {
          products = searchProducts(query);
        } else if (category) {
          products = getProductsByCategory(category);
        } else {
          products = mockProducts;
        }
        
        // Apply limit
        if (limit && limit > 0) {
          products = products.slice(0, limit);
        }
        
        console.log(`📦 Found ${products.length} products`);
        return { products };
      }
      
      case 'show_categories': {
        console.log(`📂 Returning ${mockCategories.length} categories`);
        return { categories: mockCategories };
      }
      
      case 'show_cart': {
        const { userId } = intent.parameters;
        const cart = getCartByUserId(userId);
        console.log(`🛒 Found cart for user ${userId}:`, cart ? 'exists' : 'not found');
        return { cart: cart || { id: userId, items: [], total: 0 } };
      }
      
      default:
        console.warn(`⚠️ Unknown intent: ${intent.name}`);
        return {};
    }
  },
  
  async resolveComponentData(componentName: string, queryParams: any, _context?: any) {
    console.log(`🔧 Resolving component data for: ${componentName}`, queryParams);
    
    switch (componentName) {
      case 'ProductList': {
        const query = queryParams.query || '';
        const category = queryParams.category;
        const limit = parseInt(queryParams.limit) || 10;
        
        let filteredProducts = mockProducts;
        if (query) {
          filteredProducts = searchProducts(query);
        }
        if (category) {
          filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        console.log(`📦 Found ${filteredProducts.length} products for ProductList`);
        return {
          products: filteredProducts.slice(0, limit),
          loading: false
        };
      }
      
      case 'CategoryGrid': {
        console.log(`📂 Returning ${mockCategories.length} categories for CategoryGrid`);
        return {
          categories: mockCategories
        };
      }
      
      case 'ShoppingCart': {
        const userId = queryParams.userId || 'user1';
        const cart = getCartByUserId(userId);
        console.log(`🛒 Found cart for user ${userId} in ShoppingCart:`, cart ? 'exists' : 'not found');
        return {
          cart: cart || { id: userId, items: [], total: 0 }
        };
      }
      
      case 'ProductCard': {
        const productId = queryParams.productId;
        const product = getProductById(productId) || mockProducts[0];
        console.log(`📦 Found product for ProductCard:`, product ? product.name : 'not found');
        return {
          product
        };
      }
      
      default:
        console.warn(`⚠️ Unknown component: ${componentName}`);
        return {};
    }
  },
  
  async getCrawlerContent(options: CrawlerContentOptions) {
    // Return crawlable content for SEO/indexing
    // const crawlableIntents = ['product_search', 'show_categories'];
    const contents = [];
    
    // Add product pages
    for (const product of mockProducts.slice(0, options.limit || 50)) {
      contents.push({
        type: 'product',
        id: product.id,
        title: product.name,
        description: product.description,
        lastUpdated: new Date().toISOString(),
        url: `/products/${product.id}`,
        price: product.price,
        category: product.category
      });
    }
    
    // Add category pages
    for (const category of mockCategories) {
      contents.push({
        type: 'category',
        id: category.id,
        title: category.name,
        description: category.description,
        lastUpdated: new Date().toISOString(),
        url: `/categories/${category.id}`,
        productCount: category.productCount
      });
    }
    
    return {
      contents,
      pagination: {
        nextCursor: null,
        hasMore: false
      },
      lastUpdated: new Date().toISOString()
    };
  }
};

// Create Express app with IXP server mounted
// Define themes for the ecommerce application
const ecommerceThemes = [
  {
    name: 'default',
    mode: 'light' as const,
    colors: {
      primary: {
        main: '#007bff',
        light: '#66b3ff',
        dark: '#0056b3',
        contrast: '#ffffff'
      },
      secondary: {
        main: '#6c757d',
        light: '#adb5bd',
        dark: '#495057',
        contrast: '#ffffff'
      },
      background: {
        default: '#f8f9fa',
        paper: '#ffffff',
        elevated: '#ffffff'
      },
      text: {
        primary: '#333333',
        secondary: '#6c757d',
        disabled: '#adb5bd'
      },
      border: {
        default: '#e9ecef',
        light: '#f8f9fa',
        focus: '#007bff'
      },
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    breakpoints: {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px'
    },
    components: {
      ProductCard: {
        base: {
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          transition: 'all 0.2s ease'
        },
        variants: {
          featured: {
            border: '2px solid #007bff',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.15)'
          },
          sale: {
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107'
          }
        },
        sizes: {
          small: {
            padding: '12px',
            fontSize: '0.875rem'
          },
          large: {
            padding: '24px',
            fontSize: '1.125rem'
          }
        }
      },
      Button: {
        base: {
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: 'none'
        },
        variants: {
          primary: {
            backgroundColor: '#007bff',
            color: '#ffffff'
          },
          secondary: {
            backgroundColor: '#6c757d',
            color: '#ffffff'
          },
          outline: {
            backgroundColor: 'transparent',
            border: '2px solid #007bff',
            color: '#007bff'
          }
        },
        sizes: {
          small: {
            padding: '8px 16px',
            fontSize: '0.875rem'
          },
          large: {
            padding: '16px 24px',
            fontSize: '1.125rem'
          }
        }
      }
    }
  },
  {
    name: 'dark',
    mode: 'dark' as const,
    colors: {
      primary: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#1d4ed8',
        contrast: '#ffffff'
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
        contrast: '#ffffff'
      },
      background: {
        default: '#0f172a',
        paper: '#1e293b',
        elevated: '#334155'
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        disabled: '#64748b'
      },
      border: {
        default: '#334155',
        light: '#475569',
        focus: '#3b82f6'
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    breakpoints: {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px'
    },
    components: {
      ProductCard: {
        base: {
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          padding: '16px',
          transition: 'all 0.2s ease',
          border: '1px solid #334155'
        },
        variants: {
          featured: {
            border: '2px solid #3b82f6',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
          },
          sale: {
            backgroundColor: '#422006',
            border: '1px solid #f59e0b'
          }
        },
        sizes: {
          small: {
            padding: '12px',
            fontSize: '0.875rem'
          },
          large: {
            padding: '24px',
            fontSize: '1.125rem'
          }
        }
      },
      Button: {
        base: {
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: 'none'
        },
        variants: {
          primary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
          },
          secondary: {
            backgroundColor: '#64748b',
            color: '#ffffff'
          },
          outline: {
            backgroundColor: 'transparent',
            border: '2px solid #3b82f6',
            color: '#3b82f6'
          }
        },
        sizes: {
          small: {
            padding: '8px 16px',
            fontSize: '0.875rem'
          },
          large: {
            padding: '16px 24px',
            fontSize: '1.125rem'
          }
        }
      }
    }
  }
];

const app = createIXPApp({
  intents,
  components,
  dataProvider: ecommerceDataProvider,
  theme: ecommerceThemes,
  cors: {
    origins: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'],
    credentials: true
  },
  middleware: [],
  plugins: []
}, '/ixp');

// Get IXP server instance for later use
const server = (app as any).ixpServer;

// Add JSON body parser middleware for POST/PUT requests
app.use(express.json());

// Debug: Check if mockData is imported correctly
console.log('🔍 Debug: mockProducts length:', mockProducts?.length || 'undefined');
console.log('🔍 Debug: mockCategories length:', mockCategories?.length || 'undefined');

// Test route to verify Express app is working
app.get('/test', (_req, res) => {
  console.log('🔍 Debug: /test route hit');
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});
console.log('🔍 Debug: Registering /test route');

// REST API endpoints for direct data access
console.log('🔍 Debug: Registering /api/products route');
app.get('/api/products', (req, res) => {
  console.log('🔍 Debug: /api/products route hit');
  const { category, search, minPrice, maxPrice, inStock } = req.query;
  let products = mockProducts;
  
  if (search) {
    products = searchProducts(search as string);
  }
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (minPrice) {
    products = products.filter(p => p.price >= parseFloat(minPrice as string));
  }
  
  if (maxPrice) {
    products = products.filter(p => p.price <= parseFloat(maxPrice as string));
  }
  
  if (inStock !== undefined) {
    const stockFilter = inStock === 'true';
    products = products.filter(p => stockFilter ? p.inStock : !p.inStock);
  }
  
  res.json({
    products,
    total: products.length,
    page: 1,
    limit: products.length
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.get('/api/categories', (_req, res) => {
  res.json(mockCategories);
});

app.get('/api/categories/:id', (req, res) => {
  const category = getCategoryById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category);
});

app.get('/api/cart/:userId', (req, res) => {
  const cart = getCartByUserId(req.params.userId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }
  
  const enrichedCart = {
    ...cart,
    items: cart.items.map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        product,
        subtotal: product ? product.price * item.quantity : 0
      };
    })
  };
  
  res.json(enrichedCart);
});

// Add item to cart
app.post('/api/cart/:userId/items', (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Product ID is required'
      });
    }

    const product = getProductById(productId);
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: `Product with ID ${productId} not found`
      });
    }

    if (!product.inStock) {
      return res.status(400).json({ 
        error: 'Product unavailable',
        message: 'Product is out of stock'
      });
    }

    let cart = getCartByUserId(userId);
     if (!cart) {
       // Create new cart if it doesn't exist
       cart = {
         id: uuidv4(),
         userId,
         items: [],
         total: 0,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString()
       };
       mockCarts.push(cart);
     }

     // Check if item already exists in cart
     const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
     
     if (existingItemIndex >= 0) {
       // Update quantity
       cart.items[existingItemIndex].quantity += quantity;
     } else {
       // Add new item
       cart.items.push({
         id: uuidv4(),
         productId,
         quantity,
         price: product.price,
         addedAt: new Date().toISOString()
       });
     }

     // Recalculate total
     cart.total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
     cart.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
app.put('/api/cart/:userId/items/:itemId', (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Valid quantity is required'
      });
    }

    const cart = getCartByUserId(userId);
    if (!cart) {
      return res.status(404).json({ 
        error: 'Cart not found',
        message: `No cart found for user ${userId}`
      });
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        error: 'Item not found',
        message: 'Item not found in cart'
      });
    }

    if (quantity === 0) {
       // Remove item if quantity is 0
       cart.items.splice(itemIndex, 1);
     } else {
       // Update quantity
       cart.items[itemIndex].quantity = quantity;
     }

     // Recalculate total
     cart.total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
     cart.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: cart,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update cart item'
    });
  }
});

// Remove item from cart
app.delete('/api/cart/:userId/items/:itemId', (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    const cart = getCartByUserId(userId);
    if (!cart) {
      return res.status(404).json({ 
        error: 'Cart not found',
        message: `No cart found for user ${userId}`
      });
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        error: 'Item not found',
        message: 'Item not found in cart'
      });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate total
     cart.total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
     cart.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: cart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to remove cart item'
    });
  }
});

// Clear cart
app.delete('/api/cart/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = getCartByUserId(userId);
    if (!cart) {
      return res.status(404).json({ 
        error: 'Cart not found',
        message: `No cart found for user ${userId}`
      });
    }

    // Clear all items
     cart.items = [];
     cart.total = 0;
     cart.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: cart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to clear cart'
    });
  }
});

// Checkout - Create order from cart
app.post('/api/checkout/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Shipping address and payment method are required'
      });
    }

    const cart = getCartByUserId(userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        error: 'Empty cart',
        message: 'Cannot checkout with empty cart'
      });
    }

    // Create order
     const order = {
       id: uuidv4(),
       userId,
       items: cart.items,
       total: cart.total,
       shippingAddress,
       paymentMethod,
       status: 'pending' as const,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString()
     };

     // Clear cart after successful order creation
     cart.items = [];
     cart.total = 0;
     cart.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process checkout'
    });
  }
});

// HTML rendering endpoint for IXP intents
app.post('/api/render-ui', async (req, res) => {
  try {
    const { intent, parameters } = req.body;
    
    if (!intent) {
      return res.status(400).json({ error: 'Intent is required' });
    }

    // Find the intent definition
    const intentDef = intents.find(i => i.name === intent);
    if (!intentDef) {
      return res.status(404).json({ error: `Intent '${intent}' not found` });
    }

    // Resolve data for the intent
    const data = await ecommerceDataProvider.resolveIntentData({ name: intent, parameters });
    
    // Get component definition
    const componentDef = components[intentDef.component];
    if (!componentDef) {
      return res.status(404).json({ error: `Component '${intentDef.component}' not found` });
    }

    // Generate HTML with embedded data and basic styling
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${intentDef.description}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .product-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: white; }
    .product-image { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
    .product-name { font-weight: bold; margin: 10px 0 5px; }
    .product-price { color: #e74c3c; font-size: 18px; font-weight: bold; }
    .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
    .category-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; background: white; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${intentDef.description}</h1>
    <div id="component-content">
      ${generateComponentHTML(intentDef.component, data)}
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error rendering UI:', error);
    res.status(500).json({ error: 'Failed to render UI' });
  }
});

/**
 * AUTOMATIC /view/:componentName ROUTES
 * 
 * The IXP Server SDK automatically provides /view/:componentName routes for all registered components.
 * These routes are used for iframe embedding and component previews.
 * 
 * HOW IT WORKS:
 * 1. When a request is made to /view/ComponentName?param1=value1&param2=value2
 * 2. The SDK extracts query parameters and passes them as initial props
 * 3. If a dataProvider.resolveComponentData method is provided, it's called to resolve additional data
 * 4. The resolved data is merged with query parameters and passed to the component
 * 5. The component is rendered as HTML and returned
 * 
 * CUSTOMIZING COMPONENT DATA:
 * Implement the resolveComponentData method in your dataProvider:
 * 
 * dataProvider: {
 *   async resolveComponentData(componentName, queryParams, context) {
 *     switch (componentName) {
 *       case 'ProductList':
 *         // Custom logic to fetch and filter products
 *         return { products: [...], loading: false };
 *       default:
 *         return {};
 *     }
 *   }
 * }
 * 
 * BENEFITS:
 * - No need to manually create /view routes for each component
 * - Consistent behavior across all components
 * - Automatic data resolution with fallback to query parameters
 * - Built-in error handling and security features
 */

// Helper function to generate HTML for different components
function generateComponentHTML(componentName: string, data: any): string {
  switch (componentName) {
    case 'ProductList':
      if (!data.products || data.products.length === 0) {
        return '<p>No products found.</p>';
      }
      return `
        <div class="product-grid">
          ${data.products.map((product: any) => `
            <div class="product-card">
              <img src="${product.image}" alt="${product.name}" class="product-image" />
              <div class="product-name">${product.name}</div>
              <div class="product-price">$${product.price}</div>
              <p>${product.description}</p>
              <div style="margin-top: 10px;">
                <span style="background: ${product.inStock ? '#27ae60' : '#e74c3c'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ${product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    
    case 'CategoryGrid':
      if (!data.categories || data.categories.length === 0) {
        return '<p>No categories found.</p>';
      }
      return `
        <div class="category-grid">
          ${data.categories.map((category: any) => `
            <div class="category-card">
              <img src="${category.image}" alt="${category.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;" />
              <h3>${category.name}</h3>
              <p>${category.description}</p>
              <small>${category.productCount} products</small>
            </div>
          `).join('')}
        </div>
      `;
    
    case 'ShoppingCart':
      if (!data.cart || !data.cart.items || data.cart.items.length === 0) {
        return '<p>Your cart is empty.</p>';
      }
      return `
        <div>
          <h2>Shopping Cart</h2>
          ${data.cart.items.map((item: any) => {
            const product = getProductById(item.productId);
            return `
              <div class="cart-item">
                <div>
                  <strong>${product?.name || 'Unknown Product'}</strong>
                  <br>
                  <small>Quantity: ${item.quantity}</small>
                </div>
                <div>$${((product?.price || 0) * item.quantity).toFixed(2)}</div>
              </div>
            `;
          }).join('')}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; font-size: 18px; font-weight: bold;">
            Total: $${data.cart.total.toFixed(2)}
          </div>
        </div>
      `;
    
    case 'ProductCard':
      if (!data.product) {
        return '<p>Product not found.</p>';
      }
      return `
        <div class="product-card" style="max-width: 300px;">
          <img src="${data.product.image}" alt="${data.product.name}" class="product-image" />
          <div class="product-name">${data.product.name}</div>
          <div class="product-price">$${data.product.price}</div>
          <p>${data.product.description}</p>
          <div style="margin-top: 10px;">
            <span style="background: ${data.product.inStock ? '#27ae60' : '#e74c3c'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${data.product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      `;
    
    default:
      return `<p>Component '${componentName}' not implemented for HTML rendering.</p>`;
  }
}

// Demo page
// Serve static files
app.use('/static', express.static(__dirname + '/src/styles'));

app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-commerce IXP Server Demo</title>
        <link rel="stylesheet" href="/static/main.css">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eee;
            }
            .endpoints {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .endpoint {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }
            .endpoint h3 {
                margin: 0 0 10px 0;
                color: #007bff;
            }
            .endpoint code {
                background: #e9ecef;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Monaco', 'Consolas', monospace;
            }
            .method {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 8px;
            }
            .get { background: #28a745; color: white; }
            .post { background: #007bff; color: white; }
            .examples {
                background: #fff3cd;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #ffc107;
            }
            .examples h3 {
                margin: 0 0 15px 0;
                color: #856404;
            }
            .example-link {
                display: block;
                margin: 8px 0;
                color: #007bff;
                text-decoration: none;
            }
            .example-link:hover {
                text-decoration: underline;
            }
            .demo-section {
                background: #e7f3ff;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #007bff;
                margin-bottom: 20px;
            }
            .demo-section h3 {
                margin: 0 0 15px 0;
                color: #0056b3;
            }
            .demo-link {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin-top: 10px;
            }
            .demo-link:hover {
                background: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛒 E-commerce IXP Server</h1>
                <p>A comprehensive e-commerce example built with IXP Server SDK</p>
                <p><strong>Server running on port 3001</strong></p>
            </div>
            
            <div class="demo-section">
                <h3>🎨 Theme System Demo</h3>
                <p>Experience the IXP Server SDK's dynamic theme system with light/dark mode switching and component-specific styling.</p>
                <a href="/demo" class="demo-link">View Theme Demo</a>
            </div>
            
            <div class="endpoints">
                <div class="endpoint">
                    <h3>IXP Endpoints</h3>
                    <p><span class="method get">GET</span><code>/ixp/intents</code> - Available intents</p>
                    <p><span class="method get">GET</span><code>/ixp/components</code> - Registered components</p>
                    <p><span class="method post">POST</span><code>/ixp/render</code> - Render components</p>
                    <p><span class="method get">GET</span><code>/ixp/health</code> - Health check</p>
                </div>
                
                <div class="endpoint">
                    <h3>Product API</h3>
                    <p><span class="method get">GET</span><code>/api/products</code> - All products</p>
                    <p><span class="method get">GET</span><code>/api/products/:id</code> - Single product</p>
                    <p><span class="method get">GET</span><code>/api/categories</code> - All categories</p>
                    <p><span class="method get">GET</span><code>/api/categories/:id</code> - Single category</p>
                </div>
                
                <div class="endpoint">
                    <h3>Cart API</h3>
                    <p><span class="method get">GET</span><code>/api/cart/:userId</code> - User's cart</p>
                    <p>Example: <code>/api/cart/user1</code></p>
                </div>
            </div>
            
            <div class="examples">
                <h3>🔗 Try These Examples</h3>
                <a href="/api/products" class="example-link">View All Products</a>
                <a href="/api/products?category=electronics" class="example-link">Electronics Products</a>
                <a href="/api/products?search=laptop" class="example-link">Search for Laptops</a>
                <a href="/api/categories" class="example-link">View All Categories</a>
                <a href="/api/cart/user1" class="example-link">View User1's Cart</a>
                <a href="/ixp/intents" class="example-link">IXP Intents Discovery</a>
                <a href="/ixp/components" class="example-link">IXP Components Registry</a>
                <a href="/ixp/health" class="example-link">Health Check</a>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666;">
                <p>This server demonstrates e-commerce functionality with IXP Server SDK integration.</p>
                <p>Check the console for server logs and visit the endpoints above to explore the API.</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Serve the theme demo page
app.get('/demo', (_req, res) => {
  res.sendFile(__dirname + '/demo.html');
});

// Start server
const PORT = 3001;

// Initialize IXP server before starting
server.initialize().then(() => {
  app.listen(PORT, () => {
    console.log('🛒 E-commerce IXP Server started successfully!');
    console.log('📍 Server: http://localhost:' + PORT);
    console.log('🔍 API Docs: http://localhost:' + PORT);
    console.log('💡 Try: http://localhost:' + PORT + '/api/products');
    console.log('🔧 IXP endpoints available at: http://localhost:' + PORT + '/ixp');
  });
}).catch((error: any) => {
  console.error('Failed to initialize IXP server:', error);
  process.exit(1);
});

export default server;