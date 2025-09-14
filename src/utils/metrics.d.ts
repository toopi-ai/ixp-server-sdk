import type { MetricsData } from '../types/index';
/**
 * Metrics Service for tracking server performance and usage
 */
export declare class MetricsService {
    private requests;
    private performance;
    private errors;
    private startTime;
    private enabled;
    constructor(config?: {
        enabled?: boolean;
    });
    /**
     * Record a request
     */
    recordRequest(path: string, statusCode: number, duration: number): void;
    /**
     * Record an error
     */
    recordError(error: any): void;
    /**
     * Record intent resolution
     */
    recordIntentResolution(intentName: string, success: boolean, duration: number): void;
    /**
     * Get current metrics
     */
    getMetrics(): MetricsData;
    /**
     * Get summary statistics
     */
    getSummary(): {
        totalRequests: number;
        errorRate: number;
        averageResponseTime: number;
        uptime: number;
    };
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Enable or disable metrics collection
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if metrics collection is enabled
     */
    isEnabled(): boolean;
    /**
     * Get metrics in Prometheus format
     */
    getPrometheusMetrics(): string;
}
//# sourceMappingURL=metrics.d.ts.map