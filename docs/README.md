# IXP Server SDK Documentation

Welcome to the Intent Exchange Protocol (IXP) Server SDK documentation. This SDK provides a comprehensive framework for building IXP servers that enable seamless component sharing and intent resolution across applications.

## 📚 Documentation Structure

- **[Getting Started](./getting-started.md)** - Quick start guide and basic setup
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Configuration](./configuration.md)** - Server configuration options
- **[Middleware](./middleware.md)** - Built-in and custom middleware
- **[Plugins](./plugins.md)** - Available plugins and plugin development
- **[CLI Reference](./cli-reference.md)** - Command-line interface documentation
- **[Examples](./examples.md)** - Usage examples and patterns
- **[Theming](./theming.md)** - Theme system and customization
- **[Advanced Features](./advanced-features.md)** - Advanced usage patterns
- **[Migration Guide](./migration-guide.md)** - Upgrading between versions

## 🚀 Quick Start

```bash
# Install the SDK
npm install ixp-server

# Create a new project
npx ixp-server create my-ixp-server

# Start development server
cd my-ixp-server
npm run dev
```

## 🏗️ Basic Usage

```typescript
import { createIXPServer } from 'ixp-server';

const server = createIXPServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001
});

server.listen();
```

## 🌟 Key Features

- **Intent Resolution** - Map user intents to UI components
- **Component Registry** - Manage remote component definitions
- **Plugin System** - Extensible architecture with built-in plugins
- **Middleware Support** - Request/response processing pipeline
- **CLI Tools** - Project scaffolding and management
- **TypeScript Support** - Full type safety and IntelliSense
- **Theme System** - Customizable UI theming
- **Security** - Built-in security policies and validation
- **Performance** - Optimized for production workloads
- **Developer Experience** - Hot reload, debugging, and testing tools

## 📋 Requirements

- Node.js 16.0.0 or higher
- TypeScript 4.5.0 or higher (for TypeScript projects)

## 🤝 Contributing

See the main repository for contribution guidelines.

## 📄 License

This project is licensed under the MIT License.