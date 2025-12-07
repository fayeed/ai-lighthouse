# Example Usage

## Basic Audit

```bash
cd apps/cli
pnpm dev audit https://example.com
```

## Audit with HTML Output

```bash
pnpm dev audit https://github.com --output html
```

## Audit with All Features Enabled

```bash
pnpm dev audit https://example.com \
  --output html \
  --enable-chunking \
  --enable-extractability \
  --enable-hallucination \
  --enable-llm \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b \
  --llm-base-url http://localhost:11434
```

## Crawl Multiple Pages

```bash
pnpm dev crawl https://example.com --depth 2 --max-pages 10 --output html
```

## Crawl Using Sitemap

```bash
pnpm dev crawl https://example.com --sitemap --max-pages 50 --output json
```

## Generate Report from Previous Run

```bash
pnpm dev report ./.ai-lighthouse/audit_example_com_2024-12-05T10-30-00.json --open
```

## CI/CD Integration

```bash
# Fail build if score is below 80
pnpm dev audit https://example.com --threshold 80 --output json
```

## Export to Different Formats

```bash
# JSON (default)
pnpm dev audit https://example.com --output json

# HTML (beautiful report)
pnpm dev audit https://example.com --output html

# Lighthouse-compatible format
pnpm dev audit https://example.com --output lhr

# CSV for spreadsheets
pnpm dev audit https://example.com --output csv
```

## Advanced Options

```bash
# Fine-tune issue detection
pnpm dev audit https://example.com \
  --min-impact 9 \
  --min-confidence 0.8 \
  --max-issues 10

# Enable all analysis features
pnpm dev audit https://example.com \
  --enable-chunking \
  --enable-extractability \
  --enable-hallucination \
  --enable-llm \
  --max-chunk-tokens 1500
```
