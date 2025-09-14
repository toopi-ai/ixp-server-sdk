/**
 * IXP SDK Runtime - TypeScript Interface
 * Provides runtime functionality for IXP components
 */
import type { IXPTheme, UseThemeReturn } from '../types/index.js';
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
/**
 * Initialize the IXP SDK with server configuration
 */
export declare function initialize(options?: any): Promise<any>;
/**
 * Send notification to parent window
 */
export declare function notify(type: string, data?: any): void;
/**
 * Trigger next step in intent flow
 */
export declare function nextStep(stepData?: any): void;
/**
 * Fetch data from the IXP server
 */
export declare function fetchData(endpoint: string, options?: any): Promise<any>;
/**
 * Get the current theme configuration with enhanced functionality
 */
export declare function useTheme(): UseThemeReturn;
/**
 * Get the current SDK configuration
 */
export declare function getConfig(): any;
/**
 * Check if the SDK is initialized
 */
export declare function isInitialized(): boolean;
/**
 * Get the current context
 */
export declare function getContext(): IXPContext;
/**
 * Subscribe to events
 */
export declare function subscribe(event: string, callback: Function): () => void;
/**
 * Emit events
 */
export declare function emit(event: string, data?: any): void;
/**
 * Report metrics to the server
 */
export declare function reportMetrics(metrics: Record<string, any>): void;
/**
 * Log messages with IXP context
 */
export declare function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any): void;
/**
 * Set available themes for the application
 */
export declare function setAvailableThemes(themes: IXPTheme[]): void;
/**
 * Get all available themes
 */
export declare function getAvailableThemes(): IXPTheme[];
/**
 * Create a dark mode variant of a theme
 */
export declare function createDarkTheme(baseTheme: IXPTheme): IXPTheme;
/**
 * Apply theme to component styles
 */
export declare function applyTheme(componentName: string, variant?: string, size?: string): Record<string, any>;
declare const _default: {
    initialize: typeof initialize;
    notify: typeof notify;
    nextStep: typeof nextStep;
    fetchData: typeof fetchData;
    useTheme: typeof useTheme;
    setAvailableThemes: typeof setAvailableThemes;
    getAvailableThemes: typeof getAvailableThemes;
    createDarkTheme: typeof createDarkTheme;
    applyTheme: typeof applyTheme;
    getConfig: typeof getConfig;
    isInitialized: typeof isInitialized;
    getContext: typeof getContext;
    subscribe: typeof subscribe;
    emit: typeof emit;
    reportMetrics: typeof reportMetrics;
    log: typeof log;
};
export default _default;
//# sourceMappingURL=ixp-sdk.d.ts.map