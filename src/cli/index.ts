#!/usr/bin/env node

/**
 * IXP Server CLI Tool
 * 
 * Provides commands for scaffolding and managing IXP servers
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { dirname } from 'path';
import { version } from '../../package.json';

// Use current working directory for CLI operations
const cliWorkingDir = process.cwd();


const program = new Command();

// Package information
program
  .name('ixp-server')
  .description('CLI tool for creating and managing IXP servers')
  .version(version || '1.1.1')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

/**
 * Create a new IXP server project
 */
program
  .command('create <project-name>')
  .description('Create a new IXP server project')
  .option('-t, --template <template>', 'Project template to use', 'basic')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .option('--typescript', 'Use TypeScript template')
  .option('--javascript', 'Use JavaScript template')
  .action(async (projectName: string, options) => {
    try {
      await createProject(projectName, options);
    } catch (error) {
      console.error(chalk.red('Error creating project:'), error);
      process.exit(1);
    }
  });

/**
 * Initialize IXP server in existing project
 */
program
  .command('init')
  .description('Initialize IXP server in current directory')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .action(async (options) => {
    try {
      await initProject('.', options);
    } catch (error) {
      console.error(chalk.red('Error initializing project:'), error);
      process.exit(1);
    }
  });

/**
 * Start production server
 */
program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Port to run server on', '3001')
  .option('-c, --config <path>', 'Path to config file', './ixp.config.js')
  .option('-e, --env <env>', 'Environment mode', 'production')
  .action(async (options) => {
    try {
      await startProductionServer(options);
    } catch (error) {
      console.error(chalk.red('Error starting server:'), error);
      process.exit(1);
    }
  });

/**
 * Generate intent definition
 */
program
  .command('generate:intent <name>')
  .description('Generate a new intent definition')
  .option('-d, --description <description>', 'Intent description')
  .option('-c, --component <component>', 'Component name')
  .option('-o, --output <path>', 'Output file path', './config/intents.json')
  .action(async (name: string, options) => {
    try {
      await generateIntent(name, options);
    } catch (error) {
      console.error(chalk.red('Error generating intent:'), error);
      process.exit(1);
    }
  });

/**
 * Generate component definition
 */
program
  .command('generate:component <name>')
  .description('Generate a new component definition')
  .option('-f, --framework <framework>', 'Component framework', 'react')
  .option('-u, --url <url>', 'Remote URL for component')
  .option('-o, --output <path>', 'Output file path', './config/components.json')
  .action(async (name: string, options) => {
    try {
      await generateComponent(name, options);
    } catch (error) {
      console.error(chalk.red('Error generating component:'), error);
      process.exit(1);
    }
  });

/**
 * Validate configuration files
 */
program
  .command('validate')
  .description('Validate IXP configuration files')
  .option('-i, --intents <path>', 'Path to intents file', './config/intents.json')
  .option('-c, --components <path>', 'Path to components file', './config/components.json')
  .option('--strict', 'Enable strict validation mode')
  .action(async (options) => {
    try {
      await validateConfig(options);
    } catch (error) {
      console.error(chalk.red('Validation error:'), error);
      process.exit(1);
    }
  });

/**
 * Test server functionality
 */
program
  .command('test')
  .description('Run tests for IXP server')
  .option('-p, --port <port>', 'Port to test against', '3001')
  .option('-u, --url <url>', 'Base URL to test against')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '5000')
  .action(async (options) => {
    try {
      await runTests(options);
    } catch (error) {
      console.error(chalk.red('Tests failed:'), error);
      process.exit(1);
    }
  });

/**
 * Setup automatic rendering for components
 */
