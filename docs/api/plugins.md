# Plugins API Reference

Plugins in the IXP Server SDK provide a modular way to extend server functionality. They can add new features, integrate with external services, modify server behavior, and provide reusable components across different projects.

## Table of Contents

- [Overview](#overview)
- [Plugin Definition](#plugin-definition)
- [Plugin Types](#plugin-types)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Plugin Registry](#plugin-registry)
- [Built-in Plugins](#built-in-plugins)
- [Custom Plugins](#custom-plugins)
- [Plugin Communication](#plugin-communication)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Plugins are self-contained modules that can:

- Add new intents and components
- Register middleware
- Provide utility functions
- Integrate with external APIs
- Extend server configuration
- Add custom routes and handlers

## Plugin Definition

### Basic Structure

```typescript
interface PluginDefinition {
  name: string;
  description: string;
  version: string;
  author?: string;
  license?: string;
  dependencies?: PluginDependency[];
  config?: PluginConfig;
  hooks?: PluginHooks;
  exports?: PluginExports;
}

interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

interface PluginHooks {
  onInstall?: (server: IXPServer, config: any) => Promise<void>;
  onUninstall?: (server: IXPServer) => Promise<void>;
  onServerStart?: (server: IXPServer) => Promise<void>;
  onServerStop?: (server: IXPServer) => Promise<void>;
  onRequest?: (context: RequestContext) => Promise<void>;
  onResponse?: (context: ResponseContext) => Promise<void>;
}
```

### Properties

#### `name` (required)
- **Type:** `string`
- **Description:** Unique identifier for the plugin
- **Example:** `"weather-service"`, `"auth-provider"`

#### `description` (required)
- **Type:** `string`
- **Description:** Human-readable description of the plugin's functionality
- **Example:** `"Provides weather data integration with OpenWeatherMap API"`

#### `version` (required)
- **Type:** `string`
- **Description:** Plugin version following semantic versioning
- **Example:** `"1.1.1"`

#### `author` (optional)
- **Type:** `string`
- **Description:** Plugin author information
- **Example:** `"John Doe <john@example.com>"`

#### `license` (optional)
- **Type:** `string`
- **Description:** Plugin license
- **Example:** `"MIT"`, `"Apache-2.0"`

#### `dependencies` (optional)
- **Type:** `PluginDependency[]`
- **Description:** Other plugins this plugin depends on

#### `config` (optional)
- **Type:** `PluginConfig`
- **Description:** Plugin configuration schema and defaults

#### `hooks` (optional)
- **Type:** `PluginHooks`
- **Description:** Lifecycle hooks for the plugin

#### `exports` (optional)
- **Type:** `PluginExports`
- **Description:** Functions, components, and middleware exported by the plugin

## Plugin Types

### Service Plugins

Provide integration with external services.

```typescript
const weatherServicePlugin: PluginDefinition = {
  name: 'weather-service',
  description: 'Weather data integration plugin',
  version: '1.1.1',
  author: 'Weather Corp <dev@weather.com>',
  license: 'MIT',
  config: {
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        baseUrl: { type: 'string', default: 'https://api.openweathermap.org/data/2.5' },
        units: { type: 'string', enum: ['metric', 'imperial'], default: 'metric' },
        timeout: { type: 'number', default: 5000 }
      },
      required: ['apiKey']
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Validate API key
      await validateApiKey(config.apiKey);
      
      // Register weather intents
      server.registerIntent({
        name: 'current_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            units: { type: 'string', enum: ['metric', 'imperial'] }
          },
          required: ['location']
        },
        component: 'WeatherCard',
        version: '1.1.1'
      });
      
      // Register weather component
      server.registerComponent({
        name: 'WeatherCard',
        description: 'Displays weather information',
        version: '1.1.1',
        type: 'functional',
        props: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            temperature: { type: 'number' },
            condition: { type: 'string' },
            humidity: { type: 'number' },
            windSpeed: { type: 'number' }
          }
        },
        render: (props) => renderWeatherCard(props)
      });
    }
  },
  exports: {
    functions: {
      getCurrentWeather: async (location: string, units?: string) => {
        // Implementation
      },
      getForecast: async (location: string, days?: number) => {
        // Implementation
      }
    }
  }
};
```

### Authentication Plugins

Provide authentication and authorization functionality.

```typescript
const jwtAuthPlugin: PluginDefinition = {
  name: 'jwt-auth',
  description: 'JWT-based authentication plugin',
  version: '1.1.1',
  config: {
    schema: {
      type: 'object',
      properties: {
        secret: { type: 'string' },
        algorithm: { type: 'string', default: 'HS256' },
        expiresIn: { type: 'string', default: '1h' },
        issuer: { type: 'string' },
        audience: { type: 'string' }
      },
      required: ['secret']
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Register auth middleware
      server.use({
        name: 'jwt-auth-middleware',
        description: 'JWT authentication middleware',
        version: '1.1.1',
        type: 'request',
        priority: 10,
        handler: async (context, next) => {
          const token = extractToken(context.request);
          if (token) {
            try {
              const payload = await verifyToken(token, config);
              context.request.user = payload;
            } catch (error) {
              throw new AuthenticationError('Invalid token');
            }
          }
          await next();
        }
      });
      
      // Register auth intents
      server.registerIntent({
        name: 'login',
        description: 'User login',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['username', 'password']
        },
        component: 'LoginForm',
        version: '1.1.1'
      });
    }
  },
  exports: {
    functions: {
      generateToken: (payload: any, options?: any) => {
        // Implementation
      },
      verifyToken: (token: string, options?: any) => {
        // Implementation
      },
      refreshToken: (token: string) => {
        // Implementation
      }
    },
    middleware: {
      requireAuth: (options?: any) => {
        // Return middleware function
      },
      requireRole: (roles: string[]) => {
        // Return middleware function
      }
    }
  }
};
```

### UI Enhancement Plugins

Provide reusable UI components and themes.

```typescript
const uiKitPlugin: PluginDefinition = {
  name: 'ui-kit',
  description: 'Reusable UI components library',
  version: '1.1.1',
  hooks: {
    onInstall: async (server, config) => {
      // Register UI components
      const components = [
        'Button', 'Card', 'Modal', 'Form', 'Table', 'Navigation'
      ];
      
      for (const componentName of components) {
        server.registerComponent(await loadComponent(componentName));
      }
      
      // Register CSS assets
      server.addAsset({
        type: 'css',
        path: '/assets/ui-kit.css',
        content: await loadCSS()
      });
    }
  },
  exports: {
    components: {
      Button: ButtonComponent,
      Card: CardComponent,
      Modal: ModalComponent,
      Form: FormComponent,
      Table: TableComponent,
      Navigation: NavigationComponent
    },
    themes: {
      light: LightTheme,
      dark: DarkTheme,
      custom: (colors: any) => createCustomTheme(colors)
    }
  }
};
```

### Analytics Plugins

Provide analytics and monitoring functionality.

```typescript
const analyticsPlugin: PluginDefinition = {
  name: 'analytics',
  description: 'Analytics and monitoring plugin',
  version: '1.1.1',
  config: {
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              config: { type: 'object' }
            }
          }
        },
        sampling: { type: 'number', minimum: 0, maximum: 1, default: 1 },
        bufferSize: { type: 'number', default: 100 }
      }
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Initialize analytics providers
      for (const provider of config.providers) {
        await initializeProvider(provider);
      }
      
      // Register analytics middleware
      server.use({
        name: 'analytics-middleware',
        description: 'Tracks request analytics',
        version: '1.1.1',
        type: 'global',
        priority: 5,
        handler: async (context, next) => {
          const startTime = Date.now();
          
          try {
            await next();
            
            // Track successful request
            await trackEvent({
              type: 'request',
              intent: context.request.intent,
              duration: Date.now() - startTime,
              status: context.response.status,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            // Track error
            await trackEvent({
              type: 'error',
              intent: context.request.intent,
              error: error.message,
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            });
            throw error;
          }
        }
      });
    }
  },
  exports: {
    functions: {
      trackEvent: (event: any) => {
        // Implementation
      },
      trackUser: (userId: string, properties: any) => {
        // Implementation
      },
      trackPageView: (page: string, properties?: any) => {
        // Implementation
      }
    }
  }
};
```

## Plugin Lifecycle

### Installation Lifecycle

1. **Validation** - Plugin definition is validated
2. **Dependency Check** - Required dependencies are verified
3. **Configuration** - Plugin configuration is processed
4. **Installation** - `onInstall` hook is called
5. **Registration** - Plugin is registered with the server

### Runtime Lifecycle

1. **Server Start** - `onServerStart` hook is called
2. **Request Processing** - `onRequest` and `onResponse` hooks are called
3. **Server Stop** - `onServerStop` hook is called
4. **Uninstallation** - `onUninstall` hook is called

### Lifecycle Hooks

```typescript
const lifecyclePlugin: PluginDefinition = {
  name: 'lifecycle-example',
  description: 'Demonstrates plugin lifecycle hooks',
  version: '1.1.1',
  hooks: {
    onInstall: async (server, config) => {
      console.log('Plugin installed');
      // Initialize plugin resources
      // Register intents, components, middleware
    },
    
    onUninstall: async (server) => {
      console.log('Plugin uninstalled');
      // Clean up resources
      // Remove registered items
    },
    
    onServerStart: async (server) => {
      console.log('Server started');
      // Start background tasks
      // Connect to external services
    },
    
    onServerStop: async (server) => {
      console.log('Server stopped');
      // Stop background tasks
      // Close connections
    },
    
    onRequest: async (context) => {
      console.log('Request received:', context.request.intent);
      // Log requests
      // Modify request data
    },
    
    onResponse: async (context) => {
      console.log('Response sent:', context.response.status);
      // Log responses
      // Modify response data
    }
  }
};
```

## Plugin Registry

The Plugin Registry manages all installed plugins.

### Creating a Plugin Registry

```typescript
import { PluginRegistry } from 'ixp-server';

const registry = new PluginRegistry();
```

### Installing Plugins

```typescript
// Install from object
await registry.install(weatherServicePlugin, {
  apiKey: process.env.WEATHER_API_KEY,
  units: 'metric'
});

// Install from file
await registry.installFromFile('./plugins/weather-service.js', config);

// Install from npm package
await registry.installFromPackage('@ixp/weather-plugin', config);
```

### Managing Plugins

```typescript
// List installed plugins
const plugins = registry.getInstalledPlugins();
console.log('Installed plugins:', plugins.map(p => p.name));

// Get plugin by name
const plugin = registry.getPlugin('weather-service');
if (plugin) {
  console.log('Plugin version:', plugin.version);
}

// Check if plugin is installed
if (registry.hasPlugin('weather-service')) {
  // Plugin is available
}

// Uninstall plugin
await registry.uninstall('weather-service');
```

## Built-in Plugins

### Core Plugins

The IXP Server SDK includes several built-in plugins:

#### Static Assets Plugin

```typescript
import { staticAssetsPlugin } from 'ixp-server/plugins';

const staticAssets = staticAssetsPlugin({
  directory: './public',
  prefix: '/static',
  maxAge: 86400, // 1 day
  compress: true
});
```

#### Health Check Plugin

```typescript
import { healthCheckPlugin } from 'ixp-server/plugins';

const healthCheck = healthCheckPlugin({
  endpoint: '/health',
  checks: {
    database: async () => {
      // Check database connection
      return { status: 'ok', latency: 10 };
    },
    external_api: async () => {
      // Check external API
      return { status: 'ok', response_time: 150 };
    }
  }
});
```

#### CORS Plugin

```typescript
import { corsPlugin } from 'ixp-server/plugins';

const cors = corsPlugin({
  origin: ['http://localhost:3000', 'https://myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

## Custom Plugins

### Creating a Custom Plugin

```typescript
// plugins/custom-logger.ts
export const customLoggerPlugin: PluginDefinition = {
  name: 'custom-logger',
  description: 'Custom logging plugin with multiple outputs',
  version: '1.1.1',
  author: 'Your Name <you@example.com>',
  license: 'MIT',
  config: {
    schema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['console', 'file', 'http'] },
              config: { type: 'object' }
            }
          }
        },
        format: { type: 'string', default: 'json' }
      }
    },
    defaults: {
      level: 'info',
      outputs: [{ type: 'console', config: {} }],
      format: 'json'
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Initialize logger outputs
      const logger = new CustomLogger(config);
      
      // Register logging middleware
      server.use({
        name: 'custom-logger-middleware',
        description: 'Custom request logging',
        version: '1.1.1',
        type: 'global',
        priority: 1,
        handler: async (context, next) => {
          const startTime = Date.now();
          
          logger.info('Request started', {
            method: context.request.method,
            url: context.request.url,
            intent: context.request.intent,
            timestamp: new Date().toISOString()
          });
          
          try {
            await next();
            
            logger.info('Request completed', {
              status: context.response.status,
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            logger.error('Request failed', {
              error: error.message,
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            });
            throw error;
          }
        }
      });
      
      // Store logger instance for other plugins to use
      server.setGlobal('logger', logger);
    },
    
    onUninstall: async (server) => {
      const logger = server.getGlobal('logger');
      if (logger) {
        await logger.close();
        server.removeGlobal('logger');
      }
    }
  },
  exports: {
    functions: {
      getLogger: () => {
        // Return logger instance
      },
      createChildLogger: (name: string) => {
        // Create child logger
      }
    }
  }
};

class CustomLogger {
  constructor(private config: any) {
    // Initialize logger with config
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  error(message: string, data?: any) {
    this.log('error', message, data);
  }
  
  private log(level: string, message: string, data?: any) {
    // Implementation
  }
  
  async close() {
    // Clean up resources
  }
}
```

### Plugin with External Dependencies

```typescript
// plugins/database-plugin.ts
export const databasePlugin: PluginDefinition = {
  name: 'database',
  description: 'Database integration plugin',
  version: '1.1.1',
  dependencies: [
    { name: 'custom-logger', version: '^1.0.0', optional: true }
  ],
  config: {
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['postgresql', 'mysql', 'sqlite'] },
        host: { type: 'string' },
        port: { type: 'number' },
        database: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        ssl: { type: 'boolean', default: false },
        pool: {
          type: 'object',
          properties: {
            min: { type: 'number', default: 2 },
            max: { type: 'number', default: 10 }
          }
        }
      },
      required: ['type', 'host', 'database', 'username', 'password']
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Initialize database connection
      const db = new DatabaseConnection(config);
      await db.connect();
      
      // Register database intents
      server.registerIntent({
        name: 'query_data',
        description: 'Query database data',
        parameters: {
          type: 'object',
          properties: {
            table: { type: 'string' },
            filters: { type: 'object' },
            limit: { type: 'number', default: 10 }
          },
          required: ['table']
        },
        component: 'DataTable',
        version: '1.1.1'
      });
      
      // Store database instance
      server.setGlobal('database', db);
      
      // Use logger if available
      const logger = server.getGlobal('logger');
      if (logger) {
        logger.info('Database plugin installed', { type: config.type });
      }
    },
    
    onServerStop: async (server) => {
      const db = server.getGlobal('database');
      if (db) {
        await db.disconnect();
      }
    }
  },
  exports: {
    functions: {
      query: async (sql: string, params?: any[]) => {
        // Execute query
      },
      transaction: async (callback: (tx: any) => Promise<void>) => {
        // Execute transaction
      }
    }
  }
};
```

## Plugin Communication

### Inter-Plugin Communication

Plugins can communicate through the server's global storage:

```typescript
// Plugin A - Data Provider
const dataProviderPlugin: PluginDefinition = {
  name: 'data-provider',
  hooks: {
    onInstall: async (server, config) => {
      const dataService = new DataService(config);
      
      // Expose service to other plugins
      server.setGlobal('dataService', dataService);
      
      // Emit event for other plugins
      server.emit('dataProviderReady', dataService);
    }
  }
};

