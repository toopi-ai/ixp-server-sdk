import type { ComponentDefinition, ComponentRegistry as IComponentRegistry } from '../types/index';
/**
 * Component Registry - Manages component definitions and their lifecycle
 */
export declare class ComponentRegistry implements IComponentRegistry {
    private components;
    private configPath?;
    private watcher?;
    private listeners;
    constructor(config?: string | Record<string, ComponentDefinition>);
    /**
     * Load components from file path
     */
    private loadFromFile;
    /**
     * Load components from object
     */
    private loadFromObject;
    /**
     * Validate component definition
     */
    private validateComponent;
    /**
     * Validate props schema structure
     */
    private validatePropsSchema;
    /**
     * Validate security policy
     */
    private validateSecurityPolicy;
    /**
     * Validate CSP directives
     */
    private validateCSPDirectives;
    /**
     * Validate performance budgets
     */
    private validatePerformanceBudgets;
    /**
     * Get all components
     */
    getAll(): ComponentDefinition[];
    /**
     * Get component by name
     */
    get(name: string): ComponentDefinition | undefined;
    /**
     * Add new component
     */
    add(component: ComponentDefinition): void;
    /**
     * Remove component by name
     */
    remove(name: string): boolean;
    /**
     * Reload components from file
     */
    reload(): Promise<void>;
    /**
     * Enable file watching for hot reload
     */
    enableFileWatching(): void;
    /**
     * Disable file watching
     */
    disableFileWatching(): void;
    /**
     * Add change listener
     */
    onChange(listener: () => void): () => void;
    /**
     * Notify all listeners of changes
     */
    private notifyListeners;
    /**
     * Get components by criteria
     */
    findByCriteria(criteria: {
        framework?: string;
        deprecated?: boolean;
        sandboxed?: boolean;
    }): ComponentDefinition[];
    /**
     * Check if origin is allowed for component
     */
    isOriginAllowed(componentName: string, origin: string): boolean;
    /**
     * Get registry statistics
     */
    getStats(): {
        total: number;
        byFramework: Record<string, number>;
        deprecated: number;
        sandboxed: number;
        averageBundleSize: string;
    };
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=ComponentRegistry.d.ts.map