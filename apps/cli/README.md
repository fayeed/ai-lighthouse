# AI Lighthouse CLI

Command-line interface for auditing websites for AI readiness, SEO optimization, and content quality.

## Installation

```bash
pnpm install
pnpm build
```

## Quick Start

The simplest way to audit a website:

```bash
# Interactive wizard (recommended for beginners)
ai-lighthouse audit https://example.com

# Using presets (recommended for most users)
ai-lighthouse audit https://example.com --preset ai-optimized
```

## Usage

### Audit with Presets (Recommended)

Presets provide pre-configured scanning profiles for common use cases:

```bash
# Fast scan with core rules only (~5-10 seconds)
ai-lighthouse audit https://example.com --preset basic

# Balanced scan with AI insights (~30-60 seconds) - Recommended
ai-lighthouse audit https://example.com --preset ai-optimized

# Comprehensive scan with all features (~2-5 minutes)
ai-lighthouse audit https://example.com --preset full

# Quick scan showing only critical issues (~3-5 seconds)
ai-lighthouse audit https://example.com --preset minimal
```

### List Available Presets

```bash
ai-lighthouse presets
```

### Configure LLM Provider (for AI-powered presets)

```bash
# Using Ollama (local, free)
ai-lighthouse audit https://example.com --preset ai-optimized \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b

# Using OpenAI
ai-lighthouse audit https://example.com --preset ai-optimized \
  --llm-provider openai \
  --llm-model gpt-4o-mini \
  --llm-api-key sk-...

# Using Anthropic
ai-lighthouse audit https://example.com --preset full \
  --llm-provider anthropic \
  --llm-model claude-3-5-sonnet-20241022 \
  --llm-api-key sk-ant-...
```

### Output Formats

```bash
# Save as JSON
ai-lighthouse audit https://example.com --preset basic --output json

# Generate HTML report
ai-lighthouse audit https://example.com --preset ai-optimized --output html

# Generate PDF report
ai-lighthouse audit https://example.com --preset full --output pdf

# Interactive terminal UI (default)
ai-lighthouse audit https://example.com --preset ai-optimized
```

### CI/CD Integration

```bash
# Exit with code 1 if score is below threshold
ai-lighthouse audit https://example.com --preset minimal --threshold 80
```

### Advanced: Override Preset Defaults

You can override any preset option:

```bash
# Use ai-optimized preset but enable hallucination detection
ai-lighthouse audit https://example.com --preset ai-optimized \
  --enable-hallucination

# Use full preset but limit to 10 issues
ai-lighthouse audit https://example.com --preset full \
  --max-issues 10
```

## Commands

### `audit <url>`

Audit a single webpage for AI readiness.

**Primary Options:**

- `-o, --output <format>` - Output format: json, html, pdf, interactive (default: interactive)
- `-p, --preset <name>` - Preset configuration: basic, ai-optimized, full, minimal

**LLM Configuration (for AI-powered presets):**

- `--llm-provider <provider>` - LLM provider: openai, anthropic, ollama (default: ollama)
- `--llm-model <model>` - LLM model name (e.g., qwen2.5:0.5b, gpt-4o-mini)
- `--llm-api-key <key>` - LLM API key (for OpenAI, Anthropic, etc.)
- `--llm-base-url <url>` - LLM API base URL (for custom endpoints)

**Advanced Overrides (for power users):**

- `--enable-chunking` - Override: Enable chunking analysis
- `--enable-extractability` - Override: Enable extractability mapping
- `--enable-hallucination` - Override: Enable hallucination detection
- `--enable-llm` - Override: Enable LLM comprehension
- `--min-impact <number>` - Override: Minimum impact score to include
- `--min-confidence <number>` - Override: Minimum confidence (0-1)
- `--max-issues <number>` - Override: Maximum issues to show
- `--max-chunk-tokens <number>` - Override: Max tokens per chunk
- `--chunking-strategy <strategy>` - Override: Chunking strategy (auto, heading-based, paragraph-based)

**Utility Options:**

- `--threshold <score>` - Exit with code 1 if score is below this threshold

### `presets`

List all available preset configurations with descriptions and estimated durations.

### `crawl <url>`

Crawl and audit multiple pages from a website.

**Options:**
- `-d, --depth <number>` - Maximum crawl depth (default: 2)
- `--sitemap` - Parse sitemap.xml for URLs
- `--max-pages <number>` - Maximum number of pages to crawl (default: 50)
- `-o, --output <format>` - Output format: json, html (default: json)
- `--follow-external` - Follow external links
- `--respect-robots` - Respect robots.txt rules (default: true)

**Examples:**

```bash
# Crawl with sitemap
ai-lighthouse crawl https://example.com --sitemap --max-pages 100

# Deep crawl with custom depth
ai-lighthouse crawl https://example.com --depth 3 --output html
```

### `report <file>`

Generate and view reports from saved audit results.

**Options:**
- `--open` - Open the report in browser
- `-f, --format <format>` - Output format: html, json, csv (default: html)

**Examples:**

```bash
# Generate and open HTML report
ai-lighthouse report ./.ai-lighthouse/last_run.json --open

# Export to CSV
ai-lighthouse report ./.ai-lighthouse/crawl_*.json --format csv
```

## Output Formats

### JSON
Standard JSON format with all audit data, compatible with CI/CD pipelines.

### HTML
Beautiful, interactive HTML report with charts and detailed issue breakdowns.

### LHR (Lighthouse Report)
Lighthouse-compatible JSON format for integration with existing Lighthouse tooling.

### CSV
Comma-separated values for spreadsheet analysis.

## CI/CD Integration

Use the `--threshold` flag to fail builds when scores drop below a threshold:

```yaml
# GitHub Actions example
- name: Audit site
  run: ai-lighthouse audit ${{ env.SITE_URL }} --threshold 80
```

## Configuration

Results are saved to `.ai-lighthouse/` directory in your project root.

## License

MIT
