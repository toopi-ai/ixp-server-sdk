# CLI Commands Reference

The IXP Server SDK includes a powerful command-line interface for project management, development, and deployment tasks.

## Installation

```bash
# Install globally
npm install -g ixp-server

# Or use with npx (no installation required)
npx ixp-server --help

# Verify installation
ixp-server --version
```

## Global Options

All commands support these global options:

- `--help, -h` - Show help information
- `--version, -v` - Show version number
- `--verbose` - Enable verbose logging
- `--quiet, -q` - Suppress non-error output
- `--config <path>` - Specify custom config file path

## Commands

### `init`

Initialize a new IXP server project.

```bash
ixp-server init [project-name] [options]
```

#### Arguments

- `project-name` - Name of the project directory (optional, defaults to current directory)

#### Options

- `--template <template>` - Project template to use
  - `minimal` - Basic server with hello world example (default)
  - `react` - React components integration
  - `vue` - Vue.js components integration
  - `advanced` - Full-featured server with plugins and middleware
  - `typescript` - TypeScript-first project setup
  - `javascript` - JavaScript project setup
- `--package-manager <pm>` - Package manager to use (`npm`, `yarn`, `pnpm`)
- `--git` - Initialize git repository
- `--install` - Install dependencies after creation
- `--force` - Overwrite existing files

#### Examples

```bash
# Create a new project with default template
ixp-server init my-ixp-server

# Create with React template
ixp-server init my-react-ixp --template react

# Create in current directory with advanced template
ixp-server init . --template advanced --install

# Create with specific package manager
ixp-server init my-project --package-manager yarn --git
```

#### Generated Structure

```
my-ixp-server/
├── src/
│   ├── intents/
│   │   └── hello-world.ts
│   ├── components/
│   │   └── HelloComponent.ts
│   ├── middleware/
│   │   └── index.ts
│   └── server.ts
├── tests/
│   ├── intents/
│   └── components/
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### `dev`

Start the development server with hot reloading.

```bash
ixp-server dev [options]
```

#### Options

- `--port <port>` - Server port (default: 3000)
- `--host <host>` - Server host (default: localhost)
- `--watch <pattern>` - File patterns to watch (default: src/**/*)
- `--no-watch` - Disable file watching
- `--open` - Open browser automatically
- `--https` - Use HTTPS with self-signed certificate
- `--cert <path>` - Path to SSL certificate
- `--key <path>` - Path to SSL private key

#### Examples

```bash
# Start development server
ixp-server dev

# Start on different port
ixp-server dev --port 8080

# Start with HTTPS
ixp-server dev --https

# Start and open browser
ixp-server dev --open

# Watch specific files
ixp-server dev --watch "src/**/*.ts,config/**/*.json"
```

### `build`

Build the project for production.

```bash
ixp-server build [options]
```

#### Options

- `--output <dir>` - Output directory (default: dist)
- `--target <target>` - Build target (`node`, `browser`, `both`)
- `--minify` - Minify output
- `--sourcemap` - Generate source maps
- `--clean` - Clean output directory before build
- `--analyze` - Analyze bundle size

#### Examples

```bash
# Build for production
ixp-server build

# Build with minification and source maps
ixp-server build --minify --sourcemap

# Build to custom directory
ixp-server build --output ./build

# Clean build
ixp-server build --clean
```

### `start`

Start the production server.

```bash
ixp-server start [options]
```

#### Options

- `--port <port>` - Server port (default: 3000)
- `--host <host>` - Server host (default: 0.0.0.0)
- `--env <env>` - Environment (default: production)
- `--cluster` - Enable cluster mode
- `--workers <count>` - Number of worker processes

#### Examples

```bash
# Start production server
ixp-server start

# Start with cluster mode
ixp-server start --cluster --workers 4

# Start on specific port
ixp-server start --port 8080
```

### `validate`

Validate project configuration and components.

```bash
ixp-server validate [options]
```

#### Options

- `--intents` - Validate only intents
- `--components` - Validate only components
- `--config` - Validate only configuration
- `--strict` - Enable strict validation mode
- `--fix` - Attempt to fix validation issues

#### Examples

```bash
# Validate entire project
ixp-server validate

# Validate only intents
ixp-server validate --intents

# Strict validation with auto-fix
ixp-server validate --strict --fix
```

#### Validation Output

```
✓ Configuration is valid
✓ Found 5 intents, all valid
✗ Found 3 components, 1 invalid:
  - UserProfile: Missing required prop 'userId'
✓ All middleware functions are valid

Validation Summary:
- 8/9 items passed
- 1 error found
- 0 warnings
```

### `test`

Run tests for intents and components.

```bash
ixp-server test [pattern] [options]
```

#### Arguments

- `pattern` - Test file pattern (optional)

#### Options

- `--watch` - Watch mode
- `--coverage` - Generate coverage report
- `--reporter <reporter>` - Test reporter (`spec`, `json`, `html`)
- `--timeout <ms>` - Test timeout in milliseconds
- `--parallel` - Run tests in parallel

#### Examples

```bash
# Run all tests
ixp-server test

