/**
 * Vanilla JS Renderer
 * 
 * Provides vanilla JavaScript rendering functionality for the IXP server SDK.
 * This renderer handles client-side rendering for vanilla JavaScript components.
 */

import { FrameworkRenderer } from '../middleware/renderMiddleware';

/**
 * Vanilla JS Renderer Options
 */
export interface VanillaJSRendererOptions {
  /**
   * Custom HTML template
   */
  template?: string;

  /**
   * Custom CSS to include
   */
  customCSS?: string;
}

/**
 * Create a Vanilla JS renderer
 */
export function createVanillaJSRenderer(options: VanillaJSRendererOptions = {}): FrameworkRenderer {
  const {
    template,
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
  <link rel="preload" href="{{componentUrl}}" as="script">
</head>
<body>
  <div id="component-root">
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
      
      // Create a container for the component
      const componentContainer = document.createElement('div');
      componentContainer.id = 'js-component';
      rootElement.appendChild(componentContainer);
      
      // Initialize the component
      if (typeof Component === 'function') {
        // If Component is a constructor or factory function
        const instance = Component(componentData, componentContainer);
        
        // If the component returns a render method, call it
        if (instance && typeof instance.render === 'function') {
          instance.render();
        }
      } else if (Component && typeof Component.init === 'function') {
        // If Component is an object with an init method
        Component.init(componentData, componentContainer);
      } else if (Component && typeof Component.render === 'function') {
        // If Component is an object with a render method
        Component.render(componentData, componentContainer);
      } else {
        console.error('Component does not have a valid interface');
        rootElement.innerHTML = '<div class="error">Error: Component does not have a valid interface</div>';
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

  return {
    /**
     * Server-side render a vanilla JS component
     * 
     * Note: Vanilla JS components don't support server-side rendering,
     * so we always return an empty string.
     */
    renderToString: async (componentDef: any, props: any) => {
      // Vanilla JS components don't support server-side rendering
      return '';
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
          
          // Create a container for the component
          const componentContainer = document.createElement('div');
          componentContainer.id = 'js-component';
          rootElement.appendChild(componentContainer);
          
          // Initialize the component
          if (typeof Component === 'function') {
            // If Component is a constructor or factory function
            const instance = Component(componentData, componentContainer);
            
            // If the component returns a render method, call it
            if (instance && typeof instance.render === 'function') {
              instance.render();
            }
          } else if (Component && typeof Component.init === 'function') {
            // If Component is an object with an init method
            Component.init(componentData, componentContainer);
          } else if (Component && typeof Component.render === 'function') {
            // If Component is an object with a render method
            Component.render(componentData, componentContainer);
          } else {
            console.error('Component does not have a valid interface');
            rootElement.innerHTML = '<div class="error">Error: Component does not have a valid interface</div>';
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
        .replace('{{componentData}}', JSON.stringify(data))
        .replace('{{hydrationData}}', JSON.stringify({ component: componentDef.name, data, intent, parameters }))
        .replace('{{customCSS}}', customCSS);
    }
  };
}