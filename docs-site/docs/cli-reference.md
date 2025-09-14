---
id: cli-reference
title: CLI Reference
sidebar_label: CLI Reference
sidebar_position: 7
description: Complete command-line interface reference with all available commands and options
---

# CLI Reference

The IXP Server SDK includes a comprehensive command-line interface for project management, development, and deployment.

## Installation

```bash
# Global installation
npm install -g ixp-server

# Local installation
npm install ixp-server

# Using npx (no installation required)
npx ixp-server --help
```

## Basic Usage

```bash
ixp-server [command] [options]
```

## Commands

### create

Creates a new IXP Server project from a template.

```bash
ixp-server create <project-name> [options]
```

**Arguments:**
- `project-name` - Name of the project to create

**Options:**
- `--template <template>` - Project template to use (default: 'basic')
- `--typescript` - Use TypeScript template
- `--javascript` - Use JavaScript template
- `--framework <framework>` - Target framework (react, vue, vanilla)
- `--git` - Initialize git repository
- `--install` - Install dependencies after creation
- `--force` - Overwrite existing directory

**Examples:**
```bash
# Create basic project
ixp-server create my-ixp-server

# Create TypeScript project with React components
ixp-server create my-app --typescript --framework react

# Create project with specific template
ixp-server create my-app --template advanced --install

# Force overwrite existing directory
ixp-server create my-app --force
```

**Available Templates:**
- `basic` - Basic IXP server setup
- `advanced` - Advanced features with middleware and plugins
- `microservice` - Microservice architecture template
- `monorepo` - Monorepo setup with multiple services
- `ecommerce` - E-commerce specific intents and components
- `cms` - Content management system template

### init

Initializes an IXP Server in an existing project.

```bash
ixp-server init [options]
```

**Options:**
- `--config <file>` - Configuration file to create (default: 'ixp.config.js')
- `--intents <file>` - Intents configuration file (default: 'config/intents.json')
- `--components <file>` - Components configuration file (default: 'config/components.json')
- `--typescript` - Generate TypeScript configuration
- `--examples` - Include example intents and components

**Examples:**
```bash
# Initialize with default settings
ixp-server init

# Initialize with TypeScript
ixp-server init --typescript

# Initialize with custom config file
ixp-server init --config custom-config.js

# Initialize with examples
ixp-server init --examples
```

### start

Starts the IXP Server in production mode.

```bash
ixp-server start [options]
```

**Options:**
- `--port <port>` - Port to listen on (default: 3001)
- `--host <host>` - Host to bind to (default: 'localhost')
- `--config <file>` - Configuration file to use
- `--env <environment>` - Environment to run in (development, production)
- `--cluster` - Run in cluster mode
- `--workers <count>` - Number of worker processes (cluster mode)

**Examples:**
```bash
# Start server on default port
ixp-server start

# Start on specific port and host
ixp-server start --port 8080 --host 0.0.0.0

# Start with custom config
ixp-server start --config production.config.js

# Start in cluster mode
ixp-server start --cluster --workers 4
```

### dev

Starts the development server with hot reload and debugging features.

```bash
ixp-server dev [options]
```

**Options:**
- `--port <port>` - Port to listen on (default: 3001)
- `--host <host>` - Host to bind to (default: 'localhost')
- `--config <file>` - Configuration file to use
- `--watch <patterns>` - File patterns to watch for changes
- `--no-reload` - Disable hot reload
- `--debug` - Enable debug mode
- `--inspect` - Enable Node.js inspector
- `--open` - Open browser after starting

**Examples:**
```bash
# Start development server
ixp-server dev

# Start with custom watch patterns
ixp-server dev --watch "src/**/*.ts,config/**/*.json"

# Start with debugging
ixp-server dev --debug --inspect

# Start and open browser
ixp-server dev --open
```

### build

Builds the project for production deployment.

```bash
ixp-server build [options]
```

**Options:**
- `--output <dir>` - Output directory (default: 'dist')
- `--config <file>` - Configuration file to use
- `--minify` - Minify output
- `--sourcemap` - Generate source maps
- `--analyze` - Analyze bundle size
- `--clean` - Clean output directory before build

**Examples:**
```bash
# Build for production
ixp-server build

# Build with minification and source maps
ixp-server build --minify --sourcemap

# Build to custom directory
ixp-server build --output build

# Clean build with analysis
ixp-server build --clean --analyze
```

### generate:intent

Generates a new intent definition.

```bash
ixp-server generate:intent <name> [options]
```

**Arguments:**
- `name` - Intent name

