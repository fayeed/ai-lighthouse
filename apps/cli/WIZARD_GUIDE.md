# AI Lighthouse Interactive Wizard Guide

The AI Lighthouse CLI now features an **interactive setup wizard** that simplifies configuration by asking you questions instead of requiring complex command-line flags!

## Quick Start

### Option 1: Wizard with URL

```bash
ai-lighthouse wizard https://example.com
```

or use the short alias:

```bash
ai-lighthouse w https://example.com
```

### Option 2: Wizard without URL (asks you for it)

```bash
ai-lighthouse wizard
```

## How It Works

The wizard guides you through a simple, step-by-step configuration process:

### Step 1: URL Input (if not provided)

```
🚨 AI Lighthouse Setup Wizard
Configure your audit settings

Enter the URL to audit:
URL: _
```

Type your URL and press Enter.

### Step 2: Feature Selection

```
Select features to enable:
Selected: None (basic audit only)

  🧠 AI Understanding (LLM Analysis)
  📄 Content Chunking Analysis
  🔄 Extractability Analysis
  ⚠️  Hallucination Detection
  ✅ Continue with selected features

Use ↑↓ to navigate, Enter to toggle/continue
```

- Use **↑** and **↓** arrow keys to navigate
- Press **Enter** to toggle features on/off (✓ appears when selected)
- Select **✅ Continue** when ready

### Step 3: LLM Provider Selection (if LLM features enabled)

```
Select LLM provider:

  OpenAI (GPT-4, GPT-3.5)
  Anthropic (Claude)
  Ollama (Local)
  Custom/Local Provider

Use ↑↓ to navigate, Enter to select
```

Choose your preferred LLM provider.

### Step 4: Model Name

```
Enter LLM model name:
Model: _

Leave empty for default, or press Enter to continue
```

**Defaults:**
- OpenAI: `gpt-4o-mini`
- Anthropic: `claude-3-5-sonnet-20241022`
- Ollama: `qwen2.5:0.5b` (or any installed model)

### Step 5: API Key (for OpenAI/Anthropic)

```
Enter API key:
API Key: ****

Your API key will not be stored
```

Type your API key (it will be masked with `*` for security).

### Step 6: Base URL (optional, for Ollama/Custom)

```
Enter API base URL (optional):
Base URL: _

Press Enter to continue (leave empty for default)
```

**Defaults:**
- Ollama: `http://localhost:11434` (auto-filled)
- Custom: You specify

### Step 7: Running the Audit

```
✓ Configuration Complete
Starting audit...
```

The wizard automatically transitions to the audit UI!

## Wizard vs. Traditional Commands

### With Wizard (Simplified)

```bash
# Just run the wizard
ai-lighthouse wizard https://example.com

# Then follow the prompts:
# 1. Select "AI Understanding (LLM Analysis)" ✓
# 2. Select "Hallucination Detection" ✓
# 3. Select "Continue"
# 4. Choose "Ollama (Local)"
# 5. Enter model: "qwen2.5:0.5b"
# 6. Confirm base URL: "http://localhost:11434"
# Done!
```

### Without Wizard (Traditional)

```bash
ai-lighthouse audit https://example.com \
  --enable-llm \
  --enable-hallucination \
  --llm-provider ollama \
  --llm-model qwen2.5:0.5b \
  --llm-base-url http://localhost:11434
```

The wizard is **much easier** for beginners and interactive use!

## Feature Matrix

When you select features in the wizard:

| Feature Selected | What It Enables |
|-----------------|-----------------|
| 🧠 AI Understanding | LLM-powered page analysis, entity extraction, FAQ suggestions |
| 📄 Content Chunking | Shows how your content is divided for AI processing |
| 🔄 Extractability | Analyzes how well AI can extract your content |
| ⚠️ Hallucination Detection | Identifies potential hallucination triggers (requires AI Understanding) |

## Tips & Tricks

### Quick Basic Audit

```bash
# Wizard with URL, select "Continue" without features
ai-lighthouse w https://example.com
```

### Full-Featured Audit

```bash
# Enable all features in the wizard
ai-lighthouse wizard https://example.com
# Then select all 4 features before continuing
```

