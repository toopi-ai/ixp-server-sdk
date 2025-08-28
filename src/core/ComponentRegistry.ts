import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';
import type { ComponentDefinition, ComponentRegistry as IComponentRegistry } from '../types/index';

/**
 * Component Registry - Manages component definitions and their lifecycle
 */
export class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();
  private configPath?: string;
  private watcher?: any;
  private listeners: Set<() => void> = new Set();

  constructor(config?: string | Record<string, ComponentDefinition>) {
    if (typeof config === 'string') {
      this.configPath = config;
      this.loadFromFile(config);
    } else if (config && typeof config === 'object') {
      this.loadFromObject(config);
    }
  }

  /**
   * Load components from file path
   */
  private loadFromFile(configPath: string): void {
    try {
      const resolvedPath = path.resolve(configPath);
      
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Component configuration file not found: ${resolvedPath}`);
      }

      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (!data.components || typeof data.components !== 'object') {
        throw new Error('Invalid component configuration: missing or invalid "components" object');
      }

      this.loadFromObject(data.components);
      console.log(`✅ Loaded ${this.components.size} components from ${configPath}`);
    } catch (error) {
      console.error('❌ Failed to load components:', error);
      throw error;
    }
  }

  /**
   * Load components from object
   */
  private loadFromObject(components: Record<string, ComponentDefinition>): void {
    this.components.clear();
    
    for (const [name, component] of Object.entries(components)) {
      const componentWithName = { ...component, name };
      this.validateComponent(componentWithName);
      this.components.set(name, componentWithName);
    }
  }

  /**
   * Validate component definition
   */
  private validateComponent(component: ComponentDefinition): void {
    if (!component.name || typeof component.name !== 'string') {
      throw new Error('Component must have a valid name');
    }

    if (!component.framework || typeof component.framework !== 'string') {
      throw new Error(`Component "${component.name}" must specify a framework`);
    }

    if (!component.remoteUrl || typeof component.remoteUrl !== 'string') {
      throw new Error(`Component "${component.name}" must have a remoteUrl`);
    }

    // Validate URL format
    try {
      new URL(component.remoteUrl);
    } catch {
      throw new Error(`Component "${component.name}" has invalid remoteUrl format`);
    }

    if (!component.exportName || typeof component.exportName !== 'string') {
      throw new Error(`Component "${component.name}" must have an exportName`);
    }

    if (!component.propsSchema || typeof component.propsSchema !== 'object') {
      throw new Error(`Component "${component.name}" must have a propsSchema`);
    }

    if (component.propsSchema.type !== 'object') {
      throw new Error(`Component "${component.name}" propsSchema must be of type "object"`);
    }

    if (!component.version || typeof component.version !== 'string') {
      throw new Error(`Component "${component.name}" must have a version`);
    }

    if (!Array.isArray(component.allowedOrigins)) {
      throw new Error(`Component "${component.name}" must have allowedOrigins array`);
    }

    // Validate security policy
    if (component.securityPolicy) {
      if (typeof component.securityPolicy.allowEval !== 'boolean') {
        throw new Error(`Component "${component.name}" securityPolicy.allowEval must be boolean`);
      }
      if (typeof component.securityPolicy.sandboxed !== 'boolean') {
        throw new Error(`Component "${component.name}" securityPolicy.sandboxed must be boolean`);
      }
    }
  }

  /**
   * Get all components
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get component by name
   */
  get(name: string): ComponentDefinition | undefined {
    return this.components.get(name);
  }

  /**
   * Add new component
   */
  add(component: ComponentDefinition): void {
    this.validateComponent(component);
    this.components.set(component.name, component);
    this.notifyListeners();
  }

  /**
   * Remove component by name
   */
  remove(name: string): boolean {
    const removed = this.components.delete(name);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Reload components from file
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
      console.log('📁 Component configuration changed, reloading...');
      try {
        await this.reload();
        console.log('✅ Components reloaded successfully');
      } catch (error) {
        console.error('❌ Failed to reload components:', error);
      }
    });

    console.log('👀 File watching enabled for component configuration');
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
        console.error('Error in component registry listener:', error);
      }
    });
  }

  /**
   * Get components by criteria
   */
  findByCriteria(criteria: {
    framework?: string;
    deprecated?: boolean;
    sandboxed?: boolean;
  }): ComponentDefinition[] {
    return this.getAll().filter(component => {
      if (criteria.framework && component.framework !== criteria.framework) {
        return false;
      }
      if (criteria.deprecated !== undefined && component.deprecated !== criteria.deprecated) {
        return false;
      }
      if (criteria.sandboxed !== undefined && component.securityPolicy?.sandboxed !== criteria.sandboxed) {
        return false;
      }
      return true;
    });
  }

  /**
   * Check if origin is allowed for component
   */
  isOriginAllowed(componentName: string, origin: string): boolean {
    const component = this.get(componentName);
    if (!component) return false;
    
    return component.allowedOrigins.includes(origin) || component.allowedOrigins.includes('*');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byFramework: Record<string, number>;
    deprecated: number;
    sandboxed: number;
    averageBundleSize: string;
  } {
    const components = this.getAll();
    const stats = {
      total: components.length,
      byFramework: {} as Record<string, number>,
      deprecated: 0,
      sandboxed: 0,
      averageBundleSize: '0KB'
    };

    let totalSize = 0;
    let sizeCount = 0;

    for (const component of components) {
      // Framework stats
      stats.byFramework[component.framework] = (stats.byFramework[component.framework] || 0) + 1;
      
      // Deprecated count
      if (component.deprecated) stats.deprecated++;
      
      // Sandboxed count
      if (component.securityPolicy?.sandboxed) stats.sandboxed++;
      
      // Bundle size calculation
      if (component.bundleSize) {
        const sizeMatch = component.bundleSize.match(/(\d+)KB/);
        if (sizeMatch && sizeMatch[1]) {
          totalSize += parseInt(sizeMatch[1]);
          sizeCount++;
        }
      }
    }

    if (sizeCount > 0) {
      stats.averageBundleSize = `${Math.round(totalSize / sizeCount)}KB`;
    }

    return stats;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disableFileWatching();
    this.listeners.clear();
    this.components.clear();
  }
}