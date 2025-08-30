/**
 * IXP SDK Runtime - TypeScript Interface
 * Provides runtime functionality for IXP components
 */

// Global IXP context interface
interface IXPContext {
  apiBase: string;
  theme: Record<string, any>;
  componentId: string | null;
  intentId: string | null;
  listeners: Map<string, Function[]>;
  config: any;
  initialized: boolean;
}

// Global IXP context
let ixpContext: IXPContext = {
  apiBase: '',
  theme: {},
  componentId: null,
  intentId: null,
  listeners: new Map(),
  config: null,
  initialized: false
};

/**
 * Initialize the IXP SDK with server configuration
 */
export async function initialize(options: any = {}): Promise<any> {
  if (ixpContext.initialized) {
    return ixpContext.config;
  }

  try {
    // Load configuration from server
    const configResponse = await fetch('/ixp/sdk/config');
    if (configResponse.ok) {
      ixpContext.config = await configResponse.json();
      ixpContext.theme = ixpContext.config.theme || {};
    }
    
    // Override with provided options
    if (options.componentId) ixpContext.componentId = options.componentId;
    if (options.intentId) ixpContext.intentId = options.intentId;
    if (options.theme) ixpContext.theme = { ...ixpContext.theme, ...options.theme };
    
    ixpContext.initialized = true;
    return ixpContext.config;
  } catch (error) {
    console.warn('Failed to initialize IXP SDK:', error);
    ixpContext.initialized = true; // Mark as initialized to prevent retries
    throw error;
  }
}

/**
 * Send notification to parent window
 */
export function notify(type: string, data?: any): void {
  const message = {
    type: 'ixp-notification',
    notificationType: type,
    data,
    componentId: ixpContext.componentId,
    intentId: ixpContext.intentId,
    timestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage(message, '*');
  }

  // Emit internal event
  emit('notification', message);
}

/**
 * Trigger next step in intent flow
 */
export function nextStep(stepData?: any): void {
  notify('next-step', stepData);
}

/**
 * Fetch data from the IXP server
 */
export async function fetchData(endpoint: string, options: any = {}): Promise<any> {
  // Ensure SDK is initialized
  if (!ixpContext.initialized) {
    await initialize();
  }
  
  // Build the full URL - endpoint should start with /ixp/
  const url = endpoint.startsWith('/ixp/') ? endpoint : `/ixp${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-IXP-Component-ID': ixpContext.componentId || '',
        'X-IXP-Intent-ID': ixpContext.intentId || '',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    notify('error', { type: 'fetch-error', message: (error as Error).message, endpoint });
    throw error;
  }
}

/**
 * Get theme configuration
 */
export function useTheme(): Record<string, any> {
  return ixpContext.theme;
}

/**
 * Get the current SDK configuration
 */
export function getConfig(): any {
  return ixpContext.config;
}

/**
 * Check if the SDK is initialized
 */
export function isInitialized(): boolean {
  return ixpContext.initialized;
}

/**
 * Get the current context
 */
export function getContext(): IXPContext {
  return {
    ...ixpContext,
    config: ixpContext.config,
    initialized: ixpContext.initialized
  };
}

/**
 * Subscribe to events
 */
export function subscribe(event: string, callback: Function): () => void {
  if (!ixpContext.listeners.has(event)) {
    ixpContext.listeners.set(event, []);
  }
  
  const listeners = ixpContext.listeners.get(event)!;
  listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Emit events
 */
export function emit(event: string, data?: any): void {
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
}

/**
 * Report metrics to the server
 */
export function reportMetrics(metrics: Record<string, any>): void {
  notify('metrics', {
    ...metrics,
    timestamp: new Date().toISOString(),
    componentId: ixpContext.componentId,
    intentId: ixpContext.intentId
  });
}

/**
 * Log messages with IXP context
 */
export function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any): void {
  const logData = {
    level,
    message,
    data,
    componentId: ixpContext.componentId,
    intentId: ixpContext.intentId,
    timestamp: new Date().toISOString()
  };

  // Log to console
  const consoleMethod = level === 'info' ? 'log' : level;
  (console as any)[consoleMethod](`[IXP SDK] ${message}`, data);

  // Send to parent for centralized logging
  notify('log', logData);
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Set up message listener for parent communication
  window.addEventListener('message', (event) => {
    if (event.data.type === 'ixp-context-update') {
      ixpContext.componentId = event.data.componentId;
      ixpContext.intentId = event.data.intentId;
      if (event.data.theme) {
        ixpContext.theme = { ...ixpContext.theme, ...event.data.theme };
      }
      emit('context-updated', ixpContext);
    }
  });
  
  // Auto-initialize
  initialize().catch(error => {
    console.warn('Failed to auto-initialize IXP SDK:', error);
  });
}

// Default export for convenience
export default {
  initialize,
  notify,
  nextStep,
  fetchData,
  useTheme,
  getConfig,
  isInitialized,
  getContext,
  subscribe,
  emit,
  reportMetrics,
  log
};