program
  .command('setup:render')
  .description('Setup automatic rendering for components based on framework')
  .option('-f, --framework <framework>', 'Component framework (react, vue, vanilla)', 'react')
  .option('-p, --port <port>', 'Port for the server', '3000')
  .option('-c, --config <path>', 'Path to config directory', './config')
  .option('--no-routes', 'Skip route generation')
  .action(async (options) => {
    try {
      await setupRendering(options);
    } catch (error: any) {
      console.error(chalk.red(`Error setting up rendering: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Show server information
 */
program
  .command('info')
  .description('Display server and configuration information')
  .option('-c, --config <path>', 'Path to config file', './ixp.config.js')
  .action(async (options) => {
    try {
      await showInfo(options);
    } catch (error) {
      console.error(chalk.red('Error getting info:'), error);
      process.exit(1);
    }
  });

/**
 * Generate documentation
 */
program
  .command('docs')
  .description('Generate API documentation')
  .option('-o, --output <path>', 'Output directory', './docs')
  .option('-f, --format <format>', 'Documentation format', 'html')
  .action(async (options) => {
    try {
      await generateDocs(options);
    } catch (error) {
      console.error(chalk.red('Error generating docs:'), error);
      process.exit(1);
    }
  });

/**
 * Start development server
 */
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run server on', '3001')
  .option('-c, --config <path>', 'Path to config file', './ixp.config.js')
  .action(async (options) => {
    try {
      await startDevServer(options);
    } catch (error) {
      console.error(chalk.red('Error starting dev server:'), error);
      process.exit(1);
    }
  });

/**
 * Build project for production
 */
program
  .command('build')
  .description('Build project for production')
  .option('-o, --output <path>', 'Output directory', './dist')
  .action(async (options) => {
    try {
      await buildProject(options);
    } catch (error) {
      console.error(chalk.red('Build error:'), error);
      process.exit(1);
    }
  });

/**
 * Create a new project
 */
async function createProject(projectName: string, options: any): Promise<void> {
  const projectPath = path.resolve(projectName);
  
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory ${projectName} already exists`);
  }
  
  console.log(chalk.blue(`Creating IXP server project: ${projectName}`));
  
  // Create project directory
  await fs.ensureDir(projectPath);
  
  // Get project configuration
  const config = options.yes ? getDefaultConfig() : await getProjectConfig(options);
  
  // Generate project files
  await generateProjectFiles(projectPath, config);
  
  console.log(chalk.green(`\n✅ Project ${projectName} created successfully!`));
  console.log(chalk.yellow('\nNext steps:'));
  console.log(`  cd ${projectName}`);
  console.log('  npm install');
  console.log('  npm run dev');
}

/**
 * Initialize project in existing directory
 */
async function initProject(projectPath: string, options: any): Promise<void> {
  console.log(chalk.blue('Initializing IXP server in current directory'));
  
  const config = options.yes ? getDefaultConfig() : await getProjectConfig(options);
  await generateProjectFiles(projectPath, config);
  
  console.log(chalk.green('\n✅ IXP server initialized successfully!'));
}

/**
 * Get project configuration from user
 */
async function getProjectConfig(options: any): Promise<any> {
  const questions = [
    {
      type: 'list',
      name: 'language',
      message: 'Select language:',
      choices: ['TypeScript', 'JavaScript'],
      default: 'TypeScript',
      when: !options.typescript && !options.javascript
    },
    {
      type: 'input',
      name: 'port',
      message: 'Server port:',
      default: '3001',
      validate: (input: string) => {
        const port = parseInt(input);
        return port > 0 && port < 65536 ? true : 'Please enter a valid port number';
      }
    },
    {
      type: 'confirm',
      name: 'includeExamples',
      message: 'Include example intents and components?',
      default: true
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features:',
      choices: [
        { name: 'Swagger Documentation', value: 'swagger' },
        { name: 'Health Monitoring', value: 'health' },
        { name: 'Metrics Collection', value: 'metrics' },
        { name: 'Rate Limiting', value: 'rateLimit' },
        { name: 'Request Logging', value: 'logging' }
      ]
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  return {
    language: options.typescript ? 'TypeScript' : options.javascript ? 'JavaScript' : answers.language,
    port: answers.port,
    includeExamples: answers.includeExamples,
    features: answers.features || [],
    template: options.template
  };
}

/**
 * Get default configuration
 */
function getDefaultConfig(): any {
  return {
    language: 'TypeScript',
    port: '3001',
    includeExamples: true,
    features: ['swagger', 'health', 'metrics'],
    template: 'basic'
  };
}

/**
 * Generate project files
 */
async function generateProjectFiles(projectPath: string, config: any): Promise<void> {
  const isTypeScript = config.language === 'TypeScript';
  const ext = isTypeScript ? 'ts' : 'js';
  
  // Create directory structure
  await fs.ensureDir(path.join(projectPath, 'src'));
  await fs.ensureDir(path.join(projectPath, 'src', 'components'));
  await fs.ensureDir(path.join(projectPath, 'src', 'templates'));
  await fs.ensureDir(path.join(projectPath, 'config'));
  await fs.ensureDir(path.join(projectPath, 'public'));
  
  // Copy error page templates
  const templatesSourcePath = path.join(__dirname, '../src/templates');
  if (await fs.pathExists(templatesSourcePath)) {
    await fs.copy(templatesSourcePath, path.join(projectPath, 'src', 'templates'));
  }
  
  // Generate package.json
  const packageJson = {
    name: path.basename(projectPath),
    version: '1.1.1',
    description: 'IXP Server project',
    main: `src/index.${ext}`,
    scripts: {
      dev: isTypeScript ? 'tsx watch src/index.ts' : 'node src/index.js',
      build: 'npm run build:server && npm run build:components && npm run copy:templates && npm run copy:public',
      'build:server': 'tsc',
      'copy:templates': 'cp -r src/templates dist/ 2>/dev/null || true',
      'copy:public': 'cp -r public dist/ 2>/dev/null || true',
      start: isTypeScript ? 'node dist/index.js' : 'node src/index.js',
      'build:components': 'vite build --outDir public',
      'dev:components': 'vite --outDir public',
      validate: 'ixp-server validate',
      'generate:intent': 'ixp-server generate:intent',
      'generate:component': 'ixp-server generate:component'
    },
    dependencies: {
      'ixp-server': '^1.1.1',
      'express': '^4.18.2',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: isTypeScript ? {
      'typescript': '^5.3.3',
      'tsx': '^4.6.2',
      '@types/node': '^20.10.5',
      '@types/express': '^4.17.21',
      '@types/react': '^18.2.45',
      '@types/react-dom': '^18.2.18',
      'vite': '^4.4.9',
      '@vitejs/plugin-react': '^4.2.0'
    } : {
      'vite': '^4.4.9',
      '@vitejs/plugin-react': '^4.2.0'
    }
  };
  
  await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  
  // Generate TypeScript config if needed
  if (isTypeScript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        outDir: './dist',
        rootDir: './src',
        declaration: true,
        sourceMap: true,
        jsx: 'react-jsx'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    await fs.writeJSON(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  }
  
  // Generate main server file
  const serverCode = generateServerCode(config, isTypeScript);
  await fs.writeFile(path.join(projectPath, `src/index.${ext}`), serverCode);
  
  // Generate configuration files
  if (config.includeExamples) {
    await generateExampleIntents(path.join(projectPath, 'config/intents.json'));
    await generateExampleComponents(path.join(projectPath, 'config/components.json'));
  } else {
    await generateEmptyIntents(path.join(projectPath, 'config/intents.json'));
    await generateEmptyComponents(path.join(projectPath, 'config/components.json'));
  }
  
  // Note: Vite config and components index generation would be implemented here
  // For now, these are placeholder calls that have been removed to fix compilation
  
  // Generate README
  const readme = generateReadme(config);
  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  
  // Generate .gitignore
  const gitignore = 'node_modules/\ndist/\n.env\n*.log\n.DS_Store\n';
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
}

/**
 * Generate server code
 */
function generateServerCode(config: any, isTypeScript: boolean): string {
  const imports = isTypeScript 
    ? 'import { createIXPServer } from \'ixp-server\';\nimport express from \'express\';\nimport path from \'path\';'
    : 'const { createIXPServer } = require(\'ixp-server\');\nconst express = require(\'express\');\nconst path = require(\'path\');';
  
  const plugins = config.features.map((feature: string) => {
    switch (feature) {
      case 'swagger':
        return `  // Add swagger documentation at /ixp/api-docs\n  server.addPlugin('swagger', { title: '${path.basename(process.cwd())} API' });`;
      case 'health':
        return '  // Add health endpoint at /ixp/health\n  server.addPlugin(\'health\');';
      case 'metrics':
        return '  // Add metrics endpoint at /ixp/metrics\n  server.addPlugin(\'metrics\');';
      default:
        return '';
    }
  }).filter(Boolean).join('\n');
  
  const middleware = config.features.map((feature: string) => {
    switch (feature) {
      case 'rateLimit':
        return '  // Add rate limiting\n  server.use(server.rateLimit({ max: 100, windowMs: 15 * 60 * 1000 }));';
      case 'logging':
        return '  // Add request logging\n  server.use(server.logging({ level: \'info\' }));';
      default:
        return '';
    }
  }).filter(Boolean).join('\n');
  
  return `${imports}

async function main() {
  const server = createIXPServer({
    intents: './config/intents.json',
    components: './config/components.json',
    port: ${config.port},
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:5173']
    },
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    },
    static: {
      enabled: true,
      publicPath: path.resolve('./public'),
      urlPath: '/public'
    }
  });

${plugins}
${middleware}

  // Set up Express app
  const app = server.getExpressApp();

  // Serve static files from the components directory
  app.use(express.static(path.join(__dirname, 'components')));

  await server.listen();
  console.log('🚀 IXP Server is running!');
  console.log('🌐 Server available at: http://localhost:${config.port}');
}

main().catch(console.error);
`;
}

/**
 * Generate example intents
 */
async function generateExampleIntents(filePath: string): Promise<void> {
  const intents = {
    intents: [
      {
        name: 'show_welcome',
        description: 'Display welcome message',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User name for personalized greeting'
            }
          }
        },
        component: 'WelcomeMessage',
        version: '1.1.1',
        crawlable: true
      }
    ]
  };
  
  await fs.writeJSON(filePath, intents, { spaces: 2 });
}

/**
 * Generate example components
 */
async function generateExampleComponents(filePath: string): Promise<void> {
  const components = {
    components: {
      WelcomeMessage: {
        framework: 'react',
        remoteUrl: '/public/components.js',
        exportName: 'WelcomeMessage',
        propsSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        version: '1.1.1',
        allowedOrigins: ['*'],
        bundleSize: '5KB',
        performance: {
          tti: '0.2s',
          bundleSizeGzipped: '2KB'
        },
        securityPolicy: {
          allowEval: false,
          maxBundleSize: '50KB',
          sandboxed: true
        },
        crawlable: true
      }
    }
  };
  
  await fs.writeJSON(filePath, components, { spaces: 2 });
}

/**
 * Generate empty intents file
 */
async function generateEmptyIntents(filePath: string): Promise<void> {
  await fs.writeJSON(filePath, { intents: [] }, { spaces: 2 });
}

/**
 * Generate empty components file
 */
async function generateEmptyComponents(filePath: string): Promise<void> {
  await fs.writeJSON(filePath, { components: {} }, { spaces: 2 });
}

/**
 * Generate README
 */
function generateReadme(config: any): string {
  return `# ${path.basename(process.cwd())}

IXP Server project created with ixp-server CLI.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Your IXP server will be running at http://localhost:${config.port}

## Available Endpoints

- \`GET /ixp/intents\` - List all available intents
- \`GET /ixp/components\` - List all available components
- \`POST /ixp/render\` - Render component for intent
- \`GET /ixp/crawler_content\` - Get crawlable content
- \`GET /ixp/health\` - Health check
${config.features.includes('swagger') ? '- \`GET /ixp/api-docs\` - Swagger documentation\n' : ''}${config.features.includes('metrics') ? '- \`GET /ixp/metrics\` - Server metrics\n' : ''}
## Configuration

Edit the configuration files in the \`config/\` directory:

- \`intents.json\` - Define your intents
- \`components.json\` - Define your components

## CLI Commands

- \`npm run validate\` - Validate configuration files
- \`npm run generate:intent <name>\` - Generate new intent
- \`npm run generate:component <name>\` - Generate new component

## Learn More

- [IXP Specification](https://github.com/ixp/specification)
- [IXP Server SDK Documentation](https://github.com/ixp/ixp-server-sdk)
`;
}

/**
 * Generate intent definition
 */
async function generateIntent(name: string, options: any): Promise<void> {
  console.log(chalk.blue(`Generating intent: ${name}`));
  
  const config = options.yes ? { crawlable: false } : await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Intent description:',
      default: options.description || `${name} intent`
    },
    {
      type: 'input',
      name: 'component',
      message: 'Component name:',
      default: options.component || name.charAt(0).toUpperCase() + name.slice(1)
    },
    {
      type: 'confirm',
      name: 'crawlable',
      message: 'Should this intent be exposed to crawler?',
      default: false
    }
  ]);
  
  const intent = {
    name,
    description: config.description || options.description || `${name} intent`,
    parameters: {
      type: 'object',
      properties: {}
    },
    component: config.component || options.component || name.charAt(0).toUpperCase() + name.slice(1),
    version: '1.1.1',
    crawlable: config.crawlable || false
  };
  
  // Read existing intents file
  const intentsPath = path.resolve(options.output);
  let intentsData: { intents: any[] } = { intents: [] };
  
  if (await fs.pathExists(intentsPath)) {
    intentsData = await fs.readJSON(intentsPath);
  }
  
  // Add new intent
  intentsData.intents.push(intent);
  
  // Write back to file
  await fs.writeJSON(intentsPath, intentsData, { spaces: 2 });
  
  console.log(chalk.green(`✅ Intent '${name}' generated successfully!`));
}

