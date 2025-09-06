# examples

IXP Server project created with ixp-server CLI.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Your IXP server will be running at http://localhost:3001

## Available Endpoints

- `GET /ixp/intents` - List all available intents
- `GET /ixp/components` - List all available components
- `POST /ixp/render` - Render component for intent
- `GET /ixp/crawler_content` - Get crawlable content
- `GET /ixp/health` - Health check

## Configuration

Edit the configuration files in the `config/` directory:

- `intents.json` - Define your intents
- `components.json` - Define your components

## CLI Commands

- `npm run validate` - Validate configuration files
- `npm run generate:intent <name>` - Generate new intent
- `npm run generate:component <name>` - Generate new component

## Learn More

- [IXP Specification](https://github.com/ixp/specification)
- [IXP Server SDK Documentation](https://github.com/ixp/ixp-server-sdk)
