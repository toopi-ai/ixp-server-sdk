import { Router } from 'express';
import type { IXPServerConfig, IXPServerInstance, IXPPlugin, IXPMiddleware } from '../types/index';
import { IntentRegistry } from './IntentRegistry';
import { ComponentRegistry } from './ComponentRegistry';
import { ComponentRenderer } from './ComponentRenderer';
import { IntentResolver } from './IntentResolver';
import { CrawlerDataSourceRegistry } from './CrawlerDataSourceRegistry';
/**
 * Main IXP Server class that orchestrates all components
 */
export declare class IXPServer implements IXPServerInstance {
    readonly app: Router;
    readonly config: IXPServerConfig;
    readonly intentRegistry: IntentRegistry;
    readonly componentRegistry: ComponentRegistry;
    readonly componentRenderer: ComponentRenderer;
    readonly intentResolver: IntentResolver;
    readonly crawlerDataSourceRegistry: CrawlerDataSourceRegistry;
    private plugins;
    private middlewares;
    private metricsService;
    private logger;
    private server?;
    private isInitialized;
    constructor(config?: IXPServerConfig);
    /**
     * Initialize the server with middleware and routes
     */
    initialize(): Promise<void>;
    /**
     * Setup core middleware (CORS, security, etc.)
     */
    private setupCoreMiddleware;
    /**
     * Setup custom middleware
     */
    private setupCustomMiddleware;
    /**
     * Install plugins
     */
    private installPlugins;
    /**
     * Setup IXP routes
     */
    private setupRoutes;
    /**
     * Setup error handling middleware
     */
    private setupErrorHandling;
    private handle404;
    private handle500;
    /**
     * Handle index page with debug mode detection
     */
    private handleIndexPage;
    /**
     * Check if server is running in debug mode
     */
    private isDebugMode;
    /**
     * Render debug index page with endpoint testing interface
     */
    private renderDebugIndexPage;
    /**
     * Render production index page
     */
    private renderProductionIndexPage;
    /**
     * Get available endpoints for testing
     */
    private getAvailableEndpoints;
    /**
     * Get server information
     */
    private getServerInfo;
    /**
     * Add plugin to the server
     */
    addPlugin(plugin: IXPPlugin): Promise<void>;
    /**
     * Remove plugin from the server
     */
    removePlugin(name: string): Promise<void>;
    /**
     * Add middleware to the server
     */
    addMiddleware(middleware: IXPMiddleware): void;
    /**
     * Start the server
     */
    listen(port?: number): Promise<void>;
    /**
     * Stop the server
     */
    close(): Promise<void>;
    /**
     * Get health check information
     */
    private getHealthCheck;
    /**
     * Get metrics information
     */
    private getMetrics;
    /**
     * Extract component source from configuration
     */
    private extractComponentSource;
    /**
     * Normalize configuration with defaults
     */
    private normalizeConfig;
    /**
     * Register a crawler data source
     */
    registerCrawlerDataSource(dataSource: any): void;
    /**
     * Unregister a crawler data source
     */
    unregisterCrawlerDataSource(name: string): boolean;
    /**
     * Get all registered crawler data sources
     */
    getCrawlerDataSources(): string[];
    /**
     * Get detailed schema information for all crawler data sources
     */
    getCrawlerDataSourceSchemas(): Record<string, {
        schema: any;
        version: string;
        requiredFields: string[];
        optionalFields: string[];
        fieldTypes: Record<string, string>;
    }>;
    /**
     * Validate a crawler data source configuration without registering it
     */
    validateCrawlerDataSource(source: any): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get crawler data source registry statistics
     */
    getCrawlerDataSourceStats(): {
        total: number;
        enabled: number;
        withAuth: number;
        withCache: number;
        withRateLimit: number;
    };
    /**
     * Cleanup resources
     */
    destroy(): Promise<void>;
    /**
     * Generate chatbox HTML with theme integration
     */
    private generateChatboxHTML;
}
//# sourceMappingURL=IXPServer.d.ts.map