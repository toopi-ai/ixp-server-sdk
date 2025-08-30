import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IXPServer } from '../src/core/IXPServer';
import { ComponentRegistry } from '../src/core/ComponentRegistry';
import { ComponentBuilder } from '../src/core/ComponentBuilder';
import { ComponentRenderer } from '../src/core/ComponentRenderer';
import { ComponentDefinition, IXPServerConfig } from '../src/types/index';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('Component Integration Tests', () => {
  let registry: ComponentRegistry;
  let builder: ComponentBuilder;
  let renderer: ComponentRenderer;
  let server: IXPServer;
  let mockConfig: IXPServerConfig;

  const mockReactComponent: ComponentDefinition = {
    name: 'TestReactComponent',
    version: '1.0.0',
    framework: 'react',
    remoteUrl: '/components/TestReactComponent.js',
    exportName: 'default',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        count: { type: 'number' }
      },
      required: ['title']
    },
    allowedOrigins: ['*'],
    bundleSize: '45KB',
    performance: {
      tti: '0.8s',
      bundleSizeGzipped: '15KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '200KB',
      sandboxed: true
    }
  };

  const mockVueComponent: ComponentDefinition = {
    name: 'TestVueComponent',
    version: '1.0.0',
    framework: 'vue',
    remoteUrl: '/components/TestVueComponent.js',
    exportName: 'default',
    propsSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    allowedOrigins: ['*'],
    bundleSize: '38KB',
    performance: {
      tti: '0.6s',
      bundleSizeGzipped: '12KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '200KB',
      sandboxed: true
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock config
    mockConfig = {
      port: 3001,
      cors: {
        origins: ['http://localhost:3000'],
        credentials: true
      },
      intents: [
    {
      name: 'test_intent',
      description: 'Test intent for integration testing',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          count: { type: 'number' }
        }
      },
      component: 'TestComponent',
      version: '1.0.0',
      crawlable: true
    }
  ],
      components: {
        TestComponent: {
          name: 'TestComponent',
          framework: 'react',
          remoteUrl: 'http://localhost:5173/TestComponent.js',
          exportName: 'TestComponent',
          propsSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              count: { type: 'number' }
            }
          },
          version: '1.0.0',
          allowedOrigins: ['*'],
          bundleSize: '10KB',
          performance: {
            tti: '0.5s',
            bundleSizeGzipped: '3KB'
          },
          securityPolicy: {
            allowEval: false,
            maxBundleSize: '50KB',
            sandboxed: true
          }
        }
      },
      logging: {
        level: 'info',
        format: 'text'
      },
      metrics: {
        enabled: true,
        endpoint: '/metrics'
      }
    };

    // Mock fs operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation(() => undefined);
    mockFs.mkdirSync.mockImplementation(() => undefined);

    // Initialize components
    registry = new ComponentRegistry();
    builder = new ComponentBuilder({
      framework: 'react',
      componentsDir: './components',
      outDir: './dist/components',
      registryFile: './dist/registry.json'
    });
    renderer = new ComponentRenderer(registry);
    server = new IXPServer(mockConfig);
  });

  describe('Component Registry Integration', () => {
    it('should register and retrieve React component', () => {
      registry.add(mockReactComponent);
      
      const retrieved = registry.get('TestReactComponent');
      expect(retrieved).toBeDefined();
      expect(retrieved?.framework).toBe('react');
      expect(retrieved?.name).toBe('TestReactComponent');
    });

    it('should register and retrieve Vue component', () => {
      registry.add(mockVueComponent);
      
      const retrieved = registry.get('TestVueComponent');
      expect(retrieved).toBeDefined();
      expect(retrieved?.framework).toBe('vue');
      expect(retrieved?.name).toBe('TestVueComponent');
    });

    it('should list all registered components', () => {
      registry.add(mockReactComponent);
      registry.add(mockVueComponent);
      
      const components = registry.getAll();
      expect(components).toHaveLength(2);
      expect(components.map(c => c.name)).toContain('TestReactComponent');
      expect(components.map(c => c.name)).toContain('TestVueComponent');
    });

    it('should validate component definitions', () => {
      const invalidComponent = {
        ...mockReactComponent,
        name: '', // Invalid name
        framework: 'invalid' as any
      };
      
      expect(() => registry.add(invalidComponent)).toThrow();
    });

    it('should check origin permissions', () => {
      registry.add(mockReactComponent);
      
      const isAllowed = registry.isOriginAllowed('TestReactComponent', 'http://localhost:3000');
      expect(isAllowed).toBe(true); // '*' allows all origins
    });
  });

  describe('Component Rendering Integration', () => {
    beforeEach(() => {
      registry.add(mockReactComponent);
      registry.add(mockVueComponent);
    });

    it('should render React component', async () => {
      const renderResult = await renderer.render({
        componentName: 'TestReactComponent',
        props: {
          title: 'Test Title',
          count: 5
        }
      });
      
      expect(renderResult).toBeDefined();
      expect(renderResult.html).toBeDefined();
      expect(renderResult.bundleUrl).toBeDefined();
      expect(renderResult.context.componentId).toBeDefined();
    });

    it('should render Vue component', async () => {
      const renderResult = await renderer.render({
        componentName: 'TestVueComponent',
        props: {
          message: 'Hello Vue'
        }
      });
      
      expect(renderResult).toBeDefined();
      expect(renderResult.html).toBeDefined();
      expect(renderResult.bundleUrl).toBeDefined();
    });

    it('should handle rendering errors gracefully', async () => {
      await expect(renderer.render({
        componentName: 'NonExistentComponent',
        props: {}
      })).rejects.toThrow();
    });

    it('should generate complete HTML page', async () => {
      const renderResult = await renderer.render({
        componentName: 'TestReactComponent',
        props: { title: 'Page Test' }
      });
      
      const page = renderer.generatePage(renderResult, {
        title: 'Test Page',
        meta: { description: 'Test component page' }
      });
      
      expect(page).toContain('<!DOCTYPE html>');
      expect(page).toContain('Test Page');
      expect(page).toContain('ixp-sdk.js');
    });
  });

  describe('End-to-End Component Lifecycle', () => {
    it('should complete full component lifecycle', async () => {
      // 1. Register component
      registry.add(mockReactComponent);
      expect(registry.get('TestReactComponent')).toBeDefined();
      
      // 2. Render component
      const renderResult = await renderer.render({
        componentName: 'TestReactComponent',
        props: { title: 'Lifecycle Test' }
      });
      
      expect(renderResult.html).toBeDefined();
      expect(renderResult.bundleUrl).toBeDefined();
      expect(renderResult.performance.renderTime).toBeGreaterThanOrEqual(0);
      
      // 3. Generate complete page
      const page = renderer.generatePage(renderResult);
      expect(page).toContain('Lifecycle Test');
    });

    it('should handle multiple components in registry', () => {
      registry.add(mockReactComponent);
      registry.add(mockVueComponent);
      
      const allComponents = registry.getAll();
      expect(allComponents).toHaveLength(2);
      
      // Verify both components are accessible
      expect(registry.get('TestReactComponent')).toBeDefined();
      expect(registry.get('TestVueComponent')).toBeDefined();
    });
  });
});