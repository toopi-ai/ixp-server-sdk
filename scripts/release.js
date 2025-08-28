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
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  return versionRegex.test(version);
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('Working directory is not clean. Please commit or stash changes.', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('Error checking git status', 'red');
    process.exit(1);
  }
}

function checkBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (branch !== 'main' && branch !== 'master') {
      log(`Warning: You are on branch '${branch}', not 'main' or 'master'`, 'yellow');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      return new Promise((resolve) => {
        rl.question('Continue anyway? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'y') {
            log('Release cancelled', 'yellow');
            process.exit(0);
          }
          resolve();
        });
      });
    }
  } catch (error) {
    log('Error checking current branch', 'red');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0] || 'patch';
  
  log('🚀 Starting release process...', 'magenta');
  
  // Validate release type
  const validTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
  if (!validTypes.includes(releaseType) && !validateVersion(releaseType)) {
    log(`Invalid release type: ${releaseType}`, 'red');
    log(`Valid types: ${validTypes.join(', ')} or a specific version (e.g., 1.2.3)`, 'yellow');
    process.exit(1);
  }
  
  const currentVersion = getCurrentVersion();
  log(`Current version: ${currentVersion}`, 'blue');
  
  // Pre-flight checks
  log('Running pre-flight checks...', 'yellow');
  checkGitStatus();
  await checkBranch();
  
  // Run tests
  log('Running tests...', 'yellow');
  exec('npm run test');
  
  // Run linting
  log('Running linter...', 'yellow');
  exec('npm run lint');
  
  // Run type checking
  log('Running type check...', 'yellow');
  exec('npm run typecheck');
  
  // Build the project
  log('Building project...', 'yellow');
  exec('npm run build');
  
  // Version bump
  log(`Bumping version (${releaseType})...`, 'yellow');
  if (validateVersion(releaseType)) {
    exec(`npm version ${releaseType} --no-git-tag-version`);
  } else {
    exec(`npm version ${releaseType}`);
  }
  
  const newVersion = getCurrentVersion();
  log(`New version: ${newVersion}`, 'green');
  
  // Generate changelog (if conventional-changelog is available)
  try {
    log('Generating changelog...', 'yellow');
    exec('npx conventional-changelog -p angular -i CHANGELOG.md -s');
  } catch (error) {
    log('Changelog generation skipped (conventional-changelog not available)', 'yellow');
  }
  
  // Commit changes
  log('Committing changes...', 'yellow');
  exec('git add .');
  exec(`git commit -m "chore: release v${newVersion}"`);
  
  // Create git tag
  log('Creating git tag...', 'yellow');
  exec(`git tag v${newVersion}`);
  
  // Push changes
  log('Pushing changes...', 'yellow');
  exec('git push');
  exec('git push --tags');
  
  // Publish to npm
  log('Publishing to npm...', 'yellow');
  exec('npm publish');
  
  log(`🎉 Successfully released version ${newVersion}!`, 'green');
  log('\nNext steps:', 'blue');
  log('1. Create a GitHub release with release notes', 'blue');
  log('2. Update documentation if needed', 'blue');
  log('3. Announce the release', 'blue');
}

if (require.main === module) {
  main().catch((error) => {
    log(`Release failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };