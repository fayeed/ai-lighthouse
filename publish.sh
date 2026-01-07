#!/bin/bash

set -e  # Exit on error

# Parse arguments
FORCE=false
NEW_VERSION=""
PACKAGE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --force|-f)
      FORCE=true
      shift
      ;;
    --package|-p)
      PACKAGE="$2"
      shift 2
      ;;
    *)
      NEW_VERSION="$1"
      shift
      ;;
  esac
done

# Check if version argument is provided
if [ -z "$NEW_VERSION" ]; then
  echo "❌ Error: Version number is required"
  echo ""
  echo "Usage: ./publish.sh <version> [options]"
  echo ""
  echo "Examples:"
  echo "  ./publish.sh 1.0.1                    # Publish both packages"
  echo "  ./publish.sh 1.0.1 --package scanner  # Publish scanner only"
  echo "  ./publish.sh 1.0.1 --package cli      # Publish CLI only"
  echo "  ./publish.sh 1.0.1 --force            # Skip confirmation"
  echo ""
  echo "Version format: MAJOR.MINOR.PATCH"
  echo ""
  echo "Options:"
  echo "  --package, -p <name>   Publish only scanner or cli (default: both)"
  echo "  --force, -f            Skip confirmation prompt"
  exit 1
fi

# Validate version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Error: Invalid version format"
  echo "Version must be in format: MAJOR.MINOR.PATCH (e.g., 1.0.1)"
  exit 1
fi

# Validate package name if provided
if [ -n "$PACKAGE" ] && [ "$PACKAGE" != "scanner" ] && [ "$PACKAGE" != "cli" ]; then
  echo "❌ Error: Invalid package name"
  echo "Package must be 'scanner' or 'cli'"
  exit 1
fi

# Determine which packages to publish
PUBLISH_SCANNER=true
PUBLISH_CLI=true

if [ "$PACKAGE" = "scanner" ]; then
  PUBLISH_CLI=false
elif [ "$PACKAGE" = "cli" ]; then
  PUBLISH_SCANNER=false
fi

# Check versions
if [ "$PUBLISH_SCANNER" = true ]; then
  SCANNER_CURRENT_VERSION=$(node -p "require('./packages/scanner/package.json').version")
  if [ "$SCANNER_CURRENT_VERSION" = "$NEW_VERSION" ]; then
    echo "❌ Error: Scanner package is already at version $NEW_VERSION"
    exit 1
  fi
fi

if [ "$PUBLISH_CLI" = true ]; then
  CLI_CURRENT_VERSION=$(node -p "require('./apps/cli/package.json').version")
  if [ "$CLI_CURRENT_VERSION" = "$NEW_VERSION" ]; then
    echo "❌ Error: CLI package is already at version $NEW_VERSION"
    exit 1
  fi
fi

# Show what will be published
echo "🚀 Publishing AI Lighthouse v$NEW_VERSION..."
echo ""
echo "Packages to publish:"
if [ "$PUBLISH_SCANNER" = true ]; then
  echo "  📦 Scanner: $SCANNER_CURRENT_VERSION → $NEW_VERSION"
fi
if [ "$PUBLISH_CLI" = true ]; then
  echo "  📦 CLI: $CLI_CURRENT_VERSION → $NEW_VERSION"
fi
echo ""

# Confirm with user (unless --force is used)
if [ "$FORCE" = false ]; then
  read -p "Continue with publishing? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
  fi
else
  echo "⚡ Force mode enabled - skipping confirmation"
  echo ""
fi

# Publish Scanner
if [ "$PUBLISH_SCANNER" = true ]; then
  echo "📦 Publishing @ai-lighthouse/scanner..."
  cd packages/scanner

  echo "  Updating version to $NEW_VERSION..."
  npm version $NEW_VERSION --no-git-tag-version

  echo "  Cleaning dist..."
  rm -rf dist

  echo "  Building..."
  pnpm build

  echo "  Publishing to npm..."
  npm publish --access public

  cd ../..
  echo "✅ Scanner published successfully!"
  echo ""
fi

# Publish CLI
if [ "$PUBLISH_CLI" = true ]; then
  echo "📦 Publishing @ai-lighthouse/cli..."

  # Build scanner first if not already built
  if [ ! -d "packages/scanner/dist" ]; then
    echo "  Building scanner first..."
    cd packages/scanner
    pnpm build
    cd ../..
  fi

  cd apps/cli

  echo "  Updating version to $NEW_VERSION..."
  npm version $NEW_VERSION --no-git-tag-version

  # Always update scanner dependency to use published version
  echo "  Updating scanner dependency to ^$NEW_VERSION..."
  npm pkg set dependencies.@ai-lighthouse/scanner="^$NEW_VERSION"

  echo "  Installing dependencies..."
  pnpm install

  echo "  Building CLI..."
  pnpm build

  echo "  Publishing to npm..."
  npm publish --access public

  # Always revert to workspace dependency after publishing
  echo "  Reverting to workspace dependency..."
  npm pkg set dependencies.@ai-lighthouse/scanner="workspace:*"
  pnpm install

  cd ../..
  echo "✅ CLI published successfully!"
  echo ""
fi

echo "🎉 Publishing complete!"
echo ""
if [ "$PUBLISH_CLI" = true ]; then
  echo "To install globally:"
  echo "  npm install -g @ai-lighthouse/cli"
  echo ""
fi
echo "Don't forget to commit the version changes:"
echo "  git add ."
if [ "$PUBLISH_SCANNER" = true ] && [ "$PUBLISH_CLI" = true ]; then
  echo "  git commit -m \"chore: release v$NEW_VERSION\""
elif [ "$PUBLISH_SCANNER" = true ]; then
  echo "  git commit -m \"chore: release scanner v$NEW_VERSION\""
else
  echo "  git commit -m \"chore: release CLI v$NEW_VERSION\""
fi
echo "  git tag v$NEW_VERSION"
echo "  git push && git push --tags"
