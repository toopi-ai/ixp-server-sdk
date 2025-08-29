/**
 * IXP Server SDK - Main Entry Point
 * 
 * A comprehensive SDK for building Intent Exchange Protocol (IXP) servers with ease.
 * 
 * @example
 * ```typescript
 * import { createIXPServer } from 'ixp-server';
 * 
 * const server = createIXPServer({
 *   intents: './config/intents.json',
 *   components: './config/components.json',
 *   port: 3001,
 *   cors: { origins: ['http://localhost:3000'] }
 * });
 * 
 * server.listen();
 * ```
 */

import express from 'express';
import { IXPServer } from './core/IXPServer';
import type {
  IXPServerConfig,
  IXPServerInstance,
  IntentDefinition,
  ComponentDefinition,
  DataProvider,
  IXPPlugin,
  IXPMiddleware,
} from './types/index';
import { IntentRegistry } from './core/IntentRegistry';
import { ComponentRegistry } from './core/ComponentRegistry';
import { IntentResolver } from './core/IntentResolver';
import { IXPError, ErrorFactory } from './utils/errors';
import { Logger } from './utils/logger';
import { MetricsService } from './utils/metrics';
import {
  createRateLimitMiddleware,
  createValidationMiddleware,
  createOriginValidationMiddleware,
  createTimeoutMiddleware,
  createRequestIdMiddleware
} from './middleware/index';
import {
  createSwaggerPlugin,
  createHealthMonitoringPlugin,
  createMetricsPlugin
} from './plugins/index';

/**
 * Create a new IXP Server instance with the given configuration
 * 
 * @param config - Server configuration options
 * @returns IXP Server instance
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const server = createIXPServer({
 *   intents: './config/intents.json',
 *   components: './config/components.json'
 * });
 * 
 * // Advanced usage with custom data provider
 * const server = createIXPServer({
 *   intents: [
 *     {
 *       name: 'show_products',
 *       description: 'Display products',
 *       parameters: { type: 'object', properties: {} },
 *       component: 'ProductGrid',
 *       version: '1.0.0'
 *     }
 *   ],
 *   components: {
 *     ProductGrid: {
 *       name: 'ProductGrid',
 *       framework: 'react',
 *       remoteUrl: 'http://localhost:5173/ProductGrid.js',
 *       exportName: 'ProductGrid',
 *       propsSchema: { type: 'object', properties: {} },
 *       version: '1.0.0',
 *       allowedOrigins: ['*'],
 *       bundleSize: '45KB',
 *       performance: { tti: '0.8s', bundleSizeGzipped: '15KB' },
 *       securityPolicy: { allowEval: false, maxBundleSize: '200KB', sandboxed: true }
 *     }
 *   },
 *   dataProvider: {
 *     async getCrawlerContent(options) {
 *       // Custom crawler content implementation
 *       return { contents: [], pagination: { nextCursor: null, hasMore: false }, lastUpdated: new Date().toISOString() };
 *     }
 *   }
 * });
 * ```
 */
export function createIXPServer(config: IXPServerConfig = {}): IXPServerInstance {
  return new IXPServer(config);
}

/**
 * Create an Express app with IXP server mounted
 * 
 * @param config - Server configuration options
 * @param mountPath - Path to mount the IXP server (default: '/ixp')
 * @returns Express application with IXP server mounted
 * 
 * @example
 * ```typescript
 * const app = createIXPApp({
 *   intents: './config/intents.json',
 *   components: './config/components.json'
 * });
 * 
 * app.listen(3001, () => {
 *   console.log('Server running on http://localhost:3001');
 * });
 * ```
 */
export function createIXPApp(config: IXPServerConfig = {}, mountPath: string = '/ixp'): express.Application {
  const app = express();
  const ixpServer = createIXPServer(config);
  
  // Mount IXP server
  app.use(mountPath, ixpServer.app);
  
  // Add convenience methods
  (app as any).ixpServer = ixpServer;
  
  return app;
}

/**
 * Quick start function for simple use cases
 * 
 * @param options - Quick start options
 * @returns Promise that resolves when server is listening
 * 
 * @example
 * ```typescript
 * // Start server with minimal configuration
 * await quickStart({
 *   intents: './intents.json',
 *   components: './components.json',
 *   port: 3001
 * });
 * ```
 */
export async function quickStart(options: {
  intents: string | IntentDefinition[];
  components: string | Record<string, ComponentDefinition>;
  port?: number;
  cors?: string[];
  dataProvider?: DataProvider;
}): Promise<IXPServerInstance> {
  const config: IXPServerConfig = {
    intents: options.intents,
    components: options.components,
    port: options.port || 3001,
    ...(options.cors && { cors: { origins: options.cors } }),
    ...(options.dataProvider && { dataProvider: options.dataProvider })
  };
  
  const server = createIXPServer(config);
  await server.listen();
  
  return server;
}

