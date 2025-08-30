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

    if (!component.framework || !['react', 'vue', 'vanilla'].includes(component.framework)) {
      throw new Error(`Component "${component.name}" must have a valid framework (react, vue, vanilla)`);
    }

    if (!component.remoteUrl || typeof component.remoteUrl !== 'string') {
      throw new Error(`Component "${component.name}" must have a valid remoteUrl`);
    }

    // Validate URL format
    try {
      new URL(component.remoteUrl, 'http://localhost');
    } catch {
      throw new Error(`Component "${component.name}" has invalid remoteUrl format`);
    }

    if (!component.exportName || typeof component.exportName !== 'string') {
      throw new Error(`Component "${component.name}" must have a valid exportName`);
    }

    if (!component.propsSchema || typeof component.propsSchema !== 'object') {
      throw new Error(`Component "${component.name}" must have a valid propsSchema object`);
    }

    if (!component.version || typeof component.version !== 'string') {
      throw new Error(`Component "${component.name}" must have a valid version`);
    }

    if (!Array.isArray(component.allowedOrigins)) {
      throw new Error(`Component "${component.name}" must have allowedOrigins array`);
    }

    // Enhanced validation
    this.validatePropsSchema(component);
    this.validateSecurityPolicy(component);
    this.validatePerformanceBudgets(component);
  }

  /**
   * Validate props schema structure
   */
  private validatePropsSchema(component: ComponentDefinition): void {
    const schema = component.propsSchema;
    
    if (!schema.type || schema.type !== 'object') {
      throw new Error(`Component "${component.name}" propsSchema must have type 'object'`);
    }

    if (schema.properties && typeof schema.properties !== 'object') {
      throw new Error(`Component "${component.name}" propsSchema.properties must be an object`);
    }

    if (schema.required && !Array.isArray(schema.required)) {
      throw new Error(`Component "${component.name}" propsSchema.required must be an array`);
    }

    // Validate property definitions
    if (schema.properties) {
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        if (typeof propDef !== 'object' || !propDef) {
          throw new Error(`Component "${component.name}" prop "${propName}" must have a valid definition`);
        }
        
        const prop = propDef as any;
        if (!prop.type) {
          throw new Error(`Component "${component.name}" prop "${propName}" must have a type`);
        }

        // Validate allowed types
        const allowedTypes = ['string', 'number', 'boolean', 'object', 'array'];
        if (!allowedTypes.includes(prop.type)) {
          throw new Error(`Component "${component.name}" prop "${propName}" has invalid type "${prop.type}"`);
        }
      }
    }
  }

  /**
   * Validate security policy
   */
  private validateSecurityPolicy(component: ComponentDefinition): void {
    if (!component.securityPolicy) {
      // Set default security policy
      component.securityPolicy = {
        allowEval: false,
        sandboxed: true,
        maxBundleSize: '200KB'
      };
      return;
    }

    const policy = component.securityPolicy;
    
    if (policy.allowEval !== undefined && typeof policy.allowEval !== 'boolean') {
      throw new Error(`Component "${component.name}" securityPolicy.allowEval must be boolean`);
    }
    
    if (policy.sandboxed !== undefined && typeof policy.sandboxed !== 'boolean') {
      throw new Error(`Component "${component.name}" securityPolicy.sandboxed must be boolean`);
    }

    if (policy.maxBundleSize !== undefined && typeof policy.maxBundleSize !== 'string') {
      throw new Error(`Component "${component.name}" securityPolicy.maxBundleSize must be a string`);
    }

    // Validate CSP directives if present
    if (policy.csp) {
      this.validateCSPDirectives(component, policy.csp);
    }
  }

  /**
   * Validate CSP directives
   */
  private validateCSPDirectives(component: ComponentDefinition, csp: Record<string, any>): void {
    const validDirectives = [
      'script-src', 'style-src', 'img-src', 'connect-src', 'font-src',
      'object-src', 'media-src', 'frame-src', 'worker-src', 'child-src'
    ];

    for (const [directive, value] of Object.entries(csp)) {
      if (!validDirectives.includes(directive)) {
        throw new Error(`Component "${component.name}" has invalid CSP directive "${directive}"`);
      }

      if (!Array.isArray(value)) {
        throw new Error(`Component "${component.name}" CSP directive "${directive}" must be an array`);
      }

      // Validate CSP values
      for (const source of value) {
        if (typeof source !== 'string') {
          throw new Error(`Component "${component.name}" CSP directive "${directive}" contains invalid source`);
        }

        // Check for dangerous CSP values
        if (source === "'unsafe-eval'" && directive === 'script-src') {
          throw new Error(`Component "${component.name}" uses dangerous CSP directive 'unsafe-eval'`);
        }
      }
    }
  }

  /**
   * Validate performance budgets
   */
  private validatePerformanceBudgets(component: ComponentDefinition): void {
    if (!component.performance) {
      return;
    }

    const perf = component.performance;
    
    if (perf.bundleSizeGzipped !== undefined && typeof perf.bundleSizeGzipped !== 'string') {
      throw new Error(`Component "${component.name}" performance.bundleSizeGzipped must be a string`);
    }

    if (perf.tti !== undefined && typeof perf.tti !== 'string') {
      throw new Error(`Component "${component.name}" performance.tti must be a string`);
    }

    // Parse and validate bundle size
    if (perf.bundleSizeGzipped) {
      const sizeMatch = perf.bundleSizeGzipped.match(/^(\d+(?:\.\d+)?)(KB|MB)$/);
      if (!sizeMatch || sizeMatch.length < 3) {
        throw new Error(`Component "${component.name}" has invalid bundleSizeGzipped format`);
      }

      const size = parseFloat(sizeMatch[1]!);
      const unit = sizeMatch[2]!;
      const sizeInKB = unit === 'MB' ? size * 1024 : size;

      // Default budget: 200KB
      const budgetKB = 200;
      if (sizeInKB > budgetKB) {
        console.warn(`⚠️  Component "${component.name}" bundle size ${perf.bundleSizeGzipped} exceeds recommended budget of ${budgetKB}KB`);
      }
    }

    // Parse and validate TTI
    if (perf.tti) {
      const ttiMatch = perf.tti.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
      if (!ttiMatch || ttiMatch.length < 3) {
        throw new Error(`Component "${component.name}" has invalid tti format`);
      }

      const time = parseFloat(ttiMatch[1]!);
      const unit = ttiMatch[2]!;
      const timeInMs = unit === 's' ? time * 1000 : time;

      // Default budget: 1500ms
      const budgetMs = 1500;
      if (timeInMs > budgetMs) {
        console.warn(`⚠️  Component "${component.name}" TTI ${perf.tti} exceeds recommended budget of ${budgetMs}ms`);
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