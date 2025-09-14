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
import type { IXPServerConfig, IXPServerInstance, IntentDefinition, ComponentDefinition, DataProvider, IXPPlugin, IXPMiddleware } from './types/index';
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
export declare function createIXPServer(config?: IXPServerConfig): IXPServerInstance;
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
export declare function createIXPApp(config?: IXPServerConfig, mountPath?: string): express.Application;
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
export declare function quickStart(options: {
    intents: string | IntentDefinition[];
    components: string | Record<string, ComponentDefinition>;
    port?: number;
    cors?: string[];
    dataProvider?: DataProvider;
}): Promise<IXPServerInstance>;
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
export declare function createDevServer(config?: IXPServerConfig): IXPServerInstance;
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
export declare class ConfigBuilder {
    private config;
    intents(intents: string | IntentDefinition[]): this;
    components(components: string | Record<string, ComponentDefinition>): this;
    port(port: number): this;
    cors(origins: string[], options?: {
        credentials?: boolean;
        methods?: string[];
        allowedHeaders?: string[];
    }): this;
    logging(level: 'error' | 'warn' | 'info' | 'debug', format?: 'json' | 'text'): this;
    metrics(enabled: boolean, endpoint?: string): this;
    security(options: {
        helmet?: boolean;
        csp?: Record<string, any>;
        rateLimit?: {
            windowMs?: number;
            max?: number;
        };
    }): this;
    plugin(plugin: IXPPlugin): this;
    middleware(middleware: IXPMiddleware): this;
    dataProvider(provider: DataProvider): this;
    build(): IXPServerConfig;
}
export { IXPServer, IntentRegistry, ComponentRegistry, IntentResolver, CrawlerDataSourceRegistry } from './core/index';
export { IXPError, ErrorFactory, ErrorCodes } from './utils/errors';
export { Logger, createLogger, defaultLogger } from './utils/logger';
export { MetricsService } from './utils/metrics';
export { useTheme, setAvailableThemes, getAvailableThemes, createDarkTheme, applyTheme } from './runtime/ixp-sdk';
export { createSwaggerPlugin, createHealthMonitoringPlugin as createHealthPlugin, createMetricsPlugin, PluginFactory } from './plugins/index';
export { createRateLimitMiddleware, createValidationMiddleware, createOriginValidationMiddleware, createTimeoutMiddleware, createRequestIdMiddleware, createRenderMiddleware, createSecurityHeadersMiddleware, createComponentAccessMiddleware, createLoggingMiddleware, MiddlewareFactory } from './middleware/index';
export type { IXPServerConfig, IXPServerInstance, IntentDefinition, ComponentDefinition, IntentRequest, IntentResponse, IXPPlugin, IXPMiddleware, DataProvider, CrawlerContentOptions, CrawlerContentResponse, ContentItem, IntentRegistry as IIntentRegistry, ComponentRegistry as IComponentRegistry, IntentResolver as IIntentResolver, IXPError as IIXPError, IXPErrorResponse, MetricsData, HealthCheckResult, ValidationResult, CLICommand, CLIOption, ProjectTemplate, TemplateFile, IXPTheme, ThemeColors, ColorPalette, ThemeTypography, ThemeSpacing, ThemeBreakpoints, ThemeComponents, ComponentTheme, ThemeContextValue, UseThemeReturn } from './types/index';
export declare const version = "1.1.1";
export declare const name = "ixp-server";
//# sourceMappingURL=index.d.ts.map