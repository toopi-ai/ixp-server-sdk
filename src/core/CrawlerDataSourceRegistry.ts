import type {
  CrawlerDataSource,
  CrawlerDataSourceOptions,
  CrawlerDataSourceResponse,
  CrawlerContentOptions,
  CrawlerContentResponse,
  ContentItem
} from '../types/index';
import { Logger, createLogger } from '../utils/logger';
import { IXPError, ErrorFactory } from '../utils/errors';

/**
 * Registry for managing crawler data sources
 */
export class CrawlerDataSourceRegistry {
  private sources: Map<string, CrawlerDataSource> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private rateLimits: Map<string, { requests: number; window: number; lastReset: number }> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ level: 'info' });
  }

  /**
   * Register a new crawler data source
   */
  register(source: CrawlerDataSource): void {
    if (this.sources.has(source.name)) {
      throw ErrorFactory.invalidRequest(`Crawler data source '${source.name}' already exists`);
    }

    // Validate source configuration
    this.validateDataSource(source);

    this.sources.set(source.name, source);
    this.logger.info(`Crawler data source '${source.name}' registered`, {
      version: source.version,
      description: source.description
    });
  }

  /**
   * Unregister a crawler data source
   */
  unregister(name: string): boolean {
    const removed = this.sources.delete(name);
    if (removed) {
      // Clear related cache entries
      this.clearCacheForSource(name);
      this.rateLimits.delete(name);
      this.logger.info(`Crawler data source '${name}' unregistered`);
    }
    return removed;
  }

  /**
   * Get all registered data sources
   */
  getAll(): CrawlerDataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get all registered data sources as Map
   */
  getAllDataSources(): Map<string, CrawlerDataSource> {
    return new Map(this.sources);
  }

  /**
   * Get array of registered data sources
   */
  getDataSources(): CrawlerDataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get a specific data source by name
   */
  get(name: string): CrawlerDataSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Get data sources by criteria
   */
  findByCriteria(criteria: { enabled?: boolean; hasAuth?: boolean }): CrawlerDataSource[] {
    return this.getAll().filter(source => {
      if (criteria.enabled !== undefined && source.config?.enabled !== criteria.enabled) {
        return false;
      }
      if (criteria.hasAuth !== undefined && !!source.config?.auth?.required !== criteria.hasAuth) {
        return false;
      }
      return true;
    });
  }

  /**
   * Execute crawler content request across all or specific data sources
   */
  async getCrawlerContent(options: CrawlerContentOptions): Promise<CrawlerContentResponse> {
    let sources: CrawlerDataSource[];
    
    if (options.sources && options.sources.length > 0) {
      // Filter by multiple sources
      sources = options.sources
        .map(name => this.sources.get(name))
        .filter(Boolean) as CrawlerDataSource[];
    } else if (options.source) {
      // Filter by single source
      sources = [this.sources.get(options.source)].filter(Boolean) as CrawlerDataSource[];
    } else {
      // Get all enabled sources
      sources = this.getAll().filter(source => source.config?.enabled !== false);
    }

    if (sources.length === 0) {
      return {
        contents: [],
        pagination: { nextCursor: null, hasMore: false, total: 0 },
        lastUpdated: new Date().toISOString(),
        metadata: { sources: [], totalSources: 0 }
      };
    }

    const allContents: ContentItem[] = [];
    const sourceNames: string[] = [];
    let hasMore = false;
    let nextCursor: string | null = null;
    let totalItems = 0;

    // Process each data source
    for (const source of sources) {
      try {
        // Check rate limits
        if (!this.checkRateLimit(source)) {
          this.logger.warn(`Rate limit exceeded for source '${source.name}'`);
          continue;
        }

        // Check cache first
        const cacheKey = this.getCacheKey(source.name, options);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.logger.debug(`Using cached data for source '${source.name}'`);
          allContents.push(...this.transformToContentItems(cached.data, source));
          sourceNames.push(source.name);
          continue;
        }

        // Prepare options for data source
        const sourceOptions: CrawlerDataSourceOptions = {
          limit: Math.min(
            options.limit || source.config?.pagination?.defaultLimit || 100,
            source.config?.pagination?.maxLimit || 1000
          ),
          filters: {},
          ...(options.cursor && { cursor: options.cursor }),
          ...(options.fields && { fields: options.fields }),
          ...(options.lastUpdated && { lastUpdated: options.lastUpdated })
        };

        // Execute data source handler
        const result = await source.handler(sourceOptions);
        
        // Validate returned data against schema
        if (result.data && Array.isArray(result.data)) {
          const validation = this.validateDataAgainstSchema(result.data, source);
          if (!validation.valid) {
            this.logger.warn(`Data validation failed for source '${source.name}':`, validation.errors);
            // Continue processing but log validation errors
          }
        }
        
        // Cache the result if caching is enabled
        if (source.config?.cache?.enabled) {
          this.setCache(cacheKey, result, source.config.cache.ttl);
        }

        // Transform and add to results
        const contentItems = this.transformToContentItems(result.data, source);
        allContents.push(...contentItems);
        sourceNames.push(source.name);
        
        if (result.pagination.hasMore) {
          hasMore = true;
          nextCursor = result.pagination.nextCursor;
        }
        
        if (result.pagination.total) {
          totalItems += result.pagination.total;
        }

        this.logger.debug(`Retrieved ${contentItems.length} items from source '${source.name}'`);
      } catch (error) {
        this.logger.error(`Error retrieving data from source '${source.name}':`, error);
        // Continue with other sources instead of failing completely
      }
    }

    // Sort by lastUpdated (most recent first)
    allContents.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    // Apply limit across all sources
    const limit = options.limit || 100;
    const limitedContents = allContents.slice(0, limit);

    const response: CrawlerContentResponse = {
      contents: limitedContents,
      pagination: {
        nextCursor,
        hasMore: hasMore || allContents.length > limit,
        total: totalItems || allContents.length
      },
      lastUpdated: new Date().toISOString()
    };

    if (options.includeMetadata) {
      response.metadata = {
        sources: sourceNames,
        totalSources: sources.length,
        schema: this.generateCombinedSchema(sources)
      };
    }

    return response;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    withAuth: number;
    withCache: number;
    withRateLimit: number;
  } {
    const sources = this.getAll();
    return {
      total: sources.length,
      enabled: sources.filter(s => s.config?.enabled !== false).length,
      withAuth: sources.filter(s => s.config?.auth?.required).length,
      withCache: sources.filter(s => s.config?.cache?.enabled).length,
      withRateLimit: sources.filter(s => s.config?.rateLimit).length
    };
  }

  /**
   * Get detailed schema information for all data sources
   */
  getSchemaInfo(): Record<string, {
    schema: any;
    version: string;
    requiredFields: string[];
    optionalFields: string[];
    fieldTypes: Record<string, string>;
  }> {
    const schemaInfo: Record<string, any> = {};
    
    for (const source of this.getAll()) {
      const requiredFields = source.schema.required || [];
      const allFields = Object.keys(source.schema.properties || {});
      const optionalFields = allFields.filter(field => !requiredFields.includes(field));
      
      const fieldTypes: Record<string, string> = {};
      for (const [fieldName, fieldDef] of Object.entries(source.schema.properties || {})) {
        fieldTypes[fieldName] = (fieldDef as any).type;
      }
      
      schemaInfo[source.name] = {
        schema: source.schema,
        version: source.version,
        requiredFields,
        optionalFields,
        fieldTypes
      };
    }
    
    return schemaInfo;
  }

  /**
   * Validate a data source configuration without registering it
   */
  validateConfiguration(source: CrawlerDataSource): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      this.validateDataSource(source);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push('Unknown validation error');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Crawler data source cache cleared');
  }

  /**
   * Validate data source configuration
   */
  private validateDataSource(source: CrawlerDataSource): void {
    if (!source.name || typeof source.name !== 'string') {
      throw ErrorFactory.invalidRequest('Data source name is required and must be a string');
    }

    if (!source.handler || typeof source.handler !== 'function') {
      throw ErrorFactory.invalidRequest('Data source handler is required and must be a function');
    }

    if (!source.schema || source.schema.type !== 'object') {
      throw ErrorFactory.invalidRequest('Data source schema is required and must be an object schema');
    }

    if (!source.version || typeof source.version !== 'string') {
      throw ErrorFactory.invalidRequest('Data source version is required and must be a string');
    }

    // Validate schema structure
    this.validateSchemaStructure(source.schema);

    // Validate configuration if present
    if (source.config) {
      this.validateDataSourceConfig(source.config);
    }
  }

  /**
   * Validate schema structure and properties
   */
  private validateSchemaStructure(schema: any): void {
    if (!schema.properties || typeof schema.properties !== 'object') {
      throw ErrorFactory.invalidRequest('Schema must have properties object');
    }

    // Validate each property definition
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      if (typeof propDef !== 'object' || !propDef) {
        throw ErrorFactory.invalidRequest(`Invalid property definition for '${propName}'`);
      }

      const prop = propDef as any;
      if (!prop.type) {
        throw ErrorFactory.invalidRequest(`Property '${propName}' must have a type`);
      }

      const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
      if (!validTypes.includes(prop.type)) {
        throw ErrorFactory.invalidRequest(`Property '${propName}' has invalid type '${prop.type}'`);
      }
    }

    // Validate required fields if present
    if (schema.required && !Array.isArray(schema.required)) {
      throw ErrorFactory.invalidRequest('Schema required field must be an array');
    }

    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!schema.properties[requiredField]) {
          throw ErrorFactory.invalidRequest(`Required field '${requiredField}' not found in schema properties`);
        }
      }
    }
  }

  /**
   * Validate data source configuration
   */
  private validateDataSourceConfig(config: any): void {
    // Validate pagination config
    if (config.pagination) {
      const { defaultLimit, maxLimit } = config.pagination;
      if (defaultLimit && (typeof defaultLimit !== 'number' || defaultLimit < 1)) {
        throw ErrorFactory.invalidRequest('Pagination defaultLimit must be a positive number');
      }
      if (maxLimit && (typeof maxLimit !== 'number' || maxLimit < 1)) {
        throw ErrorFactory.invalidRequest('Pagination maxLimit must be a positive number');
      }
      if (defaultLimit && maxLimit && defaultLimit > maxLimit) {
        throw ErrorFactory.invalidRequest('Pagination defaultLimit cannot exceed maxLimit');
      }
    }

    // Validate cache config
    if (config.cache) {
      const { enabled, ttl } = config.cache;
      if (typeof enabled !== 'boolean') {
        throw ErrorFactory.invalidRequest('Cache enabled must be a boolean');
      }
      if (enabled && (typeof ttl !== 'number' || ttl < 1)) {
        throw ErrorFactory.invalidRequest('Cache ttl must be a positive number when caching is enabled');
      }
    }

    // Validate rate limit config
    if (config.rateLimit) {
      const { requests, window } = config.rateLimit;
      if (typeof requests !== 'number' || requests < 1) {
        throw ErrorFactory.invalidRequest('Rate limit requests must be a positive number');
      }
      if (typeof window !== 'number' || window < 1000) {
        throw ErrorFactory.invalidRequest('Rate limit window must be at least 1000ms');
      }
    }
  }

  /**
   * Validate data against schema
   */
  private validateDataAgainstSchema(data: any[], source: CrawlerDataSource): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schema = source.schema;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Check required fields
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in item)) {
            errors.push(`Item ${i}: Missing required field '${requiredField}'`);
          }
        }
      }

      // Validate field types
      for (const [fieldName, fieldDef] of Object.entries(schema.properties)) {
        if (fieldName in item) {
          const fieldValue = item[fieldName];
          const expectedType = (fieldDef as any).type;
          
          if (!this.isValidType(fieldValue, expectedType)) {
            errors.push(`Item ${i}: Field '${fieldName}' expected type '${expectedType}' but got '${typeof fieldValue}'`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if value matches expected type
   */
  private isValidType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) {
      return true; // Allow null/undefined for optional fields
    }

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Check rate limits for a data source
   */
  private checkRateLimit(source: CrawlerDataSource): boolean {
    if (!source.config?.rateLimit) {
      return true;
    }

    const now = Date.now();
    const key = source.name;
    const limit = this.rateLimits.get(key);
    const { requests, window } = source.config.rateLimit;
    const windowMs = window * 1000;

    if (!limit) {
      this.rateLimits.set(key, { requests: 1, window: windowMs, lastReset: now });
      return true;
    }

    // Reset window if expired
    if (now - limit.lastReset > windowMs) {
      this.rateLimits.set(key, { requests: 1, window: windowMs, lastReset: now });
      return true;
    }

    // Check if within limits
    if (limit.requests < requests) {
      limit.requests++;
      return true;
    }

    return false;
  }

  /**
   * Generate cache key for a request
   */
  private getCacheKey(sourceName: string, options: CrawlerContentOptions): string {
    const keyData = {
      source: sourceName,
      cursor: options.cursor,
      limit: options.limit,
      type: options.type,
      fields: options.fields,
      lastUpdated: options.lastUpdated
    };
    return `crawler:${sourceName}:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.timestamp + cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear cache entries for a specific source
   */
  private clearCacheForSource(sourceName: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`crawler:${sourceName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Transform data source response to ContentItem format
   */
  private transformToContentItems(data: Record<string, any>[], source: CrawlerDataSource): ContentItem[] {
    return data.map(item => ({
      type: source.name,
      id: item.id || item._id || `${source.name}-${Date.now()}-${Math.random()}`,
      title: item.title || item.name || 'Untitled',
      description: item.description || item.summary || '',
      lastUpdated: item.lastUpdated || item.updatedAt || new Date().toISOString(),
      source: source.name,
      url: item.url || item.link,
      metadata: {
        schema: source.schema,
        version: source.version
      },
      ...item
    }));
  }

  /**
   * Generate combined schema from multiple sources
   */
  private generateCombinedSchema(sources: CrawlerDataSource[]): Record<string, any> {
    const combinedProperties: Record<string, any> = {};
    const allRequired: string[] = [];

    sources.forEach(source => {
      Object.assign(combinedProperties, source.schema.properties);
      if (source.schema.required) {
        allRequired.push(...source.schema.required);
      }
    });

    return {
      type: 'object',
      properties: combinedProperties,
      required: [...new Set(allRequired)]
    };
  }
}