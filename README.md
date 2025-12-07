# 🚨 AI Lighthouse

**SEO and AI Readability Audits** - A comprehensive toolkit for auditing websites for AI readiness, SEO optimization, and content quality.

## 📦 Packages

This monorepo contains:

- **`packages/scanner`** - Core scanning engine with 50+ rules for detecting AI readiness issues
- **`apps/cli`** - Command-line interface for running audits and generating reports

## 🚀 Quick Start

### Installation

```bash
pnpm install
```

### CLI Usage

```bash
# Audit a single page
cd apps/cli
pnpm dev audit https://example.com --output html

# Crawl multiple pages
pnpm dev crawl https://example.com --depth 2 --sitemap

# Generate report from saved results
pnpm dev report ./.ai-lighthouse/last_run.json --open
```

## 🎯 Features

### Scanning Engine (`packages/scanner`)

- **50+ Built-in Rules** covering:
  - AI Readiness & Comprehension
  - Content Clarity & Quality
  - Extractability & Chunking
  - Knowledge Graph & Schema.org
  - SEO & Crawlability
  - Accessibility (A11y)
  - Security & Performance

- **LLM Integration:**
  - Support for OpenAI, Anthropic, Ollama, and local models
  - Hallucination detection
  - Content comprehension analysis
  - Entity extraction
  - FAQ generation

- **Advanced Analysis:**
  - Content chunking with token optimization
  - Extractability mapping
  - AI readiness scoring
  - Traditional SEO scoring

### CLI (`apps/cli`)

Three powerful commands:

1. **`audit`** - Audit a single webpage
2. **`crawl`** - Crawl and audit multiple pages
3. **`report`** - Generate and view reports

**Output Formats:**
- JSON (CI/CD friendly)
- HTML (beautiful visualizations)
- LHR (Lighthouse-compatible)
- CSV (spreadsheet analysis)

## 📖 Documentation

- [`packages/scanner/README.md`](packages/scanner/README.md) - Scanner API documentation
- [`apps/cli/README.md`](apps/cli/README.md) - CLI documentation
- [`apps/cli/EXAMPLES.md`](apps/cli/EXAMPLES.md) - Usage examples
- [`apps/cli/IMPLEMENTATION.md`](apps/cli/IMPLEMENTATION.md) - Implementation details

## 💻 Development

```bash
# Install dependencies
pnpm install

# Run scanner tests
cd packages/scanner
pnpm dev

# Use the CLI
cd apps/cli
pnpm dev audit https://example.com
```

## 🏗️ Architecture

```
ai-lighthouse/
├── packages/
│   ├── scanner/          # Core scanning engine
│   │   ├── src/
│   │   │   ├── rules/    # 50+ detection rules
│   │   │   ├── llm/      # LLM integration
│   │   │   └── ...       # Core functionality
│   └── utils/            # Shared utilities
└── apps/
    └── cli/              # Command-line interface
        ├── src/
        │   └── commands/ # CLI commands
        └── bin/          # Executable entry
```

## 🎨 Example Output

### AI Readiness Score
```
╔════════════════════════════════════════════════════════════════╗
║           AI Readiness Assessment for example.com              ║
╚════════════════════════════════════════════════════════════════╝

📊 Overall AI Readiness: 87/100 (B+)

🔍 Extractability    : 92/100 ⭐⭐⭐⭐⭐
📝 Clarity          : 85/100 ⭐⭐⭐⭐
🧩 Chunkability     : 88/100 ⭐⭐⭐⭐
🎯 Context          : 84/100 ⭐⭐⭐⭐
```

### HTML Report

Beautiful, interactive reports with:
- Color-coded severity levels
- Score visualizations
- Detailed issue breakdowns
- Entity detection display
- Actionable remediation steps

## 🛠️ CI/CD Integration

```yaml
# GitHub Actions example
- name: Audit Website
  run: |
    cd apps/cli
    pnpm dev audit ${{ secrets.SITE_URL }} --threshold 80 --output json
```

Exit code 1 if score is below threshold - perfect for automated quality gates!

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please see individual package READMEs for specific contribution guidelines.


## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
