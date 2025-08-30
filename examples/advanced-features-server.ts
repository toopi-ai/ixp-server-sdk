/**
 * Advanced Features IXP Server Example
 * 
 * This example demonstrates advanced SDK features including:
 * - Custom middleware creation
 * - Plugin development
 * - Advanced data providers
 * - Error handling strategies
 * - Performance monitoring
 * - Security configurations
 * - Custom validation
 */

import { createIXPServer, type IntentDefinition, type ComponentDefinition } from '../dist/index.js';
import { createSwaggerPlugin, createHealthMonitoringPlugin, createMetricsPlugin } from '../dist/plugins/index.js';
import { createRateLimitMiddleware, createRequestIdMiddleware, createValidationMiddleware } from '../dist/middleware/index.js';

// Advanced intents with complex validation
const intents: IntentDefinition[] = [
  {
    name: 'analytics_dashboard',
    description: 'Display comprehensive analytics dashboard',
    parameters: {
      type: 'object' as const,
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          },
          required: ['start', 'end']
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['revenue', 'users', 'sessions', 'conversions']
          },
          minItems: 1,
          maxItems: 4
        },
        granularity: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month'],
          description: 'Data aggregation level'
        },
        filters: {
          type: 'object',
          properties: {
            country: { type: 'string' },
            device: { type: 'string', enum: ['desktop', 'mobile', 'tablet'] },
            source: { type: 'string' }
          },
          additionalProperties: false
        }
      },
      required: ['dateRange', 'metrics']
    },
    component: 'AnalyticsDashboard',
    version: '2.0.0',
    crawlable: false
  },
  {
    name: 'user_management',
    description: 'Advanced user management interface',
    parameters: {
      type: 'object' as const,
      properties: {
        view: {
          type: 'string',
          enum: ['list', 'grid', 'tree'],
          description: 'Display view type'
        },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required permissions to view users'
        },
        searchQuery: {
          type: 'string',
          maxLength: 100,
          description: 'Search query for filtering users'
        },
        sortBy: {
          type: 'object',
          properties: {
            field: { type: 'string', enum: ['name', 'email', 'created', 'lastLogin'] },
            order: { type: 'string', enum: ['asc', 'desc'] }
          },
          required: ['field', 'order']
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 10, maximum: 100 }
          },
          required: ['page', 'limit']
        }
      },
      required: ['view', 'pagination']
    },
    component: 'UserManagement',
    version: '2.0.0',
    crawlable: false
  }
];

// Advanced component definitions with security policies
const components: Record<string, ComponentDefinition> = {
  AnalyticsDashboard: {
    name: 'AnalyticsDashboard',
    framework: 'react',
    remoteUrl: 'http://localhost:5173/components/AnalyticsDashboard.js',
    exportName: 'AnalyticsDashboard',
    propsSchema: {
      type: 'object' as const,
      properties: {
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          required: ['start', 'end']
        },
        metrics: {
          type: 'array',
          items: { type: 'string' }
        },
        granularity: { type: 'string' },
        filters: { type: 'object' }
      },
      required: ['dateRange', 'metrics']
    },
    version: '2.0.0',
    allowedOrigins: ['https://admin.example.com', 'http://localhost:3000'],
    bundleSize: '150KB',
    performance: {
      tti: '1.2s',
      bundleSizeGzipped: '45KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '200KB',
      sandboxed: true
    }
  },
  UserManagement: {
    name: 'UserManagement',
    framework: 'vue',
    remoteUrl: 'http://localhost:5174/components/UserManagement.js',
    exportName: 'UserManagement',
    propsSchema: {
      type: 'object' as const,
      properties: {
        view: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } },
        searchQuery: { type: 'string' },
        sortBy: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            order: { type: 'string' }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      },
      required: ['view', 'pagination']
    },
    version: '2.0.0',
    allowedOrigins: ['https://admin.example.com', 'http://localhost:3000'],
    bundleSize: '120KB',
    performance: {
      tti: '0.9s',
      bundleSizeGzipped: '38KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '150KB',
      sandboxed: true
    }
  }
};

