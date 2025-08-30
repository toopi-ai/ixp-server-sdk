# Migration Guide

This guide helps you migrate between different versions of the IXP Server SDK, providing step-by-step instructions for breaking changes and new features.

## Table of Contents

- [Version 2.x to 3.x](#version-2x-to-3x)
- [Version 1.x to 2.x](#version-1x-to-2x)
- [Common Migration Patterns](#common-migration-patterns)
- [Breaking Changes Reference](#breaking-changes-reference)
- [Migration Tools](#migration-tools)
- [Troubleshooting](#troubleshooting)

## Version 2.x to 3.x

### Overview

Version 3.x introduces significant architectural improvements, enhanced TypeScript support, and new plugin system.

### Breaking Changes

#### 1. Server Configuration

**Before (v2.x):**
```typescript
import { IXPServer } from '@ixp/server-sdk';

const server = new IXPServer({
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    database: 'ixp_db'
  }
});
```

**After (v3.x):**
```typescript
import { IXPServer, DatabaseConfig } from '@ixp/server-sdk';

const dbConfig: DatabaseConfig = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'ixp_db',
  synchronize: false, // Now required
  migrations: ['./migrations/*.ts']
};

const server = new IXPServer({
  port: 3000,
  database: dbConfig,
  plugins: [] // New plugin system
});
```

#### 2. Intent Registration

**Before (v2.x):**
```typescript
server.registerIntent('greeting', async (context) => {
  return { message: `Hello ${context.user.name}!` };
});
```

**After (v3.x):**
```typescript
import { Intent, IntentContext, IntentResponse } from '@ixp/server-sdk';

class GreetingIntent extends Intent {
  name = 'greeting';
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    return {
      message: `Hello ${context.user.name}!`,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

server.registerIntent(new GreetingIntent());
```

#### 3. Middleware System

**Before (v2.x):**
```typescript
server.use((req, res, next) => {
  console.log('Request received');
  next();
});
```

**After (v3.x):**
```typescript
import { Middleware, MiddlewareContext } from '@ixp/server-sdk';

class LoggingMiddleware extends Middleware {
  async execute(context: MiddlewareContext, next: () => Promise<void>): Promise<void> {
    console.log('Request received:', context.request.id);
    await next();
    console.log('Request completed:', context.request.id);
  }
}

server.use(new LoggingMiddleware());
```

#### 4. Component System

**Before (v2.x):**
```typescript
server.registerComponent('user-profile', {
  template: '<div>{{user.name}}</div>',
  props: ['user']
});
```

**After (v3.x):**
```typescript
import { Component, ComponentProps } from '@ixp/server-sdk';

interface UserProfileProps extends ComponentProps {
  user: {
    name: string;
    email: string;
  };
}

class UserProfileComponent extends Component<UserProfileProps> {
  name = 'user-profile';
  
  render(props: UserProfileProps): string {
    return `
      <div class="user-profile">
        <h3>${props.user.name}</h3>
        <p>${props.user.email}</p>
      </div>
    `;
  }
}

server.registerComponent(new UserProfileComponent());
```

### Migration Steps

#### Step 1: Update Dependencies

```bash
# Remove old version
npm uninstall @ixp/server-sdk

# Install new version
npm install @ixp/server-sdk@^3.0.0

# Update TypeScript (if needed)
npm install --save-dev typescript@^5.0.0
```

#### Step 2: Update Configuration

1. Create a new configuration file:

```typescript
// config/server.config.ts
import { IXPServerConfig } from '@ixp/server-sdk';

export const serverConfig: IXPServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  database: {
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME || 'ixp_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    synchronize: process.env.NODE_ENV === 'development',
    migrations: ['./src/migrations/*.ts'],
    entities: ['./src/entities/*.ts']
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '24h'
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
};
```

#### Step 3: Migrate Intents

Create a migration script:

```typescript
// scripts/migrate-intents.ts
import { Intent, IntentContext, IntentResponse } from '@ixp/server-sdk';

// Convert function-based intents to class-based
export function migrateIntent(
  name: string,
  handler: (context: any) => Promise<any>
): Intent {
  return class MigratedIntent extends Intent {
    name = name;
    
    async execute(context: IntentContext): Promise<IntentResponse> {
      const result = await handler(context);
      return {
        ...result,
        metadata: {
          migrated: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  };
}

// Usage
const GreetingIntent = migrateIntent('greeting', async (context) => {
  return { message: `Hello ${context.user.name}!` };
});
```

#### Step 4: Update Database Schema

Run the migration command:

```bash
# Generate migration
npx ixp migration:generate -n "upgrade-to-v3"

# Run migrations
npx ixp migration:run
```

#### Step 5: Update Tests

**Before (v2.x):**
```typescript
import { createTestServer } from '@ixp/server-sdk/testing';

const server = createTestServer();
const response = await server.request('/api/intents/greeting');
```

**After (v3.x):**
```typescript
import { TestingModule, createTestingModule } from '@ixp/server-sdk/testing';

const module: TestingModule = await createTestingModule({
  intents: [GreetingIntent],
  middleware: [LoggingMiddleware]
});

const server = module.createServer();
const response = await server.request('/api/intents/greeting');
```

## Version 1.x to 2.x

### Overview

Version 2.x introduced TypeScript support, improved error handling, and enhanced middleware system.

### Breaking Changes

#### 1. Import Changes

**Before (v1.x):**
```javascript
const IXPServer = require('@ixp/server-sdk');
```

**After (v2.x):**
```typescript
import { IXPServer } from '@ixp/server-sdk';
```

#### 2. Error Handling

**Before (v1.x):**
```javascript
server.registerIntent('example', (context, callback) => {
  try {
    const result = processIntent(context);
    callback(null, result);
  } catch (error) {
    callback(error);
  }
});
```

**After (v2.x):**
```typescript
server.registerIntent('example', async (context) => {
  try {
    return await processIntent(context);
  } catch (error) {
    throw new IntentError('Processing failed', {
      code: 'INTENT_PROCESSING_ERROR',
      details: error.message
    });
  }
});
```

### Migration Steps

#### Step 1: Convert to TypeScript

1. Rename files from `.js` to `.ts`
2. Add type annotations
3. Install TypeScript dependencies:

```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

#### Step 2: Update Error Handling

Replace callback-based error handling with async/await and proper error classes.

#### Step 3: Update Configuration

Convert configuration objects to use TypeScript interfaces.

## Common Migration Patterns

### Pattern 1: Async/Await Migration

```typescript
// Before: Callback-based
function processData(data, callback) {
  setTimeout(() => {
    callback(null, { processed: data });
  }, 1000);
}

// After: Promise-based
async function processData(data: any): Promise<{ processed: any }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { processed: data };
}
```

### Pattern 2: Configuration Migration

```typescript
// Migration helper
function migrateConfig(oldConfig: any): IXPServerConfig {
  return {
    port: oldConfig.port || 3000,
    database: {
      type: 'postgresql',
      ...oldConfig.db,
      synchronize: false
    },
    cors: oldConfig.cors || { origin: '*' },
    security: {
      jwt: oldConfig.jwt || { secret: 'default-secret' }
    }
  };
}
```

### Pattern 3: Component Migration

```typescript
// Migration utility for components
function migrateComponent(name: string, config: any): Component {
  return class MigratedComponent extends Component {
    name = name;
    
    render(props: any): string {
      if (typeof config.template === 'function') {
        return config.template(props);
      }
      return config.template || '<div></div>';
    }
    
    getProps(): string[] {
      return config.props || [];
    }
  };
}
```

## Breaking Changes Reference

### v3.0.0

- **Server Configuration**: New structured configuration format
- **Intent System**: Class-based intents replace function-based
- **Middleware**: New middleware architecture with lifecycle hooks
- **Components**: Type-safe component system
- **Database**: Enhanced ORM integration with migrations
- **Plugin System**: New plugin architecture

### v2.0.0

- **TypeScript**: Full TypeScript rewrite
- **Async/Await**: Callback-based APIs replaced with Promises
- **Error Handling**: Structured error classes
- **Configuration**: Type-safe configuration objects

## Migration Tools

### Automated Migration Script

```typescript
// scripts/migrate.ts
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

class MigrationTool {
  async migrateProject(version: string): Promise<void> {
    console.log(`Migrating to version ${version}...`);
    
    switch (version) {
      case '3.0.0':
        await this.migrateToV3();
        break;
      case '2.0.0':
        await this.migrateToV2();
        break;
      default:
        throw new Error(`Unsupported migration version: ${version}`);
    }
    
    console.log('Migration completed successfully!');
  }
  
  private async migrateToV3(): Promise<void> {
    // Update package.json
    this.updatePackageJson();
    
    // Migrate configuration files
    this.migrateConfigFiles();
    
    // Convert intents to class-based
    this.migrateIntents();
    
    // Update middleware
    this.migrateMiddleware();
    
    // Run database migrations
    execSync('npx ixp migration:run');
  }
  
  private updatePackageJson(): void {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    packageJson.dependencies['@ixp/server-sdk'] = '^3.0.0';
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  }
  
  private migrateConfigFiles(): void {
    const configFiles = glob.sync('**/*.config.{js,ts}');
    
    for (const file of configFiles) {
      const content = readFileSync(file, 'utf8');
      const migratedContent = this.transformConfigFile(content);
      writeFileSync(file, migratedContent);
    }
  }
  
  private transformConfigFile(content: string): string {
    // Transform configuration format
    return content
      .replace(/database:\s*{([^}]+)}/g, (match, dbConfig) => {
        return `database: {
  type: 'postgresql',
  ${dbConfig},
  synchronize: false,
  migrations: ['./migrations/*.ts']
}`;
      });
  }
  
  private migrateIntents(): void {
    const intentFiles = glob.sync('**/*intent*.{js,ts}');
    
    for (const file of intentFiles) {
      const content = readFileSync(file, 'utf8');
      const migratedContent = this.transformIntentFile(content);
      writeFileSync(file, migratedContent);
    }
  }
  
  private transformIntentFile(content: string): string {
    // Transform function-based intents to class-based
    return content.replace(
      /server\.registerIntent\('([^']+)',\s*async\s*\(([^)]+)\)\s*=>\s*{([^}]+)}/g,
      (match, name, params, body) => {
        return `class ${this.toPascalCase(name)}Intent extends Intent {
  name = '${name}';
  
  async execute(${params}): Promise<IntentResponse> {
    ${body}
  }
}

server.registerIntent(new ${this.toPascalCase(name)}Intent());`;
      }
    );
  }
  
  private migrateMiddleware(): void {
    // Similar transformation for middleware
  }
  
  private toPascalCase(str: string): string {
    return str.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
  }
}

// Usage
const migrationTool = new MigrationTool();
migrationTool.migrateProject('3.0.0').catch(console.error);
```

### CLI Migration Command

```bash
# Install migration CLI
npm install -g @ixp/migration-cli

# Run migration
ixp migrate --to=3.0.0 --dry-run
ixp migrate --to=3.0.0

# Validate migration
ixp validate-migration
```

## Troubleshooting

### Common Issues

#### Issue 1: TypeScript Compilation Errors

**Problem**: Type errors after migration

**Solution**:
```bash
# Update TypeScript configuration
npx tsc --init --target es2020 --module commonjs --strict

# Install missing type definitions
npm install --save-dev @types/node @types/express
```

#### Issue 2: Database Connection Issues

**Problem**: Database connection fails after migration

**Solution**:
```typescript
// Check database configuration
const dbConfig = {
  type: 'postgresql' as const, // Ensure correct type
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  // ... other config
};

// Test connection
import { createConnection } from 'typeorm';
const connection = await createConnection(dbConfig);
console.log('Database connected successfully');
```

#### Issue 3: Intent Registration Failures

**Problem**: Intents not registering properly

**Solution**:
```typescript
// Ensure proper intent class structure
class ExampleIntent extends Intent {
  name = 'example'; // Must be defined
  
  async execute(context: IntentContext): Promise<IntentResponse> {
    // Must return IntentResponse
    return {
      message: 'Success',
      data: {},
      metadata: {}
    };
  }
}

// Register with proper error handling
try {
  server.registerIntent(new ExampleIntent());
  console.log('Intent registered successfully');
} catch (error) {
  console.error('Intent registration failed:', error);
}
```

### Migration Checklist

- [ ] Update package.json dependencies
- [ ] Run `npm install` to install new versions
- [ ] Update TypeScript configuration
- [ ] Migrate configuration files
- [ ] Convert intents to class-based (v3.x)
- [ ] Update middleware system
- [ ] Migrate components
- [ ] Run database migrations
- [ ] Update tests
- [ ] Validate application functionality
- [ ] Update documentation
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production

### Getting Help

- **Documentation**: [https://docs.ixp-server.com](https://docs.ixp-server.com)
- **GitHub Issues**: [https://github.com/ixp/server-sdk/issues](https://github.com/ixp/server-sdk/issues)
- **Discord Community**: [https://discord.gg/ixp-server](https://discord.gg/ixp-server)
- **Migration Support**: [migration-support@ixp-server.com](mailto:migration-support@ixp-server.com)

For complex migrations or enterprise support, consider our [Professional Migration Services](https://ixp-server.com/migration-services).
