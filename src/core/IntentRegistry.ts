import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';
import type { IntentDefinition, IntentRegistry as IIntentRegistry } from '../types/index';

/**
 * Intent Registry - Manages intent definitions and their lifecycle
 */
export class IntentRegistry implements IIntentRegistry {
  private intents: Map<string, IntentDefinition> = new Map();
  private configPath?: string;
  private watcher?: any;
  private listeners: Set<() => void> = new Set();

  constructor(config?: string | IntentDefinition[]) {
    if (typeof config === 'string') {
      this.configPath = config;
      this.loadFromFile(config);
    } else if (Array.isArray(config)) {
      this.loadFromArray(config);
    }
  }

  /**
   * Load intents from file path
   */
  private loadFromFile(configPath: string): void {
    try {
      const resolvedPath = path.resolve(configPath);
      
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Intent configuration file not found: ${resolvedPath}`);
      }

      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (!data.intents || !Array.isArray(data.intents)) {
        throw new Error('Invalid intent configuration: missing or invalid "intents" array');
      }

      this.loadFromArray(data.intents);
      console.log(`✅ Loaded ${this.intents.size} intents from ${configPath}`);
    } catch (error) {
      console.error('❌ Failed to load intents:', error);
      throw error;
    }
  }

  /**
   * Load intents from array
   */
  private loadFromArray(intents: IntentDefinition[]): void {
    this.intents.clear();
    
    for (const intent of intents) {
      this.validateIntent(intent);
      this.intents.set(intent.name, intent);
    }
  }

  /**
   * Validate intent definition
   */
  private validateIntent(intent: IntentDefinition): void {
    if (!intent.name || typeof intent.name !== 'string') {
      throw new Error('Intent must have a valid name');
    }

    if (!intent.description || typeof intent.description !== 'string') {
      throw new Error(`Intent "${intent.name}" must have a description`);
    }

    if (!intent.component || typeof intent.component !== 'string') {
      throw new Error(`Intent "${intent.name}" must specify a component`);
    }

    if (!intent.parameters || typeof intent.parameters !== 'object') {
      throw new Error(`Intent "${intent.name}" must have parameters definition`);
    }

    if (intent.parameters.type !== 'object') {
      throw new Error(`Intent "${intent.name}" parameters must be of type "object"`);
    }

    if (!intent.version || typeof intent.version !== 'string') {
      throw new Error(`Intent "${intent.name}" must have a version`);
    }
  }

  /**
   * Get all intents
   */
  getAll(): IntentDefinition[] {
    return Array.from(this.intents.values());
  }

  /**
   * Get intent by name
   */
  get(name: string): IntentDefinition | undefined {
    return this.intents.get(name);
  }

  /**
   * Add new intent
   */
  add(intent: IntentDefinition): void {
    this.validateIntent(intent);
    this.intents.set(intent.name, intent);
    this.notifyListeners();
  }

  /**
   * Remove intent by name
   */
  remove(name: string): boolean {
    const removed = this.intents.delete(name);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Reload intents from file
   */
  async reload(): Promise<void> {
    if (this.configPath) {
      this.loadFromFile(this.configPath);
      this.notifyListeners();
    }
  }

  /**
   * Enable file watching for hot reload
   */
  enableFileWatching(): void {
    if (!this.configPath) {
      console.warn('Cannot enable file watching: no config path specified');
      return;
    }

    if (this.watcher) {
      console.warn('File watching is already enabled');
      return;
    }

    this.watcher = watch(this.configPath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      console.log('📁 Intent configuration changed, reloading...');
      try {
        await this.reload();
        console.log('✅ Intents reloaded successfully');
      } catch (error) {
        console.error('❌ Failed to reload intents:', error);
      }
    });

    console.log('👀 File watching enabled for intent configuration');
  }

  /**
   * Disable file watching
   */
  disableFileWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
      console.log('👁️ File watching disabled');
    }
  }

  /**
   * Add change listener
   */
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in intent registry listener:', error);
      }
    });
  }

  /**
   * Get intents by criteria
   */
  findByCriteria(criteria: {
    crawlable?: boolean;
    deprecated?: boolean;
    component?: string;
  }): IntentDefinition[] {
    return this.getAll().filter(intent => {
      if (criteria.crawlable !== undefined && intent.crawlable !== criteria.crawlable) {
        return false;
      }
      if (criteria.deprecated !== undefined && intent.deprecated !== criteria.deprecated) {
        return false;
      }
      if (criteria.component && intent.component !== criteria.component) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    crawlable: number;
    deprecated: number;
    byComponent: Record<string, number>;
  } {
    const intents = this.getAll();
    const stats = {
      total: intents.length,
      crawlable: 0,
      deprecated: 0,
      byComponent: {} as Record<string, number>
    };

    for (const intent of intents) {
      if (intent.crawlable) stats.crawlable++;
      if (intent.deprecated) stats.deprecated++;
      
      stats.byComponent[intent.component] = (stats.byComponent[intent.component] || 0) + 1;
    }

    return stats;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disableFileWatching();
    this.listeners.clear();
    this.intents.clear();
  }
}