#!/bin/bash
# Render Start Script
# This script is executed on Render to start the application with PM2

echo "🚀 Starting AI Lighthouse API with PM2..."

cd apps/api
exec pm2-runtime start ecosystem.config.cjs
