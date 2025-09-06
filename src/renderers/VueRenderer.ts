/**
 * Vue Renderer
 * 
 * Provides Vue-specific rendering functionality for the IXP server SDK.
 * This renderer handles server-side rendering and client-side hydration for Vue components.
 */

import { FrameworkRenderer } from '../middleware/renderMiddleware';

/**
 * Vue Renderer Options
 */
export interface VueRendererOptions {
  /**
   * Custom Vue import path
   * @default 'vue'
   */
  vueImport?: string;

  /**
   * Custom HTML template
   */
  template?: string;

  /**
   * Whether to include Vue script
   * @default true
   */
  includeVueScript?: boolean;

  /**
   * Vue version to use
   * @default '3.3.4'
   */
  vueVersion?: string;

  /**
   * Custom CSS to include
   */
  customCSS?: string;
}

/**
 * Create a Vue renderer
 */
export function createVueRenderer(options: VueRendererOptions = {}): FrameworkRenderer {
  const {
    vueImport = 'vue',
    template,
    includeVueScript = true,
    vueVersion = '3.3.4',
    customCSS = ''
  } = options;

  // Default template
  const defaultTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{componentName}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    #component-root {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    #component-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      font-size: 18px;
      color: #666;
    }
    .error {
      color: #e53935;
      padding: 20px;
      border: 1px solid #e53935;
      border-radius: 4px;
      background-color: #ffebee;
    }
    {{customCSS}}
  </style>
  {{vueScript}}
  <link rel="preload" href="{{componentUrl}}" as="script">
</head>
<body>
  <div id="component-root">
    {{serverRenderedContent}}
    <div id="component-loading">Loading component...</div>
  </div>

  <!-- Hydration data -->
  <script>
    window.__HYDRATION_DATA__ = {{hydrationData}};
  </script>

  <!-- Hydration script -->
  <script>
    // Component data
    const componentData = {{componentData}};
    const componentName = "{{componentName}}";
    const componentUrl = "{{componentUrl}}";
    const exportName = "{{exportName}}";
    
    // Load the component
    const scriptElement = document.createElement('script');
    scriptElement.src = componentUrl;
    
    scriptElement.onload = function() {
      // Access the component from the global Components object
      const Component = window.Components[exportName];
      if (!Component) {
        throw new Error('Component ' + exportName + ' not found in module');
      }
      
      // Get root element
      const rootElement = document.getElementById('component-root');
      
      // Remove loading indicator
      const loadingElement = document.getElementById('component-loading');
      if (loadingElement) {
        loadingElement.remove();
      }
      
      // Create a container for the Vue component
      const vueRoot = document.createElement('div');
      vueRoot.id = 'vue-root';
      rootElement.appendChild(vueRoot);
      
      // Render the component
      const Vue = window.Vue;
      
      if (Vue) {
        // Vue is already available
        const app = Vue.createApp(Component, componentData);
        app.mount('#vue-root');
      }
    };
    
    scriptElement.onerror = function(error) {
      console.error('Error loading component:', error);
      document.getElementById('component-root').innerHTML = '<div class="error">Error loading component: ' + error.message + '</div>';
    };
    
    document.head.appendChild(scriptElement);
  </script>
</body>
</html>`;

  // Vue script
  const vueScript = includeVueScript ? `
  <script crossorigin src="https://unpkg.com/vue@${vueVersion}/dist/vue.global.prod.js"></script>` : '';

  return {
    /**
     * Server-side render a Vue component
     * 
     * Note: This is a placeholder implementation. In a real implementation,
     * we would use Vue's server renderer to render the component.
     * However, this requires importing Vue at runtime, which
     * is not possible in this context without additional dependencies.
     */
    renderToString: async (componentDef: any, props: any) => {
      try {
        // In a real implementation, we would use Vue's server renderer
        // For now, we'll return an empty string as a placeholder
        return '';
      } catch (error) {
        console.error('Error rendering Vue component:', error);
        return '';
      }
    },

    /**
     * Generate client-side hydration script
     */
    generateHydrationScript: (componentDef: any, data: any, intent: string, parameters: any) => {
      return `
        // Component data
        const componentData = ${JSON.stringify(data)};
        const componentName = "${componentDef.name}";
        const componentUrl = "${componentDef.remoteUrl}";
        const exportName = "${componentDef.exportName || componentDef.name}";
        
        // Load the component
        const scriptElement = document.createElement('script');
        scriptElement.src = componentUrl;
        
        scriptElement.onload = function() {
          // Access the component from the global Components object
          const Component = window.Components[exportName];
          if (!Component) {
            throw new Error('Component ' + exportName + ' not found in module');
          }
          
          // Get root element
          const rootElement = document.getElementById('component-root');
          
          // Remove loading indicator
          const loadingElement = document.getElementById('component-loading');
          if (loadingElement) {
            loadingElement.remove();
          }
          
          // Create a container for the Vue component
          const vueRoot = document.createElement('div');
          vueRoot.id = 'vue-root';
          rootElement.appendChild(vueRoot);
          
          // Render the component
          const Vue = window.Vue;
          
          if (Vue) {
            // Vue is already available
            const app = Vue.createApp(Component, componentData);
            app.mount('#vue-root');
          }
        };
        
        scriptElement.onerror = function(error) {
          console.error('Error loading component:', error);
          document.getElementById('component-root').innerHTML = '<div class="error">Error loading component: ' + error.message + '</div>';
        };
        
        document.head.appendChild(scriptElement);
      `;
    },

    /**
     * Generate HTML template
     */
    generateTemplate: (content: string, componentDef: any, data: any, intent: string, parameters: any) => {
      const templateToUse = template || defaultTemplate;
      
      return templateToUse
        .replace('{{componentName}}', componentDef.name)
        .replace('{{componentUrl}}', componentDef.remoteUrl)
        .replace('{{exportName}}', componentDef.exportName || componentDef.name)
        .replace('{{serverRenderedContent}}', content)
        .replace('{{componentData}}', JSON.stringify(data))
        .replace('{{hydrationData}}', JSON.stringify({ component: componentDef.name, data, intent, parameters }))
        .replace('{{vueScript}}', vueScript)
        .replace('{{customCSS}}', customCSS);
    }
  };
}