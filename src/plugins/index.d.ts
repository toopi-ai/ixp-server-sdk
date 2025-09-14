/**
 * Built-in Plugins for IXP Server
 */
import type { IXPPlugin } from '../types/index';
/**
 * Swagger Documentation Plugin
 * Automatically generates OpenAPI/Swagger documentation for IXP endpoints
 */
export declare function createSwaggerPlugin(options: {
    title?: string;
    version?: string;
    description?: string;
    endpoint?: string;
    uiEndpoint?: string;
}): IXPPlugin;
/**
 * Health Monitoring Plugin
 * Provides detailed health checks and monitoring capabilities
 */
export declare function createHealthMonitoringPlugin(options: {
    endpoint?: string;
    checks?: Record<string, () => Promise<{
        status: 'pass' | 'fail' | 'warn';
        message?: string;
        duration?: number;
    }>>;
}): IXPPlugin;
/**
 * Metrics Collection Plugin
 * Provides detailed metrics collection and reporting
 */
export declare function createMetricsPlugin(options: {
    endpoint?: string;
    format?: 'json' | 'prometheus';
    includeSystemMetrics?: boolean;
}): IXPPlugin;
export declare const PluginFactory: {
    swagger: typeof createSwaggerPlugin;
    healthMonitoring: typeof createHealthMonitoringPlugin;
    metrics: typeof createMetricsPlugin;
};
//# sourceMappingURL=index.d.ts.map