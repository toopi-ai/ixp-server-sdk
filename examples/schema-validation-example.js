const { IXPServer } = require('../dist/index');

// Create IXP Server instance
const server = new IXPServer({ port: 3003 });

console.log('🔍 Schema Validation Example');
console.log('============================\n');

// Example 1: Valid data source with comprehensive schema
const validUserDataSource = {
  name: 'validated_users',
  description: 'User data with comprehensive validation',
  version: '2.0.0',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' },
      profile: { type: 'object' },
      tags: { type: 'array' }
    },
    required: ['id', 'name', 'email']
  },
  handler: async function(options) {
    // Return data that matches the schema
    return {
      data: [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          age: 28,
          isActive: true,
          profile: { department: 'Engineering' },
          tags: ['developer', 'senior']
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          age: 35,
          isActive: false,
          profile: { department: 'Marketing' },
          tags: ['manager']
        }
      ],
      pagination: { nextCursor: null, hasMore: false, total: 2 }
    };
  },
  config: {
    enabled: true,
    pagination: {
      defaultLimit: 10,
      maxLimit: 100
    },
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    },
    rateLimit: {
      requests: 100,
      window: 60000 // 1 minute
    }
  }
};

// Example 2: Data source that returns invalid data (for testing validation)
const invalidDataSource = {
  name: 'invalid_products',
  description: 'Product data that will fail validation',
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      inStock: { type: 'boolean' }
    },
    required: ['id', 'name', 'price']
  },
  handler: async function(options) {
    // Return data that violates the schema (for demonstration)
    return {
      data: [
        {
          id: 'p1',
          name: 'Laptop',
          price: 999.99,
          inStock: true
        },
        {
          // Missing required 'id' field
          name: 'Mouse',
          price: 'invalid_price', // Wrong type (should be number)
          inStock: 'yes' // Wrong type (should be boolean)
        },
        {
          id: 'p3',
          // Missing required 'name' field
          price: 49.99,
          inStock: false
        }
      ],
      pagination: { nextCursor: null, hasMore: false, total: 3 }
    };
  }
};

async function demonstrateSchemaValidation() {
  try {
    console.log('1. Testing configuration validation...');
    
    // Test valid configuration
    const validResult = server.validateCrawlerDataSource(validUserDataSource);
    console.log('✅ Valid data source validation:', validResult);
    
    // Test invalid configuration (missing required fields)
    const invalidConfig = {
      name: 'invalid_source',
      // Missing required fields: description, version, schema, handler
    };
    const invalidResult = server.validateCrawlerDataSource(invalidConfig);
    console.log('❌ Invalid data source validation:', invalidResult);
    
    console.log('\n2. Registering data sources...');
    
    // Register valid data source
    server.registerCrawlerDataSource(validUserDataSource);
    console.log('✅ Registered valid data source');
    
    // Register data source that returns invalid data
    server.registerCrawlerDataSource(invalidDataSource);
    console.log('✅ Registered data source with invalid data (for testing)');
    
    console.log('\n3. Getting schema information...');
    const schemas = server.getCrawlerDataSourceSchemas();
    console.log('📋 Schema information:', JSON.stringify(schemas, null, 2));
    
    console.log('\n4. Getting registry statistics...');
    const stats = server.getCrawlerDataSourceStats();
    console.log('📊 Registry statistics:', stats);
    
    console.log('\n5. Starting server...');
    
    // Initialize the server (it starts automatically)
    await server.initialize();
    
    console.log('\n🚀 Server running on http://localhost:3003');
    console.log('\n📋 Test endpoints:');
    console.log('  - GET /ixp/crawler_content?sources=validated_users - Valid data');
    console.log('  - GET /ixp/crawler_content?sources=invalid_products - Invalid data (check logs)');
    console.log('  - GET /ixp/crawler_content?includeMetadata=true - With metadata');
    console.log('\n📝 Registered data sources:', server.getCrawlerDataSources());
    console.log('\n💡 Check the server logs to see validation warnings for invalid data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateSchemaValidation().catch(console.error);

// Example usage with curl:
// curl "http://localhost:3003/ixp/crawler_content?sources=validated_users"
// curl "http://localhost:3003/ixp/crawler_content?sources=invalid_products"
// curl "http://localhost:3003/ixp/crawler_content?includeMetadata=true"