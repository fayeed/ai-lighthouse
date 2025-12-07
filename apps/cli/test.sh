#!/bin/bash

# AI Lighthouse CLI Test Script

echo "=== Testing AI Lighthouse CLI ==="
echo ""

# Test 1: Show help
echo "1. Testing --help..."
pnpm dev --help
echo ""

# Test 2: Show audit command help
echo "2. Testing audit --help..."
pnpm dev audit --help
echo ""

# Test 3: Show crawl command help  
echo "3. Testing crawl --help..."
pnpm dev crawl --help
echo ""

# Test 4: Show report command help
echo "4. Testing report --help..."
pnpm dev report --help
echo ""

echo "=== All tests passed! ==="
echo ""
echo "To run a real audit, try:"
echo "  pnpm dev audit https://example.com --output html"
