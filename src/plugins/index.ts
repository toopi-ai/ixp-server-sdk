/**
 * Built-in Plugins for IXP Server
 */

import { Router } from 'express';
import type { IXPPlugin, IXPServerInstance } from '../types/index';

/**
 * Swagger Documentation Plugin
 * Automatically generates OpenAPI/Swagger documentation for IXP endpoints
 */
export function createSwaggerPlugin(options: {
  title?: string;
  version?: string;
  description?: string;
  endpoint?: string;
  uiEndpoint?: string;
}): IXPPlugin {
  const {
    title = 'IXP Server API',
    version = '1.0.0',
    description = 'Intent Exchange Protocol Server API Documentation',
    endpoint = '/api-docs.json',
    uiEndpoint = '/api-docs'
  } = options;

  return {
    name: 'swagger-docs',
    version: '1.0.0',
    install: async (server: IXPServerInstance) => {
      // Generate OpenAPI specification
      const generateSpec = () => {
        const intents = server.intentRegistry.getAll();
        const components = server.componentRegistry.getAll();
        
        const spec = {
          openapi: '3.0.0',
          info: {
            title,
            version,
            description
          },
          servers: [
            {
              url: `http://localhost:${server.config.port || 3001}/ixp`,
              description: 'Development server'
            }
          ],
          paths: {
            '/intents': {
              get: {
                summary: 'Get all available intents',
                description: 'Returns a list of all intents supported by this server',
                responses: {
                  '200': {
                    description: 'List of intents',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            intents: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Intent' }
                            },
                            version: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '/components': {
              get: {
                summary: 'Get all available components',
                description: 'Returns a list of all components registered with this server',
                responses: {
                  '200': {
                    description: 'List of components',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            components: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Component' }
                            },
                            version: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '/render': {
              post: {
                summary: 'Render component for intent',
                description: 'Resolves an intent request to a component descriptor',
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          intent: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              parameters: { type: 'object' }
                            },
                            required: ['name']
                          },
                          options: { type: 'object' }
                        },
                        required: ['intent']
                      }
                    }
                  }
                },
                responses: {
                  '200': {
                    description: 'Component descriptor',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/IntentResponse' }
                      }
                    }
                  },
                  '400': {
                    description: 'Invalid request',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                      }
                    }
                  },
                  '404': {
                    description: 'Intent or component not found',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                      }
                    }
                  }
                }
              }
            },
            '/crawler_content': {
              get: {
                summary: 'Get crawlable content',
                description: 'Returns public content for search engine indexing',
                parameters: [
                  {
                    name: 'cursor',
                    in: 'query',
                    description: 'Pagination cursor',
                    schema: { type: 'string' }
                  },
                  {
                    name: 'limit',
                    in: 'query',
                    description: 'Maximum number of items to return',
                    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
                  }
                ],
                responses: {
                  '200': {
                    description: 'Crawlable content',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/CrawlerContent' }
                      }
                    }
                  }
                }
              }
            },
            '/health': {
              get: {
                summary: 'Health check',
                description: 'Returns server health status',
                responses: {
                  '200': {
                    description: 'Server is healthy',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/HealthCheck' }
                      }
                    }
                  },
                  '503': {
                    description: 'Server is unhealthy',
                    content: {
                      'application/json': {
                        schema: { $ref: '#/components/schemas/HealthCheck' }
                      }
                    }
                  }
                }
              }
            }
          },
          components: {
            schemas: {
              Intent: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parameters: { type: 'object' },
                  component: { type: 'string' },
                  version: { type: 'string' },
                  deprecated: { type: 'boolean' },
                  crawlable: { type: 'boolean' }
                }
              },
              Component: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  framework: { type: 'string' },
                  remoteUrl: { type: 'string' },
                  exportName: { type: 'string' },
                  propsSchema: { type: 'object' },
                  version: { type: 'string' },
                  deprecated: { type: 'boolean' },
                  allowedOrigins: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  bundleSize: { type: 'string' },
                  performance: { type: 'object' },
                  securityPolicy: { type: 'object' }
                }
              },
              IntentResponse: {
                type: 'object',
                properties: {
                  record: {
                    type: 'object',
                    properties: {
                      moduleUrl: { type: 'string' },
                      exportName: { type: 'string' },
                      props: { type: 'object' }
                    }
                  },
                  component: { $ref: '#/components/schemas/Component' },
                  ttl: { type: 'number' }
                }
              },
              CrawlerContent: {
                type: 'object',
                properties: {
                  contents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      nextCursor: { type: 'string', nullable: true },
                      hasMore: { type: 'boolean' }
                    }
                  },
                  lastUpdated: { type: 'string', format: 'date-time' }
                }
              },
              HealthCheck: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
                  service: { type: 'string' },
                  version: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  uptime: { type: 'number' },
                  checks: { type: 'object' }
                }
              },
              Error: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      message: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      details: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        };
        
        return spec;
      };
      
      // Add API documentation endpoint
      server.app.get(endpoint, (req, res) => {
        try {
          const spec = generateSpec();
          res.setHeader('Content-Type', 'application/json');
          res.json(spec);
        } catch (error) {
          console.error('Error generating OpenAPI spec:', error);
          res.status(500).json({ error: 'Failed to generate API documentation' });
        }
      });
      
      // Add Swagger UI endpoint
      server.app.get(uiEndpoint, (req, res) => {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${title}</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
            <style>
              html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
              *, *:before, *:after { box-sizing: inherit; }
              body { margin:0; background: #fafafa; }
            </style>
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
            <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
            <script>
              window.onload = function() {
                SwaggerUIBundle({
                  url: '/ixp${endpoint}',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                  ],
                  plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                  ],
                  layout: "StandaloneLayout"
                });
              };
            </script>
          </body>
          </html>
        `;
        res.send(html);
      });
      
      console.log(`📚 Swagger documentation available at ${uiEndpoint}`);
    }
  };
}

/**
 * Health Monitoring Plugin
 * Provides detailed health checks and monitoring capabilities
 */
export function createHealthMonitoringPlugin(options: {
  endpoint?: string;
  checks?: Record<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; duration?: number }>>;
}): IXPPlugin {
  const {
    endpoint = '/health/detailed',
    checks = {}
  } = options;

  return {
    name: 'health-monitoring',
    version: '1.0.0',
    install: async (server: IXPServerInstance) => {
      // Add detailed health check endpoint
      server.app.get(endpoint, async (req, res) => {
        const results: Record<string, any> = {};
        
        // Run custom checks
        for (const [name, checkFn] of Object.entries(checks)) {
          try {
            const start = Date.now();
            const result = await checkFn();
            results[name] = {
              ...result,
              duration: result.duration || (Date.now() - start)
            };
          } catch (error) {
            results[name] = {
              status: 'fail',
              message: error instanceof Error ? error.message : 'Check failed',
              duration: Date.now() - Date.now()
            };
          }
        }
        
        // Add default system checks
        results.memory = {
          status: 'pass',
          message: `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          duration: 0
        };
        
        results.uptime = {
          status: 'pass',
          message: `Uptime: ${Math.floor(process.uptime())}s`,
          duration: 0
        };
        
        // Determine overall status
        const hasFailures = Object.values(results).some((check: any) => check.status === 'fail');
        const hasWarnings = Object.values(results).some((check: any) => check.status === 'warn');
        
        const overallStatus = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';
        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json({
          status: overallStatus,
          service: 'IXP Server',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          checks: results
        });
      });
      
      console.log(`🏥 Health monitoring available at ${endpoint}`);
    }
  };
}

