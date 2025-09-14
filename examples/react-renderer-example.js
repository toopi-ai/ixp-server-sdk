/**
 * Example: Using the new React renderer with remote component loading
 * 
 * This example demonstrates how to use the enhanced React renderer
 * that supports dynamic remote component loading with proper error handling.
 */

const { createIXPServer, createReactRenderer } = require('../dist/index.js');
const express = require('express');
const path = require('path');

// Create an IXP server with the new React renderer
async function createServerWithReactRenderer() {
  const app = express();
  
  // Create the enhanced React renderer with remote component loading
  const reactRenderer = createReactRenderer({
    useRemoteRenderer: true,  // Enable the new remote component loading
    reactVersion: '18.2.0',
    includeReactScripts: true,
    customCSS: `
      .remote-component-container {
        min-height: 200px;
        padding: 20px;
        border-radius: 8px;
        background: #f8f9fa;
      }
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  });
  
  // Create IXP server instance
  const server = createIXPServer({
    intents: path.join(__dirname, 'automotive-website/config/intents.json'),
    components: path.join(__dirname, 'automotive-website/config/components.json'),
    port: 3003,
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    },
    // Use our enhanced React renderer
    renderers: {
      react: reactRenderer
    }
  });
  
  // Add a custom route to demonstrate the renderer
  server.app.get('/demo/react-renderer', (req, res) => {
    const demoComponent = {
      name: 'SearchFilters',
      remoteUrl: 'http://localhost:3001/public/components.js',
      exportName: 'SearchFilters'
    };
    
    const demoData = {
      make: req.query.make || 'Toyota',
      model: req.query.model || 'Camry',
      onFilterChange: '(filters) => console.log("Filters changed:", filters)'
    };
    
    // Generate the HTML with our enhanced renderer
    const html = reactRenderer.generateTemplate(
      '', // No server-side rendering
      demoComponent,
      demoData,
      'search_vehicles',
      req.query
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
  
  // Add documentation route
  server.app.get('/demo/docs', (req, res) => {
    res.json({
      title: 'Enhanced React Renderer Demo',
      description: 'This demo shows the new React renderer with remote component loading capabilities.',
      features: [
        'Dynamic remote component loading',
        'Automatic error handling and fallbacks',
        'Loading states with custom spinners',
        'Component caching for performance',
        'Prop passing and event handling'
      ],
      endpoints: {
        '/demo/react-renderer': 'Demo the enhanced React renderer',
        '/demo/docs': 'This documentation',
        '/view/SearchFilters': 'Standard component view (uses new renderer if configured)'
      },
      usage: {
        'Enable new renderer': 'Set useRemoteRenderer: true in createReactRenderer options',
        'Component loading': 'Components are loaded dynamically from remoteUrl',
        'Error handling': 'Automatic fallback UI for failed component loads',
        'Caching': 'Components are cached after first load for performance'
      }
    });
  });
  
  return server;
}

// Start the demo server
if (require.main === module) {
  createServerWithReactRenderer()
    .then(server => {
      server.listen(() => {
        console.log('🚀 Enhanced React Renderer Demo Server started!');
        console.log('📍 Demo URL: http://localhost:3003/demo/react-renderer');
        console.log('📚 Documentation: http://localhost:3003/demo/docs');
        console.log('\n✨ Features:');
        console.log('  • Dynamic remote component loading');
        console.log('  • Automatic error handling and fallbacks');
        console.log('  • Loading states with custom spinners');
        console.log('  • Component caching for performance');
      });
    })
    .catch(error => {
      console.error('❌ Failed to start demo server:', error);
    });
}

module.exports = { createServerWithReactRenderer };