# Run specific test pattern
ixp-server test "**/*.intent.test.ts"

# Run with coverage
ixp-server test --coverage

# Watch mode
ixp-server test --watch
```

### `generate`

Generate boilerplate code for intents, components, and middleware.

```bash
ixp-server generate <type> <name> [options]
```

#### Arguments

- `type` - Type to generate (`intent`, `component`, `middleware`, `plugin`)
- `name` - Name of the generated item

#### Options

- `--template <template>` - Template to use
- `--output <dir>` - Output directory
- `--typescript` - Generate TypeScript files (default)
- `--javascript` - Generate JavaScript files
- `--test` - Generate test files

#### Examples

```bash
# Generate a new intent
ixp-server generate intent user-profile

# Generate a component with tests
ixp-server generate component ProductCard --test

# Generate middleware
ixp-server generate middleware auth-check

# Generate to specific directory
ixp-server generate intent search --output src/intents/
```

#### Generated Files

**Intent Generation**:
```
src/intents/
├── user-profile.ts
└── user-profile.test.ts  # if --test flag used
```

**Component Generation**:
```
src/components/
├── ProductCard.ts
└── ProductCard.test.ts  # if --test flag used
```

### `docs`

Generate and serve documentation.

```bash
ixp-server docs [command] [options]
```

#### Commands

- `generate` - Generate documentation
- `serve` - Serve documentation locally
- `build` - Build static documentation

#### Options

- `--output <dir>` - Documentation output directory
- `--port <port>` - Serve port (default: 4000)
- `--theme <theme>` - Documentation theme
- `--include-private` - Include private APIs

#### Examples

```bash
# Generate documentation
ixp-server docs generate

# Serve documentation locally
ixp-server docs serve

# Build static docs
ixp-server docs build --output ./docs-dist
```

### `deploy`

Deploy the server to various platforms.

```bash
ixp-server deploy <platform> [options]
```

#### Platforms

- `docker` - Generate Dockerfile and docker-compose.yml
- `vercel` - Deploy to Vercel
- `netlify` - Deploy to Netlify Functions
- `aws` - Deploy to AWS Lambda
- `gcp` - Deploy to Google Cloud Functions
- `heroku` - Deploy to Heroku

#### Options

- `--env <env>` - Environment configuration
- `--build` - Build before deployment
- `--config <path>` - Deployment configuration file

#### Examples

```bash
# Generate Docker files
ixp-server deploy docker

# Deploy to Vercel
ixp-server deploy vercel --build

# Deploy to AWS with custom config
ixp-server deploy aws --config ./aws-config.json
```

### `info`

Display project and environment information.

```bash
ixp-server info [options]
```

#### Options

- `--json` - Output as JSON
- `--system` - Include system information
- `--dependencies` - Include dependency information

#### Example Output

```
IXP Server SDK Information

Project:
  Name: my-ixp-server
  Version: 1.0.0
  IXP SDK: 1.1.1

Configuration:
  Intents: 5
  Components: 8
  Middleware: 3
  Plugins: 2

Environment:
  Node.js: v20.10.0
  npm: 10.2.3
  TypeScript: 5.3.3
  Platform: darwin-arm64
```

## Configuration File

The CLI can be configured using `ixp.config.js` or `ixp.config.json`:

```javascript
// ixp.config.js
module.exports = {
  // Development server options
  dev: {
    port: 3000,
    host: 'localhost',
    watch: ['src/**/*'],
    open: true
  },
  
  // Build options
  build: {
    output: 'dist',
    target: 'node',
    minify: true,
    sourcemap: true
  },
  
  // Test options
  test: {
    coverage: true,
    reporter: 'spec',
    timeout: 5000
  },
  
  // Validation options
  validate: {
    strict: true,
    fix: false
  }
};
```

## Environment Variables

The CLI respects these environment variables:

- `IXP_PORT` - Default server port
- `IXP_HOST` - Default server host
- `IXP_ENV` - Environment (development, production, test)
- `IXP_CONFIG` - Path to configuration file
- `IXP_LOG_LEVEL` - Logging level (debug, info, warn, error)
- `NODE_ENV` - Node.js environment

## Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Invalid command or arguments
- `3` - Configuration error
- `4` - Validation error
- `5` - Build error
- `6` - Test failure

## Troubleshooting

### Common Issues

**Command not found**:
```bash
# Make sure it's installed globally
npm install -g ixp-server

# Or use npx
npx ixp-server --help
```

**Permission errors**:
```bash
# Use npx instead of global install
npx ixp-server init my-project

# Or fix npm permissions
npm config set prefix ~/.npm-global
```

**Port already in use**:
```bash
# Use different port
ixp-server dev --port 3001

# Or kill existing process
lsof -ti:3000 | xargs kill
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Enable verbose output
ixp-server dev --verbose

# Set debug environment
DEBUG=ixp:* ixp-server dev

# Check configuration
ixp-server info --system --dependencies
```

---

**Next**: [Middleware API](./middleware.md) | [Plugins API](./plugins.md)