/**
 * Example: IXP Chatbox Interface
 * 
 * This example demonstrates the chatbox functionality with theme integration
 * available at the root route (/) of an IXP server.
 */

import { createIXPApp } from '../src/index';
import { IXPServerConfig } from '../src/types';

// Configure server with custom theme for the chatbox
const config: IXPServerConfig = {
  theme: {
    colors: {
      primary: '#6366f1', // Indigo
      secondary: '#64748b', // Slate
      background: {
        default: '#ffffff',
        paper: '#f8fafc'
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b'
      },
      border: {
        default: '#e2e8f0'
      },
      status: {
        success: '#10b981',
        error: '#ef4444'
      }
    },
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        base: '1rem'
      }
    },
    spacing: {
      sm: '8px',
      md: '16px',
      lg: '24px'
    }
  },
  port: 3003
};

// Create IXP app with chatbox functionality
const app = createIXPApp(config);

// Start the server
app.listen(config.port, () => {
  console.log(`🚀 IXP Server with Chatbox running on http://localhost:${config.port}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET / - Interactive Chatbox Interface`);
  console.log(`  GET /ixp/theme - Get theme configuration`);
  console.log(`  GET /ixp/intents - Get available intents`);
  console.log(`  GET /ixp/components - Get available components`);
  console.log('');
  console.log('💬 Open your browser and visit the root URL to use the chatbox!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down IXP Server...');
  process.exit(0);
});