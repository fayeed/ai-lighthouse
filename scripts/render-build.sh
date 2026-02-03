#!/bin/bash
# Render Build Script
# This script is executed on Render during deployment

set -e

echo "🚀 Starting Render build..."

# Install dependencies with frozen lockfile
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma clients and run migrations
echo "🔧 Generating Prisma clients..."
cd apps/api && npx prisma generate && cd ../..
cd apps/web && npx prisma generate && cd ../..

echo "🗄️ Running database migrations..."
cd apps/api && npx prisma db push --skip-generate && cd ../..

# Build the API app
echo "🏗️ Building API..."
cd apps/api && pnpm build && cd ../..

echo "✅ Build complete!"
