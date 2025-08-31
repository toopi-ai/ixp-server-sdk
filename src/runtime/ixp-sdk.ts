/**
 * IXP SDK Runtime - TypeScript Interface
 * Provides runtime functionality for IXP components
 */

import type { IXPTheme, UseThemeReturn, ThemeContextValue } from '../types/index.js';

// Global IXP context interface
interface IXPContext {
  apiBase: string;
  theme: IXPTheme | null;
  availableThemes: IXPTheme[];
  componentId: string | null;
  intentId: string | null;
  listeners: Map<string, Function[]>;
  config: any;
  initialized: boolean;
}

// Default theme based on architecture document
const defaultTheme: IXPTheme = {
  name: 'default',
  version: '1.0.0',
  mode: 'light',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    background: {
      default: '#ffffff',
      paper: '#f8fafc',
      elevated: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#cbd5e1'
    },
    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
      focus: '#2563eb'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  components: {
    button: {
      base: {
        borderRadius: '8px',
        fontWeight: 500,
        transition: 'all 0.2s ease'
      },
      variants: {
        primary: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#1d4ed8' }
        },
        secondary: {
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          '&:hover': { backgroundColor: '#e2e8f0' }
        }
      },
      sizes: {
        sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
        md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
        lg: { padding: '1rem 2rem', fontSize: '1.125rem' }
      },
      states: {
        disabled: { opacity: 0.5, cursor: 'not-allowed' }
      }
    },
    card: {
      base: {
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff'
      },
      variants: {},
      sizes: {},
      states: {}
    },
    input: {
      base: {
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem',
        fontSize: '1rem'
      },
      variants: {},
      sizes: {},
      states: {
        focus: { borderColor: '#2563eb', outline: 'none' }
      }
    },
    modal: {
      base: {
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
      },
      variants: {},
      sizes: {},
      states: {}
    }
  }
};

// Global IXP context
let ixpContext: IXPContext = {
  apiBase: '',
  theme: defaultTheme,
  availableThemes: [defaultTheme],
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
    if (options.theme) {
      if (Array.isArray(options.theme)) {
        ixpContext.availableThemes = options.theme;
        ixpContext.theme = options.theme[0] || defaultTheme;
      } else {
        ixpContext.theme = { ...defaultTheme, ...options.theme };
      }
    }
    
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
 * Get the current theme configuration with enhanced functionality
 */
export function useTheme(): UseThemeReturn {
  const theme = ixpContext.theme || defaultTheme;
  
  return {
    theme,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    breakpoints: theme.breakpoints,
    components: theme.components,
    mode: theme.mode,
    setTheme: (newTheme: IXPTheme | string) => {
      if (typeof newTheme === 'string') {
        const foundTheme = ixpContext.availableThemes.find(t => t.name === newTheme);
        if (foundTheme) {
          ixpContext.theme = foundTheme;
          emit('theme:changed', foundTheme);
        }
      } else {
        ixpContext.theme = newTheme;
        emit('theme:changed', newTheme);
      }
    },
    toggleMode: () => {
      if (ixpContext.theme) {
        const newMode: 'light' | 'dark' = ixpContext.theme.mode === 'light' ? 'dark' : 'light';
        const updatedTheme: IXPTheme = { ...ixpContext.theme, mode: newMode };
        ixpContext.theme = updatedTheme;
        emit('theme:mode:changed', newMode);
      }
    },
    css: (styles: Record<string, any>) => {
      return Object.entries(styles)
        .map(([property, value]) => `${property}: ${value}`)
        .join('; ');
    },
    className: (styles: Record<string, any>) => {
      // Simple CSS-in-JS style generation for component styling
      const className = `ixp-${Math.random().toString(36).substr(2, 9)}`;
      const cssText = Object.entries(styles)
        .map(([property, value]) => `${property}: ${value}`)
        .join('; ');
      
      // Inject styles into document head if in browser
      if (typeof document !== 'undefined') {
        const styleElement = document.createElement('style');
        styleElement.textContent = `.${className} { ${cssText} }`;
        document.head.appendChild(styleElement);
      }
      
      return className;
    }
  };
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
/**
 * Set available themes for the application
 */
export function setAvailableThemes(themes: IXPTheme[]): void {
  ixpContext.availableThemes = themes;
  if (!ixpContext.theme && themes.length > 0) {
    ixpContext.theme = themes[0] || null;
  }
}

/**
 * Get all available themes
 */
export function getAvailableThemes(): IXPTheme[] {
  return ixpContext.availableThemes;
}

/**
 * Create a dark mode variant of a theme
 */
export function createDarkTheme(baseTheme: IXPTheme): IXPTheme {
  return {
    ...baseTheme,
    name: `${baseTheme.name}-dark`,
    mode: 'dark',
    colors: {
      ...baseTheme.colors,
      background: {
        default: '#0f172a',
        paper: '#1e293b',
        elevated: '#334155'
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        disabled: '#64748b'
      },
      border: {
        default: '#334155',
        light: '#475569',
        focus: '#3b82f6'
      }
    }
  };
}

/**
 * Apply theme to component styles
 */
export function applyTheme(componentName: string, variant?: string, size?: string): Record<string, any> {
  const theme = ixpContext.theme || defaultTheme;
  const componentTheme = theme.components[componentName];
  
  if (!componentTheme) {
    return {};
  }
  
  let styles = { ...componentTheme.base };
  
  if (variant && componentTheme.variants[variant]) {
    styles = { ...styles, ...componentTheme.variants[variant] };
  }
  
  if (size && componentTheme.sizes[size]) {
    styles = { ...styles, ...componentTheme.sizes[size] };
  }
  
  return styles;
}

export default {
  initialize,
  notify,
  nextStep,
  fetchData,
  useTheme,
  setAvailableThemes,
  getAvailableThemes,
  createDarkTheme,
  applyTheme,
  getConfig,
  isInitialized,
  getContext,
  subscribe,
  emit,
  reportMetrics,
  log
};
