#!/bin/bash
# Render Build Script
# This script is executed on Render during deployment

echo "🚀 Starting Render build..."

# Install dependencies with frozen lockfile
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "✅ Build complete!"
