import type { IXPError as IIXPError, IXPErrorResponse } from '../types/index';

/**
 * Custom IXP Error class with structured error information
 */
export class IXPError extends Error implements IIXPError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'IXPError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.details = details;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IXPError.prototype);
  }

  /**
   * Convert error to API response format
   */
  toResponse(): IXPErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
        details: this.details
      }
    };
  }

  /**
   * Create error from unknown error object
   */
  static fromError(error: unknown, defaultCode: string = 'INTERNAL_ERROR'): IXPError {
    if (error instanceof IXPError) {
      return error;
    }

    if (error instanceof Error) {
      return new IXPError(error.message, defaultCode, 500, {
        originalError: error.name,
        stack: error.stack
      });
    }

    return new IXPError(
      typeof error === 'string' ? error : 'An unknown error occurred',
      defaultCode,
      500,
      { originalError: error }
    );
  }
}

/**
 * Predefined error factory functions
 */
export const ErrorFactory = {
  /**
   * Intent not found error
   */
  intentNotFound(intentName: string): IXPError {
    return new IXPError(
      `Intent '${intentName}' not found`,
      'INTENT_NOT_SUPPORTED',
      404,
      { intentName }
    );
  },

  /**
   * Component not found error
   */
  componentNotFound(componentName: string): IXPError {
    return new IXPError(
      `Component '${componentName}' not found`,
      'COMPONENT_NOT_FOUND',
      404,
      { componentName }
    );
  },

  /**
   * Invalid request error
   */
  invalidRequest(message: string, details?: any): IXPError {
    return new IXPError(
      message,
      'INVALID_REQUEST',
      400,
      details
    );
  },

  /**
   * Parameter validation error
   */
  parameterValidation(errors: string[], details?: any): IXPError {
    return new IXPError(
      `Parameter validation failed: ${errors.join(', ')}`,
      'PARAMETER_VALIDATION_FAILED',
      400,
      { validationErrors: errors, ...details }
    );
  },

  /**
   * Component validation error
   */
  componentValidation(componentName: string, errors: string[]): IXPError {
    return new IXPError(
      `Component '${componentName}' validation failed: ${errors.join(', ')}`,
      'COMPONENT_VALIDATION_FAILED',
      400,
      { componentName, validationErrors: errors }
    );
  },

  /**
   * Configuration error
   */
  configuration(message: string, details?: any): IXPError {
    return new IXPError(
      `Configuration error: ${message}`,
      'CONFIGURATION_ERROR',
      500,
      details
    );
  },

  /**
   * Rate limit exceeded error
   */
  rateLimitExceeded(limit: number, windowMs: number): IXPError {
    return new IXPError(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      'RATE_LIMIT_EXCEEDED',
      429,
      { limit, windowMs }
    );
  },

  /**
   * Origin not allowed error
   */
  originNotAllowed(origin: string, componentName?: string): IXPError {
    const message = componentName
      ? `Origin '${origin}' not allowed for component '${componentName}'`
      : `Origin '${origin}' not allowed`;
    
    return new IXPError(
      message,
      'ORIGIN_NOT_ALLOWED',
      403,
      { origin, componentName }
    );
  },

  /**
   * Plugin error
   */
  plugin(pluginName: string, message: string, details?: any): IXPError {
    return new IXPError(
      `Plugin '${pluginName}' error: ${message}`,
      'PLUGIN_ERROR',
      500,
      { pluginName, ...details }
    );
  },

  /**
   * Data provider error
   */
  dataProvider(message: string, details?: any): IXPError {
    return new IXPError(
      `Data provider error: ${message}`,
      'DATA_PROVIDER_ERROR',
      500,
      details
    );
  },

  /**
   * File system error
   */
  fileSystem(operation: string, path: string, originalError?: Error): IXPError {
    return new IXPError(
      `File system error during ${operation}: ${path}`,
      'FILE_SYSTEM_ERROR',
      500,
      {
        operation,
        path,
        originalError: originalError?.message
      }
    );
  },

  /**
   * Network error
   */
  network(message: string, details?: any): IXPError {
    return new IXPError(
      `Network error: ${message}`,
      'NETWORK_ERROR',
      503,
      details
    );
  },

  /**
   * Timeout error
   */
  timeout(operation: string, timeoutMs: number): IXPError {
    return new IXPError(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT_ERROR',
      408,
      { operation, timeoutMs }
    );
  }
};

/**
 * Error code constants
 */
export const ErrorCodes = {
  // Client errors (4xx)
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTENT_NOT_SUPPORTED: 'INTENT_NOT_SUPPORTED',
  COMPONENT_NOT_FOUND: 'COMPONENT_NOT_FOUND',
  PARAMETER_VALIDATION_FAILED: 'PARAMETER_VALIDATION_FAILED',
  COMPONENT_VALIDATION_FAILED: 'COMPONENT_VALIDATION_FAILED',
  ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  DATA_PROVIDER_ERROR: 'DATA_PROVIDER_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

/**
 * Check if error is an IXP error
 */
export function isIXPError(error: unknown): error is IXPError {
  return error instanceof IXPError;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isIXPError(error)) {
    return error.statusCode;
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Convert any error to IXP error response format
 */
export function toErrorResponse(error: unknown): IXPErrorResponse {
  if (isIXPError(error)) {
    return error.toResponse();
  }

  const ixpError = IXPError.fromError(error);
  return ixpError.toResponse();
}