/**
 * Generate component definition
 */
async function generateComponent(name: string, options: any): Promise<void> {
  console.log(chalk.blue(`Generating component: ${name}`));
  
  const config = options.yes ? { framework: 'react', url: '/public/components.js', crawlable: false } : await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Component framework:',
      choices: ['react', 'vue', 'vanilla'],
      default: options.framework || 'react'
    },
    {
      type: 'input',
      name: 'url',
      message: 'Remote URL:',
      default: options.url || '/public/components.js'
    },
    {
      type: 'confirm',
      name: 'crawlable',
      message: 'Should this component be exposed to crawler?',
      default: false
    }
  ]);
  
  const framework = config.framework || options.framework || 'react';
  const remoteUrl = config.url || options.url || '/public/components.js';
  
  const component = {
    framework,
    remoteUrl,
    exportName: name,
    propsSchema: {
      type: 'object',
      properties: {}
    },
    version: '1.1.1',
    allowedOrigins: ['*'],
    bundleSize: '10KB',
    performance: {
      tti: '0.5s',
      bundleSizeGzipped: '3KB'
    },
    securityPolicy: {
      allowEval: false,
      maxBundleSize: '100KB',
      sandboxed: true
    },
    crawlable: config.crawlable || false
  };
  
  // Read existing components file
  const componentsPath = path.resolve(options.output);
  let componentsData: { components: Record<string, any> } = { components: {} };
  
  if (await fs.pathExists(componentsPath)) {
    componentsData = await fs.readJSON(componentsPath);
  }
  
  // Add new component
  componentsData.components[name] = component;
  
  // Write back to file
  await fs.writeJSON(componentsPath, componentsData, { spaces: 2 });
  
  // Create component directory if it doesn't exist
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  await fs.ensureDir(componentsDir);
  
  // Create component file based on framework
  const componentContent = generateComponentContent(name, framework);
  const fileExtension = framework === 'react' ? 'tsx' : framework === 'vue' ? 'vue' : 'js';
  await fs.writeFile(path.join(componentsDir, `${name}.${fileExtension}`), componentContent);
  
  // Update or create index file to export all components
  await updateComponentIndex(componentsDir, name, framework);
  
  // Create or update Vite config if it doesn't exist
  await createViteConfig(framework);
  
  console.log(chalk.green(`✅ Component '${name}' generated successfully!`));
  console.log(chalk.yellow('Next steps:'));
  console.log(`  1. Update the props schema in ${options.output}`);
  console.log(`  2. Customize your component in src/components/${name}.${fileExtension}`);
  console.log(`  3. Run 'npm run dev' to start the development server`);
}

