import express, { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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
import { CrawlerDataSourceRegistry } from './CrawlerDataSourceRegistry';
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
  public readonly crawlerDataSourceRegistry: CrawlerDataSourceRegistry;
  
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
    this.crawlerDataSourceRegistry = new CrawlerDataSourceRegistry();
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

    // Static file serving
    if (this.config.static?.enabled !== false) {
      const publicPath = this.config.static?.publicPath || path.join(process.cwd(), 'public');
      const urlPath = this.config.static?.urlPath || '/public';
      const staticOptions = {
        maxAge: this.config.static?.maxAge || 86400000, // 1 day
        etag: this.config.static?.etag !== false,
        index: this.config.static?.index !== false ? ['index.html'] : false
      };
      
      this.app.use(urlPath, express.static(publicPath, staticOptions));
      this.logger.debug('Static file serving configured', { publicPath, urlPath });
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

    // GET /ixp/theme - Theme Configuration
    this.app.get('/theme', async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Default theme configuration
        const defaultTheme = {
          name: 'default',
          version: '1.0.0',
          mode: 'light',
          colors: {
            primary: {
              50: '#eff6ff',
              100: '#dbeafe',
              200: '#bfdbfe',
              300: '#93c5fd',
              400: '#60a5fa',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              800: '#1e40af',
              900: '#1e3a8a'
            },
            secondary: {
              50: '#f8fafc',
              100: '#f1f5f9',
              200: '#e2e8f0',
              300: '#cbd5e1',
              400: '#94a3b8',
              500: '#64748b',
              600: '#475569',
              700: '#334155',
              800: '#1e293b',
              900: '#0f172a'
            },
            background: {
              default: '#ffffff',
              paper: '#f8fafc',
              elevated: '#ffffff'
            },
            text: {
              primary: '#0f172a',
              secondary: '#64748b',
              disabled: '#cbd5e1'
            },
            border: {
              default: '#e2e8f0',
              light: '#f1f5f9',
              focus: '#2563eb'
            },
            status: {
              success: '#10b981',
              warning: '#f59e0b',
              error: '#ef4444',
              info: '#3b82f6'
            }
          },
          typography: {
            fontFamily: {
              sans: ['Inter', 'system-ui', 'sans-serif'],
              mono: ['Monaco', 'Consolas', 'monospace']
            },
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem'
            },
            fontWeight: {
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75
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
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px'
          },
          components: {
            button: {
              base: {
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease'
              },
              variants: {},
              sizes: {},
              states: {
                hover: { opacity: 0.9 },
                focus: { outline: '2px solid #3b82f6', outlineOffset: '2px' },
                disabled: { opacity: 0.5, cursor: 'not-allowed' }
              }
            },
            card: {
              base: {
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '1rem'
              },
              variants: {},
              sizes: {},
              states: {}
            },
            input: {
              base: {
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                padding: '0.75rem',
                fontSize: '1rem'
              },
              variants: {},
              sizes: {},
              states: {
                focus: { borderColor: '#2563eb', outline: 'none' }
              }
            },
            modal: {
              base: {
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
              },
              variants: {},
              sizes: {},
              states: {}
            }
          }
        };

        // Use configured theme or default theme
        const theme = this.config.theme || defaultTheme;
        res.json({
          theme,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    });

    // POST /ixp/render - Component Resolution (JSON response)
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

  

    // GET /ixp/crawler_content - Crawler Content
    this.app.get('/crawler_content', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: CrawlerContentOptions = {
          cursor: req.query.cursor as string,
          limit: Math.min(parseInt(req.query.limit as string) || 100, 1000),
          lastUpdated: req.query.lastUpdated as string,
          format: (req.query.format as 'json' | 'xml' | 'csv') || 'json',
          type: req.query.type as string,
          includeMetadata: req.query.includeMetadata === 'true'
        };
        
        // Add optional fields if present
        if (req.query.sources) {
          options.sources = (req.query.sources as string).split(',');
        }
        if (req.query.fields) {
          options.fields = (req.query.fields as string).split(',');
        }

        let result;
        
        // Check if there are registered data sources
        const dataSources = this.crawlerDataSourceRegistry.getDataSources();
        
        if (dataSources.length > 0) {
          // Use crawler data source registry
          result = await this.crawlerDataSourceRegistry.getCrawlerContent(options);
        } else if (this.config.dataProvider?.getCrawlerContent) {
          // Use custom data provider
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
    // 404 handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!res.headersSent) {
        this.handle404(req, res);
      }
    });

    // Error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      const statusCode = getErrorStatusCode(error);
      const errorResponse = toErrorResponse(error);
      
      this.metricsService.recordError(error);
      this.logger.error('Request error', {
        error: errorResponse.error,
        path: req.path,
        method: req.method
      });
      
      // Handle HTML error pages for browser requests
      const acceptsHtml = req.headers.accept?.includes('text/html');
      if (acceptsHtml && this.config.errorPages?.enabled !== false) {
        if (statusCode >= 500) {
          this.handle500(req, res, error);
        } else {
          this.handle404(req, res);
        }
      } else {
        res.status(statusCode).json(errorResponse);
      }
    });
  }

  private handle404(req: Request, res: Response): void {
    try {
      const template404Path = this.config.errorPages?.custom404 || 
        path.join(__dirname, '../templates/404.html');
      
      if (fs.existsSync(template404Path)) {
        const template = fs.readFileSync(template404Path, 'utf8');
        res.status(404).type('html').send(template);
      } else {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      this.logger.error('Error rendering 404 page', { error: err });
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private handle500(req: Request, res: Response, error: any): void {
    try {
      const template500Path = this.config.errorPages?.custom500 || 
        path.join(__dirname, '../templates/500.html');
      
      if (fs.existsSync(template500Path)) {
        let template = fs.readFileSync(template500Path, 'utf8');
        const errorId = crypto.randomUUID();
        const isDebug = this.config.errorPages?.debug === true;
        
        // Replace template variables
        template = template
          .replace(/{{timestamp}}/g, new Date().toISOString())
          .replace(/{{errorId}}/g, errorId)
          .replace(/{{path}}/g, req.path)
          .replace(/{{method}}/g, req.method)
          .replace(/{{errorStack}}/g, isDebug ? (error.stack || error.message || 'Unknown error') : 'Error details hidden in production mode');
        
        // Handle debug sections
         if (isDebug) {
           template = template.replace(/\{\{#debug\}\}/g, '').replace(/\{\{\/debug\}\}/g, '');
           template = template.replace(/\{\{\^debug\}\}[\s\S]*?\{\{\/debug\}\}/g, '');
         } else {
           template = template.replace(/\{\{#debug\}\}[\s\S]*?\{\{\/debug\}\}/g, '');
           template = template.replace(/\{\{\^debug\}\}/g, '').replace(/\{\{\/debug\}\}/g, '');
         }
        
        res.status(500).type('html').send(template);
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An internal server error occurred',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      this.logger.error('Error rendering 500 page', { error: err });
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Handle index page with debug mode detection
   */
  private handleIndexPage(req: Request, res: Response): void {
    const isDebugMode = this.isDebugMode();
    
    if (isDebugMode) {
      this.renderDebugIndexPage(req, res);
    } else {
      this.renderProductionIndexPage(req, res);
    }
  }

  /**
   * Check if server is running in debug mode
   */
  private isDebugMode(): boolean {
    // Check multiple indicators for debug mode
    const nodeEnv = process.env.NODE_ENV;
    const loggingLevel = this.config.logging?.level;
    const errorPagesDebug = this.config.errorPages?.debug;
    const ixpDebug = process.env.IXP_DEBUG;
    
    const isDebug = (
      nodeEnv === 'development' ||
      loggingLevel === 'debug' ||
      errorPagesDebug === true ||
      ixpDebug === 'true' ||
      // Also check for common development indicators
      process.env.NODE_ENV?.toLowerCase().includes('dev') ||
      process.env.DEBUG === 'true'
    );
    
    this.logger.info('Debug mode check', {
      NODE_ENV: nodeEnv,
      loggingLevel,
      errorPagesDebug,
      IXP_DEBUG: ixpDebug,
      DEBUG: process.env.DEBUG,
      isDebugMode: isDebug
    });
    
    return isDebug;
  }

  /**
   * Render debug index page with endpoint testing interface
   */
  private renderDebugIndexPage(req: Request, res: Response): void {
    try {
      const endpoints = this.getAvailableEndpoints();
      const serverInfo = this.getServerInfo();
      
      // Read the debug template file
      const templatePath = path.join(__dirname, '../templates/debugindex.html');
      let debugHtml = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      debugHtml = debugHtml.replace(/{{serverInfo\.port}}/g, serverInfo.port.toString());
      debugHtml = debugHtml.replace(/{{serverInfo\.environment}}/g, serverInfo.environment);
      debugHtml = debugHtml.replace(/{{serverInfo\.intentsCount}}/g, serverInfo.intentsCount.toString());
      debugHtml = debugHtml.replace(/{{serverInfo\.componentsCount}}/g, serverInfo.componentsCount.toString());
      debugHtml = debugHtml.replace(/{{serverInfo\.uptime}}/g, serverInfo.uptime);
      debugHtml = debugHtml.replace(/{{serverInfo\.version}}/g, serverInfo.version);
      debugHtml = debugHtml.replace(/{{timestamp}}/g, new Date().toISOString());
      
      // Generate endpoints HTML
      const endpointsHtml = endpoints.map(endpoint => `
        <div class="endpoint">
          <div class="endpoint-header">
            <div>
              <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
              <span class="endpoint-path">${endpoint.path}</span>
            </div>
            <button class="test-button" onclick="testEndpoint('${endpoint.method}', '${endpoint.path}', '${endpoint.path.replace(/'/g, "\\'")}')">Test</button>
          </div>
          <div class="endpoint-description">${endpoint.description}</div>
          <div class="response-area" id="response-${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}"></div>
        </div>
      `).join('');
      
      debugHtml = debugHtml.replace(/{{endpoints}}/g, endpointsHtml);
      
      res.type('html').send(debugHtml);
    } catch (error) {
      this.logger.error('Failed to render debug index page:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Render production index page
   */
  private renderProductionIndexPage(req: Request, res: Response): void {
    try {
      const serverInfo = this.getServerInfo();
      
      // Read the production template file
      const templatePath = path.join(__dirname, '../templates/productionindex.html');
      let productionHtml = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      productionHtml = productionHtml.replace(/{{serverInfo\.intentsCount}}/g, serverInfo.intentsCount.toString());
      productionHtml = productionHtml.replace(/{{serverInfo\.componentsCount}}/g, serverInfo.componentsCount.toString());
      productionHtml = productionHtml.replace(/{{serverInfo\.version}}/g, serverInfo.version);
      productionHtml = productionHtml.replace(/{{serverInfo\.port}}/g, serverInfo.port.toString());
      productionHtml = productionHtml.replace(/{{serverInfo\.uptime}}/g, serverInfo.uptime);
      
      res.type('html').send(productionHtml);
    } catch (error) {
      this.logger.error('Failed to render production index page:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Get available endpoints for testing
   */
  private getAvailableEndpoints(): Array<{method: string, path: string, description: string}> {
    return [
      {
        method: 'GET',
        path: '/ixp/intents',
        description: 'Get all available intents with their definitions and parameters'
      },
      {
        method: 'GET',
        path: '/ixp/components',
        description: 'Get all registered components with their metadata'
      },
      {
        method: 'GET',
        path: '/ixp/theme',
        description: 'Get the current theme configuration'
      },
      {
        method: 'POST',
        path: '/ixp/render',
        description: 'Resolve intent requests to component descriptors'
      },
      {
        method: 'GET',
        path: '/ixp/crawler_content',
        description: 'Get crawlable public content for SEO and indexing'
      },
      {
        method: 'GET',
        path: '/ixp/health',
        description: 'Get server health status and system information'
      },
      ...(this.config.metrics?.enabled !== false ? [{
        method: 'GET',
        path: this.config.metrics?.endpoint || '/ixp/metrics',
        description: 'Get server performance metrics and statistics'
      }] : [])
    ];
  }

  /**
   * Get server information
   */
  private getServerInfo(): {port: number, environment: string, intentsCount: number, componentsCount: number, uptime: string, version: string} {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return {
      port: this.config.port || 3001,
      environment: process.env.NODE_ENV || 'development',
      intentsCount: this.intentRegistry.getAll().length,
      componentsCount: this.componentRegistry.getAll().length,
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      version: '1.1.1' // You might want to read this from package.json
    };
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
      
      // Add static file serving to main app if enabled
      if (this.config.static?.enabled !== false) {
        const publicPath = this.config.static?.publicPath || path.join(process.cwd(), 'public');
        const urlPath = this.config.static?.urlPath || '/public';
        const staticOptions = {
          maxAge: this.config.static?.maxAge || 86400000, // 1 day
          etag: this.config.static?.etag !== false,
          index: this.config.static?.index !== false ? ['index.html'] : false
        };
        
        app.use(urlPath, express.static(publicPath, staticOptions));
        this.logger.debug('Static file serving configured on main app', { publicPath, urlPath });
      }
      
      // Add templates directory serving for React renderer
      const templatesPath = path.join(__dirname, '../../templates');
      if (fs.existsSync(templatesPath)) {
        app.use('/templates', express.static(templatesPath, {
          maxAge: 86400000, // 1 day
          etag: true
        }));
        this.logger.debug('Templates directory serving configured', { templatesPath });
      }
      
           app.get('/', (req, res) => {
               // Get theme configuration
               const theme = this.config.theme || {};
               
               // Generate chatbox HTML with theme integration
               const chatboxHTML = this.generateChatboxHTML(theme);
               
               res.setHeader('Content-Type', 'text/html');
               res.send(chatboxHTML);
            });
      // Add index route with debug mode detection
      app.get('/ixp', (req: Request, res: Response) => {
        this.handleIndexPage(req, res);
      });
      
      app.use('/ixp', this.app);
      
      // Add global error handling for non-IXP routes
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (!res.headersSent) {
          this.handle404(req, res);
        }
      });
      
      app.use((error: any, req: Request, res: Response, next: NextFunction) => {
        const statusCode = getErrorStatusCode(error);
        const errorResponse = toErrorResponse(error);
        
        this.metricsService.recordError(error);
        this.logger.error('Request error', {
          error: errorResponse.error,
          path: req.path,
          method: req.method
        });
        
        // Handle HTML error pages for browser requests
        const acceptsHtml = req.headers.accept?.includes('text/html');
        if (acceptsHtml && this.config.errorPages?.enabled !== false) {
          if (statusCode >= 500) {
            this.handle500(req, res, error);
          } else {
            this.handle404(req, res);
          }
        } else {
          res.status(statusCode).json(errorResponse);
        }
      });
      
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
   * Register a crawler data source
   */
  registerCrawlerDataSource(dataSource: any): void {
    this.crawlerDataSourceRegistry.register(dataSource);
    this.logger.info(`Crawler data source '${dataSource.name}' registered`);
  }

  /**
   * Unregister a crawler data source
   */
  unregisterCrawlerDataSource(name: string): boolean {
    const result = this.crawlerDataSourceRegistry.unregister(name);
    if (result) {
      this.logger.info(`Crawler data source '${name}' unregistered`);
    }
    return result;
  }

  /**
   * Get all registered crawler data sources
   */
  getCrawlerDataSources(): string[] {
    return Array.from(this.crawlerDataSourceRegistry.getAllDataSources().keys());
  }

  /**
   * Get detailed schema information for all crawler data sources
   */
  getCrawlerDataSourceSchemas(): Record<string, {
    schema: any;
    version: string;
    requiredFields: string[];
    optionalFields: string[];
    fieldTypes: Record<string, string>;
  }> {
    return this.crawlerDataSourceRegistry.getSchemaInfo();
  }

  /**
   * Validate a crawler data source configuration without registering it
   */
  validateCrawlerDataSource(source: any): { valid: boolean; errors: string[] } {
    return this.crawlerDataSourceRegistry.validateConfiguration(source);
  }

  /**
   * Get crawler data source registry statistics
   */
  getCrawlerDataSourceStats(): {
    total: number;
    enabled: number;
    withAuth: number;
    withCache: number;
    withRateLimit: number;
  } {
    return this.crawlerDataSourceRegistry.getStats();
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

  /**
   * Generate chatbox HTML with theme integration
   */
  private generateChatboxHTML(theme: any): string {
    // Read the chatbox template
    const templatePath = path.join(__dirname, '../../src/templates/chatbox.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    
    // Extract theme colors with fallbacks
    const colors = {
      primary: theme.colors?.primary || '#3b82f6',
      secondary: theme.colors?.secondary || '#64748b',
      background: theme.colors?.background?.default || '#ffffff',
      surface: theme.colors?.background?.paper || '#f8fafc',
      text: theme.colors?.text?.primary || '#1e293b',
      textSecondary: theme.colors?.text?.secondary || '#64748b',
      border: theme.colors?.border?.default || '#e2e8f0',
      success: theme.colors?.status?.success || '#10b981',
      error: theme.colors?.status?.error || '#ef4444'
    };

    const typography = {
      fontFamily: theme.typography?.fontFamily?.sans?.[0] || 'Inter, system-ui, sans-serif',
      fontSize: theme.typography?.fontSize?.base || '1rem'
    };

    const spacing = {
      sm: theme.spacing?.sm || '8px',
      md: theme.spacing?.md || '16px',
      lg: theme.spacing?.lg || '24px'
    };

    // Inject CSS custom properties
    const cssVariables = `
    :root {
        --font-family: ${typography.fontFamily};
        --font-size: ${typography.fontSize};
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --background-color: ${colors.background};
        --surface-color: ${colors.surface};
        --text-color: ${colors.text};
        --text-secondary-color: ${colors.textSecondary};
        --border-color: ${colors.border};
        --spacing-sm: ${spacing.sm};
        --spacing-md: ${spacing.md};
        --spacing-lg: ${spacing.lg};
        --success-color: ${colors.success};
        --error-color: ${colors.error};
    }
    `;
    
    // Inject CSS variables into the style section
    html = html.replace('<style>', '<style>' + cssVariables);

    return html;
  }
}