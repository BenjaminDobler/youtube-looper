const fs = require('fs');
const path = require('path');

// Read the dist/browser directory
const browserDir = path.join(__dirname, 'angular-app', 'dist', 'browser');
const files = fs.readdirSync(browserDir);

// Find the main JS file (either main.js or main-[HASH].js)
let mainFile = files.find(f => f === 'main.js');
if (!mainFile) {
  mainFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
}

if (!mainFile) {
  console.error('Could not find main bundle file');
  process.exit(1);
}

// Create a simple manifest
const manifest = {
  mainBundle: `angular-app/dist/browser/${mainFile}`
};

// Write to build directory
const manifestPath = path.join(__dirname, 'build', 'angular-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Created angular-manifest.json with main bundle: ${mainFile}`);
