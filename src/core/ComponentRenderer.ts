import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import type { ComponentDefinition, IntentRequest } from '../types/index';
import type { ComponentRegistry } from './ComponentRegistry';
// Built renderer is available in templates/renderer/ for client-side use

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
export class ComponentRenderer {
  private componentRegistry: ComponentRegistry;
  private renderCache: Map<string, ComponentRenderResult> = new Map();
  private bundleCache: Map<string, string> = new Map();
  constructor(componentRegistry: ComponentRegistry) {
    this.componentRegistry = componentRegistry;
  }

  /**
   * Render a component with given options
   */
  async render(options: ComponentRenderOptions): Promise<ComponentRenderResult> {
    const startTime = Date.now();
    const componentId = this.generateComponentId();
    
    try {
      // Get component definition
      const component = this.componentRegistry.get(options.componentName);
      if (!component) {
        throw new Error(`Component not found: ${options.componentName}`);
      }

      // Validate props against schema
      this.validateProps(component, options.props);

      // Check cache if not in development
      const cacheKey = this.getCacheKey(options);
      if (this.renderCache.has(cacheKey)) {
        const cached = this.renderCache.get(cacheKey)!;
        return {
          ...cached,
          context: {
            ...cached.context,
            componentId
          }
        };
      }

      // Prepare render context
      const context: {
        componentId: string;
        intentId?: string;
        theme: Record<string, any>;
        apiBase: string;
      } = {
        componentId,
        theme: options.theme || {},
        apiBase: options.apiBase || ''
      };
      
      if (options.intentId) {
        context.intentId = options.intentId;
      }

      // Client-side only rendering
      const html = this.generateClientOnlyHTML(component, options.props, context);
      
      // Load CSS if available
      const css = await this.loadComponentCSS(component);

      const result: ComponentRenderResult = {
        html,
        css,
        bundleUrl: component.remoteUrl,
        props: options.props,
        context,
        performance: {
          renderTime: Date.now() - startTime,
          bundleSize: component.bundleSize || '0KB'
        },
        errors: []
      };

      // Cache result
      this.renderCache.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new Error(`Component render failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }





  /**
   * Validate component props against schema
   */
  private validateProps(component: ComponentDefinition, props: Record<string, any>): void {
    if (!component.propsSchema) return;

    // Basic validation - in a real implementation, you'd use a proper JSON schema validator
    const schema = component.propsSchema;
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in props)) {
          throw new Error(`Required prop '${requiredProp}' is missing`);
        }
      }
    }
  }



  /**
   * Generate client-only HTML container
   */
  private generateClientOnlyHTML(
    component: ComponentDefinition, 
    props: Record<string, any>, 
    context: Record<string, any>
  ): string {
    return `
      <div id="ixp-component-${context.componentId}" 
           class="ixp-component" 
           data-component="${component.name}"
           data-framework="${component.framework}">
        <div class="ixp-loading">
          <div class="ixp-spinner"></div>
          <span>Loading ${component.name}...</span>
        </div>
      </div>
    `;
  }

  /**
   * Load component CSS file
   */
  private async loadComponentCSS(component: ComponentDefinition): Promise<string> {
    const cssPath = component.remoteUrl.replace('.esm.js', '.css');
    
    try {
      if (this.bundleCache.has(cssPath)) {
        return this.bundleCache.get(cssPath)!;
      }

      // Try to fetch CSS from remote URL
      if (cssPath.startsWith('http')) {
        try {
          const response = await axios.get(cssPath);
          if (response.status === 200) {
            const css = response.data;
            this.bundleCache.set(cssPath, css);
            return css;
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch CSS from remote URL ${cssPath}:`, fetchError);
        }
      }

      // Fallback to local file system
      const fullPath = path.join(process.cwd(), 'dist', cssPath.replace(/^https?:\/\/[^\/]+\//, ''));
      
      if (fs.existsSync(fullPath)) {
        const css = fs.readFileSync(fullPath, 'utf8');
        this.bundleCache.set(cssPath, css);
        return css;
      }
    } catch (error) {
      console.warn(`Failed to load CSS for component ${component.name}:`, error);
    }

    return '';
  }

  /**
   * Generate framework-specific hydration code
   */
  private generateFrameworkHydration(renderResult: ComponentRenderResult): string {
    const componentName = renderResult.context.componentId.split('-')[0];
    const component = componentName ? this.componentRegistry.get(componentName) : null;
    
    if (!component) return '';

    const propsJson = JSON.stringify(renderResult.props);
    const contextJson = JSON.stringify(renderResult.context);
    const remoteUrl = `/ixp/component/${component.name}`;

    // Use the built React renderer for client-side rendering
    if (component.framework === 'react') {
      return `
        import { ReactRenderer } from '/ixp/templates/renderer/index.js';
        
        // Initialize React renderer with remote component loading
        const renderer = new ReactRenderer();
        renderer.render({
          container: 'ixp-component-${renderResult.context.componentId}',
          remoteUrl: '${remoteUrl}',
          componentName: '${component.name}',
          props: ${propsJson},
          context: ${contextJson}
        });
      `;
    }
    
    // Fallback for other frameworks
    return `
      import { renderRemoteComponent } from '/ixp/templates/vanilla-remote-app';
      
      // Initialize remote component with framework: ${component.framework}
      renderRemoteComponent(
        'ixp-component-${renderResult.context.componentId}',
        '${remoteUrl}',
        '${component.name}',
        ${propsJson},
        ${contextJson}
      );
    `;
  }

  /**
   * Generate cache key for render result
   */
  private getCacheKey(options: ComponentRenderOptions): string {
    return `${options.componentName}:${JSON.stringify(options.props)}:${options.intentId || 'no-intent'}`;
  }

  /**
   * Generate unique component ID
   */
  private generateComponentId(): string {
    return `ixp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear render cache
   */
  clearCache(): void {
    this.renderCache.clear();
    this.bundleCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { renderCache: number; bundleCache: number } {
    return {
      renderCache: this.renderCache.size,
      bundleCache: this.bundleCache.size
    };
  }
}