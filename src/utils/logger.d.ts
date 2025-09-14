/**
 * Logger utility for structured logging
 */
export declare class Logger {
    private level;
    private format;
    private context;
    private readonly levels;
    constructor(config?: {
        level?: 'error' | 'warn' | 'info' | 'debug';
        format?: 'json' | 'text';
        context?: Record<string, any>;
    });
    /**
     * Log error message
     */
    error(message: string, meta?: any): void;
    /**
     * Log warning message
     */
    warn(message: string, meta?: any): void;
    /**
     * Log info message
     */
    info(message: string, meta?: any): void;
    /**
     * Log debug message
     */
    debug(message: string, meta?: any): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Format metadata for text output
     */
    private formatMeta;
    /**
     * Output log message to appropriate stream
     */
    private output;
    /**
     * Create child logger with additional context
     */
    child(context: Record<string, any>): Logger;
    /**
     * Set log level
     */
    setLevel(level: 'error' | 'warn' | 'info' | 'debug'): void;
    /**
     * Set log format
     */
    setFormat(format: 'json' | 'text'): void;
    /**
     * Add context to all future log messages
     */
    addContext(context: Record<string, any>): void;
    /**
     * Clear all context
     */
    clearContext(): void;
    /**
     * Get current log level
     */
    getLevel(): string;
    /**
     * Check if level is enabled
     */
    isLevelEnabled(level: 'error' | 'warn' | 'info' | 'debug'): boolean;
    /**
     * Log with custom level and additional options
     */
    logWithLevel(level: 'error' | 'warn' | 'info' | 'debug', message: string, meta?: any): void;
    /**
     * Time a function execution
     */
    time<T>(label: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Time a synchronous function execution
     */
    timeSync<T>(label: string, fn: () => T): T;
}
/**
 * Create a default logger instance
 */
export declare const defaultLogger: Logger;
/**
 * Create logger with specific configuration
 */
export declare function createLogger(config?: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    format?: 'json' | 'text';
    context?: Record<string, any>;
}): Logger;
//# sourceMappingURL=logger.d.ts.map