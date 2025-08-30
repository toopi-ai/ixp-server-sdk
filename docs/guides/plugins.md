# Plugin Development Guide

This comprehensive guide covers how to develop, implement, and manage plugins in the IXP Server SDK.

## Table of Contents

- [Plugin Overview](#plugin-overview)
- [Plugin Architecture](#plugin-architecture)
- [Creating Plugins](#creating-plugins)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Plugin Registration](#plugin-registration)
- [Plugin Communication](#plugin-communication)
- [Plugin Configuration](#plugin-configuration)
- [Built-in Plugins](#built-in-plugins)
- [Custom Plugin Examples](#custom-plugin-examples)
- [Plugin Testing](#plugin-testing)
- [Plugin Distribution](#plugin-distribution)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## Plugin Overview

Plugins in IXP Server provide a powerful way to extend functionality without modifying the core system. They enable modular architecture, allowing developers to add features, integrate with external services, and customize behavior.

### Plugin Benefits

- **Modularity**: Separate concerns into independent modules
- **Extensibility**: Add new features without core modifications
- **Reusability**: Share plugins across different projects
- **Maintainability**: Easier to maintain and update individual features
- **Testability**: Test plugins in isolation

### Plugin Types

1. **Service Plugins**: Integrate with external services (databases, APIs, etc.)
2. **Processing Plugins**: Transform or process data
3. **Authentication Plugins**: Handle authentication mechanisms
4. **Storage Plugins**: Manage data storage and retrieval
5. **Notification Plugins**: Send notifications via various channels
6. **Analytics Plugins**: Collect and analyze usage data

## Plugin Architecture

### Plugin Interface

```typescript
import { Plugin, PluginContext, PluginConfig } from 'ixp-server';

interface IXPPlugin {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  
  initialize(context: PluginContext, config: PluginConfig): Promise<void>;
  start?(): Promise<void>;
  stop?(): Promise<void>;
  health?(): Promise<PluginHealth>;
}

interface PluginHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
}

interface PluginContext {
  server: IXPServer;
  logger: Logger;
  config: ServerConfig;
  eventBus: EventBus;
  serviceRegistry: ServiceRegistry;
}
```

### Plugin Lifecycle

```
Registration → Configuration → Initialization → Start → Running → Stop → Cleanup
```

### Plugin Communication

Plugins communicate through:
- **Event Bus**: Publish/subscribe pattern for loose coupling
- **Service Registry**: Register and discover services
- **Shared Context**: Access to server context and configuration
- **Direct API**: Direct method calls for tight integration

## Creating Plugins

### Basic Plugin Structure

```typescript
import { Plugin, PluginContext, PluginConfig, Logger } from 'ixp-server';

export class BasicPlugin implements Plugin {
  public readonly name = 'basic-plugin';
  public readonly version = '1.0.0';
  public readonly description = 'A basic example plugin';
  
  private context: PluginContext;
  private config: PluginConfig;
  private logger: Logger;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.config = config;
    this.logger = context.logger.child({ plugin: this.name });
    
    this.logger.info('Plugin initialized', { version: this.version });
  }
  
  async start(): Promise<void> {
    this.logger.info('Plugin starting');
    
    // Plugin startup logic here
    await this.setupServices();
    await this.registerEventHandlers();
    
    this.logger.info('Plugin started successfully');
  }
  
  async stop(): Promise<void> {
    this.logger.info('Plugin stopping');
    
    // Plugin cleanup logic here
    await this.cleanupServices();
    await this.unregisterEventHandlers();
    
    this.logger.info('Plugin stopped successfully');
  }
  
  async health(): Promise<PluginHealth> {
    try {
      // Perform health checks
      await this.performHealthCheck();
      
      return {
        status: 'healthy',
        message: 'Plugin is operating normally'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { error: error.stack }
      };
    }
  }
  
  private async setupServices(): Promise<void> {
    // Setup plugin services
  }
  
  private async registerEventHandlers(): Promise<void> {
    // Register event handlers
  }
  
  private async cleanupServices(): Promise<void> {
    // Cleanup plugin services
  }
  
  private async unregisterEventHandlers(): Promise<void> {
    // Unregister event handlers
  }
  
  private async performHealthCheck(): Promise<void> {
    // Perform health check logic
  }
}
```

### Advanced Plugin with Dependencies

```typescript
import { Plugin, PluginContext, PluginConfig, ServiceRegistry } from 'ixp-server';

export class AdvancedPlugin implements Plugin {
  public readonly name = 'advanced-plugin';
  public readonly version = '2.0.0';
  public readonly description = 'An advanced plugin with dependencies';
  public readonly dependencies = ['database-plugin', 'cache-plugin'];
  
  private context: PluginContext;
  private config: PluginConfig;
  private logger: Logger;
  private databaseService: DatabaseService;
  private cacheService: CacheService;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.config = config;
    this.logger = context.logger.child({ plugin: this.name });
    
    // Get dependencies from service registry
    this.databaseService = context.serviceRegistry.get<DatabaseService>('database');
    this.cacheService = context.serviceRegistry.get<CacheService>('cache');
    
    if (!this.databaseService) {
      throw new Error('Database service dependency not found');
    }
    
    if (!this.cacheService) {
      throw new Error('Cache service dependency not found');
    }
    
    this.logger.info('Plugin initialized with dependencies');
  }
  
  async start(): Promise<void> {
    this.logger.info('Starting advanced plugin');
    
    // Register services
    await this.registerServices();
    
    // Setup event listeners
    await this.setupEventListeners();
    
    // Initialize plugin-specific functionality
    await this.initializeFeatures();
    
    this.logger.info('Advanced plugin started successfully');
  }
  
  async stop(): Promise<void> {
    this.logger.info('Stopping advanced plugin');
    
    await this.cleanupFeatures();
    await this.removeEventListeners();
    await this.unregisterServices();
    
    this.logger.info('Advanced plugin stopped successfully');
  }
  
  private async registerServices(): Promise<void> {
    // Register plugin services with the service registry
    const advancedService = new AdvancedService(this.databaseService, this.cacheService);
    this.context.serviceRegistry.register('advanced', advancedService);
  }
  
  private async setupEventListeners(): Promise<void> {
    this.context.eventBus.on('user.created', this.handleUserCreated.bind(this));
    this.context.eventBus.on('user.updated', this.handleUserUpdated.bind(this));
  }
  
  private async initializeFeatures(): Promise<void> {
    // Initialize plugin-specific features
  }
  
  private async cleanupFeatures(): Promise<void> {
    // Cleanup plugin-specific features
  }
  
  private async removeEventListeners(): Promise<void> {
    this.context.eventBus.off('user.created', this.handleUserCreated.bind(this));
    this.context.eventBus.off('user.updated', this.handleUserUpdated.bind(this));
  }
  
  private async unregisterServices(): Promise<void> {
    this.context.serviceRegistry.unregister('advanced');
  }
  
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.info('Handling user created event', { userId: event.userId });
    // Handle user created event
  }
  
  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.info('Handling user updated event', { userId: event.userId });
    // Handle user updated event
  }
}
```

## Plugin Lifecycle

### Lifecycle Hooks

```typescript
export class LifecycleAwarePlugin implements Plugin {
  public readonly name = 'lifecycle-aware-plugin';
  public readonly version = '1.0.0';
  
  private context: PluginContext;
  private config: PluginConfig;
  private logger: Logger;
  private isInitialized = false;
  private isStarted = false;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Plugin already initialized');
    }
    
    this.context = context;
    this.config = config;
    this.logger = context.logger.child({ plugin: this.name });
    
    // Validate configuration
    await this.validateConfig();
    
    // Setup initial state
    await this.setupInitialState();
    
    this.isInitialized = true;
    this.logger.info('Plugin initialized');
  }
  
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Plugin not initialized');
    }
    
    if (this.isStarted) {
      this.logger.warn('Plugin already started');
      return;
    }
    
    this.logger.info('Starting plugin');
    
    try {
      await this.preStart();
      await this.doStart();
      await this.postStart();
      
      this.isStarted = true;
      this.logger.info('Plugin started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start plugin', { error: error.message });
      await this.handleStartupError(error);
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    if (!this.isStarted) {
      this.logger.warn('Plugin not started');
      return;
    }
    
    this.logger.info('Stopping plugin');
    
    try {
      await this.preStop();
      await this.doStop();
      await this.postStop();
      
      this.isStarted = false;
      this.logger.info('Plugin stopped successfully');
      
    } catch (error) {
      this.logger.error('Failed to stop plugin gracefully', { error: error.message });
      // Continue with forced cleanup
      await this.forceStop();
      throw error;
    }
  }
  
  async restart(): Promise<void> {
    this.logger.info('Restarting plugin');
    await this.stop();
    await this.start();
  }
  
  async health(): Promise<PluginHealth> {
    if (!this.isInitialized) {
      return {
        status: 'unhealthy',
        message: 'Plugin not initialized'
      };
    }
    
    if (!this.isStarted) {
      return {
        status: 'unhealthy',
        message: 'Plugin not started'
      };
    }
    
    try {
      const healthData = await this.performHealthCheck();
      
      return {
        status: 'healthy',
        message: 'Plugin is healthy',
        details: healthData
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { error: error.stack }
      };
    }
  }
  
  // Lifecycle hook methods
  private async validateConfig(): Promise<void> {
    // Validate plugin configuration
  }
  
  private async setupInitialState(): Promise<void> {
    // Setup initial plugin state
  }
  
  private async preStart(): Promise<void> {
    // Pre-start operations
  }
  
  private async doStart(): Promise<void> {
    // Main start operations
  }
  
  private async postStart(): Promise<void> {
    // Post-start operations
  }
  
  private async preStop(): Promise<void> {
    // Pre-stop operations
  }
  
  private async doStop(): Promise<void> {
    // Main stop operations
  }
  
  private async postStop(): Promise<void> {
    // Post-stop operations
  }
  
  private async forceStop(): Promise<void> {
    // Force stop operations
  }
  
  private async handleStartupError(error: Error): Promise<void> {
    // Handle startup errors
  }
  
  private async performHealthCheck(): Promise<any> {
    // Perform health check
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}
```

## Plugin Registration

### Manual Registration

```typescript
import { createIXPServer } from 'ixp-server';
import { DatabasePlugin } from './plugins/DatabasePlugin';
import { CachePlugin } from './plugins/CachePlugin';
import { AnalyticsPlugin } from './plugins/AnalyticsPlugin';

const server = createIXPServer();

// Register plugins
server.registerPlugin(new DatabasePlugin(), {
  connectionString: process.env.DATABASE_URL,
  poolSize: 10
});

server.registerPlugin(new CachePlugin(), {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

server.registerPlugin(new AnalyticsPlugin(), {
  apiKey: process.env.ANALYTICS_API_KEY,
  endpoint: process.env.ANALYTICS_ENDPOINT
});
```

### Automatic Discovery

```typescript
// plugins/index.ts
export { DatabasePlugin } from './DatabasePlugin';
export { CachePlugin } from './CachePlugin';
export { AnalyticsPlugin } from './AnalyticsPlugin';

// server.ts
import { createIXPServer } from 'ixp-server';
import * as plugins from './plugins';

const server = createIXPServer();

// Auto-register all plugins
Object.values(plugins).forEach(PluginClass => {
  const plugin = new PluginClass();
  server.registerPlugin(plugin, {
    // Plugin-specific configuration
  });
});
```

### Configuration-Based Registration

```typescript
// config/plugins.json
{
  "plugins": [
    {
      "name": "database-plugin",
      "module": "./plugins/DatabasePlugin",
      "enabled": true,
      "config": {
        "connectionString": "${DATABASE_URL}",
        "poolSize": 10
      }
    },
    {
      "name": "cache-plugin",
      "module": "./plugins/CachePlugin",
      "enabled": true,
      "config": {
        "redis": {
          "host": "${REDIS_HOST}",
          "port": "${REDIS_PORT}"
        }
      }
    }
  ]
}

// Plugin loader
class PluginLoader {
  static async loadPlugins(server: IXPServer, configPath: string): Promise<void> {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    for (const pluginConfig of config.plugins) {
      if (!pluginConfig.enabled) {
        continue;
      }
      
      try {
        const PluginClass = await import(pluginConfig.module);
        const plugin = new PluginClass.default();
        
        await server.registerPlugin(plugin, pluginConfig.config);
        
      } catch (error) {
        console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
      }
    }
  }
}

// Usage
const server = createIXPServer();
await PluginLoader.loadPlugins(server, './config/plugins.json');
```

## Plugin Communication

### Event-Based Communication

```typescript
export class EventDrivenPlugin implements Plugin {
  public readonly name = 'event-driven-plugin';
  public readonly version = '1.0.0';
  
  private context: PluginContext;
  private eventBus: EventBus;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.eventBus = context.eventBus;
  }
  
  async start(): Promise<void> {
    // Subscribe to events
    this.eventBus.on('user.login', this.handleUserLogin.bind(this));
    this.eventBus.on('order.created', this.handleOrderCreated.bind(this));
    this.eventBus.on('payment.processed', this.handlePaymentProcessed.bind(this));
    
    // Emit plugin ready event
    this.eventBus.emit('plugin.ready', {
      pluginName: this.name,
      version: this.version
    });
  }
  
  async stop(): Promise<void> {
    // Unsubscribe from events
    this.eventBus.off('user.login', this.handleUserLogin.bind(this));
    this.eventBus.off('order.created', this.handleOrderCreated.bind(this));
    this.eventBus.off('payment.processed', this.handlePaymentProcessed.bind(this));
  }
  
  private async handleUserLogin(event: UserLoginEvent): Promise<void> {
    // Process user login
    const result = await this.processUserLogin(event);
    
    // Emit processed event
    this.eventBus.emit('user.login.processed', {
      userId: event.userId,
      result,
      processedBy: this.name
    });
  }
  
  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Process order creation
    await this.processOrderCreation(event);
    
    // Emit notification event
    this.eventBus.emit('notification.send', {
      type: 'order_confirmation',
      userId: event.userId,
      orderId: event.orderId
    });
  }
  
  private async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    // Process payment
    await this.processPayment(event);
    
    // Emit analytics event
    this.eventBus.emit('analytics.track', {
      event: 'payment_processed',
      userId: event.userId,
      amount: event.amount,
      currency: event.currency
    });
  }
  
  private async processUserLogin(event: UserLoginEvent): Promise<any> {
    // User login processing logic
    return { success: true };
  }
  
  private async processOrderCreation(event: OrderCreatedEvent): Promise<void> {
    // Order creation processing logic
  }
  
  private async processPayment(event: PaymentProcessedEvent): Promise<void> {
    // Payment processing logic
  }
}
```

### Service Registry Communication

```typescript
export class ServiceProviderPlugin implements Plugin {
  public readonly name = 'service-provider-plugin';
  public readonly version = '1.0.0';
  
  private context: PluginContext;
  private serviceRegistry: ServiceRegistry;
  private emailService: EmailService;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.serviceRegistry = context.serviceRegistry;
    
    // Create service instance
    this.emailService = new EmailService(config.email);
  }
  
  async start(): Promise<void> {
    // Register services
    this.serviceRegistry.register('email', this.emailService);
    this.serviceRegistry.register('notification', new NotificationService(this.emailService));
    
    // Register service factory
    this.serviceRegistry.registerFactory('email-template', (templateName: string) => {
      return new EmailTemplate(templateName, this.emailService);
    });
  }
  
  async stop(): Promise<void> {
    // Unregister services
    this.serviceRegistry.unregister('email');
    this.serviceRegistry.unregister('notification');
    this.serviceRegistry.unregisterFactory('email-template');
  }
}

export class ServiceConsumerPlugin implements Plugin {
  public readonly name = 'service-consumer-plugin';
  public readonly version = '1.0.0';
  public readonly dependencies = ['service-provider-plugin'];
  
  private context: PluginContext;
  private serviceRegistry: ServiceRegistry;
  private emailService: EmailService;
  private notificationService: NotificationService;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.serviceRegistry = context.serviceRegistry;
  }
  
  async start(): Promise<void> {
    // Get services from registry
    this.emailService = this.serviceRegistry.get<EmailService>('email');
    this.notificationService = this.serviceRegistry.get<NotificationService>('notification');
    
    if (!this.emailService) {
      throw new Error('Email service not available');
    }
    
    if (!this.notificationService) {
      throw new Error('Notification service not available');
    }
    
    // Use services
    await this.setupNotifications();
  }
  
  private async setupNotifications(): Promise<void> {
    // Setup notification handlers using the services
    this.context.eventBus.on('user.registered', async (event) => {
      await this.notificationService.sendWelcomeEmail(event.userId);
    });
    
    this.context.eventBus.on('order.shipped', async (event) => {
      const template = this.serviceRegistry.createInstance<EmailTemplate>(
        'email-template',
        'order-shipped'
      );
      
      await template.send(event.userId, {
        orderId: event.orderId,
        trackingNumber: event.trackingNumber
      });
    });
  }
}
```

## Plugin Configuration

### Configuration Schema

```typescript
import Joi from 'joi';

export class ConfigurablePlugin implements Plugin {
  public readonly name = 'configurable-plugin';
  public readonly version = '1.0.0';
  
  private static readonly configSchema = Joi.object({
    enabled: Joi.boolean().default(true),
    apiKey: Joi.string().required(),
    endpoint: Joi.string().uri().required(),
    timeout: Joi.number().integer().min(1000).default(5000),
    retries: Joi.number().integer().min(0).max(5).default(3),
    features: Joi.object({
      analytics: Joi.boolean().default(true),
      notifications: Joi.boolean().default(false),
      caching: Joi.boolean().default(true)
    }).default({}),
    database: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().integer().min(1).max(65535).default(5432),
      username: Joi.string().required(),
      password: Joi.string().required(),
      database: Joi.string().required(),
      ssl: Joi.boolean().default(false)
    }).required()
  });
  
  private config: any;
  private context: PluginContext;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    
    // Validate configuration
    const { error, value } = ConfigurablePlugin.configSchema.validate(config, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new Error(`Plugin configuration validation failed: ${error.message}`);
    }
    
    this.config = value;
    
    // Check if plugin is enabled
    if (!this.config.enabled) {
      throw new Error('Plugin is disabled in configuration');
    }
    
    context.logger.info('Plugin configuration validated', {
      features: this.config.features,
      timeout: this.config.timeout,
      retries: this.config.retries
    });
  }
  
  async start(): Promise<void> {
    // Use configuration to setup plugin
    await this.setupDatabaseConnection();
    
    if (this.config.features.analytics) {
      await this.setupAnalytics();
    }
    
    if (this.config.features.notifications) {
      await this.setupNotifications();
    }
    
    if (this.config.features.caching) {
      await this.setupCaching();
    }
  }
  
  private async setupDatabaseConnection(): Promise<void> {
    // Setup database connection using config.database
  }
  
  private async setupAnalytics(): Promise<void> {
    // Setup analytics using config.apiKey and config.endpoint
  }
  
  private async setupNotifications(): Promise<void> {
    // Setup notifications
  }
  
  private async setupCaching(): Promise<void> {
    // Setup caching
  }
}
```

### Environment-Based Configuration

```typescript
export class EnvironmentAwarePlugin implements Plugin {
  public readonly name = 'environment-aware-plugin';
  public readonly version = '1.0.0';
  
  private config: any;
  private context: PluginContext;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    
    // Merge configuration with environment variables
    this.config = this.mergeWithEnvironment(config);
    
    // Apply environment-specific overrides
    this.applyEnvironmentOverrides();
    
    context.logger.info('Plugin configured for environment', {
      environment: process.env.NODE_ENV,
      config: this.sanitizeConfig(this.config)
    });
  }
  
  private mergeWithEnvironment(config: PluginConfig): any {
    return {
      ...config,
      apiKey: process.env.PLUGIN_API_KEY || config.apiKey,
      endpoint: process.env.PLUGIN_ENDPOINT || config.endpoint,
      debug: process.env.PLUGIN_DEBUG === 'true' || config.debug,
      logLevel: process.env.PLUGIN_LOG_LEVEL || config.logLevel || 'info'
    };
  }
  
  private applyEnvironmentOverrides(): void {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'development':
        this.config.debug = true;
        this.config.logLevel = 'debug';
        this.config.timeout = 10000; // Longer timeout for debugging
        break;
        
      case 'test':
        this.config.debug = false;
        this.config.logLevel = 'error';
        this.config.timeout = 1000; // Shorter timeout for tests
        break;
        
      case 'production':
        this.config.debug = false;
        this.config.logLevel = 'warn';
        this.config.timeout = 5000;
        break;
    }
  }
  
  private sanitizeConfig(config: any): any {
    // Remove sensitive information from config for logging
    const sanitized = { ...config };
    
    if (sanitized.apiKey) {
      sanitized.apiKey = '***masked***';
    }
    
    if (sanitized.password) {
      sanitized.password = '***masked***';
    }
    
    return sanitized;
  }
}
```

## Built-in Plugins

### Database Plugin

```typescript
import { DatabasePlugin } from 'ixp-server/plugins';

// PostgreSQL
server.registerPlugin(new DatabasePlugin(), {
  type: 'postgresql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production',
  pool: {
    min: 2,
    max: 10
  }
});

// MongoDB
server.registerPlugin(new DatabasePlugin(), {
  type: 'mongodb',
  connectionString: process.env.MONGODB_URL,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
});
```

### Cache Plugin

```typescript
import { CachePlugin } from 'ixp-server/plugins';

// Redis Cache
server.registerPlugin(new CachePlugin(), {
  type: 'redis',
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'ixp:',
  ttl: 3600 // Default TTL in seconds
});

// Memory Cache
server.registerPlugin(new CachePlugin(), {
  type: 'memory',
  maxSize: 1000,
  ttl: 3600
});
```

### Authentication Plugin

```typescript
import { AuthPlugin } from 'ixp-server/plugins';

// JWT Authentication
server.registerPlugin(new AuthPlugin(), {
  type: 'jwt',
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  issuer: 'ixp-server',
  audience: 'ixp-client',
  expiresIn: '24h'
});

// OAuth2 Authentication
server.registerPlugin(new AuthPlugin(), {
  type: 'oauth2',
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: process.env.GITHUB_REDIRECT_URI
    }
  }
});
```

### Logging Plugin

```typescript
import { LoggingPlugin } from 'ixp-server/plugins';

server.registerPlugin(new LoggingPlugin(), {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: [
    {
      type: 'console',
      colorize: process.env.NODE_ENV === 'development'
    },
    {
      type: 'file',
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: 5
    },
    {
      type: 'elasticsearch',
      host: process.env.ELASTICSEARCH_HOST,
      index: 'ixp-logs'
    }
  ]
});
```

## Custom Plugin Examples

### Email Service Plugin

```typescript
import nodemailer from 'nodemailer';

export class EmailPlugin implements Plugin {
  public readonly name = 'email-plugin';
  public readonly version = '1.0.0';
  public readonly description = 'Email service plugin using nodemailer';
  
  private context: PluginContext;
  private config: any;
  private transporter: nodemailer.Transporter;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.config = config;
    
    // Create email transporter
    this.transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.username,
        pass: config.smtp.password
      }
    });
  }
  
  async start(): Promise<void> {
    // Verify SMTP connection
    await this.transporter.verify();
    
    // Register email service
    const emailService = new EmailService(this.transporter, this.config);
    this.context.serviceRegistry.register('email', emailService);
    
    // Register event handlers
    this.context.eventBus.on('email.send', this.handleSendEmail.bind(this));
    this.context.eventBus.on('email.template', this.handleTemplateEmail.bind(this));
    
    this.context.logger.info('Email plugin started');
  }
  
  async stop(): Promise<void> {
    // Cleanup
    this.context.eventBus.off('email.send', this.handleSendEmail.bind(this));
    this.context.eventBus.off('email.template', this.handleTemplateEmail.bind(this));
    this.context.serviceRegistry.unregister('email');
    
    this.context.logger.info('Email plugin stopped');
  }
  
  async health(): Promise<PluginHealth> {
    try {
      await this.transporter.verify();
      return {
        status: 'healthy',
        message: 'SMTP connection is working'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'SMTP connection failed',
        details: { error: error.message }
      };
    }
  }
  
  private async handleSendEmail(event: SendEmailEvent): Promise<void> {
    try {
      const result = await this.transporter.sendMail({
        from: event.from || this.config.defaultFrom,
        to: event.to,
        subject: event.subject,
        text: event.text,
        html: event.html,
        attachments: event.attachments
      });
      
      this.context.eventBus.emit('email.sent', {
        messageId: result.messageId,
        to: event.to,
        subject: event.subject
      });
      
    } catch (error) {
      this.context.logger.error('Failed to send email', {
        error: error.message,
        to: event.to,
        subject: event.subject
      });
      
      this.context.eventBus.emit('email.failed', {
        error: error.message,
        to: event.to,
        subject: event.subject
      });
    }
  }
  
  private async handleTemplateEmail(event: TemplateEmailEvent): Promise<void> {
    // Handle template-based emails
    const template = await this.loadTemplate(event.template);
    const rendered = await this.renderTemplate(template, event.data);
    
    await this.handleSendEmail({
      to: event.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
  }
  
  private async loadTemplate(templateName: string): Promise<any> {
    // Load email template
    return {};
  }
  
  private async renderTemplate(template: any, data: any): Promise<any> {
    // Render template with data
    return {
      subject: 'Rendered Subject',
      html: '<p>Rendered HTML</p>',
      text: 'Rendered Text'
    };
  }
}

class EmailService {
  constructor(
    private transporter: nodemailer.Transporter,
    private config: any
  ) {}
  
  async sendEmail(options: any): Promise<any> {
    return this.transporter.sendMail({
      from: options.from || this.config.defaultFrom,
      ...options
    });
  }
  
  async sendTemplateEmail(template: string, to: string, data: any): Promise<any> {
    // Send template-based email
  }
}
```

### Analytics Plugin

```typescript
export class AnalyticsPlugin implements Plugin {
  public readonly name = 'analytics-plugin';
  public readonly version = '1.0.0';
  public readonly description = 'Analytics tracking plugin';
  
  private context: PluginContext;
  private config: any;
  private analyticsClient: AnalyticsClient;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    this.context = context;
    this.config = config;
    
    this.analyticsClient = new AnalyticsClient({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 10000
    });
  }
  
  async start(): Promise<void> {
    // Register analytics service
    this.context.serviceRegistry.register('analytics', this.analyticsClient);
    
    // Register event handlers for automatic tracking
    this.context.eventBus.on('request.started', this.trackRequestStarted.bind(this));
    this.context.eventBus.on('request.completed', this.trackRequestCompleted.bind(this));
    this.context.eventBus.on('user.action', this.trackUserAction.bind(this));
    this.context.eventBus.on('error.occurred', this.trackError.bind(this));
    
    // Start analytics client
    await this.analyticsClient.start();
    
    this.context.logger.info('Analytics plugin started');
  }
  
  async stop(): Promise<void> {
    // Flush remaining events
    await this.analyticsClient.flush();
    
    // Cleanup
    this.context.eventBus.off('request.started', this.trackRequestStarted.bind(this));
    this.context.eventBus.off('request.completed', this.trackRequestCompleted.bind(this));
    this.context.eventBus.off('user.action', this.trackUserAction.bind(this));
    this.context.eventBus.off('error.occurred', this.trackError.bind(this));
    
    this.context.serviceRegistry.unregister('analytics');
    
    await this.analyticsClient.stop();
    
    this.context.logger.info('Analytics plugin stopped');
  }
  
  private async trackRequestStarted(event: RequestStartedEvent): Promise<void> {
    await this.analyticsClient.track({
      event: 'request_started',
      userId: event.userId,
      sessionId: event.sessionId,
      properties: {
        method: event.method,
        url: event.url,
        userAgent: event.userAgent,
        ip: event.ip
      },
      timestamp: event.timestamp
    });
  }
  
  private async trackRequestCompleted(event: RequestCompletedEvent): Promise<void> {
    await this.analyticsClient.track({
      event: 'request_completed',
      userId: event.userId,
      sessionId: event.sessionId,
      properties: {
        method: event.method,
        url: event.url,
        statusCode: event.statusCode,
        duration: event.duration,
        responseSize: event.responseSize
      },
      timestamp: event.timestamp
    });
  }
  
  private async trackUserAction(event: UserActionEvent): Promise<void> {
    await this.analyticsClient.track({
      event: event.action,
      userId: event.userId,
      properties: event.properties,
      timestamp: event.timestamp
    });
  }
  
  private async trackError(event: ErrorEvent): Promise<void> {
    await this.analyticsClient.track({
      event: 'error_occurred',
      userId: event.userId,
      properties: {
        error: event.error.name,
        message: event.error.message,
        stack: event.error.stack,
        url: event.url,
        method: event.method
      },
      timestamp: event.timestamp
    });
  }
}

class AnalyticsClient {
  private events: any[] = [];
  private flushTimer: NodeJS.Timeout;
  
  constructor(private config: any) {}
  
  async start(): Promise<void> {
    // Start flush timer
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
  
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    await this.flush();
  }
  
  async track(event: any): Promise<void> {
    this.events.push(event);
    
    if (this.events.length >= this.config.batchSize) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      // Re-queue events on failure
      this.events.unshift(...eventsToSend);
      throw error;
    }
  }
  
  private async sendEvents(events: any[]): Promise<void> {
    // Send events to analytics service
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({ events })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }
}
```

## Plugin Testing

### Unit Testing

```typescript
import { createMockPluginContext } from 'ixp-server/testing';
import { EmailPlugin } from '../EmailPlugin';

describe('EmailPlugin', () => {
  let plugin: EmailPlugin;
  let mockContext: any;
  let mockConfig: any;

  beforeEach(() => {
    plugin = new EmailPlugin();
    mockContext = createMockPluginContext();
    mockConfig = {
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        username: 'test@test.com',
        password: 'password'
      },
      defaultFrom: 'noreply@test.com'
    };
  });

  describe('initialize', () => {
    it('should initialize with valid configuration', async () => {
      await expect(plugin.initialize(mockContext, mockConfig)).resolves.not.toThrow();
    });

    it('should throw error with invalid configuration', async () => {
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.smtp.host;

      await expect(plugin.initialize(mockContext, invalidConfig)).rejects.toThrow();
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await plugin.initialize(mockContext, mockConfig);
    });

    it('should start successfully', async () => {
      await expect(plugin.start()).resolves.not.toThrow();
      
      expect(mockContext.serviceRegistry.register).toHaveBeenCalledWith(
        'email',
        expect.any(Object)
      );
    });

    it('should register event handlers', async () => {
      await plugin.start();
      
      expect(mockContext.eventBus.on).toHaveBeenCalledWith(
        'email.send',
        expect.any(Function)
      );
    });
  });

  describe('health', () => {
    beforeEach(async () => {
      await plugin.initialize(mockContext, mockConfig);
      await plugin.start();
    });

    it('should return healthy status when SMTP is working', async () => {
      const health = await plugin.health();
      
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('SMTP connection is working');
    });
  });
});
```

### Integration Testing

```typescript
import { createTestServer } from 'ixp-server/testing';
import { EmailPlugin } from '../EmailPlugin';
import { AnalyticsPlugin } from '../AnalyticsPlugin';

describe('Plugin Integration', () => {
  let server: any;

  beforeEach(async () => {
    server = createTestServer();
    
    // Register plugins
    await server.registerPlugin(new EmailPlugin(), {
      smtp: {
        host: 'localhost',
        port: 1025, // MailHog test server
        secure: false
      }
    });
    
    await server.registerPlugin(new AnalyticsPlugin(), {
      apiKey: 'test-key',
      endpoint: 'http://localhost:3001/analytics'
    });
    
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should handle plugin communication', async () => {
    // Trigger an event that should be handled by both plugins
    server.eventBus.emit('user.registered', {
      userId: 'user123',
      email: 'test@example.com'
    });
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that both plugins processed the event
    // (This would require mocking or test doubles)
  });

  it('should handle plugin dependencies', async () => {
    const emailService = server.serviceRegistry.get('email');
    const analyticsService = server.serviceRegistry.get('analytics');
    
    expect(emailService).toBeDefined();
    expect(analyticsService).toBeDefined();
  });
});
```

## Plugin Distribution

### NPM Package Structure

```
my-ixp-plugin/
├── package.json
├── README.md
├── LICENSE
├── src/
│   ├── index.ts
│   ├── plugin.ts
│   ├── services/
│   └── types/
├── dist/
├── tests/
├── examples/
└── docs/
```

### Package.json

```json
{
  "name": "@myorg/ixp-email-plugin",
  "version": "1.0.0",
  "description": "Email service plugin for IXP Server",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["ixp-server", "plugin", "email"],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "ixp-server": "^1.0.0"
  },
  "dependencies": {
    "nodemailer": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.8.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

### Plugin Registry

```typescript
// Plugin registry for discovery
export interface PluginRegistry {
  name: string;
  version: string;
  description: string;
  author: string;
  repository: string;
  tags: string[];
  dependencies: string[];
  compatibility: string; // IXP Server version compatibility
}

// Usage
const registry: PluginRegistry = {
  name: '@myorg/ixp-email-plugin',
  version: '1.0.0',
  description: 'Email service plugin for IXP Server',
  author: 'Your Name',
  repository: 'https://github.com/myorg/ixp-email-plugin',
  tags: ['email', 'notifications', 'smtp'],
  dependencies: ['nodemailer'],
  compatibility: '^1.0.0'
};
```

## Performance Considerations

### Plugin Optimization

```typescript
export class OptimizedPlugin implements Plugin {
  public readonly name = 'optimized-plugin';
  public readonly version = '1.0.0';
  
  private cache = new Map<string, any>();
  private connectionPool: ConnectionPool;
  private eventQueue: EventQueue;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    // Use connection pooling
    this.connectionPool = new ConnectionPool({
      min: config.pool?.min || 2,
      max: config.pool?.max || 10,
      acquireTimeoutMillis: config.pool?.timeout || 5000
    });
    
    // Use event queuing for better performance
    this.eventQueue = new EventQueue({
      batchSize: config.queue?.batchSize || 100,
      flushInterval: config.queue?.flushInterval || 1000
    });
  }
  
  async start(): Promise<void> {
    await this.connectionPool.initialize();
    await this.eventQueue.start();
    
    // Use efficient event handling
    this.context.eventBus.on('data.process', this.handleDataProcessing.bind(this));
  }
  
  private async handleDataProcessing(event: DataProcessingEvent): Promise<void> {
    // Use caching to avoid expensive operations
    const cacheKey = this.generateCacheKey(event);
    let result = this.cache.get(cacheKey);
    
    if (!result) {
      // Use connection pool for database operations
      const connection = await this.connectionPool.acquire();
      
      try {
        result = await this.processData(connection, event);
        this.cache.set(cacheKey, result);
      } finally {
        await this.connectionPool.release(connection);
      }
    }
    
    // Queue result for batch processing
    await this.eventQueue.enqueue({
      type: 'data.processed',
      result,
      timestamp: Date.now()
    });
  }
  
  private generateCacheKey(event: DataProcessingEvent): string {
    return `${event.type}:${event.id}:${event.version}`;
  }
  
  private async processData(connection: any, event: DataProcessingEvent): Promise<any> {
    // Expensive data processing operation
    return { processed: true };
  }
}
```

### Memory Management

```typescript
export class MemoryEfficientPlugin implements Plugin {
  public readonly name = 'memory-efficient-plugin';
  public readonly version = '1.0.0';
  
  private cache: LRUCache<string, any>;
  private cleanupInterval: NodeJS.Timeout;
  
  async initialize(context: PluginContext, config: PluginConfig): Promise<void> {
    // Use LRU cache to prevent memory leaks
    this.cache = new LRUCache({
      max: config.cache?.maxSize || 1000,
      ttl: config.cache?.ttl || 300000, // 5 minutes
      updateAgeOnGet: true
    });
  }
  
  async start(): Promise<void> {
    // Setup periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }
  
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear cache
    this.cache.clear();
  }
  
  private performCleanup(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    this.context.logger.debug('Memory usage', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      cacheSize: this.cache.size
    });
  }
}
```

## Best Practices

### Design Principles

1. **Single Responsibility**: Each plugin should have one clear purpose
2. **Loose Coupling**: Minimize dependencies between plugins
3. **High Cohesion**: Keep related functionality together
4. **Configuration-Driven**: Make plugins configurable and flexible
5. **Error Resilience**: Handle errors gracefully and provide fallbacks

### Implementation Guidelines

1. **Proper Lifecycle Management**: Implement all lifecycle methods correctly
2. **Resource Cleanup**: Always clean up resources in the stop method
3. **Error Handling**: Catch and handle errors appropriately
4. **Logging**: Use structured logging with appropriate levels
5. **Health Checks**: Implement meaningful health checks

### Security Considerations

1. **Input Validation**: Validate all inputs and configurations
2. **Secure Defaults**: Use secure default configurations
3. **Credential Management**: Handle credentials securely
4. **Access Control**: Implement proper access controls
5. **Audit Logging**: Log security-relevant events

### Performance Best Practices

1. **Connection Pooling**: Use connection pools for external services
2. **Caching**: Cache expensive operations and API calls
3. **Batch Processing**: Process events in batches when possible
4. **Lazy Loading**: Load resources only when needed
5. **Memory Management**: Monitor and manage memory usage

### Testing Strategies

1. **Unit Tests**: Test plugin logic in isolation
2. **Integration Tests**: Test plugin interactions
3. **Performance Tests**: Test plugin under load
4. **Security Tests**: Test for security vulnerabilities
5. **Compatibility Tests**: Test with different IXP Server versions

This guide provides a comprehensive foundation for developing robust, scalable, and secure plugins with the IXP Server SDK. For more advanced patterns and examples, refer to the [Examples](../examples/) section of the documentation.