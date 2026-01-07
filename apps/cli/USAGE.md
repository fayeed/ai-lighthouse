# AI Lighthouse CLI - Quick Start Guide

## Simplest Usage (Recommended for New Users)

Just run with a URL - the wizard will guide you through the rest!

```bash
ai-lighthouse audit https://example.com
```

This will:
1. **Ask you** which features to enable (AI Understanding, Chunking, etc.)
2. **Guide you** through LLM provider setup if needed
3. **Show results** in a beautiful interactive UI

## How It Works

### Basic Audit (No Additional Features)

```bash
ai-lighthouse audit https://example.com
```

When the wizard appears:
- Just press **Enter** on "Continue with selected features"
- You'll get a basic audit with core metrics

### With AI Analysis

```bash
ai-lighthouse audit https://example.com
```

When the wizard appears:
1. Select **🧠 AI Understanding** (press Enter to toggle)
2. Select **Continue**
3. Choose your LLM provider (e.g., **Ollama** for local)
4. Enter model name (e.g., `qwen2.5:0.5b`)
5. Confirm settings

### Full-Featured Audit

```bash
ai-lighthouse audit https://example.com
```

In the wizard, select all features:
- ✓ 🧠 AI Understanding
- ✓ 📄 Content Chunking
- ✓ 🔄 Extractability
- ✓ ⚠️ Hallucination Detection
- Continue

Then configure your LLM provider.

## Advanced Usage (Skip Wizard)

If you know exactly what you want, you can skip the wizard with flags:

### Quick Examples

```bash
# Basic audit, skip wizard, export as JSON
ai-lighthouse audit https://example.com --output json

# With Ollama (local LLM)
ai-lighthouse audit https://example.com \
  --enable-llm \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b

# With OpenAI
ai-lighthouse audit https://example.com \
  --enable-llm \
  --llm-provider openai \
  --llm-api-key sk-...

# Full-featured with Ollama
ai-lighthouse audit https://example.com \
  --enable-llm \
  --enable-chunking \
  --enable-extractability \
  --enable-hallucination \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b
```

## When Does the Wizard Appear?

The wizard **automatically shows** when:
- ✅ You run `ai-lighthouse audit <url>` with NO feature flags
- ✅ You just provide a URL

The wizard **does NOT show** when:
- ❌ You pass `--enable-llm` or other feature flags
- ❌ You specify `--output json` (or html, pdf, csv)
- ❌ You're using the command in a script/CI

This means:
- **Interactive use** = Wizard (easy!)
- **Scripted use** = No wizard (predictable!)

## Output Formats

```bash
# Interactive UI (default)
ai-lighthouse audit https://example.com

# JSON (for scripts/CI)
ai-lighthouse audit https://example.com --output json

# HTML report
ai-lighthouse audit https://example.com --output html

# PDF report
ai-lighthouse audit https://example.com --output pdf

# Lighthouse format
ai-lighthouse audit https://example.com --output lhr

# CSV export
ai-lighthouse audit https://example.com --output csv
```

## Common Workflows

### First Time Using the Tool

```bash
# Just run it!
ai-lighthouse audit https://yoursite.com

# The wizard will guide you through everything
```

### Regular Quick Check

```bash
# Run basic audit (press Enter when wizard appears)
ai-lighthouse audit https://yoursite.com
```

### Deep Analysis

```bash
# Select all features in the wizard
ai-lighthouse audit https://yoursite.com
```

### Automation / CI/CD

```bash
# Skip wizard with flags
ai-lighthouse audit https://yoursite.com \
  --output json \
  --threshold 80
```

### Compare Before/After Changes

```bash
# Before changes
ai-lighthouse audit https://yoursite.com --output json > before.json

# Make changes to your site

# After changes
ai-lighthouse audit https://yoursite.com --output json > after.json

# Compare the JSON files
```

## Tips

### 🎯 For Beginners
- Just use `ai-lighthouse audit <url>`
- Let the wizard guide you
- Start with basic audit (no features)
- Enable features one at a time to learn

### 🚀 For Power Users
- Use flags to skip the wizard
- Create shell aliases for common configs
- Use `--output json` for scripting
- Pipe output to `jq` for filtering

### 🤖 For CI/CD
- Always use `--output json`
- Add `--threshold` to fail builds on low scores
- Store API keys in environment variables
- Use `--no-color` if needed

## Examples by Use Case

### Local Development with Ollama

```bash
# 1. Start Ollama
ollama serve

# 2. Pull a small model
ollama pull qwen2.5:0.5b

# 3. Run audit (wizard will auto-detect Ollama settings)
ai-lighthouse audit http://localhost:3000
```

### Production Site Audit

```bash
# Let wizard guide you
ai-lighthouse audit https://yourproductionsite.com

# Or be specific
ai-lighthouse audit https://yourproductionsite.com \
  --enable-llm \
  --enable-hallucination \
  --llm-provider openai \
  --llm-api-key $OPENAI_API_KEY
```

### CI/CD Pipeline

```yaml
# .github/workflows/audit.yml
- name: Audit website
  run: |
    ai-lighthouse audit https://staging.example.com \
      --output json \
      --threshold 80
```

### Batch Auditing Multiple URLs

```bash
# audit-sites.sh
for url in https://site1.com https://site2.com https://site3.com; do
  ai-lighthouse audit $url --output json > "$(echo $url | sed 's/https:\/\///g').json"
done
```

## Getting Help

```bash
# Main help
ai-lighthouse --help

# Command help
ai-lighthouse audit --help

# Version
ai-lighthouse --version
```

## What's Next?

After you've run a few audits:

1. **Read the full guide**: See [WIZARD_GUIDE.md](./WIZARD_GUIDE.md) for detailed wizard usage
2. **Explore the UI**: See [CLI_UI_README.md](./CLI_UI_README.md) for UI features
3. **Learn the flags**: Run `ai-lighthouse audit --help` for all options
4. **Automate**: Create scripts for regular audits

Happy auditing! 🚨✨
