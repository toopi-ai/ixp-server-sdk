# Framework Renderers

This directory contains framework-specific renderers for the IXP Server SDK's automated rendering system. These renderers enable server-side rendering (where supported) and client-side hydration for components built with different frameworks.

## Available Renderers

### React Renderer

The React renderer provides server-side rendering and client-side hydration for React components.

```typescript
import { createReactRenderer } from 'ixp-server-sdk/renderers';

const reactRenderer = createReactRenderer({
  // Optional: Custom options
  template: '...', // Custom HTML template
  reactImport: 'react', // Custom React import
  reactDOMImport: 'react-dom/server', // Custom ReactDOM import
  customCSS: '...', // Custom CSS
});
```

### Vue Renderer

The Vue renderer provides server-side rendering and client-side hydration for Vue components.

```typescript
import { createVueRenderer } from 'ixp-server-sdk/renderers';

const vueRenderer = createVueRenderer({
  // Optional: Custom options
  template: '...', // Custom HTML template
  customCSS: '...', // Custom CSS
});
```

### Vanilla JS Renderer

The Vanilla JS renderer provides client-side rendering for vanilla JavaScript components. Note that server-side rendering is not supported for vanilla JavaScript components.

```typescript
import { createVanillaJSRenderer } from 'ixp-server-sdk/renderers';

const vanillaRenderer = createVanillaJSRenderer({
  // Optional: Custom options
  template: '...', // Custom HTML template
  customCSS: '...', // Custom CSS
});
```

## Using Renderers with the Rendering Middleware

Renderers are designed to be used with the `createRenderMiddleware` function from the `middleware` directory:

```typescript
import { createRenderMiddleware } from 'ixp-server-sdk/middleware';
import { createReactRenderer, createVueRenderer, createVanillaJSRenderer } from 'ixp-server-sdk/renderers';

// Create renderers
const reactRenderer = createReactRenderer();
const vueRenderer = createVueRenderer();
const vanillaRenderer = createVanillaJSRenderer();

// Add rendering middleware with multiple renderers
server.use(
  createRenderMiddleware({
    renderers: {
      react: reactRenderer,
      vue: vueRenderer,
      vanilla: vanillaRenderer,
    },
    defaultRenderer: 'react', // Default to React if not specified
  })
);
```

## Creating Custom Renderers

You can create custom renderers by implementing the `FrameworkRenderer` interface from the `renderMiddleware` module:

```typescript
import { FrameworkRenderer } from 'ixp-server-sdk/middleware/renderMiddleware';

const customRenderer: FrameworkRenderer = {
  renderToString: async (componentDef, props) => {
    // Server-side rendering logic
    return '<div>Server-rendered content</div>';
  },
  generateHydrationScript: (componentDef, data, intent, parameters) => {
    // Client-side hydration script
    return 'console.log("Hydrating component")';
  },
  generateTemplate: (content, componentDef, data, intent, parameters) => {
    // HTML template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${componentDef.name}</title>
        </head>
        <body>
          <div id="root">${content}</div>
          <script>
            // Hydration script
          </script>
        </body>
      </html>
    `;
  },
};
```

## Component Configuration

Components should be configured with a `framework` property that specifies which renderer to use:

```json
{
  "components": {
    "MyReactComponent": {
      "framework": "react",
      "remoteUrl": "http://localhost:5173/MyReactComponent.js",
      "exportName": "MyReactComponent",
      "propsSchema": {
        "type": "object",
        "properties": {}
      }
    }
  }
}
```

The middleware will use the component's `framework` property to determine which renderer to use for that component.