/**
 * Generate component content based on framework
 */
function generateComponentContent(name: string, framework: string): string {
  if (framework === 'react') {
    return `import React from 'react';

interface ${name}Props {
  // Define your props here
}

const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="${name.toLowerCase()}-container">
      <h2>${name}</h2>
      <p>This is a new ${name} component.</p>
    </div>
  );
};

export default ${name};
`;
  } else if (framework === 'vue') {
    return `<template>
  <div class="${name.toLowerCase()}-container">
    <h2>${name}</h2>
    <p>This is a new ${name} component.</p>
  </div>
</template>

<script>
export default {
  name: '${name}',
  props: {
    // Define your props here
  },
  data() {
    return {
      // Component state
    };
  },
  methods: {
    // Component methods
  }
};
</script>

<style scoped>
.${name.toLowerCase()}-container {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
`;
  } else {
    // Vanilla JS
    return `// ${name} Component

class ${name} extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        .${name.toLowerCase()}-container {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      </style>
      <div class="${name.toLowerCase()}-container">
        <h2>${name}</h2>
        <p>This is a new ${name} component.</p>
      </div>
    \`;
  }
}

customElements.define('${name.toLowerCase()}-component', ${name});

export default ${name};
`;
  }
}

/**
 * Update component index file
 */
