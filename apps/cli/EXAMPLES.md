# AI Lighthouse CLI - Examples

Real-world usage examples for common scenarios.

## Basic Audits

### Quick Health Check

```bash
# Fastest scan - only critical issues (~3-5 seconds)
ai-lighthouse audit https://example.com --preset minimal
```

### Standard Audit

```bash
# Fast scan with core rules (~5-10 seconds)
ai-lighthouse audit https://example.com --preset basic
```

## AI-Powered Audits

### Recommended: Balanced AI Analysis

```bash
# Best balance of speed and insights (~30-60 seconds)
ai-lighthouse audit https://example.com --preset ai-optimized \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b
```

### Comprehensive Analysis

```bash
# Full analysis with all features (~2-5 minutes)
ai-lighthouse audit https://example.com --preset full \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b
```

## LLM Provider Examples

### Using Ollama (Local, Free)

```bash
# Install Ollama first: https://ollama.ai
# Pull model: ollama pull qwen2.5:0.5b

ai-lighthouse audit https://example.com --preset ai-optimized \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b
```

### Using OpenAI

```bash
ai-lighthouse audit https://example.com --preset ai-optimized \
  --llm-provider openai \
  --llm-model gpt-4o-mini \
  --llm-api-key sk-...
```

### Using Anthropic Claude

```bash
ai-lighthouse audit https://example.com --preset full \
  --llm-provider anthropic \
  --llm-model claude-3-5-sonnet-20241022 \
  --llm-api-key sk-ant-...
```

## Output Formats

### Generate HTML Report

```bash
ai-lighthouse audit https://example.com --preset ai-optimized \
  --output html
```

### Generate PDF Report

```bash
ai-lighthouse audit https://example.com --preset full \
  --output pdf
```

### Save as JSON

```bash
ai-lighthouse audit https://example.com --preset basic \
  --output json
```

## CI/CD Integration

### GitHub Actions

```yaml
name: AI Readiness Check

on:
  push:
    branches: [main]
  pull_request:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install AI Lighthouse
        run: npm install -g @ai-lighthouse/cli

      - name: Audit site
        run: |
          ai-lighthouse audit https://staging.example.com \
            --preset minimal \
            --threshold 80 \
            --output json
```

### GitLab CI

```yaml
ai-readiness-check:
  stage: test
  script:
    - npm install -g @ai-lighthouse/cli
    - ai-lighthouse audit https://staging.example.com --preset minimal --threshold 80
  only:
    - merge_requests
    - main
```

## Advanced Usage

### Override Preset Defaults

```bash
# Use ai-optimized preset but add hallucination detection
ai-lighthouse audit https://example.com --preset ai-optimized \
  --enable-hallucination \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b
```

### Custom Filtering

```bash
# Show only high-impact issues
ai-lighthouse audit https://example.com --preset basic \
  --min-impact 15 \
  --max-issues 5
```

### Multi-Page Crawl

```bash
# Crawl entire site using sitemap
ai-lighthouse crawl https://example.com \
  --sitemap \
  --max-pages 100 \
  --output html
```

## Comparing Multiple Sites

```bash
# Audit multiple sites and compare
for url in https://site1.com https://site2.com https://site3.com; do
  ai-lighthouse audit $url --preset basic --output json
done
```

## Interactive Wizard

```bash
# Let the wizard guide you (recommended for beginners)
ai-lighthouse audit https://example.com
# Then follow the prompts to select features and configure LLM
```

## Preset Comparison

| Preset         | Duration | Features                             | Use Case                       |
| -------------- | -------- | ------------------------------------ | ------------------------------ |
| `minimal`      | 3-5s     | Core rules, strict filtering         | Quick health checks, CI/CD     |
| `basic`        | 5-10s    | Core rules, no AI                    | Fast audits, baseline scans    |
| `ai-optimized` | 30-60s   | AI comprehension, message alignment  | Recommended for most users     |
| `full`         | 2-5min   | All features enabled                 | Comprehensive pre-launch audits|
