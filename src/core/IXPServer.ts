import express, { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import type {
  IXPServerConfig,
  IXPServerInstance,
  IXPPlugin,
  IXPMiddleware,
  IntentRequest,
  DataProvider,
  CrawlerContentOptions,
  HealthCheckResult,
  MetricsData
} from '../types/index';
import { IntentRegistry } from './IntentRegistry';
import { ComponentRegistry } from './ComponentRegistry';
import { ComponentRenderer } from './ComponentRenderer';
import { IntentResolver } from './IntentResolver';
import { IXPError, ErrorFactory, toErrorResponse, getErrorStatusCode } from '../utils/errors';
import { Logger, createLogger } from '../utils/logger';
import { MetricsService } from '../utils/metrics';

/**
 * Main IXP Server class that orchestrates all components
 */
export class IXPServer implements IXPServerInstance {
  public readonly app: Router;
  public readonly config: IXPServerConfig;
  public readonly intentRegistry: IntentRegistry;
  public readonly componentRegistry: ComponentRegistry;
  public readonly componentRenderer: ComponentRenderer;
  public readonly intentResolver: IntentResolver;
  
  private plugins: Map<string, IXPPlugin> = new Map();
  private middlewares: IXPMiddleware[] = [];
  private metricsService: MetricsService;
  private logger: Logger;
  private server?: any;
  private isInitialized = false;

  constructor(config: IXPServerConfig = {}) {
    this.config = this.normalizeConfig(config);
    this.app = express.Router();
    this.logger = new Logger(this.config.logging);
    this.metricsService = new MetricsService(this.config.metrics);
    
    // Initialize registries
    this.intentRegistry = new IntentRegistry(this.config.intents);
    
    // Extract component source from configuration
    const componentSource = this.extractComponentSource(this.config.components);
    this.componentRegistry = new ComponentRegistry(componentSource);
    this.componentRenderer = new ComponentRenderer(this.componentRegistry);
    this.intentResolver = new IntentResolver(
      this.intentRegistry,
      this.componentRegistry,
      this.config.dataProvider
    );

    this.logger.info('IXP Server initialized', {
      intents: this.intentRegistry.getAll().length,
      components: this.componentRegistry.getAll().length
    });
  }

  /**
   * Initialize the server with middleware and routes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Server already initialized');
      return;
    }

    try {
      // Setup core middleware
      await this.setupCoreMiddleware();
      
      // Setup custom middleware
      await this.setupCustomMiddleware();
      
      // Install plugins
      await this.installPlugins();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Enable file watching if configured
      if (this.config.intents && typeof this.config.intents === 'string') {
        this.intentRegistry.enableFileWatching();
      }
      if (this.config.components && typeof this.config.components === 'string') {
        this.componentRegistry.enableFileWatching();
      }
      
      this.isInitialized = true;
      this.logger.info('IXP Server initialization complete');
    } catch (error) {
      this.logger.error('Failed to initialize IXP Server', error);
      throw ErrorFactory.configuration('Server initialization failed', { error });
    }
  }

  /**
   * Setup core middleware (CORS, security, etc.)
   */
  private async setupCoreMiddleware(): Promise<void> {
    // Request logging and metrics
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.metricsService.recordRequest(req.path, res.statusCode, duration);
        this.logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        });
      });
      
      next();
    });

    // CORS configuration
    if (this.config.cors) {
      const corsOptions = {
        origin: this.config.cors?.origins || ['http://localhost:3000'],
        credentials: this.config.cors?.credentials ?? true,
        methods: this.config.cors?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: this.config.cors?.allowedHeaders || ['Content-Type', 'Authorization']
      };
      
      this.app.use(cors(corsOptions));
      this.logger.debug('CORS configured', corsOptions);
    }

    // Security middleware
    if (this.config.security?.helmet !== false) {
      const helmetOptions = {
        contentSecurityPolicy: this.config.security?.csp || {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'"]
          }
        }
      };
      
      this.app.use(helmet(helmetOptions));
      this.logger.debug('Security middleware configured');
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  /**
   * Setup custom middleware
   */
  private async setupCustomMiddleware(): Promise<void> {
    // Sort middleware by priority
    const sortedMiddleware = [...(this.config.middleware || []), ...this.middlewares]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const middleware of sortedMiddleware) {
      this.app.use(middleware.handler);
      this.logger.debug(`Middleware '${middleware.name}' installed`);
    }
  }

  /**
   * Install plugins
   */
  private async installPlugins(): Promise<void> {
    const plugins = this.config.plugins || [];
    
    for (const plugin of plugins) {
      await this.addPlugin(plugin);
    }
  }

  /**
   * Setup IXP routes
   */
  private setupRoutes(): void {
    // GET /ixp/intents - Intent Discovery
    this.app.get('/intents', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const intents = this.intentRegistry.getAll();
        res.json({
          intents,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/components - Component Registry
    this.app.get('/components', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const components = this.componentRegistry.getAll();
        res.json({
          components,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    });

    // POST /ixp/render - Component Resolution
    this.app.post('/render', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { intent, options } = req.body;
        
        if (!intent || !intent.name) {
          throw ErrorFactory.invalidRequest('Missing required parameter \'intent.name\'');
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin) {
          const intentDef = this.intentRegistry.get(intent.name);
          if (intentDef) {
            const componentDef = this.componentRegistry.get(intentDef.component);
            if (componentDef && !this.componentRegistry.isOriginAllowed(componentDef.name, origin)) {
              throw ErrorFactory.originNotAllowed(origin, componentDef.name);
            }
          }
        }

        const result = await this.intentResolver.resolveIntent(intent, options);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // POST /ixp/render-ui - Intent Resolution with HTML Output
    this.app.post('/render-ui', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { intent, options } = req.body;
        
        if (!intent || !intent.name) {
          throw ErrorFactory.invalidRequest('Missing required parameter \'intent.name\'');
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin) {
          const intentDef = this.intentRegistry.get(intent.name);
          if (intentDef) {
            const componentDef = this.componentRegistry.get(intentDef.component);
            if (componentDef && !this.componentRegistry.isOriginAllowed(componentDef.name, origin)) {
              throw ErrorFactory.originNotAllowed(origin, componentDef.name);
            }
          }
        }

        const result = await this.intentResolver.resolveIntent(intent, options);
        
        // Render the component as HTML
        const renderOptions = {
          componentName: result.component.name,
          props: result.record.props,
          intentId: intent.name,
          theme: options?.theme || this.config.theme || {},
          apiBase: options?.apiBase || '/ixp',
          ssr: options?.ssr !== false,
          hydrate: options?.hydrate !== false,
          timeout: options?.timeout || 5000
        };

        const renderResult = await this.componentRenderer.render(renderOptions);
        
        const html = this.componentRenderer.generatePage(renderResult, {
          title: `${intent.name} - ${result.component.name}`,
          meta: {
            'intent-name': intent.name,
            'component-name': result.component.name,
            'render-time': renderResult.performance.renderTime.toString()
          }
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.send(html);
      } catch (error) {
        next(error);
      }
    });

    // POST /ixp/components/render - Direct Component Rendering
    this.app.post('/components/render', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { componentName, props, options = {} } = req.body;
        
        if (!componentName) {
          throw ErrorFactory.invalidRequest('Missing required parameter \'componentName\'');
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin) {
          const componentDef = this.componentRegistry.get(componentName);
          if (componentDef && !this.componentRegistry.isOriginAllowed(componentName, origin)) {
            throw ErrorFactory.originNotAllowed(origin, componentName);
          }
        }

        const renderOptions = {
          componentName,
          props: props || {},
          intentId: options.intentId,
          theme: options.theme || this.config.theme || {},
          apiBase: options.apiBase || '/ixp',
          ssr: options.ssr !== false,
          hydrate: options.hydrate !== false,
          timeout: options.timeout || 5000
        };

        const result = await this.componentRenderer.render(renderOptions);
        
        // Return different formats based on Accept header
        const acceptHeader = req.get('Accept');
        if (acceptHeader?.includes('text/html')) {
          // Return full HTML page
          const html = this.componentRenderer.generatePage(result, {
            title: `${componentName} Component`,
            meta: {
              'component-name': componentName,
              'render-time': result.performance.renderTime.toString()
            }
          });
          res.setHeader('Content-Type', 'text/html');
          res.send(html);
        } else {
          // Return JSON response
          res.json({
            ...result,
            hydrationScript: this.componentRenderer.generateHydrationScript(result)
          });
        }
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/components/:name - Get Component Definition
    this.app.get('/components/:name', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name } = req.params;
        
        if (!name) {
          throw ErrorFactory.invalidRequest('Component name is required');
        }
        
        const component = this.componentRegistry.get(name);
        
        if (!component) {
          throw ErrorFactory.componentNotFound(name);
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin && !this.componentRegistry.isOriginAllowed(name, origin)) {
          throw ErrorFactory.originNotAllowed(origin, name);
        }

        res.json({
          component,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/components/:name/bundle - Serve Component Bundle
    this.app.get('/components/:name/bundle', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name } = req.params;
        
        if (!name) {
          throw ErrorFactory.invalidRequest('Component name is required');
        }
        
        const component = this.componentRegistry.get(name);
        
        if (!component) {
          throw ErrorFactory.componentNotFound(name);
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin && !this.componentRegistry.isOriginAllowed(name, origin)) {
          throw ErrorFactory.originNotAllowed(origin, name);
        }

        // Serve the bundle file
        const bundlePath = component.remoteUrl.startsWith('/') 
          ? component.remoteUrl.substring(1) 
          : component.remoteUrl;
        
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.sendFile(bundlePath, { root: process.cwd() });
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/components/:name/css - Serve Component CSS
    this.app.get('/components/:name/css', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name } = req.params;
        
        if (!name) {
          throw ErrorFactory.invalidRequest('Component name is required');
        }
        
        const component = this.componentRegistry.get(name);
        
        if (!component) {
          throw ErrorFactory.componentNotFound(name);
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin && !this.componentRegistry.isOriginAllowed(name, origin)) {
          throw ErrorFactory.originNotAllowed(origin, name);
        }

        // Serve the CSS file
        const cssPath = component.remoteUrl.replace('.esm.js', '.css');
        const fullCssPath = cssPath.startsWith('/') ? cssPath.substring(1) : cssPath;
        
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.sendFile(fullCssPath, { root: process.cwd() });
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/sdk - Serve IXP SDK runtime
    this.app.get('/sdk', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sdkPath = path.resolve(__dirname, '../runtime/ixp-sdk.js');
        
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(sdkPath);
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/sdk/config - Serve SDK configuration
    this.app.get('/sdk/config', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const config = {
          theme: this.config.theme || {},
          version: '1.1.0',
          endpoints: {
            intents: '/ixp/intents',
            components: '/ixp/components',
            render: '/ixp/render',
            sdk: '/ixp/sdk',
            health: '/ixp/health',
            metrics: this.config.metrics?.endpoint || '/ixp/metrics'
          },
          cors: {
            origins: this.config.cors?.origins || ['http://localhost:3000']
          }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(config);
      } catch (error) {
        next(error);
      }
    });

    // GET /view/:componentName - Component View for iframe embedding
    this.app.get('/view/:componentName', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { componentName } = req.params;
        
        if (!componentName) {
          throw ErrorFactory.invalidRequest('Component name is required');
        }
        
        const component = this.componentRegistry.get(componentName);
        
        if (!component) {
          throw ErrorFactory.componentNotFound(componentName);
        }

        // Validate origin if component has restrictions
        const origin = req.get('Origin');
        if (origin && !this.componentRegistry.isOriginAllowed(componentName, origin)) {
          throw ErrorFactory.originNotAllowed(origin, componentName);
        }

        // Extract props from query parameters
        let props = { ...req.query };
        
        // Use data provider to resolve component data if available
        if (this.config.dataProvider?.resolveComponentData) {
          try {
            const resolvedData = await this.config.dataProvider.resolveComponentData(
              componentName,
              req.query,
              { req, res }
            );
            props = { ...props, ...resolvedData };
          } catch (error) {
            this.logger.warn(`Failed to resolve component data for ${componentName}:`, error);
            // Continue with query params only if data provider fails
          }
        }
        
        const renderOptions = {
          componentName,
          props,
          theme: this.config.theme || {},
          apiBase: '/ixp',
          ssr: true,
          hydrate: true,
          timeout: 5000
        };

        const renderResult = await this.componentRenderer.render(renderOptions);
        
        const html = this.componentRenderer.generatePage(renderResult, {
          title: `${componentName} Component`,
          meta: {
            'component-name': componentName,
            'render-time': renderResult.performance.renderTime.toString(),
            'viewport': 'width=device-width, initial-scale=1.0'
          }
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.send(html);
      } catch (error) {
        next(error);
      }
    });

    // GET /ixp/crawler_content - Crawler Content
    this.app.get('/crawler_content', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: CrawlerContentOptions = {
          cursor: req.query.cursor as string,
          limit: Math.min(parseInt(req.query.limit as string) || 100, 1000),
          lastUpdated: req.query.lastUpdated as string,
          format: (req.query.format as 'json' | 'ndjson') || 'json',
          type: req.query.type as string
        };

        let result;
        if (this.config.dataProvider?.getCrawlerContent) {
          result = await this.config.dataProvider.getCrawlerContent(options);
        } else {
          // Default implementation - return crawlable intents metadata
          const crawlableIntents = this.intentRegistry.findByCriteria({ crawlable: true });
          result = {
            contents: crawlableIntents.map(intent => ({
              type: 'intent',
              id: intent.name,
              title: intent.name,
              description: intent.description,
              lastUpdated: new Date().toISOString()
            })),
            pagination: {
              nextCursor: null,
              hasMore: false
            },
            lastUpdated: new Date().toISOString()
          };
        }

        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const health = await this.getHealthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        next(error);
      }
    });

    // Metrics endpoint
    if (this.config.metrics?.enabled !== false) {
      const metricsEndpoint = this.config.metrics?.endpoint || '/metrics';
      this.app.get(metricsEndpoint, async (req: Request, res: Response, next: NextFunction) => {
        try {
          const metrics = await this.getMetrics();
          res.json(metrics);
        } catch (error) {
          next(error);
        }
      });
    }

    this.logger.debug('IXP routes configured');
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      const statusCode = getErrorStatusCode(error);
      const errorResponse = toErrorResponse(error);
      
      this.metricsService.recordError(error);
      this.logger.error('Request error', {
        error: errorResponse.error,
        path: req.path,
        method: req.method
      });
      
      res.status(statusCode).json(errorResponse);
    });
  }

  /**
   * Add plugin to the server
   */
  async addPlugin(plugin: IXPPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw ErrorFactory.plugin(plugin.name, 'Plugin already installed');
    }

    try {
      await plugin.install(this);
      this.plugins.set(plugin.name, plugin);
      this.logger.info(`Plugin '${plugin.name}' installed successfully`);
    } catch (error) {
      throw ErrorFactory.plugin(plugin.name, 'Installation failed', { error });
    }
  }

  /**
   * Remove plugin from the server
   */
  async removePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw ErrorFactory.plugin(name, 'Plugin not found');
    }

    try {
      if (plugin.uninstall) {
        await plugin.uninstall(this);
      }
      this.plugins.delete(name);
      this.logger.info(`Plugin '${name}' removed successfully`);
    } catch (error) {
      throw ErrorFactory.plugin(name, 'Removal failed', { error });
    }
  }

  /**
   * Add middleware to the server
   */
  addMiddleware(middleware: IXPMiddleware): void {
    this.middlewares.push(middleware);
    this.logger.debug(`Middleware '${middleware.name}' added`);
  }

  /**
   * Start the server
   */
  async listen(port?: number): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const serverPort = port || this.config.port || 3001;
    
    return new Promise((resolve, reject) => {
      const app = express();
      app.use('/ixp', this.app);
      
      this.server = app.listen(serverPort, () => {
        this.logger.info(`🚀 IXP Server running on http://localhost:${serverPort}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.logger.info('IXP Server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Get health check information
   */
  private async getHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    
    // Check intent registry
    try {
      const intentCount = this.intentRegistry.getAll().length;
      checks.intents = {
        status: intentCount > 0 ? 'pass' : 'warn',
        message: `${intentCount} intents loaded`
      };
    } catch (error) {
      checks.intents = {
        status: 'fail',
        message: 'Failed to load intents'
      };
    }
    
    // Check component registry
    try {
      const componentCount = this.componentRegistry.getAll().length;
      checks.components = {
        status: componentCount > 0 ? 'pass' : 'warn',
        message: `${componentCount} components loaded`
      };
    } catch (error) {
      checks.components = {
        status: 'fail',
        message: 'Failed to load components'
      };
    }
    
    // Determine overall status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
    
    const status = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';
    
    return {
      status,
      service: 'IXP Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
  }

  /**
   * Get metrics information
   */
  private async getMetrics(): Promise<MetricsData> {
    return this.metricsService.getMetrics();
  }

  /**
   * Extract component source from configuration
   */
  private extractComponentSource(components: IXPServerConfig['components']): string | Record<string, any> | undefined {
    if (!components) {
      return undefined;
    }
    
    // If it's a string or plain object, return as-is
    if (typeof components === 'string' || !('source' in components)) {
      return components;
    }
    
    // If it's the new configuration object, extract the source
    return components.source;
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(config: IXPServerConfig): IXPServerConfig {
    return {
      port: 3001,
      cors: {
        origins: ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      security: {
        helmet: true
      },
      logging: {
        level: 'info',
        format: 'text'
      },
      metrics: {
        enabled: true,
        endpoint: '/metrics'
      },
      ...config
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.close();
    
    // Cleanup registries
    this.intentRegistry.destroy();
    this.componentRegistry.destroy();
    
    // Uninstall plugins
    for (const [name, plugin] of Array.from(this.plugins.entries())) {
      try {
        if (plugin.uninstall) {
          await plugin.uninstall(this);
        }
      } catch (error) {
        this.logger.error(`Failed to uninstall plugin '${name}'`, error);
      }
    }
    
    this.plugins.clear();
    this.middlewares.length = 0;
    
    this.logger.info('IXP Server destroyed');
  }
}