async function updateComponentIndex(componentsDir: string, name: string, framework: string) {
  const indexPath = path.join(componentsDir, 'index.ts');
  let indexContent = '';
  
  // Create or update the index file
  if (await fs.pathExists(indexPath)) {
    // Read existing content
    indexContent = await fs.readFile(indexPath, 'utf8');
    
    // Check if the component is already exported
    if (!indexContent.includes(`export { default as ${name} }`)) {
      // Add the new export
      indexContent += `\nexport { default as ${name} } from './${name}';
`;
    }
  } else {
    // Create a new index file with a header comment
    indexContent = `// Export all components\nexport { default as ${name} } from './${name}';
`;
  }
  
  // Write the updated index file
  await fs.writeFile(indexPath, indexContent);
}

/**
 * Create Vite configuration file
 */
async function createViteConfig(framework: string) {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  
  // Only create if it doesn't exist
  if (!await fs.pathExists(viteConfigPath)) {
    let viteConfig = '';
    
    if (framework === 'react') {
      viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist/public',
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'Components',
      formats: ['umd'],
      fileName: () => 'components.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
`;
    } else if (framework === 'vue') {
      viteConfig = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist/public',
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'Components',
      formats: ['umd'],
      fileName: () => 'components.js'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
`;
    } else {
      // Vanilla JS
      viteConfig = `import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist/public',
    lib: {
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'Components',
      formats: ['umd'],
      fileName: () => 'components.js'
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
`;
    }
    
    await fs.writeFile(viteConfigPath, viteConfig);
    
    // Update package.json to include build scripts
    await updatePackageJsonForVite();
  }
}

/**
 * Update package.json with Vite build scripts
 */
async function updatePackageJsonForVite() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJSON(packageJsonPath);
      
      // Add or update scripts
      packageJson.scripts = packageJson.scripts || {};
      
      if (!packageJson.scripts['build:components']) {
        packageJson.scripts['build:components'] = 'vite build';
      }
      
      if (!packageJson.scripts['dev:components']) {
        packageJson.scripts['dev:components'] = 'vite';
      }
      
      // Add required dependencies if they don't exist
      packageJson.devDependencies = packageJson.devDependencies || {};
      
      if (!packageJson.devDependencies['vite']) {
        packageJson.devDependencies['vite'] = '^4.4.9';
      }
      
      // Write the updated package.json
      await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      
      console.log(chalk.blue('📦 Updated package.json with Vite build scripts'));
      console.log(chalk.yellow('Run npm install to install new dependencies'));
    } catch (error) {
      console.error('Error updating package.json:', error);
    }
  }
}

/**
 * Setup automatic rendering for components based on framework
 */
