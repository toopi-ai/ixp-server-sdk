import type { IntentDefinition, IntentRegistry as IIntentRegistry } from '../types/index';
/**
 * Intent Registry - Manages intent definitions and their lifecycle
 */
export declare class IntentRegistry implements IIntentRegistry {
    private intents;
    private configPath?;
    private watcher?;
    private listeners;
    constructor(config?: string | IntentDefinition[]);
    /**
     * Load intents from file path
     */
    private loadFromFile;
    /**
     * Load intents from array
     */
    private loadFromArray;
    /**
     * Validate intent definition
     */
    private validateIntent;
    /**
     * Get all intents
     */
    getAll(): IntentDefinition[];
    /**
     * Get intent by name
     */
    get(name: string): IntentDefinition | undefined;
    /**
     * Add new intent
     */
    add(intent: IntentDefinition): void;
    /**
     * Remove intent by name
     */
    remove(name: string): boolean;
    /**
     * Reload intents from file
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
     * Get intents by criteria
     */
    findByCriteria(criteria: {
        crawlable?: boolean;
        deprecated?: boolean;
        component?: string;
    }): IntentDefinition[];
    /**
     * Get registry statistics
     */
    getStats(): {
        total: number;
        crawlable: number;
        deprecated: number;
        byComponent: Record<string, number>;
    };
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=IntentRegistry.d.ts.map