#!/bin/bash
# Render Build Script
# This script is executed on Render during deployment

echo "🚀 Starting Render build..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo "✅ Build complete!"