**Options:**
- `--description <desc>` - Intent description
- `--component <component>` - Target component name
- `--parameters <schema>` - Parameters JSON schema
- `--category <category>` - Intent category
- `--crawlable` - Make intent crawlable
- `--output <file>` - Output file (default: adds to intents.json)

**Examples:**
```bash
# Generate basic intent
ixp-server generate:intent show_products

# Generate intent with details
ixp-server generate:intent show_products \
  --description "Display product catalog" \
  --component ProductGrid \
  --category ecommerce \
  --crawlable

# Generate with custom parameters
ixp-server generate:intent search_products \
  --parameters '{"type":"object","properties":{"query":{"type":"string"}}}'
```

### generate:component

Generates a new component definition.

```bash
ixp-server generate:component <name> [options]
```

**Arguments:**
- `name` - Component name

**Options:**
- `--framework <framework>` - Component framework (react, vue, vanilla)
- `--url <url>` - Remote component URL
- `--export <name>` - Export name (default: component name)
- `--props <schema>` - Props JSON schema
- `--version <version>` - Component version (default: '1.0.0')
- `--output <file>` - Output file (default: adds to components.json)

**Examples:**
```bash
# Generate React component
ixp-server generate:component ProductGrid --framework react

# Generate with custom URL and props
ixp-server generate:component UserProfile \
  --framework react \
  --url "https://cdn.myapp.com/UserProfile.js" \
  --props '{"type":"object","properties":{"userId":{"type":"string"}}}'
```

### validate

Validates configuration files and definitions.

```bash
ixp-server validate [options]
```

**Options:**
- `--config <file>` - Configuration file to validate
- `--intents <file>` - Intents file to validate
- `--components <file>` - Components file to validate
- `--strict` - Enable strict validation
- `--fix` - Attempt to fix validation errors

**Examples:**
```bash
# Validate all configuration
ixp-server validate

# Validate specific files
ixp-server validate --intents config/intents.json

# Strict validation with auto-fix
ixp-server validate --strict --fix
```

### test

Runs tests against the IXP Server.

```bash
ixp-server test [options]
```

**Options:**
- `--port <port>` - Server port to test against
- `--host <host>` - Server host to test against
- `--config <file>` - Configuration file to use
- `--timeout <ms>` - Test timeout in milliseconds
- `--verbose` - Verbose test output
- `--coverage` - Generate coverage report

**Examples:**
```bash
# Run tests against running server
ixp-server test --port 3001

# Run tests with coverage
ixp-server test --coverage

# Run verbose tests
ixp-server test --verbose --timeout 10000
```

### docs

Generates API documentation.

```bash
ixp-server docs [options]
```

**Options:**
- `--output <dir>` - Output directory (default: 'docs')
- `--format <format>` - Documentation format (html, markdown, json)
- `--config <file>` - Configuration file to use
- `--theme <theme>` - Documentation theme
- `--serve` - Serve documentation after generation

**Examples:**
```bash
# Generate HTML documentation
ixp-server docs --format html

# Generate and serve documentation
ixp-server docs --serve

# Generate with custom theme
ixp-server docs --theme custom --output public/docs
```

### lint

Lints configuration files and code.

```bash
ixp-server lint [options]
```

**Options:**
- `--config <file>` - Lint configuration file
- `--fix` - Automatically fix linting errors
- `--format <format>` - Output format (stylish, json, junit)
- `--quiet` - Only show errors

**Examples:**
```bash
# Lint all files
ixp-server lint

# Lint and fix errors
ixp-server lint --fix

# Quiet mode with JSON output
ixp-server lint --quiet --format json
```

### deploy

Deploys the IXP Server to various platforms.

```bash
ixp-server deploy <platform> [options]
```

**Arguments:**
- `platform` - Deployment platform (docker, kubernetes, aws, gcp, azure)

**Options:**
- `--config <file>` - Deployment configuration file
- `--env <environment>` - Target environment
- `--tag <tag>` - Docker image tag
- `--registry <registry>` - Docker registry URL
- `--namespace <namespace>` - Kubernetes namespace

**Examples:**
```bash
# Deploy to Docker
ixp-server deploy docker --tag v1.0.0

# Deploy to Kubernetes
ixp-server deploy kubernetes --namespace production

# Deploy to AWS with custom config
ixp-server deploy aws --config deploy/aws.json --env production
```

### migrate

Migrates configuration between versions.

```bash
ixp-server migrate [options]
```

**Options:**
- `--from <version>` - Source version
- `--to <version>` - Target version
- `--config <file>` - Configuration file to migrate
- `--backup` - Create backup before migration
- `--dry-run` - Show migration changes without applying

