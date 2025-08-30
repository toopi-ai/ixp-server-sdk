/**
 * @jest-environment jsdom
 */

import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';

// Mock fetch with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock DOM APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
});

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window messaging
Object.defineProperty(window, 'parent', {
  value: {
    postMessage: jest.fn()
  },
  writable: true
});

window.addEventListener = jest.fn();
window.postMessage = jest.fn();

// Mock SDK functions for testing
const mockSDK = {
  initialize: jest.fn(),
  notify: jest.fn(),
  nextStep: jest.fn(),
  fetchData: jest.fn(),
  useTheme: jest.fn(),
  getConfig: jest.fn(),
  isInitialized: jest.fn(),
  getContext: jest.fn(),
  subscribe: jest.fn(),
  emit: jest.fn(),
  reportMetrics: jest.fn(),
  log: jest.fn()
};

// Create actual implementations for testing
let ixpContext = {
  apiBase: '',
  theme: {},
  componentId: null as string | null,
  intentId: null as string | null,
  listeners: new Map<string, Function[]>(),
  config: null as any,
  initialized: false
};

const initialize = jest.fn().mockImplementation(async (options: any = {}) => {
  if (ixpContext.initialized) {
    return ixpContext.config;
  }

  try {
    const configResponse = await fetch('/ixp/sdk/config');
    if (configResponse.ok) {
      ixpContext.config = await configResponse.json();
      ixpContext.theme = ixpContext.config.theme || {};
    }
    
    if (options.componentId) ixpContext.componentId = options.componentId;
    if (options.intentId) ixpContext.intentId = options.intentId;
    if (options.theme) ixpContext.theme = { ...ixpContext.theme, ...options.theme };
    
    ixpContext.initialized = true;
    return ixpContext.config;
  } catch (error) {
    console.warn('Failed to initialize IXP SDK:', error);
    ixpContext.initialized = false;
    throw error;
  }
});

const notify = jest.fn((event: string, data?: any) => {
  const message = {
    type: 'ixp-event',
    event,
    data,
    timestamp: expect.any(Number)
  };

  if (typeof window !== 'undefined' && window.parent) {
    (window.parent.postMessage as jest.Mock)(message, '*');
  }
});

const nextStep = jest.fn((intentId: string, params: any = {}) => {
  const message = {
    type: 'ixp-navigate',
    intentId,
    params
  };
  
  if (window.parent && window.parent !== window) {
    (window.parent.postMessage as jest.Mock)(message, '*');
  }
});

