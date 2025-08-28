module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,js}': [
    'eslint --fix',
    'prettier --write',
    'git add',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
    'git add',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    'git add',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
    'git add',
  ],
  
  // Run type check on any TypeScript file change
  '*.ts': () => 'npm run typecheck',
  
  // Run tests related to changed files
  '*.{ts,js}': () => 'npm test -- --findRelatedTests --passWithNoTests',
};