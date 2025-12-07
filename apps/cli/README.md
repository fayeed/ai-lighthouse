# AI Lighthouse CLI

Command-line interface for auditing websites for AI readiness, SEO optimization, and content quality.

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### Audit a single page

```bash
ai-lighthouse audit https://example.com --output html
```

### Audit with specific rules

```bash
ai-lighthouse audit https://example.com --rules strict --enable-llm
```

### Crawl multiple pages

```bash
ai-lighthouse crawl https://example.com --depth 2 --sitemap
```

### Generate report from saved results

```bash
ai-lighthouse report ./.ai-lighthouse/last_run.json --open
```

## Commands

### `audit <url>`

Audit a single webpage for AI readiness.

**Options:**
- `-o, --output <format>` - Output format: json, html, lhr, csv (default: json)
- `-r, --rules <preset>` - Rule preset: default, strict, minimal (default: default)
- `-d, --depth <number>` - Crawl depth for multi-page audits (default: 1)
- `-p, --pages <urls>` - Comma-separated list of specific pages to audit
- `--cache-ttl <seconds>` - Cache TTL in seconds to avoid re-fetching
- `--threshold <score>` - Minimum score threshold (exit 1 if below)
- `--max-chunk-tokens <number>` - Maximum tokens per content chunk (default: 1200)
- `--enable-chunking` - Enable detailed content chunking analysis
- `--enable-extractability` - Enable extractability mapping
- `--enable-hallucination` - Enable hallucination detection
- `--enable-llm` - Enable LLM comprehension analysis
- `--min-impact <number>` - Minimum impact score to include (default: 8)
- `--min-confidence <number>` - Minimum confidence to include 0-1 (default: 0.7)
- `--max-issues <number>` - Maximum issues to return (default: 20)
- `--llm-provider <provider>` - LLM provider: openai, anthropic, ollama, local
- `--llm-model <model>` - LLM model name
- `--llm-base-url <url>` - LLM API base URL
- `--llm-api-key <key>` - LLM API key

**Examples:**

```bash
# Basic audit
ai-lighthouse audit https://example.com

# HTML report with all features enabled
ai-lighthouse audit https://example.com \
  --output html \
  --enable-chunking \
  --enable-extractability \
  --enable-hallucination \
  --enable-llm \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b

# CI/CD integration with score threshold
ai-lighthouse audit https://example.com --threshold 80
```

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
