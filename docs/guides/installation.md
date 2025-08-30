# Installation Guide

This guide provides comprehensive instructions for installing and setting up the IXP Server SDK in various environments and configurations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Environment Setup](#environment-setup)
- [Verification](#verification)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Docker Installation](#docker-installation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or equivalent package manager)
- **TypeScript**: Version 4.5.0 or higher (for TypeScript projects)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Hardware Requirements

- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: At least 500MB free space
- **CPU**: Any modern processor (x64 or ARM64)

### Checking Prerequisites

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version
# Should output 8.0.0 or higher

# Check TypeScript version (if using TypeScript)
npx tsc --version
# Should output 4.5.0 or higher
```

## Installation Methods

### Method 1: npm (Recommended)

```bash
# Install globally for CLI access
npm install -g ixp-server@1.1.1

# Or install locally in your project
npm install ixp-server@1.1.1

# For development dependencies
npm install --save-dev ixp-server@1.1.1
```

### Method 2: Yarn

```bash
# Install globally
yarn global add ixp-server@1.1.1

# Or install locally
yarn add ixp-server@1.1.1

# For development dependencies
yarn add --dev ixp-server@1.1.1
```

### Method 3: pnpm

```bash
# Install globally
pnpm add -g ixp-server@1.1.1

# Or install locally
pnpm add ixp-server@1.1.1

# For development dependencies
pnpm add -D ixp-server@1.1.1
```

### Method 4: From Source

```bash
# Clone the repository
git clone https://github.com/your-org/ixp-server-sdk.git
cd ixp-server-sdk

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage
npm link
```

## Environment Setup

### Environment Variables

Create a `.env` file in your project root:

```bash
# .env

# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# IXP Server Configuration
IXP_SERVER_NAME=my-ixp-server
IXP_SERVER_VERSION=1.1.1
IXP_LOG_LEVEL=info

# Security
JWT_SECRET=your-super-secret-jwt-key
API_KEY=your-api-key

# Database (if using database plugin)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# External Services
WEATHER_API_KEY=your-weather-api-key
ANALYTICS_ENDPOINT=https://analytics.example.com
```

### TypeScript Configuration

For TypeScript projects, create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
```

### Package.json Configuration

Update your `package.json` with necessary scripts:

```json
{
  "name": "my-ixp-server",
  "version": "1.0.0",
  "description": "My IXP Server application",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ixp-server dev",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "clean": "rm -rf dist",
    "validate": "ixp-server validate"
  },
  "dependencies": {
    "ixp-server": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.5.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

## Verification

### CLI Verification

```bash
# Check if CLI is installed correctly
ixp-server --version
# Should output: 1.1.1

# Check available commands
ixp-server --help
# Should show list of available commands

# Test CLI functionality
ixp-server info
# Should display system information
```

### Module Verification

Create a test file `test-installation.js`:

```javascript
// test-installation.js
const { createIXPServer, version } = require('ixp-server');

console.log('IXP Server SDK Version:', version);

// Test server creation
try {
  const server = createIXPServer({
    name: 'test-server',
    version: '1.0.0'
  });
  
  console.log('✅ Server creation successful');
  console.log('Server name:', server.config.name);
} catch (error) {
  console.error('❌ Server creation failed:', error.message);
  process.exit(1);
}

console.log('🎉 Installation verification complete!');
```

Run the test:

```bash
node test-installation.js
```

### TypeScript Verification

For TypeScript projects, create `test-installation.ts`:

```typescript
// test-installation.ts
import { createIXPServer, version, IXPServerConfig } from 'ixp-server';

console.log('IXP Server SDK Version:', version);

const config: IXPServerConfig = {
  name: 'test-server',
  version: '1.0.0',
  port: 3000
};

try {
  const server = createIXPServer(config);
  console.log('✅ TypeScript integration successful');
  console.log('Server name:', server.config.name);
} catch (error) {
  console.error('❌ TypeScript integration failed:', error);
  process.exit(1);
}

console.log('🎉 TypeScript verification complete!');
```

Compile and run:

```bash
npx tsc test-installation.ts
node test-installation.js
```

## Development Setup

### Project Initialization

```bash
# Create new project directory
mkdir my-ixp-server
cd my-ixp-server

# Initialize npm project
npm init -y

# Install IXP Server SDK
npm install ixp-server@1.1.1

# Install development dependencies
npm install --save-dev typescript @types/node jest @types/jest eslint

# Initialize TypeScript
npx tsc --init

# Create project structure
mkdir -p src/{intents,components,middleware,plugins}
mkdir -p config
mkdir -p public
mkdir -p tests
```

### Project Structure

```
my-ixp-server/
├── src/
│   ├── index.ts              # Main server file
│   ├── intents/
│   │   └── index.ts          # Intent definitions
│   ├── components/
│   │   └── index.ts          # Component definitions
│   ├── middleware/
│   │   └── index.ts          # Custom middleware
│   └── plugins/
│       └── index.ts          # Custom plugins
├── config/
│   ├── intents.json          # Intent configuration
│   ├── components.json       # Component configuration
│   └── server.json           # Server configuration
├── public/                   # Static assets
├── tests/                    # Test files
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Package configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

### Basic Server Setup

Create `src/index.ts`:

```typescript
import { createIXPServer } from 'ixp-server';
import { config } from 'dotenv';

// Load environment variables
config();

// Create server instance
const server = createIXPServer({
  name: process.env.IXP_SERVER_NAME || 'my-ixp-server',
  version: process.env.IXP_SERVER_VERSION || '1.0.0',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost'
});

// Load intents and components
server.loadIntentsFromFile('./config/intents.json');
server.loadComponentsFromFile('./config/components.json');

// Start server
server.start().then(() => {
  console.log(`🚀 Server running at http://localhost:${server.config.port}`);
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Development Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:debug": "tsx watch --inspect src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "validate": "ixp-server validate",
    "generate:intent": "ixp-server generate:intent",
    "generate:component": "ixp-server generate:component"
  }
}
```

## Production Setup

### Environment Configuration

Create production environment file `.env.production`:

```bash
# .env.production

NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Security
JWT_SECRET=your-production-jwt-secret
API_KEY=your-production-api-key

# Logging
IXP_LOG_LEVEL=warn
LOG_FILE=/var/log/ixp-server.log

# Performance
CLUSTER_WORKERS=4
MAX_MEMORY=512

# Database
DATABASE_URL=postgresql://user:password@prod-db:5432/proddb
DATABASE_POOL_SIZE=20

# Caching
REDIS_URL=redis://prod-redis:6379

# Monitoring
MONITORING_ENDPOINT=https://monitoring.example.com
HEALTH_CHECK_INTERVAL=30000
```

### Production Build

```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Validate configuration
npm run validate

# Start production server
NODE_ENV=production npm start
```

### Process Management

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Create PM2 configuration
echo '{
  "name": "ixp-server",
  "script": "dist/index.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 8080
  },
  "log_file": "/var/log/ixp-server.log",
  "error_file": "/var/log/ixp-server-error.log",
  "out_file": "/var/log/ixp-server-out.log",
  "max_memory_restart": "512M"
}' > ecosystem.config.json

# Start with PM2
pm2 start ecosystem.config.json

# Monitor
pm2 monit

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/ixp-server.service`:

```ini
[Unit]
Description=IXP Server
After=network.target

[Service]
Type=simple
User=ixp-server
WorkingDirectory=/opt/ixp-server
Environment=NODE_ENV=production
EnvironmentFile=/opt/ixp-server/.env.production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ixp-server

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ixp-server
sudo systemctl start ixp-server
sudo systemctl status ixp-server
```

## Docker Installation

### Dockerfile

Create `Dockerfile`:

```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S ixp && \
    adduser -S ixp -u 1001

# Change ownership of app directory
RUN chown -R ixp:ixp /app
USER ixp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ixp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/ixpdb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - ixp-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ixpdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ixp-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - ixp-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ixp-server
    networks:
      - ixp-network

volumes:
  postgres_data:
  redis_data:

networks:
  ixp-network:
    driver: bridge
```

### Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f ixp-server

# Scale the application
docker-compose up -d --scale ixp-server=3

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Mismatch

**Error**: `Error: The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check current Node.js version
node --version

# Install correct version using nvm
nvm install 18
nvm use 18

# Or update Node.js directly
# Visit https://nodejs.org and download latest LTS
```

#### 2. Permission Errors

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g ixp-server
```

#### 3. TypeScript Compilation Errors

**Error**: `Cannot find module 'ixp-server'`

**Solution**:
```bash
# Install type definitions
npm install --save-dev @types/node

# Check tsconfig.json configuration
# Ensure "moduleResolution": "node" is set
```

#### 4. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### 5. Module Not Found

**Error**: `Cannot resolve module 'ixp-server'`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check package.json dependencies
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
DEBUG=ixp-server:* npm start

# Or use debug flag
npm run dev:debug
```

### Health Checks

Create health check endpoint:

```typescript
// Add to your server
server.addRoute('GET', '/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: server.config.version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(health);
});
```

### Log Analysis

Enable structured logging:

```typescript
import { createLogger } from 'ixp-server/utils';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: [
    { type: 'console' },
    { type: 'file', filename: 'ixp-server.log' }
  ]
});

server.use(logger.middleware());
```

### Getting Help

If you encounter issues not covered here:

1. Check the [FAQ](../reference/faq.md)
2. Search existing [GitHub Issues](https://github.com/your-org/ixp-server-sdk/issues)
3. Create a new issue with:
   - Node.js version
   - npm version
   - Operating system
   - Error messages
   - Steps to reproduce

## Next Steps

After successful installation:

1. Follow the [First Server Guide](./first-server.md) to create your first IXP server
2. Read the [Configuration Guide](./configuration.md) to customize your setup
3. Explore the [API Documentation](../api/core.md) to understand available features
4. Check out [Examples](../examples/basic.md) for practical implementations

## Related Documentation

- [Quick Start Guide](./quick-start.md) - Get up and running quickly
- [First Server Guide](./first-server.md) - Create your first server
- [Configuration Guide](./configuration.md) - Configure your server
- [Core API](../api/core.md) - Understand the core functionality
