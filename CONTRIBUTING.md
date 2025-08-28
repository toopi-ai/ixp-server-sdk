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
│   ├── middleware/        # Express middleware
│   ├── plugins/           # Plugin system
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── cli/               # CLI tool
│   └── index.ts           # Main entry point
├── tests/                 # Test files
├── examples/              # Usage examples
├── scripts/               # Build and development scripts
├── docs/                  # Documentation
└── dist/                  # Built files (generated)
```

## Development Workflow

### Available Scripts

- `npm run dev` - Start development mode with file watching
- `npm run build` - Build the project for production
- `npm run test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run docs` - Generate documentation

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
# Patch release (1.0.0 -> 1.0.1)
node scripts/release.js patch

# Minor release (1.0.0 -> 1.1.0)
node scripts/release.js minor

# Major release (1.0.0 -> 2.0.0)
node scripts/release.js major
```

The release process:
1. Runs all tests and checks
2. Builds the project
3. Updates version in package.json
4. Generates changelog
5. Creates git tag
6. Publishes to npm
7. Creates GitHub release

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