async function setupRendering(options: any): Promise<void> {
  console.log(chalk.blue(`Setting up automatic rendering for ${options.framework} components`));
  
  // Validate framework
  const framework = options.framework.toLowerCase();
  if (!['react', 'vue', 'vanilla'].includes(framework)) {
    throw new Error(`Unsupported framework: ${framework}. Supported frameworks are: react, vue, vanilla`);
  }
  
  // Create server file if it doesn't exist
  const serverFilePath = path.resolve('./src/server.ts');
  const configPath = path.resolve(options.config);
  
  // Ensure config directory exists
  await fs.ensureDir(configPath);
  
  // Check if components.json exists, create if not
  const componentsPath = path.resolve(configPath, 'components.json');
  if (!await fs.pathExists(componentsPath)) {
    await fs.writeJSON(componentsPath, { components: {} }, { spaces: 2 });
    console.log(chalk.green(`✅ Created components configuration at ${componentsPath}`));
  }
  
  // Check if intents.json exists, create if not
  const intentsPath = path.resolve(configPath, 'intents.json');
  if (!await fs.pathExists(intentsPath)) {
    await fs.writeJSON(intentsPath, { intents: [] }, { spaces: 2 });
    console.log(chalk.green(`✅ Created intents configuration at ${intentsPath}`));
  }
  
  // Create server file with automatic rendering setup
  let serverContent = '';
  
  // Import statements based on framework
  if (framework === 'react') {
    serverContent = `import { createIXPServer } from 'ixp-server-sdk';
import { createRenderMiddleware } from 'ixp-server-sdk/middleware';
import { createReactRenderer } from 'ixp-server-sdk/renderers';
import path from 'path';

// Create IXP Server
const server = createIXPServer({
  port: ${options.port},
  configDir: path.resolve('${options.config}'),
});

// Setup React renderer
const reactRenderer = createReactRenderer();

// Add rendering middleware
server.use(
  createRenderMiddleware({
    renderers: {
      react: reactRenderer,
    },
    defaultRenderer: 'react',
  })
);

// Start server
server.start().then(() => {
  console.log("✅ IXP Server started on port ${options.port}");
  console.log("🚀 React component rendering available at http://localhost:${options.port}/render-ui");
});
`;
  } else if (framework === 'vue') {
    serverContent = `import { createIXPServer } from 'ixp-server-sdk';
import { createRenderMiddleware } from 'ixp-server-sdk/middleware';
import { createVueRenderer } from 'ixp-server-sdk/renderers';
import path from 'path';

// Create IXP Server
const server = createIXPServer({
  port: ${options.port},
  configDir: path.resolve('${options.config}'),
});

// Setup Vue renderer
const vueRenderer = createVueRenderer();

// Add rendering middleware
server.use(
  createRenderMiddleware({
    renderers: {
      vue: vueRenderer,
    },
    defaultRenderer: 'vue',
  })
);

// Start server
server.start().then(() => {
  console.log("✅ IXP Server started on port ${options.port}");
  console.log("🚀 Vue component rendering available at http://localhost:${options.port}/render-ui");
});
`;
  } else { // vanilla
    serverContent = `import { createIXPServer } from 'ixp-server-sdk';
import { createRenderMiddleware } from 'ixp-server-sdk/middleware';
import { createVanillaJSRenderer } from 'ixp-server-sdk/renderers';
import path from 'path';

// Create IXP Server
const server = createIXPServer({
  port: ${options.port},
  configDir: path.resolve('${options.config}'),
});

// Setup Vanilla JS renderer
const vanillaRenderer = createVanillaJSRenderer();

// Add rendering middleware
server.use(
  createRenderMiddleware({
    renderers: {
      vanilla: vanillaRenderer,
    },
    defaultRenderer: 'vanilla',
  })
);

// Start server
server.start().then(() => {
  console.log("✅ IXP Server started on port ${options.port}");
  console.log("🚀 Vanilla JS component rendering available at http://localhost:${options.port}/render-ui");
});
`;
  }
  
  // Write server file
  if (!await fs.pathExists(serverFilePath)) {
    await fs.outputFile(serverFilePath, serverContent);
    console.log(chalk.green(`✅ Created server file with ${framework} rendering at ${serverFilePath}`));
  } else {
    // Ask user if they want to overwrite
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Server file already exists at ${serverFilePath}. Overwrite?`,
        default: false
      }
    ]);
    
    if (overwrite) {
      await fs.outputFile(serverFilePath, serverContent);
      console.log(chalk.green(`✅ Updated server file with ${framework} rendering at ${serverFilePath}`));
    } else {
      console.log(chalk.yellow(`⚠️ Skipped server file creation. You'll need to manually configure rendering.`));
    }
  }
  
  // Generate routes if needed
  if (options.routes !== false) {
    // Create routes directory if it doesn't exist
    const routesDir = path.resolve('./src/routes');
    await fs.ensureDir(routesDir);
    
    // Create render route file
    const renderRoutePath = path.resolve(routesDir, 'render.ts');
    const renderRouteContent = `import { Router } from 'express';
import { createRenderMiddleware } from 'ixp-server-sdk/middleware';
import { create${framework === 'vanilla' ? 'VanillaJS' : framework.charAt(0).toUpperCase() + framework.slice(1)}Renderer } from 'ixp-server-sdk/renderers';

const router = Router();

// Setup ${framework} renderer
const ${framework}Renderer = create${framework === 'vanilla' ? 'VanillaJS' : framework.charAt(0).toUpperCase() + framework.slice(1)}Renderer();

// Add rendering middleware to router
router.use(
  createRenderMiddleware({
    renderers: {
      ${framework}: ${framework}Renderer,
    },
    defaultRenderer: '${framework}',
  })
);

export default router;
`;
    
    if (!await fs.pathExists(renderRoutePath)) {
      await fs.outputFile(renderRoutePath, renderRouteContent);
      console.log(chalk.green(`✅ Created render route at ${renderRoutePath}`));
    } else {
      // Ask user if they want to overwrite
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Render route file already exists at ${renderRoutePath}. Overwrite?`,
          default: false
        }
      ]);
      
      if (overwrite) {
        await fs.outputFile(renderRoutePath, renderRouteContent);
        console.log(chalk.green(`✅ Updated render route at ${renderRoutePath}`));
      } else {
        console.log(chalk.yellow(`⚠️ Skipped render route creation. You'll need to manually configure rendering routes.`));
      }
    }
  }
  
  console.log(chalk.green(`\n✅ Automatic rendering setup complete for ${framework} components!`));
  console.log(chalk.blue(`\nTo start your server, run:`));
  console.log(chalk.cyan(`  npm start`));
  console.log(chalk.blue(`\nTo access the rendering UI, visit:`));
  console.log(chalk.cyan(`  http://localhost:${options.port}/render-ui`));
}

/**
 * Validate configuration files
 */
