#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Pass.me Extension...');

try {
  // Clean dist directory
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ Cleaned dist directory');
  }

  // Run webpack build
  console.log('📦 Running webpack build...');
  execSync('npx webpack --config webpack.config.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Extension built successfully!');
  console.log('📁 Output: dist/extension/');
  console.log('');
  console.log('🚀 To load in Chrome:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the dist/extension folder');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}