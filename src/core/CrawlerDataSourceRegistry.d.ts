import type { CrawlerDataSource, CrawlerContentOptions, CrawlerContentResponse } from '../types/index';
import { Logger } from '../utils/logger';
/**
 * Registry for managing crawler data sources
 */
export declare class CrawlerDataSourceRegistry {
    private sources;
    private cache;
    private rateLimits;
    private logger;
    constructor(logger?: Logger);
    /**
     * Register a new crawler data source
     */
    register(source: CrawlerDataSource): void;
    /**
     * Unregister a crawler data source
     */
    unregister(name: string): boolean;
    /**
     * Get all registered data sources
     */
    getAll(): CrawlerDataSource[];
    /**
     * Get all registered data sources as Map
     */
    getAllDataSources(): Map<string, CrawlerDataSource>;
    /**
     * Get array of registered data sources
     */
    getDataSources(): CrawlerDataSource[];
    /**
     * Get a specific data source by name
     */
    get(name: string): CrawlerDataSource | undefined;
    /**
     * Get data sources by criteria
     */
    findByCriteria(criteria: {
        enabled?: boolean;
        hasAuth?: boolean;
    }): CrawlerDataSource[];
    /**
     * Execute crawler content request across all or specific data sources
     */
    getCrawlerContent(options: CrawlerContentOptions): Promise<CrawlerContentResponse>;
    /**
     * Get registry statistics
     */
    getStats(): {
        total: number;
        enabled: number;
        withAuth: number;
        withCache: number;
        withRateLimit: number;
    };
    /**
     * Get detailed schema information for all data sources
     */
    getSchemaInfo(): Record<string, {
        schema: any;
        version: string;
        requiredFields: string[];
        optionalFields: string[];
        fieldTypes: Record<string, string>;
    }>;
    /**
     * Validate a data source configuration without registering it
     */
    validateConfiguration(source: CrawlerDataSource): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Clear all caches
     */
    clearCache(): void;
    /**
     * Validate data source configuration
     */
    private validateDataSource;
    /**
     * Validate schema structure and properties
     */
    private validateSchemaStructure;
    /**
     * Validate data source configuration
     */
    private validateDataSourceConfig;
    /**
     * Validate data against schema
     */
    private validateDataAgainstSchema;
    /**
     * Check if value matches expected type
     */
    private isValidType;
    /**
     * Check rate limits for a data source
     */
    private checkRateLimit;
    /**
     * Generate cache key for a request
     */
    private getCacheKey;
    /**
     * Get data from cache
     */
    private getFromCache;
    /**
     * Set data in cache
     */
    private setCache;
    /**
     * Clear cache entries for a specific source
     */
    private clearCacheForSource;
    /**
     * Transform data source response to ContentItem format
     */
    private transformToContentItems;
    /**
     * Generate combined schema from multiple sources
     */
    private generateCombinedSchema;
}
//# sourceMappingURL=CrawlerDataSourceRegistry.d.ts.map