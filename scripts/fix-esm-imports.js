#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix ESM imports by:
 * 1. Renaming .js files to .mjs
 * 2. Updating import statements to use .mjs extensions
 * 3. Adding proper ESM package.json files
 */

function fixEsmImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixEsmImports(fullPath);
    } else if (file.name.endsWith('.js')) {
      // Read file content
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix relative imports to use .mjs extension
      content = content.replace(
        /from ['"](\..*?)\.js['"]/g,
        "from '$1.mjs'"
      );
      
      content = content.replace(
        /import\(['"](\..*?)\.js['"]\)/g,
        "import('$1.mjs')"
      );
      
      // Write back the content
      fs.writeFileSync(fullPath, content);
      
      // Rename .js to .mjs
      const mjsPath = fullPath.replace(/\.js$/, '.mjs');
      fs.renameSync(fullPath, mjsPath);
      
      console.log(`Fixed: ${file.name} -> ${path.basename(mjsPath)}`);
    }
  }
}

// Process dist-esm directory
const distEsmDir = path.join(__dirname, '..', 'dist-esm');
if (fs.existsSync(distEsmDir)) {
  console.log('Fixing ESM imports...');
  fixEsmImports(distEsmDir);
  
  // Move files from dist-esm to dist with .mjs extension
  const distDir = path.join(__dirname, '..', 'dist');
  
  function moveFiles(srcDir, destDir) {
    const files = fs.readdirSync(srcDir, { withFileTypes: true });
    
    for (const file of files) {
      const srcPath = path.join(srcDir, file.name);
      const destPath = path.join(destDir, file.name);
      
      if (file.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        moveFiles(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  moveFiles(distEsmDir, distDir);
  
  // Clean up dist-esm
  fs.rmSync(distEsmDir, { recursive: true, force: true });
  
  console.log('ESM imports fixed successfully!');
} else {
  console.log('No dist-esm directory found, skipping ESM fix.');
}