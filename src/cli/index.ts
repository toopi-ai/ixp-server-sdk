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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// Package information
program
  .name('ixp-server')
  .description('CLI tool for creating and managing IXP servers')
  .version('1.0.0');

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
  .action(async (options) => {
    try {
      await validateConfig(options);
    } catch (error) {
      console.error(chalk.red('Validation error:'), error);
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
  await fs.ensureDir(path.join(projectPath, 'config'));
  
  // Generate package.json
  const packageJson = {
    name: path.basename(projectPath),
    version: '1.0.0',
    description: 'IXP Server project',
    main: `src/index.${ext}`,
    scripts: {
      dev: isTypeScript ? 'tsx watch src/index.ts' : 'node src/index.js',
      build: isTypeScript ? 'tsc' : 'echo "No build step needed for JavaScript"',
      start: isTypeScript ? 'node dist/index.js' : 'node src/index.js',
      validate: 'ixp-server validate',
      'generate:intent': 'ixp-server generate:intent',
      'generate:component': 'ixp-server generate:component'
    },
    dependencies: {
      'ixp-server': '^1.0.0'
    },
    devDependencies: isTypeScript ? {
      'typescript': '^5.3.3',
      'tsx': '^4.6.2',
      '@types/node': '^20.10.5'
    } : {}
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
        sourceMap: true
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
    ? 'import { createIXPServer, PluginFactory, MiddlewareFactory } from \'ixp-server\';'
    : 'const { createIXPServer, PluginFactory, MiddlewareFactory } = require(\'ixp-server\');';
  
  const plugins = config.features.map((feature: string) => {
    switch (feature) {
      case 'swagger':
        return `  server.addPlugin(PluginFactory.swagger({ title: '${path.basename(process.cwd())} API' }));`;
      case 'health':
        return '  server.addPlugin(PluginFactory.healthMonitoring({}));';
      case 'metrics':
        return '  server.addPlugin(PluginFactory.metrics({}));';
      default:
        return '';
    }
  }).filter(Boolean).join('\n');
  
  const middleware = config.features.map((feature: string) => {
    switch (feature) {
      case 'rateLimit':
        return '  server.addMiddleware(MiddlewareFactory.rateLimit({ max: 100, windowMs: 15 * 60 * 1000 }));';
      case 'logging':
        return '  server.addMiddleware(MiddlewareFactory.logging({ logLevel: \'info\' }));';
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
      level: 'info'
    }
  });

${plugins}
${middleware}

  await server.listen();
  console.log('🚀 IXP Server is running!');
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
        version: '1.0.0',
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
        remoteUrl: 'http://localhost:5173/WelcomeMessage.js',
        exportName: 'WelcomeMessage',
        propsSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        version: '1.0.0',
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
        }
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
  
  const config = options.yes ? {} : await inquirer.prompt([
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
    version: '1.0.0',
    crawlable: false
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
  
  const config = options.yes ? {} : await inquirer.prompt([
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
      default: options.url || `http://localhost:5173/${name}.js`
    }
  ]);
  
  const component = {
    framework: config.framework || options.framework || 'react',
    remoteUrl: config.url || options.url || `http://localhost:5173/${name}.js`,
    exportName: name,
    propsSchema: {
      type: 'object',
      properties: {}
    },
    version: '1.0.0',
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
    }
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
  
  console.log(chalk.green(`✅ Component '${name}' generated successfully!`));
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
  console.log(chalk.blue('Starting development server...'));
  
  // This would import and start the actual server
  // For now, just show a message
  console.log(chalk.yellow('Development server functionality would be implemented here'));
  console.log(chalk.green(`Server would start on port ${options.port}`));
}

/**
 * Build project for production
 */
async function buildProject(options: any): Promise<void> {
  console.log(chalk.blue('Building project for production...'));
  
  // This would implement the build process
  console.log(chalk.yellow('Build functionality would be implemented here'));
  console.log(chalk.green(`Output would be written to ${options.output}`));
}

// Parse command line arguments
program.parse();