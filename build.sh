#!/bin/bash

# YouTube Looper Extension Build Script

echo "🎬 Building YouTube Looper Extension..."

# Angular is already built by npm run build:angular, skip duplicate build
echo "📦 Using pre-built Angular components..."

# Build TypeScript extension files
echo "🔨 Building extension files..."
npm run build:extension

# Create build directory
echo "📁 Creating build directory..."
rm -rf build
mkdir -p build
mkdir -p build/angular-app/dist
mkdir -p build/icons

# Copy files to build directory
echo "📋 Copying files..."
cp manifest.json build/
cp -r dist/* build/
cp content/preload-angular.js build/content/
cp content/inject-angular.js build/content/
cp -r angular-app/dist/* build/angular-app/dist/

# Create Angular manifest
echo "📝 Creating Angular manifest..."
node create-angular-manifest.js



# Copy icons
cp -r icons build/

echo "✅ Build complete! Extension is in ./build directory"
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the ./build directory"
