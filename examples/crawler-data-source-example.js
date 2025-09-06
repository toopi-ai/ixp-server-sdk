/**
 * Example: How to register and use crawler data sources with IXP Server
 * This demonstrates exposing data from APIs or databases to the public with pagination
 */

const { IXPServer } = require('../dist/index.js');

// Create IXP Server instance
const server = new IXPServer({
  port: 3002,
  logging: { level: 'info' }
});

// Example 1: Simple database-like data source
const userDataSource = {
  name: 'users',
  version: '1.0.0',
  description: 'User profiles data source',
  enabled: true,
  config: {
    pagination: {
      defaultLimit: 50,
      maxLimit: 200
    },
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    }
  },
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  handler: async function getData(options) {
    // Simulate database query with pagination
    const allUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-01-02T00:00:00Z' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', createdAt: '2024-01-03T00:00:00Z' },
      // ... more users
    ];

    const startIndex = options.cursor ? parseInt(options.cursor) : 0;
    const limit = options.limit || 50;
    const endIndex = startIndex + limit;
    
    const users = allUsers.slice(startIndex, endIndex);
    const hasMore = endIndex < allUsers.length;
    const nextCursor = hasMore ? endIndex.toString() : undefined;

    return {
      data: users,
      pagination: {
        nextCursor,
        hasMore,
        total: allUsers.length
      }
    };
  }
};

// Example 2: API-based data source
const apiDataSource = {
  name: 'products',
  version: '1.0.0',
  description: 'Products from external API',
  enabled: true,
  config: {
    pagination: {
      defaultLimit: 20,
      maxLimit: 100
    },
    rateLimit: {
      requests: 100,
      window: 60000 // 1 minute
    }
  },
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      price: { type: 'number' },
      category: { type: 'string' },
      description: { type: 'string' }
    }
  },
  handler: async function getData(options) {
    // Simulate API call
    try {
      // In real implementation, you would make HTTP request here
      // const response = await fetch(`https://api.example.com/products?page=${page}&limit=${limit}`);
      // const data = await response.json();
      
      // Mock data for example
      const mockProducts = [
        { id: 'p1', title: 'Laptop', price: 999.99, category: 'Electronics', description: 'High-performance laptop' },
        { id: 'p2', title: 'Mouse', price: 29.99, category: 'Electronics', description: 'Wireless mouse' },
        { id: 'p3', title: 'Keyboard', price: 79.99, category: 'Electronics', description: 'Mechanical keyboard' }
      ];

      const startIndex = options.cursor ? parseInt(options.cursor) : 0;
      const limit = options.limit || 20;
      const endIndex = startIndex + limit;
      
      const products = mockProducts.slice(startIndex, endIndex);
      const hasMore = endIndex < mockProducts.length;
      const nextCursor = hasMore ? endIndex.toString() : undefined;

      return {
        data: products,
        pagination: {
          nextCursor,
          hasMore,
          total: mockProducts.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }
};

// Register data sources
server.registerCrawlerDataSource(userDataSource);
server.registerCrawlerDataSource(apiDataSource);

// Start server
server.listen().then(() => {
  console.log('🚀 IXP Server running on http://localhost:3002');
  console.log('📊 Crawler endpoints available:');
  console.log('  - GET /ixp/crawler_content - Get all crawler content');
  console.log('  - GET /ixp/crawler_content?sources=users - Get only user data');
  console.log('  - GET /ixp/crawler_content?sources=products - Get only product data');
  console.log('  - GET /ixp/crawler_content?limit=10&cursor=0 - Paginated results');
  console.log('  - GET /ixp/crawler_content?includeMetadata=true - Include metadata');
  console.log('\n📝 Registered data sources:', server.getCrawlerDataSources());
}).catch(console.error);

// Example usage with curl:
// curl "http://localhost:3002/ixp/crawler_content"
// curl "http://localhost:3002/ixp/crawler_content?sources=users&limit=5"
// curl "http://localhost:3002/ixp/crawler_content?includeMetadata=true"