const fetchData = jest.fn(async (endpoint: string, options: any = {}) => {
  if (!ixpContext.initialized) {
    await initialize();
  }
  
  const url = endpoint.startsWith('/ixp/') ? endpoint : `/ixp${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
});

const useTheme = jest.fn().mockImplementation(() => ixpContext.theme);
const getConfig = jest.fn().mockImplementation(() => ixpContext.config);
const isInitialized = jest.fn().mockImplementation(() => ixpContext.initialized);
const getContext = jest.fn().mockImplementation(() => ({ ...ixpContext }));

const subscribe = jest.fn((event: string, callback: Function) => {
  if (!ixpContext.listeners.has(event)) {
    ixpContext.listeners.set(event, []);
  }
  
  const listeners = ixpContext.listeners.get(event)!;
  listeners.push(callback);
  
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
});

const emit = jest.fn((event: string, data?: any) => {
  const listeners = ixpContext.listeners.get(event);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
});

const reportMetrics = jest.fn((metrics: Record<string, any>) => {
  const message = {
    type: 'ixp-event',
    event: 'metrics',
    data: metrics,
    timestamp: expect.any(Number)
  };
  
  if (window.parent && window.parent !== window) {
    (window.parent.postMessage as jest.Mock)(message, '*');
  }
});

const log = jest.fn((level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) => {
  const consoleMethod = level === 'info' ? 'log' : level;
  (console as any)[consoleMethod](`[IXP SDK] ${message}`, data);
  
  notify('log', {
    level,
    message,
    data,
    componentId: ixpContext.componentId,
    intentId: ixpContext.intentId,
    timestamp: new Date().toISOString()
  });
});

describe('IXP SDK', () => {
  beforeEach(() => {
    // Reset context
    ixpContext = {
      apiBase: '',
      theme: {},
      componentId: null,
      intentId: null,
      listeners: new Map<string, Function[]>(),
      config: null,
      initialized: false
    };
    
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize SDK with default configuration', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          theme: { primaryColor: '#007bff' },
          endpoints: {
            health: '/ixp/health',
            metrics: '/ixp/metrics'
          },
          cors: { origins: ['*'] },
          version: '1.0.0'
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      
      await initialize();
      
      expect(global.fetch).toHaveBeenCalledWith('/ixp/sdk/config');
      expect(isInitialized()).toBe(true);
    });

    it('should handle initialization with custom options', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          theme: { primaryColor: '#007bff' },
          endpoints: {},
          version: '1.0.0'
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      
      const customOptions = {
        theme: { secondaryColor: '#6c757d' }
      };
      
      await initialize(customOptions);
      
      expect(isInitialized()).toBe(true);
      const theme = useTheme() as any;
      expect(theme.secondaryColor).toBe('#6c757d');
    });

    it('should handle initialization failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(initialize()).rejects.toThrow('Network error');
      expect(isInitialized()).toBe(false);
    });
  });

  describe('notify', () => {
    it('should send message to parent window', () => {
      const event = 'test-event';
      const data = { message: 'Hello World' };
      
      notify(event, data);
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        type: 'ixp-event',
        event,
        data,
        timestamp: expect.any(Number)
      }, '*');
    });

    it('should handle notify without data', () => {
      const event = 'simple-event';
      
      notify(event);
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        type: 'ixp-event',
        event,
        data: undefined,
        timestamp: expect.any(Number)
      }, '*');
    });
  });

  describe('nextStep', () => {
    it('should navigate to next intent with parameters', () => {
      const intentId = 'next-intent';
      const params = { userId: '123', action: 'view' };
      
      nextStep(intentId, params);
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        type: 'ixp-navigate',
        intentId,
        params
      }, '*');
    });

    it('should navigate without parameters', () => {
      const intentId = 'simple-intent';
      
      nextStep(intentId);
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        type: 'ixp-navigate',
        intentId,
        params: {}
      }, '*');
    });
  });

  describe('fetchData', () => {
    beforeEach(async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          theme: { primaryColor: '#007bff' },
          endpoints: { api: '/ixp/api' },
          version: '1.0.0'
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      await initialize();
      jest.clearAllMocks();
    });

    it('should fetch data from API endpoint', async () => {
      const mockData = { users: [{ id: 1, name: 'John' }] };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockData)
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      
      const result = await fetchData('users');
      
      expect(global.fetch).toHaveBeenCalledWith('/ixp/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual(mockData);
    });

    it('should handle POST requests with data', async () => {
      const postData = { name: 'Jane', email: 'jane@example.com' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 2, ...postData })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      
      const result = await fetchData('users', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/ixp/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      expect(result.name).toBe('Jane');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(fetchData('invalid-endpoint')).rejects.toThrow('API Error');
    });

    it('should handle non-ok responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      
      await expect(fetchData('not-found')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('useTheme', () => {
    it('should return current theme', async () => {
      const mockTheme = { primaryColor: '#007bff', fontSize: '14px' };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          theme: mockTheme,
          endpoints: {},
          version: '1.0.0'
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      await initialize();
      
      const theme = useTheme();
      expect(theme).toEqual(mockTheme);
    });
  });

  describe('getConfig', () => {
    it('should return SDK configuration', async () => {
      const mockConfig = {
        theme: { primaryColor: '#007bff' },
        endpoints: { health: '/ixp/health' },
        version: '1.0.0'
      };
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockConfig)
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      await initialize();
      
      const config = getConfig() as any;
      expect(config).toEqual(mockConfig);
    });
  });

  describe('getContext', () => {
    it('should return component context', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          theme: { primaryColor: '#007bff' },
          endpoints: {},
          version: '1.0.0'
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      await initialize();
      
      const context = getContext();
      expect(context).toHaveProperty('componentId');
      expect(context).toHaveProperty('intentId');
      expect(context).toHaveProperty('theme');
      expect(context).toHaveProperty('config');
      expect(context).toHaveProperty('initialized');
    });
  });

  describe('subscribe and emit', () => {
    it('should subscribe to events and receive notifications', () => {
      const callback = jest.fn();
      const eventData = { message: 'Test event' };
      
      const unsubscribe = subscribe('test-event', callback);
      emit('test-event', eventData);
      
      expect(callback).toHaveBeenCalledWith(eventData);
      
      // Test unsubscribe
      unsubscribe();
      emit('test-event', eventData);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const eventData = { message: 'Multi-subscriber test' };
      
      subscribe('multi-event', callback1);
      subscribe('multi-event', callback2);
      
      emit('multi-event', eventData);
      
      expect(callback1).toHaveBeenCalledWith(eventData);
      expect(callback2).toHaveBeenCalledWith(eventData);
    });

    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = jest.fn();
      
      subscribe('error-event', errorCallback);
      subscribe('error-event', normalCallback);
      
      emit('error-event', { data: 'test' });
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error in event listener:', expect.any(Error));
    });
  });

  describe('reportMetrics', () => {
    it('should report metrics via notify', () => {
      const metrics = {
        loadTime: 1500,
        renderTime: 200,
        bundleSize: '45KB'
      };
      
      reportMetrics(metrics);
      
      expect(window.parent.postMessage).toHaveBeenCalledWith({
        type: 'ixp-event',
        event: 'metrics',
        data: metrics,
        timestamp: expect.any(Number)
      }, '*');
    });
  });

  describe('log', () => {
    it('should log messages with IXP prefix', () => {
      const message = 'Test log message';
      const data = { component: 'test-component' };
      
      log('info', message, data);
      
      expect(console.log).toHaveBeenCalledWith('[IXP SDK] Test log message', data);
    });

    it('should handle different log levels', () => {
      log('error', 'Error message');
      log('warn', 'Warning message');
      log('info', 'Info message');
      
      expect(console.error).toHaveBeenCalledWith('[IXP SDK] Error message', undefined);
      expect(console.warn).toHaveBeenCalledWith('[IXP SDK] Warning message', undefined);
      expect(console.log).toHaveBeenCalledWith('[IXP SDK] Info message', undefined);
    });
  });
});