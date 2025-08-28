#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`Executing: ${command}`, 'cyan');
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`Error executing command: ${command}`, 'red');
    throw error;
  }
}

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`, 'red');
    process.exit(1);
  }
  
  log(`Node.js version: ${nodeVersion} ✓`, 'green');
}

function checkGit() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    log('Git is available ✓', 'green');
  } catch (error) {
    log('Git is not installed. Please install Git first.', 'red');
    process.exit(1);
  }
}

function installDependencies() {
  log('Installing dependencies...', 'yellow');
  
  // Check if we should use npm, yarn, or pnpm
  let packageManager = 'npm';
  
  if (fs.existsSync('pnpm-lock.yaml')) {
    packageManager = 'pnpm';
  } else if (fs.existsSync('yarn.lock')) {
    packageManager = 'yarn';
  }
  
  log(`Using package manager: ${packageManager}`, 'blue');
  
  try {
    if (packageManager === 'pnpm') {
      exec('pnpm install');
    } else if (packageManager === 'yarn') {
      exec('yarn install');
    } else {
      exec('npm install');
    }
  } catch (error) {
    log('Failed to install dependencies', 'red');
    throw error;
  }
}

function setupGitHooks() {
  log('Setting up Git hooks...', 'yellow');
  
  try {
    // Install husky if available
    if (fs.existsSync('node_modules/husky')) {
      exec('npx husky install');
      log('Git hooks configured ✓', 'green');
    } else {
      log('Husky not found, skipping Git hooks setup', 'yellow');
    }
  } catch (error) {
    log('Failed to setup Git hooks', 'yellow');
  }
}

function buildProject() {
  log('Building project...', 'yellow');
  
  try {
    exec('npm run build');
    log('Project built successfully ✓', 'green');
  } catch (error) {
    log('Failed to build project', 'red');
    throw error;
  }
}

function runTests() {
  log('Running tests...', 'yellow');
  
  try {
    exec('npm test');
    log('All tests passed ✓', 'green');
  } catch (error) {
    log('Some tests failed', 'yellow');
    log('This might be expected for a fresh setup. You can run tests manually later.', 'yellow');
  }
}

function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.example');
  const localEnvPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath) && !fs.existsSync(localEnvPath)) {
    log('Creating local environment file...', 'yellow');
    fs.copyFileSync(envPath, localEnvPath);
    log('Created .env.local from .env.example', 'green');
    log('Please update .env.local with your local configuration', 'blue');
  }
}

function linkCLI() {
  log('Linking CLI for local development...', 'yellow');
  
  try {
    exec('npm link');
    log('CLI linked successfully ✓', 'green');
    log('You can now use "ixp-server" command globally', 'blue');
  } catch (error) {
    log('Failed to link CLI (this is optional)', 'yellow');
  }
}

function printNextSteps() {
  log('\n🎉 Setup completed successfully!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Review the README.md for project overview', 'blue');
  log('2. Check out the examples/ directory for usage examples', 'blue');
  log('3. Run "npm run dev" to start development mode', 'blue');
  log('4. Run "npm test" to run the test suite', 'blue');
  log('5. Run "npm run lint" to check code style', 'blue');
  log('\nUseful commands:', 'magenta');
  log('- npm run build      # Build the project', 'cyan');
  log('- npm run test       # Run tests', 'cyan');
  log('- npm run lint       # Run linter', 'cyan');
  log('- npm run typecheck  # Run TypeScript checks', 'cyan');
  log('- npm run docs       # Generate documentation', 'cyan');
  log('\nHappy coding! 🚀', 'green');
}

async function main() {
  log('🔧 Setting up IXP Server SDK development environment...', 'magenta');
  
  try {
    // System checks
    log('\n1. Checking system requirements...', 'yellow');
    checkNodeVersion();
    checkGit();
    
    // Install dependencies
    log('\n2. Installing dependencies...', 'yellow');
    installDependencies();
    
    // Setup Git hooks
    log('\n3. Setting up Git hooks...', 'yellow');
    setupGitHooks();
    
    // Create environment file
    log('\n4. Setting up environment...', 'yellow');
    createEnvFile();
    
    // Build project
    log('\n5. Building project...', 'yellow');
    buildProject();
    
    // Link CLI
    log('\n6. Setting up CLI...', 'yellow');
    linkCLI();
    
    // Run tests
    log('\n7. Running tests...', 'yellow');
    runTests();
    
    // Print next steps
    printNextSteps();
    
  } catch (error) {
    log('\n❌ Setup failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('\nPlease check the error above and try again.', 'yellow');
    log('If you need help, please check the README.md or open an issue.', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };