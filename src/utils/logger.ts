/**
 * Logger utility for structured logging
 */
export class Logger {
  private level: 'error' | 'warn' | 'info' | 'debug';
  private format: 'json' | 'text';
  private context: Record<string, any> = {};

  private readonly levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  constructor(config?: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    format?: 'json' | 'text';
    context?: Record<string, any>;
  }) {
    this.level = config?.level || 'info';
    this.format = config?.format || 'text';
    this.context = config?.context || {};
  }

  /**
   * Log error message
   */
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  /**
   * Core logging method
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug', message: string, meta?: any): void {
    // Check if this level should be logged
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(meta && typeof meta === 'object' ? meta : { meta })
    };

    if (this.format === 'json') {
      const output = JSON.stringify(logEntry);
      this.output(level, output);
    } else {
      const metaStr = meta ? ` ${this.formatMeta(meta)}` : '';
      const contextStr = Object.keys(this.context).length > 0 ? ` ${this.formatMeta(this.context)}` : '';
      const output = `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${metaStr}`;
      this.output(level, output);
    }
  }

  /**
   * Format metadata for text output
   */
  private formatMeta(meta: any): string {
    if (typeof meta === 'string') {
      return meta;
    }
    
    if (meta instanceof Error) {
      return `Error: ${meta.message}${meta.stack ? '\n' + meta.stack : ''}`;
    }
    
    try {
      return JSON.stringify(meta);
    } catch {
      return String(meta);
    }
  }

  /**
   * Output log message to appropriate stream
   */
  private output(level: string, message: string): void {
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    return new Logger({
      level: this.level,
      format: this.format,
      context: { ...this.context, ...context }
    });
  }

  /**
   * Set log level
   */
  setLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.level = level;
  }

  /**
   * Set log format
   */
  setFormat(format: 'json' | 'text'): void {
    this.format = format;
  }

  /**
   * Add context to all future log messages
   */
  addContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear all context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.level;
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Log with custom level and additional options
   */
  logWithLevel(level: 'error' | 'warn' | 'info' | 'debug', message: string, meta?: any): void {
    this.log(level, message, meta);
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${label}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${label}`, { duration: `${duration}ms`, error });
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(label: string, fn: () => T): T {
    const start = Date.now();
    this.debug(`Starting ${label}`);
    
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.info(`Completed ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${label}`, { duration: `${duration}ms`, error });
      throw error;
    }
  }
}

/**
 * Create a default logger instance
 */
export const defaultLogger = new Logger();

/**
 * Create logger with specific configuration
 */
export function createLogger(config?: {
  level?: 'error' | 'warn' | 'info' | 'debug';
  format?: 'json' | 'text';
  context?: Record<string, any>;
}): Logger {
  return new Logger(config);
}