/**
 * Metrics Collection Plugin
 * Provides detailed metrics collection and reporting
 */
export function createMetricsPlugin(options: {
  endpoint?: string;
  format?: 'json' | 'prometheus';
  includeSystemMetrics?: boolean;
}): IXPPlugin {
  const {
    endpoint = '/metrics/detailed',
    format = 'json',
    includeSystemMetrics = true
  } = options;

  return {
    name: 'metrics-collection',
    version: '1.0.0',
    install: async (server: IXPServerInstance) => {
      server.app.get(endpoint, (req, res) => {
        const metrics: any = {};
        
        // Get basic metrics (this would be enhanced with actual metrics collection)
        metrics.requests = {
          total: 0,
          byIntent: {},
          byStatus: {}
        };
        
        metrics.performance = {
          averageResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0
        };
        
        if (includeSystemMetrics) {
          const memUsage = process.memoryUsage();
          metrics.system = {
            memory: {
              heapUsed: memUsage.heapUsed,
              heapTotal: memUsage.heapTotal,
              external: memUsage.external,
              rss: memUsage.rss
            },
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage()
          };
        }
        
        metrics.intents = server.intentRegistry.getStats();
        
        metrics.components = server.componentRegistry.getStats();
        
        if (format === 'prometheus') {
          // Convert to Prometheus format
          const lines: string[] = [];
          
          lines.push('# HELP ixp_intents_total Total number of intents');
          lines.push('# TYPE ixp_intents_total gauge');
          lines.push(`ixp_intents_total ${metrics.intents.total}`);
          
          lines.push('# HELP ixp_components_total Total number of components');
          lines.push('# TYPE ixp_components_total gauge');
          lines.push(`ixp_components_total ${metrics.components.total}`);
          
          if (includeSystemMetrics) {
            lines.push('# HELP ixp_memory_heap_used_bytes Memory heap used in bytes');
            lines.push('# TYPE ixp_memory_heap_used_bytes gauge');
            lines.push(`ixp_memory_heap_used_bytes ${metrics.system.memory.heapUsed}`);
            
            lines.push('# HELP ixp_uptime_seconds Server uptime in seconds');
            lines.push('# TYPE ixp_uptime_seconds gauge');
            lines.push(`ixp_uptime_seconds ${metrics.system.uptime}`);
          }
          
          res.set('Content-Type', 'text/plain');
          res.send(lines.join('\n'));
        } else {
          res.json({
            ...metrics,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      console.log(`📊 Detailed metrics available at ${endpoint}`);
    }
  };
}

// Export plugin factory functions
export const PluginFactory = {
  swagger: createSwaggerPlugin,
  healthMonitoring: createHealthMonitoringPlugin,
  metrics: createMetricsPlugin
};