# Error Codes Reference

This document provides a comprehensive reference of all error codes used in the IXP Server SDK.

## Table of Contents

- [Error Code Format](#error-code-format)
- [Server Errors (1000-1999)](#server-errors-1000-1999)
- [Authentication Errors (2000-2999)](#authentication-errors-2000-2999)
- [Authorization Errors (3000-3999)](#authorization-errors-3000-3999)
- [Validation Errors (4000-4999)](#validation-errors-4000-4999)
- [Intent Errors (5000-5999)](#intent-errors-5000-5999)
- [Component Errors (6000-6999)](#component-errors-6000-6999)
- [Plugin Errors (7000-7999)](#plugin-errors-7000-7999)
- [Database Errors (8000-8999)](#database-errors-8000-8999)
- [Network Errors (9000-9999)](#network-errors-9000-9999)
- [Error Handling Best Practices](#error-handling-best-practices)

## Error Code Format

All IXP Server error codes follow a consistent format:

```
IXP_[CATEGORY]_[SPECIFIC_ERROR]
```

- **Category**: Broad error category (SERVER, AUTH, VALIDATION, etc.)
- **Specific Error**: Specific error within the category
- **Numeric Code**: 4-digit numeric identifier

### Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "IXP_VALIDATION_REQUIRED_FIELD",
    "numericCode": 4001,
    "message": "Required field 'query' is missing",
    "details": {
      "field": "query",
      "expectedType": "string",
      "receivedType": "undefined"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Server Errors (1000-1999)

General server and system-level errors.

### 1001 - IXP_SERVER_STARTUP_FAILED
**Message**: Server failed to start
**Cause**: Critical error during server initialization
**Resolution**: Check server configuration and dependencies

```typescript
// Example
try {
  await server.start();
} catch (error) {
  if (error.code === 'IXP_SERVER_STARTUP_FAILED') {
    console.error('Server startup failed:', error.details);
    // Check configuration, database connection, etc.
  }
}
```

### 1002 - IXP_SERVER_SHUTDOWN_ERROR
**Message**: Error occurred during server shutdown
**Cause**: Failed to properly close connections or cleanup resources
**Resolution**: Check for hanging connections or incomplete operations

### 1003 - IXP_SERVER_CONFIGURATION_INVALID
**Message**: Invalid server configuration
**Cause**: Missing or invalid configuration parameters
**Resolution**: Validate configuration against schema

```typescript
// Example configuration validation
const config = {
  port: 'invalid', // Should be number
  database: {
    // Missing required fields
  }
};

// This will throw IXP_SERVER_CONFIGURATION_INVALID
const server = createIXPServer(config);
```

### 1004 - IXP_SERVER_INTERNAL_ERROR
**Message**: Internal server error
**Cause**: Unexpected error in server processing
**Resolution**: Check server logs for detailed error information

### 1005 - IXP_SERVER_OVERLOADED
**Message**: Server is overloaded
**Cause**: Too many concurrent requests or high resource usage
**Resolution**: Implement rate limiting or scale server resources

### 1006 - IXP_SERVER_MAINTENANCE_MODE
**Message**: Server is in maintenance mode
**Cause**: Server is temporarily unavailable for maintenance
**Resolution**: Wait for maintenance to complete

## Authentication Errors (2000-2999)

Errors related to user authentication.

### 2001 - IXP_AUTH_TOKEN_MISSING
**Message**: Authentication token is missing
**Cause**: No authorization header or token provided
**Resolution**: Include valid authorization header

```typescript
// Correct usage
const response = await fetch('/api/intent/user-profile', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### 2002 - IXP_AUTH_TOKEN_INVALID
**Message**: Authentication token is invalid
**Cause**: Token is malformed, expired, or tampered with
**Resolution**: Obtain a new valid token

### 2003 - IXP_AUTH_TOKEN_EXPIRED
**Message**: Authentication token has expired
**Cause**: Token has passed its expiration time
**Resolution**: Refresh the token or re-authenticate

### 2004 - IXP_AUTH_CREDENTIALS_INVALID
**Message**: Invalid credentials provided
**Cause**: Incorrect username/password combination
**Resolution**: Verify credentials and try again

### 2005 - IXP_AUTH_USER_NOT_FOUND
**Message**: User not found
**Cause**: User account does not exist
**Resolution**: Check user identifier or create account

### 2006 - IXP_AUTH_ACCOUNT_LOCKED
**Message**: User account is locked
**Cause**: Account locked due to security policy (e.g., too many failed attempts)
**Resolution**: Wait for lockout period or contact administrator

### 2007 - IXP_AUTH_ACCOUNT_DISABLED
**Message**: User account is disabled
**Cause**: Account has been deactivated
**Resolution**: Contact administrator to reactivate account

### 2008 - IXP_AUTH_SESSION_EXPIRED
**Message**: User session has expired
**Cause**: Session timeout reached
**Resolution**: Re-authenticate to create new session

### 2009 - IXP_AUTH_MFA_REQUIRED
**Message**: Multi-factor authentication required
**Cause**: MFA is enabled but not provided
**Resolution**: Provide valid MFA code

### 2010 - IXP_AUTH_MFA_INVALID
**Message**: Invalid MFA code
**Cause**: Incorrect or expired MFA code
**Resolution**: Generate and use new MFA code

## Authorization Errors (3000-3999)

Errors related to user permissions and access control.

### 3001 - IXP_AUTHZ_INSUFFICIENT_PERMISSIONS
**Message**: Insufficient permissions for this operation
**Cause**: User lacks required role or permission
**Resolution**: Request appropriate permissions or use different account

```typescript
// Example: User needs 'admin' role
if (!user.roles.includes('admin')) {
  throw new IXPError('IXP_AUTHZ_INSUFFICIENT_PERMISSIONS', {
    required: ['admin'],
    current: user.roles
  });
}
```

### 3002 - IXP_AUTHZ_RESOURCE_FORBIDDEN
**Message**: Access to resource is forbidden
**Cause**: User cannot access the requested resource
**Resolution**: Check resource permissions or ownership

### 3003 - IXP_AUTHZ_OPERATION_FORBIDDEN
**Message**: Operation is forbidden
**Cause**: User cannot perform the requested operation
**Resolution**: Check operation permissions

### 3004 - IXP_AUTHZ_RATE_LIMIT_EXCEEDED
**Message**: Rate limit exceeded
**Cause**: Too many requests in time window
**Resolution**: Wait before making more requests

### 3005 - IXP_AUTHZ_QUOTA_EXCEEDED
**Message**: Usage quota exceeded
**Cause**: User has exceeded their usage limits
**Resolution**: Upgrade plan or wait for quota reset

### 3006 - IXP_AUTHZ_IP_BLOCKED
**Message**: IP address is blocked
**Cause**: Request from blocked IP address
**Resolution**: Contact administrator or use different IP

## Validation Errors (4000-4999)

Errors related to input validation and data format.

### 4001 - IXP_VALIDATION_REQUIRED_FIELD
**Message**: Required field is missing
**Cause**: Mandatory field not provided in request
**Resolution**: Include all required fields

```typescript
// Schema validation example
const schema = {
  query: { type: 'string', required: true },
  limit: { type: 'number', required: false, default: 10 }
};

// This will throw IXP_VALIDATION_REQUIRED_FIELD
const params = { limit: 5 }; // Missing 'query'
```

### 4002 - IXP_VALIDATION_INVALID_TYPE
**Message**: Invalid data type
**Cause**: Field has wrong data type
**Resolution**: Provide correct data type

### 4003 - IXP_VALIDATION_INVALID_FORMAT
**Message**: Invalid data format
**Cause**: Data doesn't match expected format (e.g., email, URL)
**Resolution**: Use correct format

### 4004 - IXP_VALIDATION_OUT_OF_RANGE
**Message**: Value is out of allowed range
**Cause**: Numeric value exceeds min/max limits
**Resolution**: Use value within allowed range

### 4005 - IXP_VALIDATION_INVALID_LENGTH
**Message**: Invalid string length
**Cause**: String too short or too long
**Resolution**: Adjust string length to meet requirements

### 4006 - IXP_VALIDATION_INVALID_ENUM
**Message**: Invalid enum value
**Cause**: Value not in allowed enum options
**Resolution**: Use one of the allowed values

```typescript
// Enum validation example
const allowedCategories = ['electronics', 'clothing', 'books'];
if (!allowedCategories.includes(category)) {
  throw new IXPError('IXP_VALIDATION_INVALID_ENUM', {
    field: 'category',
    value: category,
    allowed: allowedCategories
  });
}
```

### 4007 - IXP_VALIDATION_PATTERN_MISMATCH
**Message**: Value doesn't match required pattern
**Cause**: String doesn't match regex pattern
**Resolution**: Format string according to pattern

### 4008 - IXP_VALIDATION_DUPLICATE_VALUE
**Message**: Duplicate value not allowed
**Cause**: Value already exists where uniqueness is required
**Resolution**: Use unique value

### 4009 - IXP_VALIDATION_INVALID_JSON
**Message**: Invalid JSON format
**Cause**: Malformed JSON in request body
**Resolution**: Fix JSON syntax

### 4010 - IXP_VALIDATION_SCHEMA_VIOLATION
**Message**: Data violates schema constraints
**Cause**: Complex validation rule violation
**Resolution**: Check data against schema requirements

## Intent Errors (5000-5999)

Errors related to intent processing and execution.

### 5001 - IXP_INTENT_NOT_FOUND
**Message**: Intent not found
**Cause**: Requested intent is not registered
**Resolution**: Check intent name or register intent

```typescript
// Register intent before using
server.registerIntent({
  name: 'product-search',
  handler: async (params, context) => {
    // Intent implementation
  }
});
```

### 5002 - IXP_INTENT_EXECUTION_FAILED
**Message**: Intent execution failed
**Cause**: Error occurred during intent processing
**Resolution**: Check intent implementation and dependencies

### 5003 - IXP_INTENT_TIMEOUT
**Message**: Intent execution timed out
**Cause**: Intent took too long to execute
**Resolution**: Optimize intent performance or increase timeout

### 5004 - IXP_INTENT_PARAMETER_INVALID
**Message**: Invalid intent parameter
**Cause**: Intent parameter validation failed
**Resolution**: Provide valid parameters according to intent schema

### 5005 - IXP_INTENT_DEPENDENCY_MISSING
**Message**: Intent dependency is missing
**Cause**: Required service or plugin not available
**Resolution**: Install and configure required dependencies

### 5006 - IXP_INTENT_CIRCULAR_DEPENDENCY
**Message**: Circular dependency detected
**Cause**: Intent has circular dependency with another intent
**Resolution**: Refactor intent dependencies

### 5007 - IXP_INTENT_REGISTRATION_FAILED
**Message**: Failed to register intent
**Cause**: Error during intent registration
**Resolution**: Check intent definition and server state

### 5008 - IXP_INTENT_ALREADY_EXISTS
**Message**: Intent already exists
**Cause**: Attempting to register intent with existing name
**Resolution**: Use different name or unregister existing intent

### 5009 - IXP_INTENT_CONTEXT_INVALID
**Message**: Invalid intent context
**Cause**: Context object is missing required properties
**Resolution**: Ensure context is properly initialized

### 5010 - IXP_INTENT_RESULT_INVALID
**Message**: Invalid intent result
**Cause**: Intent returned invalid result format
**Resolution**: Return result matching expected schema

## Component Errors (6000-6999)

Errors related to component rendering and management.

### 6001 - IXP_COMPONENT_NOT_FOUND
**Message**: Component not found
**Cause**: Requested component is not registered
**Resolution**: Register component before using

### 6002 - IXP_COMPONENT_RENDER_FAILED
**Message**: Component rendering failed
**Cause**: Error during component rendering
**Resolution**: Check component implementation and props

### 6003 - IXP_COMPONENT_PROPS_INVALID
**Message**: Invalid component props
**Cause**: Component props validation failed
**Resolution**: Provide valid props according to component schema

```typescript
// Component with prop validation
const productCard = {
  name: 'product-card',
  props: {
    product: { type: 'object', required: true },
    showPrice: { type: 'boolean', default: true }
  },
  render: (props) => {
    if (!props.product) {
      throw new IXPError('IXP_COMPONENT_PROPS_INVALID', {
        component: 'product-card',
        missing: ['product']
      });
    }
    // Render component
  }
};
```

### 6004 - IXP_COMPONENT_LIFECYCLE_ERROR
**Message**: Component lifecycle error
**Cause**: Error in component lifecycle method
**Resolution**: Check lifecycle method implementation

### 6005 - IXP_COMPONENT_DEPENDENCY_MISSING
**Message**: Component dependency missing
**Cause**: Required dependency not available
**Resolution**: Install required dependencies

### 6006 - IXP_COMPONENT_REGISTRATION_FAILED
**Message**: Component registration failed
**Cause**: Error during component registration
**Resolution**: Check component definition

### 6007 - IXP_COMPONENT_ALREADY_EXISTS
**Message**: Component already exists
**Cause**: Component with same name already registered
**Resolution**: Use different name or unregister existing component

### 6008 - IXP_COMPONENT_TEMPLATE_INVALID
**Message**: Invalid component template
**Cause**: Component template has syntax errors
**Resolution**: Fix template syntax

### 6009 - IXP_COMPONENT_STATE_INVALID
**Message**: Invalid component state
**Cause**: Component state is corrupted or invalid
**Resolution**: Reset component state or check state management

### 6010 - IXP_COMPONENT_EVENT_HANDLER_FAILED
**Message**: Component event handler failed
**Cause**: Error in component event handler
**Resolution**: Check event handler implementation

## Plugin Errors (7000-7999)

Errors related to plugin system and management.

### 7001 - IXP_PLUGIN_NOT_FOUND
**Message**: Plugin not found
**Cause**: Requested plugin is not installed
**Resolution**: Install plugin before using

### 7002 - IXP_PLUGIN_INSTALLATION_FAILED
**Message**: Plugin installation failed
**Cause**: Error during plugin installation
**Resolution**: Check plugin compatibility and dependencies

```typescript
// Plugin installation with error handling
try {
  await server.installPlugin(myPlugin, config);
} catch (error) {
  if (error.code === 'IXP_PLUGIN_INSTALLATION_FAILED') {
    console.error('Plugin installation failed:', error.details);
    // Check plugin requirements, configuration, etc.
  }
}
```

### 7003 - IXP_PLUGIN_INITIALIZATION_FAILED
**Message**: Plugin initialization failed
**Cause**: Error during plugin initialization
**Resolution**: Check plugin configuration and dependencies

### 7004 - IXP_PLUGIN_CONFIGURATION_INVALID
**Message**: Invalid plugin configuration
**Cause**: Plugin configuration doesn't match schema
**Resolution**: Provide valid configuration

### 7005 - IXP_PLUGIN_DEPENDENCY_MISSING
**Message**: Plugin dependency missing
**Cause**: Required plugin dependency not available
**Resolution**: Install required plugin dependencies

### 7006 - IXP_PLUGIN_VERSION_INCOMPATIBLE
**Message**: Incompatible plugin version
**Cause**: Plugin version not compatible with server
**Resolution**: Use compatible plugin version

### 7007 - IXP_PLUGIN_ALREADY_INSTALLED
**Message**: Plugin already installed
**Cause**: Plugin with same name already installed
**Resolution**: Uninstall existing plugin or use different name

### 7008 - IXP_PLUGIN_UNINSTALLATION_FAILED
**Message**: Plugin uninstallation failed
**Cause**: Error during plugin removal
**Resolution**: Check for active plugin usage or dependencies

### 7009 - IXP_PLUGIN_COMMUNICATION_FAILED
**Message**: Plugin communication failed
**Cause**: Error in inter-plugin communication
**Resolution**: Check plugin interfaces and event system

### 7010 - IXP_PLUGIN_SECURITY_VIOLATION
**Message**: Plugin security violation
**Cause**: Plugin attempted unauthorized operation
**Resolution**: Review plugin permissions and security policies

## Database Errors (8000-8999)

Errors related to database operations and connectivity.

### 8001 - IXP_DB_CONNECTION_FAILED
**Message**: Database connection failed
**Cause**: Cannot connect to database
**Resolution**: Check database configuration and availability

### 8002 - IXP_DB_QUERY_FAILED
**Message**: Database query failed
**Cause**: Error executing database query
**Resolution**: Check query syntax and database state

### 8003 - IXP_DB_TRANSACTION_FAILED
**Message**: Database transaction failed
**Cause**: Transaction was rolled back due to error
**Resolution**: Check transaction logic and constraints

### 8004 - IXP_DB_CONSTRAINT_VIOLATION
**Message**: Database constraint violation
**Cause**: Data violates database constraints
**Resolution**: Ensure data meets constraint requirements

### 8005 - IXP_DB_RECORD_NOT_FOUND
**Message**: Database record not found
**Cause**: Requested record doesn't exist
**Resolution**: Check record identifier or create record

### 8006 - IXP_DB_DUPLICATE_KEY
**Message**: Duplicate key violation
**Cause**: Attempting to insert duplicate unique value
**Resolution**: Use unique value or update existing record

### 8007 - IXP_DB_TIMEOUT
**Message**: Database operation timed out
**Cause**: Query took too long to execute
**Resolution**: Optimize query or increase timeout

### 8008 - IXP_DB_POOL_EXHAUSTED
**Message**: Database connection pool exhausted
**Cause**: All database connections are in use
**Resolution**: Increase pool size or optimize connection usage

### 8009 - IXP_DB_MIGRATION_FAILED
**Message**: Database migration failed
**Cause**: Error during database schema migration
**Resolution**: Check migration scripts and database state

### 8010 - IXP_DB_BACKUP_FAILED
**Message**: Database backup failed
**Cause**: Error creating database backup
**Resolution**: Check backup configuration and storage

## Network Errors (9000-9999)

Errors related to network operations and external services.

### 9001 - IXP_NETWORK_REQUEST_FAILED
**Message**: Network request failed
**Cause**: HTTP request to external service failed
**Resolution**: Check network connectivity and service availability

### 9002 - IXP_NETWORK_TIMEOUT
**Message**: Network request timed out
**Cause**: Request took too long to complete
**Resolution**: Increase timeout or check service performance

### 9003 - IXP_NETWORK_SERVICE_UNAVAILABLE
**Message**: External service unavailable
**Cause**: External service is down or unreachable
**Resolution**: Wait for service recovery or use fallback

### 9004 - IXP_NETWORK_RATE_LIMITED
**Message**: Rate limited by external service
**Cause**: Too many requests to external service
**Resolution**: Implement backoff strategy or reduce request rate

### 9005 - IXP_NETWORK_AUTHENTICATION_FAILED
**Message**: External service authentication failed
**Cause**: Invalid credentials for external service
**Resolution**: Check and update service credentials

### 9006 - IXP_NETWORK_SSL_ERROR
**Message**: SSL/TLS connection error
**Cause**: SSL certificate or connection issue
**Resolution**: Check SSL configuration and certificates

### 9007 - IXP_NETWORK_DNS_RESOLUTION_FAILED
**Message**: DNS resolution failed
**Cause**: Cannot resolve hostname
**Resolution**: Check DNS configuration and hostname

### 9008 - IXP_NETWORK_PROXY_ERROR
**Message**: Proxy connection error
**Cause**: Error connecting through proxy
**Resolution**: Check proxy configuration

### 9009 - IXP_NETWORK_FIREWALL_BLOCKED
**Message**: Request blocked by firewall
**Cause**: Firewall blocking outbound request
**Resolution**: Configure firewall rules

### 9010 - IXP_NETWORK_BANDWIDTH_EXCEEDED
**Message**: Bandwidth limit exceeded
**Cause**: Network bandwidth limit reached
**Resolution**: Optimize data transfer or increase bandwidth

## Error Handling Best Practices

### 1. Consistent Error Structure

Always use the standard error structure:

```typescript
class IXPError extends Error {
  constructor(
    public code: string,
    public details?: any,
    public numericCode?: number
  ) {
    super();
    this.name = 'IXPError';
  }
  
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        numericCode: this.numericCode,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId()
      }
    };
  }
}
```

### 2. Error Logging

```typescript
// Log errors with appropriate level
function handleError(error: IXPError, context: any) {
  const logLevel = getLogLevel(error.numericCode);
  
  logger[logLevel]({
    error: error.code,
    message: error.message,
    details: error.details,
    context: {
      userId: context.user?.id,
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

function getLogLevel(numericCode: number): string {
  if (numericCode >= 1000 && numericCode < 2000) return 'error';
  if (numericCode >= 4000 && numericCode < 5000) return 'warn';
  return 'info';
}
```

### 3. Error Recovery

```typescript
// Implement retry logic for transient errors
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry for specific error types
      if (isRetryableError(error) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'IXP_NETWORK_TIMEOUT',
    'IXP_NETWORK_SERVICE_UNAVAILABLE',
    'IXP_DB_CONNECTION_FAILED',
    'IXP_SERVER_OVERLOADED'
  ];
  
  return retryableCodes.includes(error.code);
}
```

### 4. User-Friendly Error Messages

```typescript
// Convert technical errors to user-friendly messages
function getUserFriendlyMessage(error: IXPError): string {
  const messageMap: Record<string, string> = {
    'IXP_AUTH_TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'IXP_VALIDATION_REQUIRED_FIELD': 'Please fill in all required fields.',
    'IXP_NETWORK_SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
    'IXP_DB_CONNECTION_FAILED': 'We\'re experiencing technical difficulties. Please try again later.'
  };
  
  return messageMap[error.code] || 'An unexpected error occurred. Please try again.';
}
```

### 5. Error Monitoring and Alerting

```typescript
// Set up error monitoring
function setupErrorMonitoring() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    // Send to monitoring service
    sendToMonitoring(error, 'uncaught_exception');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    // Send to monitoring service
    sendToMonitoring(reason, 'unhandled_rejection');
  });
}

function sendToMonitoring(error: any, type: string) {
  // Send to external monitoring service (e.g., Sentry, DataDog)
  monitoringService.captureException(error, {
    tags: {
      type,
      service: 'ixp-server'
    }
  });
}
```

This error codes reference provides a comprehensive guide for handling all types of errors in IXP Server applications, ensuring consistent error handling and improved debugging capabilities.