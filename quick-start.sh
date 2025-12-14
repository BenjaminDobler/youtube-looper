#!/bin/bash

# YouTube Looper - Quick Start Script
# This script sets up and builds the extension

set -e  # Exit on any error

echo "🎬 YouTube Looper - Quick Start"
echo "================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "→ Installing root dependencies..."
npm install

# Install Angular dependencies
echo "→ Installing Angular dependencies..."
cd angular-app
npm install
cd ..

echo ""
echo "🔨 Building extension..."
echo ""

# Build everything
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory: $(pwd)/build"
echo ""
echo "🎥 Then visit any YouTube video to see the extension in action!"
echo ""
echo "📚 Documentation:"
echo "  - INSTALLATION.md - User guide"
echo "  - DEVELOPMENT.md  - Developer guide"
echo "  - PROJECT_SUMMARY.md - Technical overview"
echo ""
