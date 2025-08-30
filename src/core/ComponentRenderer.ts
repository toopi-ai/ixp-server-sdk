import * as fs from 'fs';
import * as path from 'path';
import type { ComponentDefinition, IntentRequest } from '../types/index';
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
  ssr?: boolean;
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
 * Component Hydration Script
 */
export interface HydrationScript {
  bundleUrl: string;
  props: Record<string, any>;
  context: Record<string, any>;
  componentName: string;
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
      if (!options.ssr && this.renderCache.has(cacheKey)) {
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

      let html = '';
      let css = '';
      const errors: string[] = [];

      if (options.ssr) {
        // Server-side rendering
        try {
          const renderResult = await this.renderServerSide(component, options.props, context);
          html = renderResult.html;
          css = renderResult.css;
        } catch (error) {
          errors.push(`SSR Error: ${error instanceof Error ? error.message : String(error)}`);
          // Fallback to client-side rendering
          html = this.generateClientOnlyHTML(component, options.props, context);
        }
      } else {
        // Client-side only rendering
        html = this.generateClientOnlyHTML(component, options.props, context);
      }

      // Load CSS if available
      if (!css) {
        css = await this.loadComponentCSS(component);
      }

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
        errors
      };

      // Cache result
      if (!options.ssr) {
        this.renderCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      throw new Error(`Component render failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate hydration script for client-side rendering
   */
  generateHydrationScript(renderResult: ComponentRenderResult): string {
    const script: HydrationScript = {
      bundleUrl: renderResult.bundleUrl,
      props: renderResult.props,
      context: renderResult.context,
      componentName: renderResult.context.componentId
    };

    return `
      <script type="module">
        window.IXP_HYDRATION_DATA = window.IXP_HYDRATION_DATA || {};
        window.IXP_HYDRATION_DATA['${renderResult.context.componentId}'] = ${JSON.stringify(script)};
        
        // Load and hydrate component
        import('${renderResult.bundleUrl}').then(module => {
          const Component = module.default || module;
          const container = document.getElementById('ixp-component-${renderResult.context.componentId}');
          
          if (container && Component) {
            // Initialize IXP SDK context
            if (window.IXP && window.IXP.initialize) {
              window.IXP.initialize(${JSON.stringify(renderResult.context)});
            }
            
            // Render component based on framework
            ${this.generateFrameworkHydration(renderResult)}
          }
        }).catch(error => {
          console.error('Failed to load component:', error);
          const container = document.getElementById('ixp-component-${renderResult.context.componentId}');
          if (container) {
            container.innerHTML = '<div class="ixp-error">Component failed to load</div>';
          }
        });
      </script>
    `;
  }

  /**
   * Generate complete HTML page with component
   */
  generatePage(renderResult: ComponentRenderResult, options: { title?: string; meta?: Record<string, string> } = {}): string {
    const { title = 'IXP Component', meta = {} } = options;
    
    const metaTags = Object.entries(meta)
      .map(([name, content]) => `<meta name="${name}" content="${content}">`) 
      .join('\n    ');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${metaTags}
    ${renderResult.css ? `<style>${renderResult.css}</style>` : ''}
    <script src="/ixp-sdk.js"></script>
</head>
<body>
    <div id="ixp-app">
        ${renderResult.html}
    </div>
    ${this.generateHydrationScript(renderResult)}
</body>
</html>
    `.trim();
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
   * Server-side rendering (placeholder - would need actual SSR implementation)
   */
  private async renderServerSide(
    component: ComponentDefinition, 
    props: Record<string, any>, 
    context: Record<string, any>
  ): Promise<{ html: string; css: string }> {
    // This is a placeholder for actual SSR implementation
    // In a real implementation, you would:
    // 1. Load the component bundle in a server environment (e.g., using vm2 or similar)
    // 2. Execute the component with the given props
    // 3. Extract the rendered HTML and CSS
    
    throw new Error('Server-side rendering not implemented yet');
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

      // In a real implementation, you'd load from the actual file system or CDN
      const fullPath = path.join(process.cwd(), 'dist', cssPath);
      
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

    switch (component.framework) {
      case 'react':
        return `
          // React hydration
          if (window.React && window.ReactDOM) {
            const element = window.React.createElement(Component, ${JSON.stringify(renderResult.props)});
            if (container.innerHTML.trim()) {
              window.ReactDOM.hydrate(element, container);
            } else {
              window.ReactDOM.render(element, container);
            }
          }
        `;
      
      case 'vue':
        return `
          // Vue hydration
          if (window.Vue) {
            const app = window.Vue.createApp({
              render() {
                return window.Vue.h(Component, ${JSON.stringify(renderResult.props)});
              }
            });
            app.mount(container);
          }
        `;
      
      default: // vanilla
        return `
          // Vanilla JS hydration
          if (typeof Component === 'function') {
            Component(container, ${JSON.stringify(renderResult.props)}, ${JSON.stringify(renderResult.context)});
          }
        `;
    }
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