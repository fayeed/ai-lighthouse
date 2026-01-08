# 🚨 AI Lighthouse

**AI Readiness Audits** - A comprehensive toolkit for auditing websites for AI readiness, SEO optimization, and content quality.

## 📦 Packages

This monorepo contains:

### Core Packages

- **`packages/scanner`** - Core scanning engine with 50+ rules for AI readiness detection
- **`packages/utils`** - Shared utilities across packages

### Applications

- **`apps/cli`** - Command-line interface with interactive wizard and preset configurations
- **`apps/web`** - Next.js web application for visual audits
- **`apps/api`** - Express API server for programmatic access

## 🚀 Quick Start

### Installation

```bash
pnpm install
```

### CLI Usage

```bash
# Interactive wizard (simplest way)
pnpm --filter=@ai-lighthouse/cli dev audit https://example.com

# Using presets (recommended)
pnpm --filter=@ai-lighthouse/cli dev audit https://example.com --preset ai-optimized

# List available presets
pnpm --filter=@ai-lighthouse/cli dev presets
```

### Web Application

```bash
# Start the web app
pnpm --filter=@ai-lighthouse/web dev

# Visit http://localhost:3000
```

### API Server

```bash
# Start the API server
pnpm --filter=@ai-lighthouse/api dev

# API available at http://localhost:3001
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

**Interactive Features:**

- Beautiful terminal UI built with React (Ink)
- Interactive wizard for easy configuration
- Preset configurations (basic, ai-optimized, full, minimal)
- Tab navigation through analysis sections

**Commands:**

1. **`audit`** - Audit a single webpage with presets
2. **`crawl`** - Crawl and audit multiple pages
3. **`report`** - Generate and view reports
4. **`presets`** - List available preset configurations

**Output Formats:**

- Interactive terminal UI (default)
- JSON (CI/CD friendly)
- HTML (beautiful visualizations)
- PDF (for sharing)
- CSV (spreadsheet analysis)

### Web App (`apps/web`)

- Visual audit interface built with Next.js
- Real-time AI readiness analysis
- Interactive charts and visualizations
- Tab-based navigation through results
- Export capabilities

### API Server (`apps/api`)

- RESTful API for programmatic access
- Rate limiting and security features
- Webhook support for automation
- OpenAPI documentation

## 📖 Documentation

- [`packages/scanner/README.md`](packages/scanner/README.md) - Scanner API documentation
- [`packages/scanner/SCORING.md`](packages/scanner/SCORING.md) - Scoring system explained
- [`apps/cli/README.md`](apps/cli/README.md) - CLI documentation and commands
- [`apps/cli/EXAMPLES.md`](apps/cli/EXAMPLES.md) - Usage examples and recipes
- [`apps/web/README.md`](apps/web/README.md) - Web application documentation
- [`apps/api/README.md`](apps/api/README.md) - API server documentation

## 💻 Development

This project uses [Turborepo](https://turborepo.com/) for managing the monorepo.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run specific package in dev mode
pnpm --filter=@ai-lighthouse/cli dev
pnpm --filter=@ai-lighthouse/web dev
pnpm --filter=@ai-lighthouse/api dev

# Run tests
pnpm test

# Lint all packages
pnpm lint
```

## 🏗️ Architecture

```text
ai-lighthouse/
├── packages/
│   ├── scanner/          # Core scanning engine
│   │   ├── src/
│   │   │   ├── rules/    # 50+ detection rules
│   │   │   ├── llm/      # LLM integration
│   │   │   └── scoring/  # AI readiness scoring
│   └── utils/            # Shared utilities
└── apps/
    ├── cli/              # Command-line interface
    │   ├── src/
    │   │   ├── commands/ # CLI commands
    │   │   ├── ui/       # Interactive UI components
    │   │   └── presets.ts # Preset configurations
    ├── web/              # Next.js web app
    └── api/              # Express API server
```

## 🎨 Example Output

### AI Readiness Score

```text
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
    pnpm --filter=@ai-lighthouse/cli dev audit ${{ secrets.SITE_URL }} \
      --preset minimal \
      --threshold 80 \
      --output json
```

Exit code 1 if score is below threshold - perfect for automated quality gates!

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please see individual package READMEs for specific contribution guidelines.
