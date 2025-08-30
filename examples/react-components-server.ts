/**
 * React Components IXP Server Example
 * 
 * This example demonstrates how to create an IXP server specifically for React components.
 * It showcases:
 * - React-specific component definitions
 * - Component development workflow
 * - Hot reload integration
 * - TypeScript support for React props
 * - Component testing and validation
 */

import { createIXPServer, type IntentDefinition, type ComponentDefinition } from '../dist/index.js';
import { createSwaggerPlugin, createHealthMonitoringPlugin } from '../dist/plugins/index.js';
import { createRequestIdMiddleware } from '../dist/middleware/index.js';

// React-focused intents
const intents: IntentDefinition[] = [
  {
    name: 'show_user_profile',
    description: 'Display user profile with avatar and details',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Unique user identifier'
        },
        showAvatar: {
          type: 'boolean',
          description: 'Whether to display user avatar',
          default: true
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          description: 'UI theme preference'
        }
      },
      required: ['userId']
    },
    component: 'UserProfile',
    version: '1.0.0',
    crawlable: true
  },
  {
    name: 'show_interactive_chart',
    description: 'Display interactive data visualization',
    parameters: {
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          enum: ['line', 'bar', 'pie', 'scatter'],
          description: 'Type of chart to display'
        },
        dataSource: {
          type: 'string',
          description: 'Data source identifier'
        },
        timeRange: {
          type: 'string',
          enum: ['1h', '24h', '7d', '30d'],
          description: 'Time range for data'
        }
      },
      required: ['chartType', 'dataSource']
    },
    component: 'InteractiveChart',
    version: '1.0.0',
    crawlable: false
  },
  {
    name: 'show_form_builder',
    description: 'Dynamic form builder with validation',
    parameters: {
      type: 'object',
      properties: {
        formSchema: {
          type: 'object',
          description: 'JSON schema for form fields'
        },
        submitEndpoint: {
          type: 'string',
          description: 'API endpoint for form submission'
        },
        validationMode: {
          type: 'string',
          enum: ['onChange', 'onBlur', 'onSubmit'],
          description: 'When to validate form fields'
        }
      },
      required: ['formSchema']
    },
    component: 'FormBuilder',
    version: '1.0.0',
    crawlable: false
  }
];

// React component definitions with detailed TypeScript props
const components: Record<string, ComponentDefinition> = {
  UserProfile: {
    name: 'UserProfile',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/components/UserProfile.js',
    exportName: 'UserProfile',
    propsSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        showAvatar: { type: 'boolean' },
        theme: { type: 'string', enum: ['light', 'dark', 'auto'] }
      },
      required: ['userId']
    },
    version: '1.0.0',
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
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
  InteractiveChart: {
    name: 'InteractiveChart',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/components/InteractiveChart.js',
    exportName: 'InteractiveChart',
    propsSchema: {
      type: 'object',
      properties: {
        chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'scatter'] },
        dataSource: { type: 'string' },
        timeRange: { type: 'string', enum: ['1h', '24h', '7d', '30d'] }
      },
      required: ['chartType', 'dataSource']
    },
    version: '1.0.0',
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    bundleSize: '45KB',
    performance: {
      tti: '0.8s',
      bundleSizeGzipped: '15KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '100KB',
      sandboxed: true
    }
  },
  FormBuilder: {
    name: 'FormBuilder',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/components/FormBuilder.js',
    exportName: 'FormBuilder',
    propsSchema: {
      type: 'object',
      properties: {
        formSchema: { type: 'object' },
        submitEndpoint: { type: 'string' },
        validationMode: { type: 'string', enum: ['onChange', 'onBlur', 'onSubmit'] }
      },
      required: ['formSchema']
    },
    version: '1.0.0',
    allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
    bundleSize: '35KB',
    performance: {
      tti: '0.6s',
      bundleSizeGzipped: '12KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '80KB',
      sandboxed: true
    }
  }
};

// Create server with React-optimized configuration
const server = createIXPServer({
  intents,
  components,
  port: 3002,
  cors: {
    origins: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },
  logging: {
    level: 'debug',
    format: 'json'
  },
  metrics: {
    enabled: true,
    endpoint: '/metrics'
  },
  // Data provider for React components
  dataProvider: {
    async getCrawlerContent() {
      return {
        contents: [
          {
            type: 'component',
            id: 'user-profile',
            title: 'User Profile Component',
            description: 'Interactive user profile with avatar and details',
            lastUpdated: new Date().toISOString()
          },
          {
            type: 'component',
            id: 'interactive-chart',
            title: 'Interactive Chart Component',
            description: 'Data visualization with multiple chart types',
            lastUpdated: new Date().toISOString()
          }
        ],
        pagination: { nextCursor: null, hasMore: false },
        lastUpdated: new Date().toISOString()
      };
    },
    
    async resolveIntentData(intent, context) {
      // Mock data for React components
      if (intent.name === 'show_user_profile') {
        return {
          user: {
            id: intent.parameters.userId,
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://via.placeholder.com/150',
            joinDate: '2023-01-15',
            isOnline: true
          }
        };
      }
      
      if (intent.name === 'show_interactive_chart') {
        return {
          data: [
            { name: 'Jan', value: 400 },
            { name: 'Feb', value: 300 },
            { name: 'Mar', value: 600 },
            { name: 'Apr', value: 800 },
            { name: 'May', value: 500 }
          ],
          metadata: {
            lastUpdated: new Date().toISOString(),
            dataPoints: 5
          }
        };
      }
      
      return {};
    }
  }
});

// Add plugins
server.addPlugin(createSwaggerPlugin({
  title: 'React Components IXP Server',
  version: '1.0.0',
  description: 'IXP server optimized for React components'
}));

server.addPlugin(createHealthMonitoringPlugin({
  checks: {
    reactDevServer: async () => {
      try {
        const response = await fetch('http://localhost:5173');
        return {
          status: response.ok ? 'pass' : 'fail',
          message: response.ok ? 'React dev server is running' : 'React dev server is down'
        };
      } catch {
        return {
          status: 'fail',
          message: 'React dev server is not reachable'
        };
      }
    }
  }
}));

// Add middleware
server.addMiddleware(createRequestIdMiddleware({}));

// Start server
async function main() {
  try {
    console.log('⚛️  Starting React Components IXP Server...');
    
    await server.listen();
    
    console.log('🚀 React Components IXP Server is running!');
    console.log(`🌐 Server URL: http://localhost:3002`);
    console.log('');
    console.log('📋 Available React components:');
    Object.keys(components).forEach(name => {
      console.log(`   • ${name}: React component`);
    });
    console.log('');
    console.log('🧪 Test React component rendering:');
    console.log('   curl -X POST http://localhost:3002/ixp/render \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{');
    console.log('        "intent": {');
    console.log('          "name": "show_user_profile",');
    console.log('          "parameters": { "userId": "123", "theme": "light" }');
    console.log('        }');
    console.log('      }\'');
    
  } catch (error) {
    console.error('❌ Failed to start React server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down React server...');
  await server.close();
  process.exit(0);
});

main().catch(console.error);