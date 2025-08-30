/**
 * Minimal IXP Server Example
 *
 * This example demonstrates the simplest possible IXP server setup.
 * Perfect for:
 * - Getting started quickly
 * - Learning the basics
 * - Prototyping
 * - Testing single components
 */
import { createIXPServer } from '../dist/index.js';
// Minimal intent definition
const intents = [
    {
        name: 'hello_world',
        description: 'Display a simple hello world message',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name to greet'
                }
            }
        },
        component: 'HelloWorld',
        version: '1.0.0'
    }
];
// Minimal component definition
const components = {
    HelloWorld: {
        name: 'HelloWorld',
        framework: 'react',
        remoteUrl: 'http://localhost:5173/HelloWorld.js',
        exportName: 'HelloWorld',
        propsSchema: {
            type: 'object',
            properties: {
                name: { type: 'string' }
            }
        },
        version: '1.0.0',
        allowedOrigins: ['*'],
        bundleSize: '2KB',
        performance: {
            tti: '0.1s',
            bundleSizeGzipped: '1KB'
        },
        securityPolicy: {
            allowEval: false,
            maxBundleSize: '10KB',
            sandboxed: true
        }
    }
};
// Create minimal server
const server = createIXPServer({
    intents,
    components,
    port: 3000
});
// Start server
async function main() {
    try {
        console.log('🚀 Starting minimal IXP server...');
        await server.listen();
        console.log('✅ Minimal IXP Server is running!');
        console.log('🌐 Server URL: http://localhost:3000');
        console.log('');
        console.log('🧪 Test the server:');
        console.log('   curl -X POST http://localhost:3000/ixp/render \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{');
        console.log('        "intent": {');
        console.log('          "name": "hello_world",');
        console.log('          "parameters": { "name": "World" }');
        console.log('        }');
        console.log('      }\'');
        console.log('');
        console.log('📋 Available endpoints:');
        console.log('   • GET  /ixp/intents - List all intents');
        console.log('   • GET  /ixp/components - List all components');
        console.log('   • POST /ixp/render - Render a component');
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await server.close();
    process.exit(0);
});
main().catch(console.error);
//# sourceMappingURL=minimal-server.js.map