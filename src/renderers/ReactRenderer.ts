/**
 * React Renderer
 * 
 * Provides React-specific rendering functionality for the IXP server SDK.
 * This renderer handles server-side rendering and client-side hydration for React components.
 */

import { FrameworkRenderer } from '../middleware/renderMiddleware';

/**
 * React Renderer Options
 */
export interface ReactRendererOptions {
  /**
   * Custom React import path
   * @default 'react'
   */
  reactImport?: string;

  /**
   * Custom ReactDOM import path
   * @default 'react-dom'
   */
  reactDOMImport?: string;

  /**
   * Custom HTML template
   */
  template?: string;

  /**
   * Whether to include React and ReactDOM scripts
   * @default true
   */
  includeReactScripts?: boolean;

  /**
   * React version to use
   * @default '18.2.0'
   */
  reactVersion?: string;

  /**
   * Custom CSS to include
   */
  customCSS?: string;
}

/**
 * Create a React renderer
 */
export function createReactRenderer(options: ReactRendererOptions = {}): FrameworkRenderer {
  const {
    reactImport = 'react',
    reactDOMImport = 'react-dom',
    template,
    includeReactScripts = true,
    reactVersion = '18.2.0',
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
  {{reactScripts}}
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
      
      // Create a container for the React component
      const reactRoot = document.createElement('div');
      reactRoot.id = 'react-root';
      rootElement.appendChild(reactRoot);
      
      // Render the component
      const React = window.React;
      const ReactDOM = window.ReactDOM;
      
      if (React && ReactDOM) {
        // React is already available
        ReactDOM.render(
          React.createElement(Component, componentData),
          reactRoot
        );
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

  // React scripts
  const reactScripts = includeReactScripts ? `
  <script crossorigin src="https://unpkg.com/react@${reactVersion}/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@${reactVersion}/umd/react-dom.production.min.js"></script>` : '';

  return {
    /**
     * Server-side render a React component
     * 
     * Note: This is a placeholder implementation. In a real implementation,
     * we would use ReactDOMServer.renderToString() to render the component.
     * However, this requires importing React and ReactDOM at runtime, which
     * is not possible in this context without additional dependencies.
     */
    renderToString: async (componentDef: any, props: any) => {
      try {
        // In a real implementation, we would use ReactDOMServer.renderToString()
        // For now, we'll return an empty string as a placeholder
        return '';
      } catch (error) {
        console.error('Error rendering React component:', error);
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
          
          // Create a container for the React component
          const reactRoot = document.createElement('div');
          reactRoot.id = 'react-root';
          rootElement.appendChild(reactRoot);
          
          // Render the component
          const React = window.React;
          const ReactDOM = window.ReactDOM;
          
          if (React && ReactDOM) {
            // React is already available
            ReactDOM.render(
              React.createElement(Component, componentData),
              reactRoot
            );
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
        .replace('{{reactScripts}}', reactScripts)
        .replace('{{customCSS}}', customCSS);
    }
  };
}