**Examples:**
```bash
# Migrate to latest version
ixp-server migrate --backup

# Dry run migration
ixp-server migrate --from 1.0.0 --to 2.0.0 --dry-run

# Migrate specific config file
ixp-server migrate --config old-config.js --backup
```

## Global Options

These options are available for all commands:

- `--help, -h` - Show help information
- `--version, -v` - Show version number
- `--verbose` - Enable verbose output
- `--quiet, -q` - Suppress output
- `--no-color` - Disable colored output
- `--config <file>` - Specify configuration file

## Configuration File

The CLI can be configured using a configuration file:

### ixp.config.js

```javascript
module.exports = {
  // Server configuration
  server: {
    port: 3001,
    host: 'localhost'
  },
  
  // Development configuration
  dev: {
    port: 3001,
    watch: ['src/**/*.ts', 'config/**/*.json'],
    hotReload: true,
    debug: false
  },
  
  // Build configuration
  build: {
    output: 'dist',
    minify: true,
    sourcemap: true,
    clean: true
  },
  
  // Test configuration
  test: {
    timeout: 5000,
    coverage: true,
    verbose: false
  },
  
  // Documentation configuration
  docs: {
    output: 'docs',
    format: 'html',
    theme: 'default'
  },
  
  // Deployment configuration
  deploy: {
    docker: {
      registry: 'myregistry.com',
      tag: 'latest'
    },
    kubernetes: {
      namespace: 'default',
      context: 'production'
    }
  }
};
```

### package.json Scripts

Add CLI commands to your package.json:

```json
{
  "scripts": {
    "dev": "ixp-server dev",
    "start": "ixp-server start",
    "build": "ixp-server build",
    "test": "ixp-server test",
    "validate": "ixp-server validate",
    "lint": "ixp-server lint --fix",
    "docs": "ixp-server docs --serve",
    "deploy:docker": "ixp-server deploy docker",
    "deploy:k8s": "ixp-server deploy kubernetes"
  }
}
```

## Environment Variables

The CLI respects these environment variables:

```bash
# Server configuration
IXP_PORT=3001
IXP_HOST=localhost
IXP_CONFIG_FILE=./ixp.config.js

# Development
IXP_DEV_PORT=3001
IXP_HOT_RELOAD=true
IXP_DEBUG=false

# Build
IXP_BUILD_OUTPUT=dist
IXP_BUILD_MINIFY=true
IXP_BUILD_SOURCEMAP=true

# Deployment
DOCKER_REGISTRY=myregistry.com
KUBE_NAMESPACE=production
KUBE_CONTEXT=production

# Logging
IXP_LOG_LEVEL=info
IXP_VERBOSE=false
```

## Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Invalid command or arguments
- `3` - Configuration error
- `4` - Validation error
- `5` - Build error
- `6` - Test failure
- `7` - Deployment error

## Examples

### Complete Project Setup

```bash
# Create new project
ixp-server create my-ecommerce-app --template ecommerce --typescript --install

# Navigate to project
cd my-ecommerce-app

# Generate some intents
ixp-server generate:intent show_products --description "Display products" --component ProductGrid
ixp-server generate:intent show_cart --description "Display shopping cart" --component ShoppingCart

# Generate components
ixp-server generate:component ProductGrid --framework react --url "https://cdn.myapp.com/ProductGrid.js"
ixp-server generate:component ShoppingCart --framework react --url "https://cdn.myapp.com/ShoppingCart.js"

# Validate configuration
ixp-server validate --strict

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Run tests
npm test

# Validate production config
ixp-server validate --config production.config.js

# Deploy to Docker
ixp-server deploy docker --tag v1.0.0 --registry myregistry.com

# Deploy to Kubernetes
ixp-server deploy kubernetes --namespace production --env production
```

### Development Workflow

```bash
# Start development with debugging
ixp-server dev --debug --inspect --open

# In another terminal, run tests in watch mode
ixp-server test --watch

# Generate documentation
ixp-server docs --serve

# Lint and fix code
ixp-server lint --fix
```

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure IXP Server is installed globally or use npx
2. **Port in use**: Use `--port` option to specify different port
3. **Configuration errors**: Run `ixp-server validate` to check configuration
4. **Build failures**: Check build logs and ensure all dependencies are installed
5. **Test failures**: Run tests with `--verbose` flag for detailed output

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Enable debug for all commands
DEBUG=ixp-server:* ixp-server dev

# Enable debug for specific modules
DEBUG=ixp-server:cli,ixp-server:config ixp-server start
```

### Getting Help

```bash
# General help
ixp-server --help

# Command-specific help
ixp-server create --help
ixp-server dev --help

# Show version
ixp-server --version
```