### Skip Wizard for Automation

For scripts and CI/CD, use the traditional `audit` command with flags:

```bash
ai-lighthouse audit https://example.com --output json
```

## Common Workflows

### First-Time User

1. Run wizard: `ai-lighthouse wizard`
2. Enter your website URL
3. Try without features first (press "Continue")
4. Review the basic report
5. Run again with features to see more insights

### Using Local Ollama

1. Start Ollama: `ollama serve`
2. Pull a small model: `ollama pull qwen2.5:0.5b`
3. Run wizard: `ai-lighthouse w https://example.com`
4. Select "AI Understanding" ✓
5. Choose "Ollama (Local)"
6. Enter model name: `qwen2.5:0.5b`
7. Confirm default URL

### Using OpenAI

1. Get API key from https://platform.openai.com/api-keys
2. Run wizard: `ai-lighthouse w https://example.com`
3. Select desired features
4. Choose "OpenAI (GPT-4, GPT-3.5)"
5. Enter model: (leave empty for default or type `gpt-4o-mini`)
6. Paste API key when prompted

### Using Anthropic Claude

1. Get API key from https://console.anthropic.com/
2. Run wizard: `ai-lighthouse w https://example.com`
3. Select features
4. Choose "Anthropic (Claude)"
5. Enter model: (leave empty for default)
6. Paste API key when prompted

## Keyboard Shortcuts in Wizard

- **↑** / **↓** - Navigate options
- **Enter** - Select/toggle option
- **Type** - Input text in text fields
- **Ctrl+C** - Cancel and exit

## Benefits of Using the Wizard

✅ **No memorization** - Don't need to remember complex flags
✅ **Visual feedback** - See your selections with checkmarks
✅ **Smart defaults** - Suggests appropriate defaults for each provider
✅ **Guided flow** - Only asks relevant questions
✅ **Error prevention** - Validates inputs as you go
✅ **Security** - Masks sensitive API keys
✅ **Quick setup** - Faster than typing long commands

## When to Use Each Mode

### Use the Wizard When:
- You're learning the tool
- You want to try different configurations
- You don't remember all the flags
- You're doing interactive analysis
- You want a guided experience

### Use Direct Commands When:
- You're automating audits (CI/CD)
- You're writing scripts
- You know exactly what you want
- You're running batch operations
- You want to pipe output to other tools

## Examples

### Example 1: Quick Test Run

```bash
$ ai-lighthouse w

🚨 AI Lighthouse Setup Wizard
Configure your audit settings

Enter the URL to audit:
URL: https://example.com

Select features to enable:
Selected: None (basic audit only)
> ✅ Continue with selected features

✓ Configuration Complete
Starting audit...

[Beautiful audit UI appears]
```

### Example 2: Full Analysis with Ollama

```bash
$ ai-lighthouse wizard https://mysite.com

🚨 AI Lighthouse Setup Wizard
Configure your audit settings

Select features to enable:
Selected: 🧠, 📄, 🔄, ⚠️
> ✅ Continue with selected features

Select LLM provider:
> Ollama (Local)

Enter LLM model name:
Model: llama2

Enter API base URL (optional):
Base URL: http://localhost:11434

✓ Configuration Complete
Starting audit...

[Comprehensive audit with all features]
```

## Troubleshooting

### Wizard doesn't start
- Make sure you're using `wizard` or `w` command
- Check that you have Node.js 18+ installed

### API key not working
- Verify your API key is correct
- Check that you have credits/access
- Ensure you selected the right provider

### Ollama connection fails
- Verify Ollama is running: `ollama list`
- Check the base URL is correct (default: `http://localhost:11434`)
- Ensure the model is pulled: `ollama pull modelname`

### Features not showing data
- Make sure you enabled the features in the wizard
- Check that LLM analysis completed successfully
- Some features require LLM to be enabled

## Next Steps

After using the wizard a few times, you might want to:

1. **Save common configurations** - Use the traditional command with flags in a script
2. **Explore all options** - Check `ai-lighthouse audit --help` for advanced flags
3. **Automate audits** - Integrate into your CI/CD pipeline
4. **Compare results** - Run audits regularly to track improvements

Happy auditing! 🚨✨
