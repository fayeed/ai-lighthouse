# Publishing AI Lighthouse to npm

## Prerequisites

1. You need an npm account. Create one at [npmjs.com](https://www.npmjs.com/signup)
2. Login to npm locally:
   ```bash
   npm login
   ```

## Publishing Process

We've created an automated script to handle publishing both packages. Run it with a version number:

```bash
./publish.sh <version> [--force]
```

**Examples:**
```bash
# With confirmation prompt
./publish.sh 1.0.1

# Skip confirmation (useful for CI/CD)
./publish.sh 1.0.1 --force
./publish.sh 1.0.1 -f
```

The script will:
1. Validate the version format (MAJOR.MINOR.PATCH)
2. Check that the version is different from current versions
3. Show you the version changes and ask for confirmation (unless `--force` is used)
4. Update version in both packages
5. Build and publish `@ai-lighthouse/scanner` package
6. Update CLI to use published scanner
7. Publish `@ai-lighthouse/cli` package
8. Revert CLI back to workspace dependency for local development
9. Remind you to commit and tag the version changes

### Options

- `--force` or `-f`: Skip the confirmation prompt (useful for automated publishing in CI/CD)

## Manual Publishing (if needed)

### Step 1: Publish Scanner Package

```bash
cd packages/scanner
rm -rf dist
pnpm build
npm publish --access public
cd ../..
```

### Step 2: Publish CLI Package

```bash
cd apps/cli

# Update to use published scanner
npm pkg set dependencies.@ai-lighthouse/scanner="^1.0.0"
npm pkg delete dependencies.scanner
pnpm install

# Publish
npm publish --access public

# Revert for local dev
npm pkg set dependencies.scanner="workspace:*"
npm pkg delete dependencies.@ai-lighthouse/scanner
pnpm install

cd ../..
```

## After Publishing

Users can install globally with:

```bash
npm install -g @ai-lighthouse/cli
```

Then use it:

```bash
ai-lighthouse audit https://example.com
```

## Updating Versions

Before publishing updates, bump the version in both packages:

```bash
# In packages/scanner/package.json
npm version patch  # or minor, or major

# In apps/cli/package.json
npm version patch  # or minor, or major
```

Then run `./publish.sh` again.