// Plugin B - Data Consumer
const dataConsumerPlugin: PluginDefinition = {
  name: 'data-consumer',
  dependencies: [
    { name: 'data-provider', version: '^1.0.0' }
  ],
  hooks: {
    onInstall: async (server, config) => {
      // Wait for data provider to be ready
      server.on('dataProviderReady', (dataService) => {
        // Use the data service
        console.log('Data provider is ready');
      });
      
      // Or get it directly
      const dataService = server.getGlobal('dataService');
      if (dataService) {
        // Use the service
      }
    }
  }
};
```

### Plugin Events

```typescript
// Event emitter plugin
const eventPlugin: PluginDefinition = {
  name: 'event-system',
  hooks: {
    onInstall: async (server, config) => {
      // Register event middleware
      server.use({
        name: 'event-middleware',
        type: 'response',
        priority: 900,
        handler: async (context, next) => {
          await next();
          
          // Emit response event
          server.emit('response', {
            intent: context.request.intent,
            status: context.response.status,
            timestamp: new Date()
          });
        }
      });
    }
  }
};

// Event listener plugin
const analyticsPlugin: PluginDefinition = {
  name: 'analytics-listener',
  dependencies: [
    { name: 'event-system', version: '^1.0.0' }
  ],
  hooks: {
    onInstall: async (server, config) => {
      // Listen for response events
      server.on('response', (data) => {
        // Track analytics
        console.log('Response tracked:', data);
      });
    }
  }
};
```

## Examples

### Complete E-commerce Plugin

```typescript
const ecommercePlugin: PluginDefinition = {
  name: 'ecommerce',
  description: 'Complete e-commerce functionality',
  version: '1.1.1',
  author: 'E-commerce Team <team@ecommerce.com>',
  license: 'MIT',
  dependencies: [
    { name: 'database', version: '^1.0.0' },
    { name: 'jwt-auth', version: '^1.0.0' },
    { name: 'ui-kit', version: '^1.0.0' }
  ],
  config: {
    schema: {
      type: 'object',
      properties: {
        currency: { type: 'string', default: 'USD' },
        taxRate: { type: 'number', default: 0.08 },
        shippingCost: { type: 'number', default: 9.99 },
        paymentGateway: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['stripe', 'paypal'] },
            apiKey: { type: 'string' },
            webhookSecret: { type: 'string' }
          }
        }
      }
    }
  },
  hooks: {
    onInstall: async (server, config) => {
      // Register product intents
      const productIntents = [
        {
          name: 'product_catalog',
          description: 'Display product catalog',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              search: { type: 'string' },
              page: { type: 'number', default: 1 },
              limit: { type: 'number', default: 20 }
            }
          },
          component: 'ProductCatalog',
          version: '1.1.1'
        },
        {
          name: 'product_details',
          description: 'Show product details',
          parameters: {
            type: 'object',
            properties: {
              productId: { type: 'string' }
            },
            required: ['productId']
          },
          component: 'ProductDetails',
          version: '1.1.1'
        },
        {
          name: 'shopping_cart',
          description: 'Display shopping cart',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string' }
            }
          },
          component: 'ShoppingCart',
          version: '1.1.1'
        }
      ];
      
      for (const intent of productIntents) {
        server.registerIntent(intent);
      }
      
      // Register components
      const components = [
        ProductCatalogComponent,
        ProductDetailsComponent,
        ShoppingCartComponent,
        CheckoutFormComponent
      ];
      
      for (const component of components) {
        server.registerComponent(component);
      }
      
      // Register cart middleware
      server.use({
        name: 'cart-middleware',
        type: 'request',
        priority: 50,
        handler: async (context, next) => {
          if (context.request.user) {
            // Load user's cart
            const cart = await loadUserCart(context.request.user.id);
            context.request.cart = cart;
          }
          await next();
        }
      });
    }
  },
  exports: {
    functions: {
      addToCart: async (userId: string, productId: string, quantity: number) => {
        // Implementation
      },
      removeFromCart: async (userId: string, productId: string) => {
        // Implementation
      },
      processPayment: async (orderId: string, paymentData: any) => {
        // Implementation
      },
      calculateTotal: (items: any[], taxRate: number, shipping: number) => {
        // Implementation
      }
    },
    components: {
      ProductCatalog: ProductCatalogComponent,
      ProductDetails: ProductDetailsComponent,
      ShoppingCart: ShoppingCartComponent,
      CheckoutForm: CheckoutFormComponent
    }
  }
};
```

## Best Practices

### 1. Plugin Design
- Keep plugins focused on specific functionality
- Use clear, descriptive names and descriptions
- Follow semantic versioning for plugin versions
- Document all configuration options and exports

### 2. Dependencies
- Minimize external dependencies
- Use optional dependencies when possible
- Specify version ranges appropriately
- Handle missing dependencies gracefully

### 3. Configuration
- Provide sensible defaults for all options
- Validate configuration at install time
- Use environment variables for sensitive data
- Document all configuration options

### 4. Error Handling
- Handle errors gracefully in all hooks
- Provide meaningful error messages
- Clean up resources in error conditions
- Log errors appropriately

### 5. Performance
- Avoid heavy operations in hooks
- Use lazy loading for expensive resources
- Cache frequently accessed data
- Monitor plugin performance impact

### 6. Security
- Validate all inputs and configurations
- Use secure defaults for all options
- Avoid logging sensitive information
- Follow security best practices

### 7. Testing
- Write comprehensive tests for plugin functionality
- Test installation and uninstallation
- Test with different configurations
- Test plugin interactions

## Related Documentation

- [Core API](./core.md) - Understand the core server functionality
- [Middleware](./middleware.md) - Learn about middleware system
- [Components API](./components.md) - Understand component rendering
- [Configuration Guide](../guides/configuration.md) - Configure your server