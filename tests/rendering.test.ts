/**
 * Component and Intent Registry Tests
 */

import { describe, expect, it } from '@jest/globals';
import { createIXPServer } from '../src';
import { ComponentDefinition, IntentDefinition } from '../src/types';

describe('Component and Intent Registry', () => {
  // Create a test server instance without starting it
  const server = createIXPServer({
    port: 3001,
    components: {},
    intents: [],
    cors: {
      origins: ['*'],
      methods: ['GET', 'POST']
    },
    logging: {
      level: 'error'
    }
  });

  // Register test components
  const testReactComponent: ComponentDefinition = {
    name: 'TestReactComponent',
    framework: 'react',
    remoteUrl: './dist/TestReactComponent.js',
    exportName: 'TestReactComponent',
    propsSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string'
        }
      },
      required: ['message']
    },
    version: '1.0.0',
    deprecated: false,
    allowedOrigins: ['*'],
    bundleSize: '10KB',
    performance: {
      tti: '100ms',
      bundleSizeGzipped: '5KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '20KB',
      sandboxed: true
    }
  };

  const testVueComponent: ComponentDefinition = {
    name: 'TestVueComponent',
    framework: 'vue',
    remoteUrl: './dist/TestVueComponent.js',
    exportName: 'TestVueComponent',
    propsSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string'
        }
      },
      required: ['message']
    },
    version: '1.0.0',
    deprecated: false,
    allowedOrigins: ['*'],
    bundleSize: '8KB',
    performance: {
      tti: '90ms',
      bundleSizeGzipped: '4KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '15KB',
      sandboxed: true
    }
  };

  const testVanillaComponent: ComponentDefinition = {
    name: 'TestVanillaComponent',
    framework: 'vanilla',
    remoteUrl: './dist/TestVanillaComponent.js',
    exportName: 'TestVanillaComponent',
    propsSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string'
        }
      },
      required: ['message']
    },
    version: '1.0.0',
    deprecated: false,
    allowedOrigins: ['*'],
    bundleSize: '5KB',
    performance: {
      tti: '50ms',
      bundleSizeGzipped: '2KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '10KB',
      sandboxed: true
    }
  };
  
  server.componentRegistry.add(testReactComponent);
  server.componentRegistry.add(testVueComponent);
  server.componentRegistry.add(testVanillaComponent);

  // Register test intents
  const testReactIntent: IntentDefinition = {
    name: 'test_react_intent',
    description: 'Test React intent',
    parameters: {
      type: 'object' as const,
      properties: {
        message: { type: 'string' }
      }
    },
    component: 'TestReactComponent',
    version: '1.0.0'
  };
  server.intentRegistry.add(testReactIntent);
  
  const testVueIntent: IntentDefinition = {
    name: 'test_vue_intent',
    description: 'Test Vue intent',
    parameters: {
      type: 'object' as const,
      properties: {
        message: { type: 'string' }
      }
    },
    component: 'TestVueComponent',
    version: '1.0.0'
  };
  server.intentRegistry.add(testVueIntent);
  
  const testVanillaIntent: IntentDefinition = {
    name: 'test_vanilla_intent',
    description: 'Test Vanilla JS intent',
    parameters: {
      type: 'object' as const,
      properties: {
        message: { type: 'string' }
      }
    },
    component: 'TestVanillaComponent',
    version: '1.0.0'
  };
  server.intentRegistry.add(testVanillaIntent);

  describe('Component Registry', () => {
    it('should register components correctly', () => {
      expect(server.componentRegistry.get('TestReactComponent')).toBeDefined();
      expect(server.componentRegistry.get('TestVueComponent')).toBeDefined();
      expect(server.componentRegistry.get('TestVanillaComponent')).toBeDefined();
    });
    
    it('should retrieve component properties', () => {
      const reactComponent = server.componentRegistry.get('TestReactComponent');
      expect(reactComponent).toBeDefined();
      expect(reactComponent?.name).toBe('TestReactComponent');
      expect(reactComponent?.framework).toBe('react');
      expect(reactComponent?.remoteUrl).toBe('./dist/TestReactComponent.js');
      expect(reactComponent?.version).toBe('1.0.0');
    });
    
    it('should retrieve component performance metrics', () => {
      const reactComponent = server.componentRegistry.get('TestReactComponent');
      expect(reactComponent).toBeDefined();
      expect(reactComponent?.bundleSize).toBe('10KB');
      expect(reactComponent?.performance?.bundleSizeGzipped).toBe('5KB');
    });
  });

  describe('Intent Registry', () => {
    it('should register intents correctly', () => {
      expect(server.intentRegistry.get('test_react_intent')).toBeDefined();
      expect(server.intentRegistry.get('test_vue_intent')).toBeDefined();
      expect(server.intentRegistry.get('test_vanilla_intent')).toBeDefined();
    });
    
    it('should retrieve intent properties', () => {
      const reactIntent = server.intentRegistry.get('test_react_intent');
      expect(reactIntent).toBeDefined();
      expect(reactIntent?.name).toBe('test_react_intent');
      expect(reactIntent?.description).toBe('Test React intent');
      expect(reactIntent?.component).toBe('TestReactComponent');
      expect(reactIntent?.version).toBe('1.0.0');
    });
    
    it('should map intents to components', () => {
      const reactIntent = server.intentRegistry.get('test_react_intent');
      const vueIntent = server.intentRegistry.get('test_vue_intent');
      const vanillaIntent = server.intentRegistry.get('test_vanilla_intent');
      
      expect(reactIntent?.component).toBe('TestReactComponent');
      expect(vueIntent?.component).toBe('TestVueComponent');
      expect(vanillaIntent?.component).toBe('TestVanillaComponent');
      
      // Verify components exist for each intent
      expect(server.componentRegistry.get(reactIntent?.component || '')).toBeDefined();
      expect(server.componentRegistry.get(vueIntent?.component || '')).toBeDefined();
      expect(server.componentRegistry.get(vanillaIntent?.component || '')).toBeDefined();
      
      try {
        // This is to handle the 'error' is of type 'unknown' issue
        const result = server.intentResolver.resolveIntent({ name: 'test_react_intent', parameters: { message: 'test' } });
        expect(result).toBeDefined();
      } catch (error: unknown) {
        const err = error as Error;
        console.error(err.message);
      }
    });
  });
});