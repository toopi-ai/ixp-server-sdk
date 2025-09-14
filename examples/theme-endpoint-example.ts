/**
 * Example: Using the Theme Endpoint
 * 
 * This example demonstrates how to configure and use the new /ixp/theme endpoint
 * to retrieve theme configuration from an IXP server.
 */

import { createIXPApp } from '../src/index';
import { IXPServerConfig } from '../src/types';

// Configure server with theme settings
const config: IXPServerConfig = {
  theme: {
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40'
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 'normal',
      lineHeight: '1.5'
    },
    components: {
      button: {
        borderRadius: '4px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500'
      },
      card: {
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      input: {
        borderRadius: '4px',
        padding: '8px 12px',
        border: '1px solid #ced4da'
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    }
  },
  port: 3001
};

// Create IXP app with theme configuration
const app = createIXPApp(config);

// Start the server
app.listen(config.port, () => {
  console.log(`IXP Server running on http://localhost:${config.port}`);
  console.log('Available endpoints:');
  console.log('  GET /ixp/theme - Get theme configuration');
  console.log('  GET /ixp/intents - Get available intents');
  console.log('  GET /ixp/components - Get available components');
  console.log('');
  console.log('Try accessing the theme endpoint:');
  console.log(`  curl http://localhost:${config.port}/ixp/theme`);
});

// Example of how to fetch theme configuration programmatically
async function fetchThemeConfiguration() {
  try {
    const response = await fetch(`http://localhost:${config.port}/ixp/theme`);
    const data = await response.json();
    
    console.log('Theme Configuration:');
    console.log(JSON.stringify(data, null, 2));
    
    // Access specific theme properties
    const { theme } = data;
    console.log('Primary color:', theme.colors?.primary);
    console.log('Font family:', theme.typography?.fontFamily);
    console.log('Button border radius:', theme.components?.button?.borderRadius);
  } catch (error) {
    console.error('Failed to fetch theme configuration:', error);
  }
}

// Uncomment to test fetching theme after server starts
// setTimeout(fetchThemeConfiguration, 1000);