/**
 * IXP SDK Runtime
 * Provides runtime functionality for IXP components
 */

// Global IXP context
let ixpContext = {
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
 * @param {object} options - Initialization options
 */
export async function initialize(options = {}) {
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
    return null;
  }
}

/**
 * Notify the parent system of component events
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function notify(event, data) {
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage({
      type: 'ixp-component-event',
      componentId: ixpContext.componentId,
      event,
      data
    }, '*');
  }
}

/**
 * Navigate to the next step in the intent flow
 * @param {string} intentId - Intent ID to navigate to
 * @param {object} params - Parameters for the intent
 */
export function nextStep(intentId, params = {}) {
  notify('navigate', { intentId, params });
}

/**
 * Get the current theme configuration
 * @returns {object} Theme configuration
 */
export function useTheme() {
  return { ...ixpContext.theme };
}

/**
 * Fetch data from the IXP server
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function fetchData(endpoint, options = {}) {
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
        'X-IXP-Component-ID': ixpContext.componentId,
        'X-IXP-Intent-ID': ixpContext.intentId,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    notify('error', { type: 'fetch-error', message: error.message, endpoint });
    throw error;
  }
}

/**
 * Get the current SDK configuration
 * @returns {object|null} SDK configuration
 */
export function getConfig() {
  return ixpContext.config;
}

/**
 * Check if the SDK is initialized
 * @returns {boolean} Initialization status
 */
export function isInitialized() {
  return ixpContext.initialized;
}

/**
 * Get component context information
 * @returns {object} Context object
 */
export function getContext() {
  return {
    componentId: ixpContext.componentId,
    intentId: ixpContext.intentId,
    theme: ixpContext.theme,
    config: ixpContext.config,
    initialized: ixpContext.initialized
  };
}

/**
 * Subscribe to IXP events
 * @param {string} event - Event name
 * @param {function} callback - Event callback
 * @returns {function} Unsubscribe function
 */
export function subscribe(event, callback) {
  if (!ixpContext.listeners.has(event)) {
    ixpContext.listeners.set(event, new Set());
  }
  
  ixpContext.listeners.get(event).add(callback);
  
  return () => {
    const listeners = ixpContext.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

/**
 * Emit an event to subscribers
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function emit(event, data) {
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
 * Report metrics to the IXP server
 * @param {object} metrics - Metrics data
 */
export function reportMetrics(metrics) {
  notify('metrics', metrics);
}

/**
 * Log a message with IXP context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data
 */
export function log(level, message, data = null) {
  console[level](`[IXP SDK] ${message}`, data);
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