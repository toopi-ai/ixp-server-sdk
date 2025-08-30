# Contributing to IXP Server SDK

Thank you for your interest in contributing to the IXP Server SDK! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher (or yarn/pnpm)
- Git
- TypeScript 4.5+ (for development)

### Package Information

The IXP Server SDK is published on npm as `ixp-server@1.1.1`:
- **Registry**: https://registry.npmjs.org/
- **Installation**: `npm install ixp-server`
- **Global CLI**: `npm install -g ixp-server`
- **Repository**: https://github.com/your-org/ixp-server-sdk

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ixp-server-sdk.git
   cd ixp-server-sdk
   ```

3. Run the setup script:
   ```bash
   node scripts/setup.js
   ```

   Or manually:
   ```bash
   npm install
   npm run build
   npm test
   ```

4. Create a branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Structure

```
sdk/
├── src/                    # Source code
│   ├── core/              # Core SDK components
│   │   ├── IXPServer.ts   # Main server class with render endpoint
│   │   ├── IntentRegistry.ts    # Intent management and validation
│   │   ├── ComponentRegistry.ts # Component metadata and resolution
│   │   ├── IntentResolver.ts    # Parameter validation and rendering logic
│   │   └── index.ts       # Core exports
│   ├── middleware/        # Express middleware factories
│   │   └── index.ts       # CORS, security, rate limiting, etc.
│   ├── plugins/           # Plugin system
│   │   └── index.ts       # Swagger, health, metrics plugins
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # All SDK type definitions
│   ├── utils/             # Utility functions
│   │   ├── errors.ts      # Error handling and factories
│   │   ├── logger.ts      # Structured logging
│   │   └── metrics.ts     # Performance tracking
│   ├── cli/               # CLI tool
│   │   └── index.ts       # Project scaffolding and templates
│   └── index.ts           # Main entry point
├── tests/                 # Test files
│   ├── basic.test.ts      # Core functionality tests
│   ├── render.test.ts     # Render endpoint tests
│   └── integration.test.ts # End-to-end tests
├── examples/              # Usage examples
│   ├── basic-server.ts    # Complete server example with render
│   └── README.md          # Example documentation
├── examples-dist/         # Compiled examples (generated)
├── templates/             # CLI project templates
├── scripts/               # Build and development scripts
├── docs/                  # Generated documentation
└── dist/                  # Built files (generated)
```

## Development Workflow

### Available Scripts

- `npm run dev` - Start development mode with file watching
- `npm run build` - Build the project for production
- `npm run build:examples` - Build example files
- `npm run test` - Run the test suite (57 tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run docs` - Generate documentation
- `npm run release` - Create and publish a new release
- `npm run example:minimal` - Run minimal server example
- `npm run example:advanced` - Run advanced features example

### Basic Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run all tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Mode

For active development:

```bash
npm run dev
```

This will:
- Watch for file changes
- Automatically rebuild on changes
- Run type checking
- Show build errors in real-time

### Testing Render Functionality

When working on render-related features:

```bash
# Start the minimal example server
npx tsx examples/minimal-server.ts

# Test render endpoint (in another terminal)
curl -X POST http://localhost:3000/ixp/render \
  -H "Content-Type: application/json" \
  -d '{"intent": {"name": "hello_world", "parameters": {"name": "World"}}}'

# Test other endpoints
curl http://localhost:3000/ixp/intents
curl http://localhost:3000/ixp/components
curl http://localhost:3000/ixp/health

# Run render-specific tests
npm test -- --testNamePattern="render"
```

### Render Architecture Guidelines

When contributing to render functionality:

1. **Component Resolution**: Ensure components are resolved efficiently with proper caching
2. **Parameter Validation**: Use Zod schemas for comprehensive parameter validation
3. **Data Provider Integration**: Support both sync and async data providers
4. **Error Handling**: Provide detailed error messages without exposing sensitive data
5. **Performance**: Implement caching strategies and avoid blocking operations
6. **Security**: Sanitize all inputs and validate component metadata

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ComponentRegistry.test.ts
```

### Writing Tests

- Place test files next to the source files with `.test.ts` extension
- Use Jest for testing framework
- Follow the existing test patterns
- Aim for high test coverage (>90%)
- Include both unit tests and integration tests
- **Render Tests**: Test component resolution, parameter validation, and data provider integration
- **Performance Tests**: Include benchmarks for render endpoint response times
- **Error Handling Tests**: Verify proper error responses for invalid inputs

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Render Functionality Test Examples

```typescript
describe('Render Endpoint', () => {
  let server: IXPServer;
  
  beforeEach(() => {
    server = createIXPServer({
      intents: mockIntents,
      components: mockComponents,
      dataProvider: mockDataProvider
    });
  });

  describe('POST /ixp/render', () => {
    it('should render component for valid intent', async () => {
      const response = await request(server.app)
        .post('/ixp/render')
        .send({
          intent: {
            name: 'show_products',
            parameters: { category: 'electronics' }
          }
        })
        .expect(200);

      expect(response.body.component).toBeDefined();
      expect(response.body.component.name).toBe('ProductGrid');
      expect(response.body.component.props).toMatchObject({
        category: 'electronics'
      });
    });

    it('should validate intent parameters', async () => {
      await request(server.app)
        .post('/ixp/render')
        .send({
          intent: {
            name: 'show_products',
            parameters: { limit: 'invalid' } // Should be number
          }
        })
        .expect(400);
    });

    it('should handle data provider errors gracefully', async () => {
      const failingDataProvider = {
        async resolveIntentData() {
          throw new Error('Data provider error');
        }
      };

      const serverWithFailingProvider = createIXPServer({
        intents: mockIntents,
        components: mockComponents,
        dataProvider: failingDataProvider
      });

      await request(serverWithFailingProvider.app)
        .post('/ixp/render')
        .send(validRenderRequest)
        .expect(500);
    });
  });
});
```

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use enums for constants
- Document public APIs with JSDoc

### ESLint and Prettier

The project uses ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Code Organization

- Keep files focused and small (< 300 lines)
- Use barrel exports (`index.ts`) for clean imports
- Group related functionality together
- Separate concerns (business logic, validation, etc.)

## Plugin Development

### Creating Custom Plugins

Plugins extend the IXP server functionality. Here's how to create a custom plugin:

```typescript
import { IXPPlugin, IXPServer } from 'ixp-server';

export interface CustomPluginOptions {
  apiKey?: string;
  endpoint?: string;
}

export const customPlugin = (options: CustomPluginOptions = {}): IXPPlugin => {
  return {
    name: 'custom-plugin',
    version: '1.0.0',
    
    async initialize(server: IXPServer) {
      // Plugin initialization logic
      server.app.use('/custom', customRoutes);
      
      // Hook into render process if needed
      server.on('beforeRender', (intent, context) => {
        // Pre-render logic
      });
      
      server.on('afterRender', (component, context) => {
        // Post-render logic
      });
    },
    
    async cleanup() {
      // Cleanup resources
    }
  };
};
```

### Plugin Guidelines

1. **Naming**: Use descriptive names with consistent prefixes
2. **Error Handling**: Always handle errors gracefully
3. **Performance**: Avoid blocking operations in plugin initialization
4. **Documentation**: Include comprehensive JSDoc comments
5. **Testing**: Write tests for all plugin functionality
6. **Hooks**: Use server hooks for render process integration

### Middleware Development

Custom middleware should follow Express.js patterns:

```typescript
import { Request, Response, NextFunction } from 'express';