async function validateConfig(options: any): Promise<void> {
  console.log(chalk.blue('Validating IXP configuration...'));
  
  const errors: string[] = [];
  
  // Validate intents file
  try {
    const intentsPath = path.resolve(options.intents);
    if (await fs.pathExists(intentsPath)) {
      const intentsData = await fs.readJSON(intentsPath);
      
      if (!intentsData.intents || !Array.isArray(intentsData.intents)) {
        errors.push('Intents file must contain an "intents" array');
      } else {
        intentsData.intents.forEach((intent: any, index: number) => {
          if (!intent.name) errors.push(`Intent at index ${index} missing name`);
          if (!intent.description) errors.push(`Intent '${intent.name}' missing description`);
          if (!intent.component) errors.push(`Intent '${intent.name}' missing component`);
          if (!intent.parameters) errors.push(`Intent '${intent.name}' missing parameters`);
        });
      }
    } else {
      errors.push(`Intents file not found: ${intentsPath}`);
    }
  } catch (error) {
    errors.push(`Error reading intents file: ${error}`);
  }
  
  // Validate components file
  try {
    const componentsPath = path.resolve(options.components);
    if (await fs.pathExists(componentsPath)) {
      const componentsData = await fs.readJSON(componentsPath);
      
      if (!componentsData.components || typeof componentsData.components !== 'object') {
        errors.push('Components file must contain a "components" object');
      } else {
        Object.entries(componentsData.components).forEach(([name, component]: [string, any]) => {
          if (!component.framework) errors.push(`Component '${name}' missing framework`);
          if (!component.remoteUrl) errors.push(`Component '${name}' missing remoteUrl`);
          if (!component.exportName) errors.push(`Component '${name}' missing exportName`);
          if (!component.propsSchema) errors.push(`Component '${name}' missing propsSchema`);
        });
      }
    } else {
      errors.push(`Components file not found: ${componentsPath}`);
    }
  } catch (error) {
    errors.push(`Error reading components file: ${error}`);
  }
  
  if (errors.length > 0) {
    console.log(chalk.red('❌ Validation failed:'));
    errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
    process.exit(1);
  } else {
    console.log(chalk.green('✅ Configuration is valid!'));
  }
}

/**
 * Start development server
 */
async function startDevServer(options: any): Promise<void> {
  console.log(chalk.blue('🚀 Starting development server...'));
  
  try {
    const { createDevServer } = await import('../index.js');
    
    const config = {
      intents: options.intents || './config/intents.json',
      components: options.components || './config/components.json',
      port: options.port || 3001,
      logging: {
        level: 'debug' as const,
        format: 'text' as const
      }
    };
    
    const server = createDevServer(config);
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down development server...'));
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down development server...'));
      await server.close();
      process.exit(0);
    });
    
    await server.listen();
    
    console.log(chalk.green('✅ Development server started successfully!'));
    console.log(chalk.cyan(`🌐 Server URL: http://localhost:${config.port}`));
    console.log(chalk.cyan('📁 File watching enabled for hot reload'));
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start development server:'), error);
    process.exit(1);
  }
}

/**
 * Build project for production
 */
async function buildProject(options: any): Promise<void> {
  console.log(chalk.blue('Building project for production...'));
  
  // TODO: Implement actual build logic
  console.log(chalk.yellow('Build functionality would be implemented here'));
  console.log(chalk.green(`Output would be written to ${options.output}`));
}

/**
 * Start production server
 */
async function startProductionServer(options: any): Promise<void> {
  console.log(chalk.blue('🚀 Starting production server...'));
  
  try {
    const { createIXPServer } = await import('../index.js');
    
    const config = {
      intents: './config/intents.json',
      components: './config/components.json',
      port: options.port || 3001,
      logging: {
        level: 'info' as const,
        format: 'json' as const
      }
    };
    
    const server = createIXPServer(config);
    
    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down server...'));
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log(chalk.yellow('\n🛑 Shutting down server...'));
      await server.close();
      process.exit(0);
    });
    
    await server.listen();
    
    console.log(chalk.green('✅ Production server started successfully!'));
    console.log(chalk.cyan(`🌐 Server URL: http://localhost:${config.port}`));
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start production server:'), error);
    process.exit(1);
  }
}

/**
 * Run tests for IXP server
 */
async function runTests(options: any): Promise<void> {
  console.log(chalk.blue('🧪 Running IXP server tests...'));
  
  const baseUrl = options.url || `http://localhost:${options.port}`;
  const timeout = parseInt(options.timeout) || 5000;
  
  const tests = [
    {
      name: 'Health Check',
      endpoint: '/ixp/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'List Intents',
      endpoint: '/ixp/intents',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'List Components',
      endpoint: '/ixp/components',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Crawler Content',
      endpoint: '/ixp/crawler_content',
      method: 'GET',
      expectedStatus: 200
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(chalk.gray(`  Testing: ${test.name}...`));
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        signal: AbortSignal.timeout(timeout)
      });
      
      if (response.status === test.expectedStatus) {
        console.log(chalk.green(`  ✅ ${test.name} - PASSED`));
        passed++;
      } else {
        console.log(chalk.red(`  ❌ ${test.name} - FAILED (Status: ${response.status})`));
        failed++;
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       console.log(chalk.red(`  ❌ ${test.name} - FAILED (${errorMessage})`));
       failed++;
     }
  }
  
  console.log(chalk.blue('\n📊 Test Results:'));
  console.log(chalk.green(`  Passed: ${passed}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.cyan(`  Total: ${passed + failed}`));
  
  if (failed > 0) {
    console.log(chalk.red('\n❌ Some tests failed'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All tests passed!'));
  }
}

/**
 * Show server and configuration information
 */
async function showInfo(options: any): Promise<void> {
  console.log(chalk.blue('📋 IXP Server Information\n'));
  
  // Package info
  console.log(chalk.cyan('Package Information:'));
  console.log(`  Name: ixp-server`);
  console.log(`  Version: 1.1.1`);
  console.log(`  CLI Version: 1.1.1\n`);
  
  // Configuration files
  console.log(chalk.cyan('Configuration:'));
  const intentsPath = './config/intents.json';
  const componentsPath = './config/components.json';
  
  try {
    if (await fs.pathExists(intentsPath)) {
      const intents = await fs.readJSON(intentsPath);
      console.log(`  Intents: ${intents.intents?.length || 0} defined`);
    } else {
      console.log(`  Intents: File not found (${intentsPath})`);
    }
    
    if (await fs.pathExists(componentsPath)) {
      const components = await fs.readJSON(componentsPath);
      const componentCount = Object.keys(components.components || {}).length;
      console.log(`  Components: ${componentCount} defined`);
    } else {
      console.log(`  Components: File not found (${componentsPath})`);
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     console.log(chalk.red(`  Error reading config: ${errorMessage}`));
   }
  
  // Environment info
  console.log(chalk.cyan('\nEnvironment:'));
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Architecture: ${process.arch}`);
  console.log(`  Working Directory: ${process.cwd()}`);
  
  // Available commands
  console.log(chalk.cyan('\nAvailable Commands:'));
  console.log(`  create <name>     Create new IXP server project`);
  console.log(`  init              Initialize IXP server in current directory`);
  console.log(`  dev               Start development server`);
  console.log(`  start             Start production server`);
  console.log(`  build             Build project for production`);
  console.log(`  test              Run server tests`);
  console.log(`  validate          Validate configuration files`);
  console.log(`  generate:intent   Generate new intent`);
  console.log(`  generate:component Generate new component`);
  console.log(`  docs              Generate API documentation`);
  console.log(`  info              Show this information`);
}

