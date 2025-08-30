/**
 * Vue Components IXP Server Example
 *
 * This example demonstrates how to create an IXP server specifically for Vue components.
 * It showcases:
 * - Vue-specific component definitions
 * - Composition API and Options API support
 * - Vue 3 features integration
 * - Component props validation
 * - Vue ecosystem plugins
 */
import { createIXPServer } from '../dist/index.js';
import { createSwaggerPlugin, createHealthMonitoringPlugin } from '../dist/plugins/index.js';
import { createRequestIdMiddleware, createRateLimitMiddleware } from '../dist/middleware/index.js';
// Vue-focused intents
const intents = [
    {
        name: 'show_todo_list',
        description: 'Display interactive todo list with Vue reactivity',
        parameters: {
            type: 'object',
            properties: {
                listId: {
                    type: 'string',
                    description: 'Todo list identifier'
                },
                showCompleted: {
                    type: 'boolean',
                    description: 'Whether to show completed tasks',
                    default: true
                },
                sortBy: {
                    type: 'string',
                    enum: ['created', 'priority', 'dueDate'],
                    description: 'Sort order for tasks'
                }
            },
            required: ['listId']
        },
        component: 'TodoList',
        version: '1.0.0',
        crawlable: true
    },
    {
        name: 'show_data_table',
        description: 'Display paginated data table with Vue reactivity',
        parameters: {
            type: 'object',
            properties: {
                dataSource: {
                    type: 'string',
                    description: 'Data source endpoint'
                },
                columns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Column names to display'
                },
                pageSize: {
                    type: 'number',
                    minimum: 10,
                    maximum: 100,
                    description: 'Number of rows per page'
                },
                searchable: {
                    type: 'boolean',
                    description: 'Enable search functionality',
                    default: true
                }
            },
            required: ['dataSource']
        },
        component: 'DataTable',
        version: '1.0.0',
        crawlable: false
    },
    {
        name: 'show_image_gallery',
        description: 'Display responsive image gallery with Vue transitions',
        parameters: {
            type: 'object',
            properties: {
                galleryId: {
                    type: 'string',
                    description: 'Gallery identifier'
                },
                layout: {
                    type: 'string',
                    enum: ['grid', 'masonry', 'carousel'],
                    description: 'Gallery layout style'
                },
                thumbnailSize: {
                    type: 'string',
                    enum: ['small', 'medium', 'large'],
                    description: 'Thumbnail size'
                },
                enableLightbox: {
                    type: 'boolean',
                    description: 'Enable lightbox for full-size viewing',
                    default: true
                }
            },
            required: ['galleryId']
        },
        component: 'ImageGallery',
        version: '1.0.0',
        crawlable: true
    }
];
// Vue component definitions
const components = {
    TodoList: {
        name: 'TodoList',
        framework: 'vue',
        remoteUrl: 'http://localhost:5174/components/TodoList.js',
        exportName: 'TodoList',
        propsSchema: {
            type: 'object',
            properties: {
                listId: { type: 'string' },
                showCompleted: { type: 'boolean' },
                sortBy: { type: 'string', enum: ['created', 'priority', 'dueDate'] }
            },
            required: ['listId']
        },
        version: '1.0.0',
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5174'],
        bundleSize: '20KB',
        performance: {
            tti: '0.4s',
            bundleSizeGzipped: '7KB'
        },
        securityPolicy: {
            allowEval: false,
            maxBundleSize: '60KB',
            sandboxed: true
        }
    },
    DataTable: {
        name: 'DataTable',
        framework: 'vue',
        remoteUrl: 'http://localhost:5174/components/DataTable.js',
        exportName: 'DataTable',
        propsSchema: {
            type: 'object',
            properties: {
                dataSource: { type: 'string' },
                columns: { type: 'array', items: { type: 'string' } },
                pageSize: { type: 'number', minimum: 10, maximum: 100 },
                searchable: { type: 'boolean' }
            },
            required: ['dataSource']
        },
        version: '1.0.0',
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5174'],
        bundleSize: '35KB',
        performance: {
            tti: '0.6s',
            bundleSizeGzipped: '12KB'
        },
        securityPolicy: {
            allowEval: false,
            maxBundleSize: '80KB',
            sandboxed: true
        }
    },
    ImageGallery: {
        name: 'ImageGallery',
        framework: 'vue',
        remoteUrl: 'http://localhost:5174/components/ImageGallery.js',
        exportName: 'ImageGallery',
        propsSchema: {
            type: 'object',
            properties: {
                galleryId: { type: 'string' },
                layout: { type: 'string', enum: ['grid', 'masonry', 'carousel'] },
                thumbnailSize: { type: 'string', enum: ['small', 'medium', 'large'] },
                enableLightbox: { type: 'boolean' }
            },
            required: ['galleryId']
        },
        version: '1.0.0',
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5174'],
        bundleSize: '28KB',
        performance: {
            tti: '0.5s',
            bundleSizeGzipped: '10KB'
        },
        securityPolicy: {
            allowEval: false,
            maxBundleSize: '70KB',
            sandboxed: true
        }
    }
};
// Create server with Vue-optimized configuration
const server = createIXPServer({
    intents,
    components,
    port: 3003,
    cors: {
        origins: ['http://localhost:3000', 'http://localhost:5174'],
        credentials: true
    },
    logging: {
        level: 'info',
        format: 'text'
    },
    metrics: {
        enabled: true,
        endpoint: '/metrics'
    },
    // Data provider for Vue components
    dataProvider: {
        async getCrawlerContent() {
            return {
                contents: [
                    {
                        type: 'component',
                        id: 'todo-list',
                        title: 'Vue Todo List Component',
                        description: 'Interactive todo list with Vue reactivity',
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        type: 'component',
                        id: 'data-table',
                        title: 'Vue Data Table Component',
                        description: 'Paginated data table with search and sorting',
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        type: 'component',
                        id: 'image-gallery',
                        title: 'Vue Image Gallery Component',
                        description: 'Responsive image gallery with transitions',
                        lastUpdated: new Date().toISOString()
                    }
                ],
                pagination: { nextCursor: null, hasMore: false },
                lastUpdated: new Date().toISOString()
            };
        },
        async resolveIntentData(intent, context) {
            // Mock data for Vue components
            if (intent.name === 'show_todo_list') {
                return {
                    todos: [
                        {
                            id: '1',
                            title: 'Learn Vue 3 Composition API',
                            completed: false,
                            priority: 'high',
                            dueDate: '2024-02-01',
                            created: '2024-01-15'
                        },
                        {
                            id: '2',
                            title: 'Build IXP Vue components',
                            completed: true,
                            priority: 'medium',
                            dueDate: '2024-01-30',
                            created: '2024-01-10'
                        },
                        {
                            id: '3',
                            title: 'Write component tests',
                            completed: false,
                            priority: 'medium',
                            dueDate: '2024-02-05',
                            created: '2024-01-20'
                        }
                    ],
                    metadata: {
                        totalCount: 3,
                        completedCount: 1,
                        lastUpdated: new Date().toISOString()
                    }
                };
            }
            if (intent.name === 'show_data_table') {
                return {
                    data: [
                        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
                        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
                        { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'Active' }
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: 4,
                        pageSize: intent.parameters.pageSize || 10
                    }
                };
            }
            if (intent.name === 'show_image_gallery') {
                return {
                    images: [
                        {
                            id: '1',
                            src: 'https://picsum.photos/400/300?random=1',
                            thumbnail: 'https://picsum.photos/200/150?random=1',
                            alt: 'Sample image 1',
                            caption: 'Beautiful landscape'
                        },
                        {
                            id: '2',
                            src: 'https://picsum.photos/400/300?random=2',
                            thumbnail: 'https://picsum.photos/200/150?random=2',
                            alt: 'Sample image 2',
                            caption: 'City architecture'
                        },
                        {
                            id: '3',
                            src: 'https://picsum.photos/400/300?random=3',
                            thumbnail: 'https://picsum.photos/200/150?random=3',
                            alt: 'Sample image 3',
                            caption: 'Nature photography'
                        }
                    ],
                    metadata: {
                        totalImages: 3,
                        galleryName: 'Sample Gallery',
                        lastUpdated: new Date().toISOString()
                    }
                };
            }
            return {};
        }
    }
});
// Add plugins
server.addPlugin(createSwaggerPlugin({
    title: 'Vue Components IXP Server',
    version: '1.0.0',
    description: 'IXP server optimized for Vue.js components'
}));
server.addPlugin(createHealthMonitoringPlugin({
    checks: {
        vueDevServer: async () => {
            try {
                const response = await fetch('http://localhost:5174');
                return {
                    status: response.ok ? 'pass' : 'fail',
                    message: response.ok ? 'Vue dev server is running' : 'Vue dev server is down'
                };
            }
            catch {
                return {
                    status: 'fail',
                    message: 'Vue dev server is not reachable'
                };
            }
        }
    }
}));
// Add middleware
server.addMiddleware(createRequestIdMiddleware({}));
server.addMiddleware(createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 200
}));
// Start server
async function main() {
    try {
        console.log('🟢 Starting Vue Components IXP Server...');
        await server.listen();
        console.log('🚀 Vue Components IXP Server is running!');
        console.log(`🌐 Server URL: http://localhost:3003`);
        console.log('');
        console.log('📋 Available Vue components:');
        Object.keys(components).forEach(name => {
            console.log(`   • ${name}: Vue component`);
        });
        console.log('');
        console.log('🧪 Test Vue component rendering:');
        console.log('   curl -X POST http://localhost:3003/ixp/render \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{');
        console.log('        "intent": {');
        console.log('          "name": "show_todo_list",');
        console.log('          "parameters": { "listId": "my-todos", "sortBy": "priority" }');
        console.log('        }');
        console.log('      }\'');
        console.log('');
        console.log('🎨 Vue-specific features:');
        console.log('   • Composition API support');
        console.log('   • Vue 3 reactivity system');
        console.log('   • Component transitions');
        console.log('   • Props validation');
    }
    catch (error) {
        console.error('❌ Failed to start Vue server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Vue server...');
    await server.close();
    process.exit(0);
});
main().catch(console.error);
//# sourceMappingURL=vue-components-server.js.map