// Create server with advanced configuration
const server = createIXPServer({
  intents,
  components,
  port: 3004,
  cors: {
    origins: ['https://admin.example.com', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
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
  // Advanced data provider with caching and error handling
  dataProvider: {
    async getCrawlerContent(options) {
      try {
        // Simulate database query with error handling
        const mockData = [
          {
            type: 'dashboard',
            id: 'analytics-dashboard',
            title: 'Analytics Dashboard',
            description: 'Comprehensive analytics and reporting dashboard',
            lastUpdated: new Date().toISOString(),
            metadata: {
              category: 'analytics',
              tags: ['dashboard', 'metrics', 'reporting'],
              access_level: 'admin'
            }
          },
          {
            type: 'management',
            id: 'user-management',
            title: 'User Management System',
            description: 'Advanced user management with permissions',
            lastUpdated: new Date().toISOString(),
            metadata: {
              category: 'admin',
              tags: ['users', 'permissions', 'management'],
              access_level: 'admin'
            }
          }
        ];

        return {
          contents: mockData,
          pagination: {
            nextCursor: options?.cursor || null,
            hasMore: false
          },
          lastUpdated: new Date().toISOString(),
          metadata: {
            totalCount: mockData.length,
            generatedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('Error fetching crawler content:', error);
        throw new Error('Failed to fetch crawler content');
      }
    },
    
    async resolveIntentData(intent, context) {
      try {
        // Advanced data resolution with context awareness
        if (intent.name === 'analytics_dashboard') {
          // Simulate analytics data fetching
          const { dateRange, metrics, granularity, filters } = intent.parameters;
          
          return {
            data: {
              revenue: {
                current: 125000,
                previous: 98000,
                change: 27.6,
                trend: 'up'
              },
              users: {
                current: 15420,
                previous: 12800,
                change: 20.5,
                trend: 'up'
              },
              sessions: {
                current: 45600,
                previous: 38200,
                change: 19.4,
                trend: 'up'
              },
              conversions: {
                current: 3.2,
                previous: 2.8,
                change: 14.3,
                trend: 'up'
              }
            },
            chartData: [
              { date: '2024-01-01', revenue: 12000, users: 1200, sessions: 3600 },
              { date: '2024-01-02', revenue: 15000, users: 1450, sessions: 4200 },
              { date: '2024-01-03', revenue: 18000, users: 1680, sessions: 4800 },
              { date: '2024-01-04', revenue: 22000, users: 1920, sessions: 5400 },
              { date: '2024-01-05', revenue: 25000, users: 2100, sessions: 6000 }
            ],
            filters: filters || {},
            metadata: {
              dateRange,
              granularity: granularity || 'day',
              lastUpdated: new Date().toISOString(),
              dataSource: 'analytics_api_v2'
            }
          };
        }
        
        if (intent.name === 'user_management') {
          const { pagination, searchQuery, sortBy } = intent.parameters;
          
          // Simulate user data with pagination
          const allUsers = Array.from({ length: 250 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            role: ['admin', 'user', 'moderator'][i % 3],
            status: ['active', 'inactive', 'pending'][i % 3],
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }));
          
          // Apply search filter
          let filteredUsers = allUsers;
          if (searchQuery) {
            filteredUsers = allUsers.filter(user => 
              user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          // Apply sorting
          if (sortBy) {
            filteredUsers.sort((a, b) => {
              const aVal = a[sortBy.field as keyof typeof a];
              const bVal = b[sortBy.field as keyof typeof b];
              if (aVal == null && bVal == null) return 0;
              if (aVal == null) return 1;
              if (bVal == null) return -1;
              const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              return sortBy.order === 'desc' ? -comparison : comparison;
            });
          }
          
          // Apply pagination
          const startIndex = (pagination.page - 1) * pagination.limit;
          const endIndex = startIndex + pagination.limit;
          const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
          
          return {
            users: paginatedUsers,
            pagination: {
              currentPage: pagination.page,
              totalPages: Math.ceil(filteredUsers.length / pagination.limit),
              totalItems: filteredUsers.length,
              pageSize: pagination.limit,
              hasNext: endIndex < filteredUsers.length,
              hasPrev: pagination.page > 1
            },
            filters: {
              searchQuery: searchQuery || '',
              sortBy: sortBy || { field: 'name', order: 'asc' }
            },
            metadata: {
              lastUpdated: new Date().toISOString(),
              totalUsers: allUsers.length,
              activeUsers: allUsers.filter(u => u.status === 'active').length
            }
          };
        }
        
        return {};
      } catch (error) {
        console.error('Error resolving intent data:', error);
        throw new Error(`Failed to resolve data for intent: ${intent.name}`);
      }
    }
  }
});

// Add comprehensive plugins
server.addPlugin(createSwaggerPlugin({
  title: 'Advanced Features IXP Server',
  version: '2.0.0',
  description: 'Demonstration of advanced IXP SDK features'
}));

server.addPlugin(createHealthMonitoringPlugin({
  checks: {
    database: async () => {
      // Simulate database health check
      const isHealthy = Math.random() > 0.1; // 90% success rate
      return {
        status: isHealthy ? 'pass' : 'fail',
        message: isHealthy ? 'Database connection OK' : 'Database connection failed',
        responseTime: Math.floor(Math.random() * 100) + 'ms'
      };
    },
    externalApi: async () => {
      try {
        // Simulate external API check
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          status: 'pass',
          message: 'External API reachable',
          responseTime: '50ms'
        };
      } catch {
        return {
          status: 'fail',
          message: 'External API unreachable'
        };
      }
    },
    componentServers: async () => {
      const servers = ['http://localhost:5173', 'http://localhost:5174'];
      const results = await Promise.allSettled(
        servers.map(async (url) => {
          try {
            const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
            return { url, status: response.ok ? 'pass' : 'fail' };
          } catch {
            return { url, status: 'fail' };
          }
        })
      );
      
      const allHealthy = results.every(r => r.status === 'fulfilled' && r.value.status === 'pass');
      return {
        status: allHealthy ? 'pass' : 'warn',
        message: allHealthy ? 'All component servers healthy' : 'Some component servers unavailable',
        details: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'fail' })
      };
    }
  }
}));

server.addPlugin(createMetricsPlugin({
  format: 'prometheus',
  includeSystemMetrics: true
}));

// Add advanced middleware stack
server.addMiddleware(createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for advanced server
  message: 'Too many requests from this IP, please try again later.'
}));