/**
 * Create a development server with hot reload and debugging features
 * 
 * @param config - Server configuration options
 * @returns IXP Server instance with development features enabled
 * 
 * @example
 * ```typescript
 * const devServer = createDevServer({
 *   intents: './config/intents.json',
 *   components: './config/components.json',
 *   port: 3001
 * });
 * 
 * await devServer.listen();
 * ```
 */
export function createDevServer(config: IXPServerConfig = {}): IXPServerInstance {
  const devConfig: IXPServerConfig = {
    ...config,
    logging: {
      level: 'debug',
      format: 'text',
      ...config.logging
    },
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
      ...config.cors
    },
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      ...config.metrics
    }
  };
  
  const server = createIXPServer(devConfig);
  
  // Enable file watching for development
  if (typeof devConfig.intents === 'string') {
    server.intentRegistry.enableFileWatching();
  }
  if (typeof devConfig.components === 'string') {
    server.componentRegistry.enableFileWatching();
  }
  
  return server;
}

/**
 * Configuration builder for complex setups
 * 
 * @example
 * ```typescript
 * const config = new ConfigBuilder()
 *   .intents('./intents.json')
 *   .components('./components.json')
 *   .port(3001)
 *   .cors(['http://localhost:3000'])
 *   .logging('debug', 'json')
 *   .metrics(true)
 *   .plugin(myPlugin)
 *   .middleware(myMiddleware)
 *   .build();
 * 
 * const server = createIXPServer(config);
 * ```
 */
export class ConfigBuilder {
  private config: IXPServerConfig = {};
  
  intents(intents: string | IntentDefinition[]): this {
    this.config.intents = intents;
    return this;
  }
  
  components(components: string | Record<string, ComponentDefinition>): this {
    this.config.components = components;
    return this;
  }
  
  port(port: number): this {
    this.config.port = port;
    return this;
  }
  
  cors(origins: string[], options?: { credentials?: boolean; methods?: string[]; allowedHeaders?: string[] }): this {
    this.config.cors = {
      origins,
      credentials: options?.credentials ?? true,
      methods: options?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: options?.allowedHeaders || ['Content-Type', 'Authorization']
    };
    return this;
  }
  
  logging(level: 'error' | 'warn' | 'info' | 'debug', format?: 'json' | 'text'): this {
    this.config.logging = { level, format: format || 'text' };
    return this;
  }
  
  metrics(enabled: boolean, endpoint?: string): this {
    this.config.metrics = { enabled, endpoint: endpoint || '/metrics' };
    return this;
  }
  
  security(options: { helmet?: boolean; csp?: Record<string, any>; rateLimit?: { windowMs?: number; max?: number } }): this {
    this.config.security = options;
    return this;
  }
  
  plugin(plugin: IXPPlugin): this {
    if (!this.config.plugins) this.config.plugins = [];
    this.config.plugins.push(plugin);
    return this;
  }
  
  middleware(middleware: IXPMiddleware): this {
    if (!this.config.middleware) this.config.middleware = [];
    this.config.middleware.push(middleware);
    return this;
  }
  
  dataProvider(provider: DataProvider): this {
    this.config.dataProvider = provider;
    return this;
  }
  
  build(): IXPServerConfig {
    return { ...this.config };
  }
}

// Re-export core types and classes
export {
  IXPServer,
  IntentRegistry,
  ComponentRegistry,
  IntentResolver
} from './core/index';

export {
  IXPError,
  ErrorFactory,
  ErrorCodes
} from './utils/errors';

export {
  Logger,
  createLogger,
  defaultLogger
} from './utils/logger';

export {
  MetricsService
} from './utils/metrics';

// Re-export plugins
export {
  createSwaggerPlugin,
  createHealthMonitoringPlugin as createHealthPlugin,
  createMetricsPlugin,
  PluginFactory
} from './plugins/index';

// Re-export middleware
export {
  createRateLimitMiddleware,
  createValidationMiddleware,
  createOriginValidationMiddleware,
  createTimeoutMiddleware,
  createRequestIdMiddleware,
  createSecurityHeadersMiddleware,
  createComponentAccessMiddleware,
  createLoggingMiddleware,
  MiddlewareFactory
} from './middleware/index';

// Re-export all types
export type {
  IXPServerConfig,
  IXPServerInstance,
  IntentDefinition,
  ComponentDefinition,
  IntentRequest,
  IntentResponse,
  IXPPlugin,
  IXPMiddleware,
  DataProvider,
  CrawlerContentOptions,
  CrawlerContentResponse,
  ContentItem,
  IntentRegistry as IIntentRegistry,
  ComponentRegistry as IComponentRegistry,
  IntentResolver as IIntentResolver,
  IXPError as IIXPError,
  IXPErrorResponse,
  MetricsData,
  HealthCheckResult,
  ValidationResult,
  CLICommand,
  CLIOption,
  ProjectTemplate,
  TemplateFile
} from './types/index';

// Package information
export const version = '1.0.2';
export const name = 'ixp-server';