export const customMiddleware = (options: any = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Middleware logic
    next();
  };
};
```

## Performance Testing

### Benchmarking Render Endpoint

Performance is critical for the render endpoint. Use these guidelines:

```typescript
describe('Render Performance', () => {
  it('should render components within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await request(server.app)
      .post('/ixp/render')
      .send(complexRenderRequest)
      .expect(200);
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });
  
  it('should handle concurrent requests efficiently', async () => {
    const requests = Array(10).fill(null).map(() => 
      request(server.app)
        .post('/ixp/render')
        .send(standardRenderRequest)
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    expect(totalTime).toBeLessThan(500); // 500ms for 10 concurrent requests
  });
});
```

### Memory Usage Testing

```typescript
it('should not leak memory during repeated renders', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform many render operations
  for (let i = 0; i < 1000; i++) {
    await request(server.app)
      .post('/ixp/render')
      .send(renderRequest);
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be reasonable (< 10MB)
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
});
```

## Commit Guidelines

We use [Conventional Commits](https://conventionalcommits.org/) for commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```
feat(core): add support for custom middleware
fix(cli): resolve template generation issue
docs(readme): update installation instructions
test(registry): add tests for component validation
```

## Troubleshooting

### Common Render Issues

#### Component Not Found
```
Error: Component 'ProductGrid' not found in registry
```
**Solution**: Ensure the component is registered in your component registry:
```typescript
const components = {
  ProductGrid: {
    name: 'ProductGrid',
    props: { /* component props schema */ }
  }
};
```

#### Intent Resolution Failed
```
Error: No component mapping found for intent 'show_products'
```
**Solution**: Check your intent-to-component mappings:
```typescript
const intents = {
  show_products: {
    component: 'ProductGrid',
    parameters: { /* parameter validation */ }
  }
};
```

#### Parameter Validation Error
```
Error: Invalid parameter 'limit': expected number, got string
```
**Solution**: Ensure parameters match the expected types in your intent definition.

#### Data Provider Timeout
```
Error: Data provider timeout after 5000ms
```
**Solution**: Optimize your data provider or increase timeout:
```typescript
const server = createIXPServer({
  // ... other config
  renderOptions: {
    dataProviderTimeout: 10000 // 10 seconds
  }
});
```

### Debug Mode

Enable debug logging for detailed render information:
```typescript
const server = createIXPServer({
  // ... other config
  debug: true
});
```

### Performance Issues

1. **Slow Render Times**: Check data provider performance and consider caching
2. **Memory Leaks**: Ensure proper cleanup in custom plugins and middleware
3. **High CPU Usage**: Profile component resolution logic and optimize complex mappings

## Pull Request Process

1. **Before Creating a PR**:
   - Ensure your branch is up to date with `main`
   - Run all tests and ensure they pass
   - Run linting and fix any issues
   - Update documentation if needed

2. **Creating the PR**:
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

3. **PR Requirements**:
   - All tests must pass
   - Code coverage should not decrease
   - At least one maintainer approval
   - All conversations resolved

4. **After Approval**:
   - Squash and merge (preferred)
   - Delete the feature branch

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Release Process

Releases are handled by maintainers using the automated release script:

```bash
# Patch release (1.1.1 -> 1.1.2)
node scripts/release.js patch

# Minor release (1.1.1 -> 1.2.0)
node scripts/release.js minor

# Major release (1.1.1 -> 2.0.0)
node scripts/release.js major
```

The release process:
1. Runs all tests and checks (57 tests must pass)
2. Builds the project and examples
3. Updates version in package.json
4. Generates changelog entries
5. Creates git tag
6. Publishes to npm registry
7. Creates GitHub release

### Manual Release Steps

For manual releases:

```bash
# 1. Ensure you're logged into npm
npm whoami

# 2. Run all tests
npm test

# 3. Build the project
npm run build

# 4. Update version
npm version patch|minor|major

# 5. Publish to npm
npm publish

# 6. Push changes and tags
git push origin main --tags
```

### Current Version

The latest published version is `1.1.1`, available on npm registry.

## Getting Help

- Check existing [issues](https://github.com/your-org/ixp-server-sdk/issues)
- Read the [documentation](./README.md)
- Join our [Discord/Slack community](#)
- Ask questions in [discussions](https://github.com/your-org/ixp-server-sdk/discussions)

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to the IXP Server SDK! 🎉