/**
 * Generate API documentation
 */
async function generateDocs(options: any): Promise<void> {
  console.log(chalk.blue('📚 Generating API documentation...'));
  
  const outputDir = path.resolve(options.output);
  await fs.ensureDir(outputDir);
  
  // Generate basic documentation structure
  const docsContent = {
    'index.html': generateDocsIndex(),
    'api.html': generateApiDocs(),
    'examples.html': generateExamplesDocs()
  };
  
  for (const [filename, content] of Object.entries(docsContent)) {
    await fs.writeFile(path.join(outputDir, filename), content);
    console.log(chalk.green(`  ✅ Generated ${filename}`));
  }
  
  console.log(chalk.green(`\n✅ Documentation generated in ${outputDir}`));
  console.log(chalk.cyan(`Open ${path.join(outputDir, 'index.html')} in your browser`));
}

/**
 * Generate documentation index page
 */
function generateDocsIndex(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IXP Server Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .nav { margin: 20px 0; }
        .nav a { margin-right: 20px; text-decoration: none; color: #007acc; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>IXP Server SDK Documentation</h1>
    <p>Welcome to the IXP Server SDK documentation. This SDK provides tools for building Intent Exchange Protocol (IXP) servers.</p>
    
    <div class="nav">
        <a href="api.html">API Reference</a>
        <a href="examples.html">Examples</a>
    </div>
    
    <h2>Quick Start</h2>
    <p>Get started with IXP Server in minutes:</p>
    <pre><code>npm install -g ixp-server
ixp-server create my-server
cd my-server
npm install
npm run dev</code></pre>
    
    <h2>Features</h2>
    <ul>
        <li>Intent-based routing</li>
        <li>Component rendering</li>
        <li>Hot reload development</li>
        <li>Production-ready builds</li>
        <li>CLI tools</li>
    </ul>
</body>
</html>`;
}

/**
 * Generate API documentation page
 */
function generateApiDocs(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Reference - IXP Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { font-weight: bold; color: #007acc; }
    </style>
</head>
<body>
    <h1>API Reference</h1>
    <p><a href="index.html">← Back to Documentation</a></p>
    
    <h2>Endpoints</h2>
    
    <div class="endpoint">
        <h3><span class="method">GET</span> /ixp/health</h3>
        <p>Health check endpoint</p>
        <p><strong>Response:</strong> <code>{ "status": "ok", "timestamp": "..." }</code></p>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">GET</span> /ixp/intents</h3>
        <p>List all available intents</p>
        <p><strong>Response:</strong> Array of intent definitions</p>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">GET</span> /ixp/components</h3>
        <p>List all available components</p>
        <p><strong>Response:</strong> Object containing component definitions</p>
    </div>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /ixp/render</h3>
        <p>Render a component for an intent</p>
        <p><strong>Body:</strong> <code>{ "intent": "intent_name", "parameters": {...} }</code></p>
        <p><strong>Response:</strong> Rendered component HTML</p>
    </div>
</body>
</html>`;
}

/**
 * Generate examples documentation page
 */
function generateExamplesDocs(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Examples - IXP Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Examples</h1>
    <p><a href="index.html">← Back to Documentation</a></p>
    
    <h2>Basic Server</h2>
    <pre><code>import { createServer } from 'ixp-server';

const server = createServer({
  intents: './config/intents.json',
  components: './config/components.json',
  port: 3001
});

server.listen().then(() => {
  console.log('Server running on port 3001');
});</code></pre>
    
    <h2>CLI Usage</h2>
    <pre><code># Create new project
ixp-server create my-project

# Initialize in existing directory
ixp-server init

# Start development server
ixp-server dev

# Run tests
ixp-server test

# Generate intent
ixp-server generate:intent welcome</code></pre>
</body>
</html>`;
}

// Parse command line arguments
program.parse();