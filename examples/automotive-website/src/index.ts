import { createIXPServer } from 'ixp-server-sdk';
import express from 'express';
import path from 'path';

async function main() {
  const server = createIXPServer({
    port: 3001,
    intents: path.resolve('./config/intents.json'),
    components: path.resolve('./config/components.json'),
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    },
    logging: {
      level: 'debug'
    },
    static: {
      enabled: true,
      publicPath: path.resolve('./public'),
      urlPath: '/public'
    }
  });

  // The server already has built-in render endpoints:
  // POST /ixp/render-ui - for intent-based rendering
  // GET /ixp/view/:componentName - for direct component rendering




  await server.listen();
  console.log('🚀 IXP Server is running!');
  console.log('🌐 Server available at: http://localhost:3001');
}

main().catch(console.error);
