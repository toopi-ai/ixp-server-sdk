/**
 * Basic Tests for IXP Server SDK
 */

import { createIXPServer, IntentRegistry, ComponentRegistry, IntentResolver } from '../src/index';
import { IXPError, ErrorFactory } from '../src/utils/errors';
import { Logger } from '../src/utils/logger';
import { MetricsService } from '../src/utils/metrics';

describe('IXP Server SDK', () => {
  describe('IntentRegistry', () => {
    test('should create registry with intents array', () => {
      const intents = [
        {
          name: 'test_intent',
          description: 'Test intent',
          parameters: { type: 'object', properties: {} },
          component: 'TestComponent',
          version: '1.0.0'
        }
      ];
      
      const registry = new IntentRegistry(intents);
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.get('test_intent')).toBeDefined();
      expect(registry.get('test_intent')).toBeValidIntentDefinition();
    });
    
    test('should add and remove intents', () => {
      const registry = new IntentRegistry([]);
      
      const intent = {
        name: 'dynamic_intent',
        description: 'Dynamically added intent',
        parameters: { type: 'object', properties: {} },
        component: 'DynamicComponent',
        version: '1.0.0'
      };
      
      registry.add(intent);
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.get('dynamic_intent')).toBeDefined();
      
      const removed = registry.remove('dynamic_intent');
      expect(removed).toBe(true);
      expect(registry.getAll()).toHaveLength(0);
    });
    
    test('should find intents by criteria', () => {
      const intents = [
        {
          name: 'crawlable_intent',
          description: 'Crawlable intent',
          parameters: { type: 'object', properties: {} },
          component: 'CrawlableComponent',
          version: '1.0.0',
          crawlable: true
        },
        {
          name: 'non_crawlable_intent',
          description: 'Non-crawlable intent',
          parameters: { type: 'object', properties: {} },
          component: 'NonCrawlableComponent',
          version: '1.0.0',
          crawlable: false
        }
      ];
      
      const registry = new IntentRegistry(intents);
      const crawlable = registry.findByCriteria({ crawlable: true });
      
      expect(crawlable).toHaveLength(1);
      expect(crawlable[0].name).toBe('crawlable_intent');
    });
  });
  
  describe('ComponentRegistry', () => {
    test('should create registry with components object', () => {
      const components = {
        TestComponent: {
          name: 'TestComponent',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/TestComponent.js',
          exportName: 'TestComponent',
          propsSchema: { type: 'object', properties: {} },
          version: '1.0.0',
          allowedOrigins: ['*'],
          bundleSize: '10KB',
          performance: { tti: '0.5s', bundleSizeGzipped: '3KB' },
          securityPolicy: { allowEval: false, maxBundleSize: '100KB', sandboxed: true }
        }
      };
      
      const registry = new ComponentRegistry(components);
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.get('TestComponent')).toBeDefined();
      expect(registry.get('TestComponent')).toBeValidComponentDefinition();
    });
    
    test('should check origin permissions', () => {
      const components = {
        RestrictedComponent: {
          name: 'RestrictedComponent',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/RestrictedComponent.js',
          exportName: 'RestrictedComponent',
          propsSchema: { type: 'object', properties: {} },
          version: '1.0.0',
          allowedOrigins: ['http://localhost:3000'],
          bundleSize: '10KB',
          performance: { tti: '0.5s', bundleSizeGzipped: '3KB' },
          securityPolicy: { allowEval: false, maxBundleSize: '100KB', sandboxed: true }
        }
      };
      
      const registry = new ComponentRegistry(components);
      
      expect(registry.isOriginAllowed('RestrictedComponent', 'http://localhost:3000')).toBe(true);
      expect(registry.isOriginAllowed('RestrictedComponent', 'http://localhost:3001')).toBe(false);
    });
  });
  
  describe('IntentResolver', () => {
    let intentRegistry: IntentRegistry;
    let componentRegistry: ComponentRegistry;
    let resolver: IntentResolver;
    
    beforeEach(() => {
      const intents = [
        {
          name: 'test_intent',
          description: 'Test intent',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              count: { type: 'number' }
            },
            required: ['name']
          },
          component: 'TestComponent',
          version: '1.0.0'
        }
      ];
      
      const components = {
        TestComponent: {
          name: 'TestComponent',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/TestComponent.js',
          exportName: 'TestComponent',
          propsSchema: { type: 'object', properties: {} },
          version: '1.0.0',
          allowedOrigins: ['*'],
          bundleSize: '10KB',
          performance: { tti: '0.5s', bundleSizeGzipped: '3KB' },
          securityPolicy: { allowEval: false, maxBundleSize: '100KB', sandboxed: true }
        }
      };
      
      intentRegistry = new IntentRegistry(intents);
      componentRegistry = new ComponentRegistry(components);
      resolver = new IntentResolver(intentRegistry, componentRegistry);
    });
    
    test('should resolve valid intent', async () => {
      const request = {
        name: 'test_intent',
        parameters: { name: 'test', count: 5 }
      };
      
      const result = await resolver.resolveIntent(request);
      
      expect(result).toBeDefined();
      expect(result.record.moduleUrl).toBe('http://localhost:5173/TestComponent.js');
      expect(result.record.exportName).toBe('TestComponent');
      expect(result.record.props.name).toBe('test');
      expect(result.record.props.count).toBe(5);
      expect(result.ttl).toBeGreaterThan(0);
    });
    
    test('should validate required parameters', async () => {
      const request = {
        name: 'test_intent',
        parameters: { count: 5 } // missing required 'name'
      };
      
      await expect(resolver.resolveIntent(request)).rejects.toThrow('Parameter validation failed');
    });
    
    test('should throw error for unknown intent', async () => {
      const request = {
        name: 'unknown_intent',
        parameters: {}
      };
      
      await expect(resolver.resolveIntent(request)).rejects.toThrow("Intent 'unknown_intent' not found");
    });
  });
  
  describe('IXPError', () => {
    test('should create error with proper structure', () => {
      const error = new IXPError('Test error', 'TEST_ERROR', 400);
      
      expect(error).toBeValidIXPError();
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.timestamp).toBeDefined();
    });
    
    test('should convert to response format', () => {
      const error = new IXPError('Test error', 'TEST_ERROR', 400);
      const response = error.toResponse();
      
      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test error');
      expect(response.error.timestamp).toBeDefined();
    });
  });
  
  describe('ErrorFactory', () => {
    test('should create intent not found error', () => {
      const error = ErrorFactory.intentNotFound('test_intent');
      
      expect(error).toBeValidIXPError();
      expect(error.code).toBe('INTENT_NOT_SUPPORTED');
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('test_intent');
    });
    
    test('should create parameter validation error', () => {
      const errors = ['Name is required', 'Count must be positive'];
      const error = ErrorFactory.parameterValidation(errors);
      
      expect(error).toBeValidIXPError();
      expect(error.code).toBe('PARAMETER_VALIDATION_FAILED');
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Name is required');
    });
  });
  
  describe('Logger', () => {
    test('should create logger with default config', () => {
      const logger = new Logger();
      
      expect(logger.getLevel()).toBe('info');
      expect(logger.isLevelEnabled('info')).toBe(true);
      expect(logger.isLevelEnabled('debug')).toBe(false);
    });
    
    test('should create child logger with context', () => {
      const parentLogger = new Logger({ level: 'debug' });
      const childLogger = parentLogger.child({ component: 'test' });
      
      expect(childLogger.getLevel()).toBe('debug');
    });
  });
  
  describe('MetricsService', () => {
    test('should track requests and errors', () => {
      const metrics = new MetricsService();
      
      metrics.recordRequest('/test', 200, 100);
      metrics.recordRequest('/test', 404, 50);
      metrics.recordError({ code: 'TEST_ERROR' });
      
      const data = metrics.getMetrics();
      
      expect(data.requests.total).toBe(2);
      expect(data.errors.total).toBe(1);
      expect(data.performance.averageResponseTime).toBe(75);
    });
    
    test('should generate summary statistics', () => {
      const metrics = new MetricsService();
      
      metrics.recordRequest('/test', 200, 100);
      metrics.recordError({ code: 'TEST_ERROR' });
      
      const summary = metrics.getSummary();
      
      expect(summary.totalRequests).toBe(1);
      expect(summary.errorRate).toBe(100); // 1 error out of 1 request
    });
  });
  
  describe('createIXPServer', () => {
    test('should create server with minimal config', () => {
      const server = createIXPServer({
        intents: [],
        components: {}
      });
      
      expect(server).toBeDefined();
      expect(server.intentRegistry).toBeDefined();
      expect(server.componentRegistry).toBeDefined();
      expect(server.intentResolver).toBeDefined();
    });
    
    test('should create server with plugins and middleware', async () => {
      const server = createIXPServer({
        intents: [],
        components: {},
        plugins: [],
        middleware: []
      });
      
      expect(server).toBeDefined();
      
      // Test plugin addition
      const testPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn()
      };
      
      await server.addPlugin(testPlugin);
      expect(testPlugin.install).toHaveBeenCalledWith(server);
    });
  });

  describe('Render Endpoint Integration', () => {
    let server: any;
    let request: any;
    
    beforeEach(async () => {
      const intents = [
        {
          name: 'show_welcome',
          description: 'Display welcome message',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              theme: { type: 'string', enum: ['light', 'dark'] }
            },
            required: ['name']
          },
          component: 'WelcomeComponent',
          version: '1.0.0',
          crawlable: true
        },
        {
          name: 'show_products',
          description: 'Display product list',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              limit: { type: 'number', minimum: 1, maximum: 50 }
            }
          },
          component: 'ProductGrid',
          version: '1.0.0'
        }
      ];
      
      const components = {
        WelcomeComponent: {
          name: 'WelcomeComponent',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/WelcomeComponent.js',
          exportName: 'WelcomeComponent',
          propsSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              theme: { type: 'string' }
            },
            required: ['name']
          },
          version: '1.0.0',
          allowedOrigins: ['*'],
          bundleSize: '5KB',
          performance: { tti: '0.2s', bundleSizeGzipped: '2KB' },
          securityPolicy: { allowEval: false, maxBundleSize: '50KB', sandboxed: true }
        },
        ProductGrid: {
          name: 'ProductGrid',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/ProductGrid.js',
          exportName: 'ProductGrid',
          propsSchema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              limit: { type: 'number' }
            }
          },
          version: '1.0.0',
          allowedOrigins: ['*'],
          bundleSize: '25KB',
          performance: { tti: '0.5s', bundleSizeGzipped: '8KB' },
          securityPolicy: { allowEval: false, maxBundleSize: '100KB', sandboxed: true }
        }
      };
      
      server = createIXPServer({
        intents,
        components,
        dataProvider: {
          async resolveIntentData(intent, context) {
            if (intent.name === 'show_products') {
              return {
                totalProducts: 100,
                availableCategories: ['electronics', 'clothing', 'books']
              };
            }
            return {};
          }
        }
      });
      
      await server.initialize();
      
      // Mock request object
      request = {
        body: {},
        get: jest.fn().mockReturnValue(null),
        method: 'POST',
        path: '/render'
      };
    });
    
    test('should render component for valid intent', async () => {
      request.body = {
        intent: {
          name: 'show_welcome',
          parameters: { name: 'World', theme: 'light' }
        }
      };
      
      const result = await server.intentResolver.resolveIntent(request.body.intent);
      
      expect(result).toBeDefined();
      expect(result.record.moduleUrl).toBe('http://localhost:5173/WelcomeComponent.js');
      expect(result.record.exportName).toBe('WelcomeComponent');
      expect(result.record.props.name).toBe('World');
      expect(result.record.props.theme).toBe('light');
      expect(result.component.name).toBe('WelcomeComponent');
      expect(result.ttl).toBeGreaterThan(0);
    });
    
    test('should include data provider data in render result', async () => {
      request.body = {
        intent: {
          name: 'show_products',
          parameters: { category: 'electronics', limit: 10 }
        }
      };
      
      const result = await server.intentResolver.resolveIntent(request.body.intent);
      
      expect(result).toBeDefined();
      expect(result.record.props.category).toBe('electronics');
      expect(result.record.props.limit).toBe(10);
      expect(result.record.props.totalProducts).toBe(100);
      expect(result.record.props.availableCategories).toEqual(['electronics', 'clothing', 'books']);
    });
    
    test('should validate intent parameters', async () => {
      request.body = {
        intent: {
          name: 'show_welcome',
          parameters: { theme: 'light' } // missing required 'name'
        }
      };
      
      await expect(server.intentResolver.resolveIntent(request.body.intent))
        .rejects.toThrow('Parameter validation failed');
    });
    
    test('should validate enum parameters', async () => {
      request.body = {
        intent: {
          name: 'show_welcome',
          parameters: { name: 'World', theme: 'invalid' } // invalid enum value
        }
      };
      
      await expect(server.intentResolver.resolveIntent(request.body.intent))
        .rejects.toThrow('Parameter validation failed');
    });
    
    test('should validate number constraints', async () => {
      request.body = {
        intent: {
          name: 'show_products',
          parameters: { limit: 100 } // exceeds maximum of 50
        }
      };
      
      await expect(server.intentResolver.resolveIntent(request.body.intent))
        .rejects.toThrow('Parameter validation failed');
    });
    
    test('should handle missing intent', async () => {
      request.body = {
        intent: {
          name: 'unknown_intent',
          parameters: {}
        }
      };
      
      await expect(server.intentResolver.resolveIntent(request.body.intent))
        .rejects.toThrow("Intent 'unknown_intent' not found");
    });
    
    test('should calculate appropriate TTL', async () => {
      // Test crawlable intent (should have higher TTL)
      const crawlableResult = await server.intentResolver.resolveIntent({
        name: 'show_welcome',
        parameters: { name: 'World' }
      });
      
      // Test non-crawlable intent
      const nonCrawlableResult = await server.intentResolver.resolveIntent({
        name: 'show_products',
        parameters: {}
      });
      
      expect(crawlableResult.ttl).toBeGreaterThanOrEqual(600); // At least 10 minutes for crawlable
      expect(nonCrawlableResult.ttl).toBeGreaterThanOrEqual(300); // At least 5 minutes default
    });
    
    test('should merge options with resolved props', async () => {
      const options = {
        customProp: 'customValue',
        metadata: { source: 'test' }
      };
      
      const result = await server.intentResolver.resolveIntent({
        name: 'show_welcome',
        parameters: { name: 'World' }
      }, options);
      
      expect(result.record.props.name).toBe('World');
      expect(result.record.props.customProp).toBe('customValue');
      expect(result.record.props.metadata).toEqual({ source: 'test' });
    });
  });
});