server.addMiddleware(createRequestIdMiddleware({
  headerName: 'X-Request-ID',
  generator: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}));

server.addMiddleware(createValidationMiddleware({
  maxBodySize: '50mb',
  allowedContentTypes: ['application/json', 'multipart/form-data'],
  requireContentType: true
}));

// Start server with comprehensive logging
async function main() {
  try {
    console.log('🔧 Starting Advanced Features IXP Server...');
    console.log('📊 Configuration:');
    console.log(`   • Port: ${server.config.port}`);
    console.log(`   • Intents: ${intents.length}`);
    console.log(`   • Components: ${Object.keys(components).length}`);
    console.log(`   • Security: Enhanced CSP and HSTS`);
    console.log(`   • Monitoring: Health checks and metrics enabled`);
    console.log('');
    
    await server.listen();
    
    console.log('🚀 Advanced Features IXP Server is running!');
    console.log(`🌐 Server URL: http://localhost:3004`);
    console.log('');
    console.log('📋 Advanced endpoints:');
    console.log('   • GET  /ixp/health - Comprehensive health checks');
    console.log('   • GET  /ixp/metrics - Prometheus metrics');
    console.log('   • GET  /ixp/api-docs - Interactive API documentation');
    console.log('   • POST /ixp/render - Advanced component rendering');
    console.log('');
    console.log('🧪 Test advanced features:');
    console.log('   # Analytics Dashboard');
    console.log('   curl -X POST http://localhost:3004/ixp/render \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{');
    console.log('        "intent": {');
    console.log('          "name": "analytics_dashboard",');
    console.log('          "parameters": {');
    console.log('            "dateRange": { "start": "2024-01-01", "end": "2024-01-31" },');
    console.log('            "metrics": ["revenue", "users"],');
    console.log('            "granularity": "day"');
    console.log('          }');
    console.log('        }');
    console.log('      }\'');
    console.log('');
    console.log('   # User Management');
    console.log('   curl -X POST http://localhost:3004/ixp/render \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{');
    console.log('        "intent": {');
    console.log('          "name": "user_management",');
    console.log('          "parameters": {');
    console.log('            "view": "list",');
    console.log('            "pagination": { "page": 1, "limit": 20 },');
    console.log('            "sortBy": { "field": "name", "order": "asc" }');
    console.log('          }');
    console.log('        }');
    console.log('      }\'');
    
  } catch (error) {
    console.error('❌ Failed to start advanced server:', error);
    process.exit(1);
  }
}

// Enhanced graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down advanced server...');
  try {
    await server.close();
    console.log('✅ Server closed successfully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  await server.close();
  process.exit(0);
});

main().catch(console.error);