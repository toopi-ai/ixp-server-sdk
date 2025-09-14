import type { ComponentRegistry } from './ComponentRegistry';
/**
 * Component Render Options
 */
export interface ComponentRenderOptions {
    componentName: string;
    props: Record<string, any>;
    intentId?: string;
    theme?: Record<string, any>;
    apiBase?: string;
    hydrate?: boolean;
    timeout?: number;
}
/**
 * Component Render Result
 */
export interface ComponentRenderResult {
    html: string;
    css?: string;
    bundleUrl: string;
    props: Record<string, any>;
    context: {
        componentId: string;
        intentId?: string;
        theme: Record<string, any>;
        apiBase: string;
    };
    performance: {
        renderTime: number;
        bundleSize: string;
    };
    errors: string[];
}
/**
 * ComponentRenderer - Handles server-side rendering and client-side hydration
 */
export declare class ComponentRenderer {
    private componentRegistry;
    private renderCache;
    private bundleCache;
    constructor(componentRegistry: ComponentRegistry);
    /**
     * Render a component with given options
     */
    render(options: ComponentRenderOptions): Promise<ComponentRenderResult>;
    /**
     * Validate component props against schema
     */
    private validateProps;
    /**
     * Generate client-only HTML container
     */
    private generateClientOnlyHTML;
    /**
     * Load component CSS file
     */
    private loadComponentCSS;
    /**
     * Generate framework-specific hydration code
     */
    private generateFrameworkHydration;
    /**
     * Generate cache key for render result
     */
    private getCacheKey;
    /**
     * Generate unique component ID
     */
    private generateComponentId;
    /**
     * Clear render cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        renderCache: number;
        bundleCache: number;
    };
}
//# sourceMappingURL=ComponentRenderer.d.ts.map