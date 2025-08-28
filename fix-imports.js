#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', 'dist', 'examples-dist', '.git'].includes(item)) {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix imports and exports in a file
function fixImportsAndExports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports that don't have .js extension
  const importRegex = /import\s+(?:{[^}]+}|[^{]+)\s+from\s+['"](\.\.[^'"]*|\.[^'"]*)['"];?/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
      modified = true;
      return match.replace(importPath, importPath + '.js');
    }
    return match;
  });
  
  // Fix relative exports that don't have .js extension
  const exportRegex = /export\s+(?:{[^}]+}|\*|[^{]+)\s+from\s+['"](\.\.[^'"]*|\.[^'"]*)['"];?/g;
  
  content = content.replace(exportRegex, (match, exportPath) => {
    if (!exportPath.endsWith('.js') && !exportPath.endsWith('.json')) {
      modified = true;
      return match.replace(exportPath, exportPath + '.js');
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports/exports in: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);

for (const file of tsFiles) {
  fixImportsAndExports(file);
}

console.log('Import/export fixing complete!');