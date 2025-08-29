/**
 * Basic IXP Server Example
 * 
 * This example demonstrates how to create a simple IXP server using the SDK.
 * It showcases:
 * - Intent and component definitions
 * - Plugin integration (Swagger, health monitoring, metrics)
 * - Middleware usage (rate limiting, security, logging)
 * - Custom data providers
 * - Error handling and graceful shutdown
 */

import { createIXPServer, type IntentDefinition, type ComponentDefinition } from '../dist/index.js';
import { createSwaggerPlugin, createHealthMonitoringPlugin, createMetricsPlugin } from '../dist/plugins/index.js';
import { createRateLimitMiddleware, createRequestIdMiddleware, createValidationMiddleware, createOriginValidationMiddleware } from '../dist/middleware/index.js';

// Define intents with proper TypeScript typing
const intents: IntentDefinition[] = [
  {
    name: 'show_welcome',
    description: 'Display a welcome message',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'User name for personalized greeting'
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark'],
          description: 'UI theme preference'
        }
      },
      required: ['name']
    },
    component: 'WelcomeMessage',
    version: '1.0.0',
    crawlable: true
  },
  {
    name: 'show_products',
    description: 'Display a list of products',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Product category to filter by'
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 50,
          description: 'Maximum number of products to show'
        }
      }
    },
    component: 'ProductGrid',
    version: '1.0.0',
    crawlable: true
  }
];

// Define components with proper TypeScript typing
const components: Record<string, ComponentDefinition> = {
  WelcomeMessage: {
    name: 'WelcomeMessage',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/WelcomeMessage.js',
    exportName: 'WelcomeMessage',
    propsSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        theme: { type: 'string' }
      },
      required: ['name']
    },
    version: '1.0.0',
    allowedOrigins: ['*'],
    bundleSize: '5KB',
    performance: {
      tti: '0.2s',
      bundleSizeGzipped: '2KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '50KB',
      sandboxed: true
    }
  },
  ProductGrid: {
    name: 'ProductGrid',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/ProductGrid.js',
    exportName: 'ProductGrid',
    propsSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        limit: { type: 'number' }
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
  }
};

// Create the server with comprehensive configuration
// This demonstrates all major configuration options available in the SDK
const server = createIXPServer({
  intents,
  components,
  port: 3001,
  cors: {
    origins: ['http://localhost:3000','http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  },
  logging: {
    level: 'info',
    format: 'text'
  },
  metrics: {
    enabled: true,
    endpoint: '/metrics'
  },
  // Custom data provider for dynamic content and crawler support
  // This is optional but demonstrates how to provide dynamic data to your intents
  dataProvider: {
    async getCrawlerContent(options: any) {
      // Mock crawler content - replace with your actual data source
      // This content will be available to search engines and crawlers
      const mockProducts = [
        {
          type: 'product',
          id: 'product-1',
          title: 'Sample Product 1',
          description: 'This is a sample product for demonstration',
          lastUpdated: new Date().toISOString()
        },
        {
          type: 'product',
          id: 'product-2',
          title: 'Sample Product 2',
          description: 'Another sample product',
          lastUpdated: new Date().toISOString()
        }
      ];
      
      // Example: fetch('woocommerce/api?params=value')

      return {
        contents: mockProducts,
        pagination: {
          nextCursor: null,
          hasMore: false
        },
        lastUpdated: new Date().toISOString()
      };
    },
    
    async resolveIntentData(intent: any, context: any) {
      // Add additional data based on intent
      if (intent.name === 'show_products') {
        return {
          totalProducts: 100,
          availableCategories: ['electronics', 'clothing', 'books']
        };
      }
      
      return {};
    }
  }
});

// Add plugins using the SDK plugin functions
server.addPlugin(createSwaggerPlugin({
  title: 'Basic IXP Server API',
  version: '1.0.0',
  description: 'A basic example of an IXP server using the SDK'
}));

server.addPlugin(createHealthMonitoringPlugin({
  checks: {
    database: async () => ({
      status: 'pass',
      message: 'Mock database connection OK'
    }),
    externalApi: async () => ({
      status: 'pass',
      message: 'External API reachable'
    })
  }
}));

server.addPlugin(createMetricsPlugin({
  format: 'json',
  includeSystemMetrics: true
}));

// Add middleware using the SDK middleware functions
server.addMiddleware(createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

server.addMiddleware(createRequestIdMiddleware({}));

server.addMiddleware(createValidationMiddleware({
  maxBodySize: '10mb',
  allowedContentTypes: ['application/json'],
  requireContentType: true
}));

server.addMiddleware(createOriginValidationMiddleware({
  allowedOrigins: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  allowCredentials: true
}));

// Start the server with enhanced error handling and logging
async function main() {
  try {
    console.log('🔧 Starting IXP Server...');
    
    // Validate configuration before starting
    console.log(`📊 Loaded ${intents.length} intents and ${Object.keys(components).length} components`);
    
    // Start the server
    await server.listen();
    
    console.log('🚀 Basic IXP Server is running successfully!');
    console.log(`🌐 Server URL: http://localhost:${server.config.port || 3001}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   • Intents: http://localhost:3001/ixp/intents');
    console.log('   • Components: http://localhost:3001/ixp/components');
    console.log('   • Render: POST http://localhost:3001/ixp/render');
    console.log('   • Crawler Content: http://localhost:3001/ixp/crawler_content');
    console.log('   • Health: http://localhost:3001/ixp/health');
    console.log('   • Metrics: http://localhost:3001/ixp/metrics');
    console.log('   • API Docs: http://localhost:3001/ixp/api-docs');
    console.log('');
    console.log('🧪 Test the render endpoint:');
    console.log('   curl -X POST http://localhost:3001/ixp/render \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{');
    console.log('        "intent": {');
    console.log('          "name": "show_welcome",');
    console.log('          "parameters": { "name": "World", "theme": "light" }');
    console.log('        }');
    console.log('      }\'');
    console.log('');
    console.log('🔍 Try the health check:');
    console.log('   curl http://localhost:3001/ixp/health');
    console.log('');
    console.log('📖 View API documentation:');
    console.log('   Open http://localhost:3001/ixp/api-docs in your browser');
    
  } catch (error) {
    console.error('❌ Failed to start server:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await server.close();
  process.exit(0);
});

// Start the server
main().catch(console.error);