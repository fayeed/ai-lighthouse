# AI Lighthouse Beautiful CLI

The AI Lighthouse CLI now features a beautiful, interactive terminal UI built with React (using Ink) that matches the functionality and design of the web version!

## Features

### Interactive UI Components

- **Beautiful Score Display** - Animated score with gradient text and grade badges
- **Tab Navigation** - Navigate through 6 different analysis sections using arrow keys or number keys
- **Real-time Loading States** - Beautiful loading spinners with progress indicators
- **Color-coded Data** - All severity levels, scores, and statuses are color-coded for easy scanning
- **Progress Bars** - Visual progress bars for all dimension scores
- **Expandable Sections** - Organized data in bordered, color-coded sections

### Analysis Sections

1. **Overview Tab** - AI readiness summary with:
   - AI Agent Perspective (Can Understand, Extract, Index, Answer)
   - Dimension scores with progress bars
   - Quick Wins section

2. **Issues Tab** - Comprehensive issue reporting with:
   - Issue summary by severity
   - Color-coded issue cards
   - Detailed fix recommendations
   - Category and impact information

3. **AI Understanding Tab** - LLM analysis including:
   - Inferred page type
   - AI-generated insights
   - Key topics and entities
   - Questions AI can answer
   - Suggested FAQs

4. **Hallucination Risk Tab** - Risk assessment with:
   - Overall risk score
   - Fact check summary
   - High-risk triggers
   - Verification recommendations

5. **Message Alignment Tab** - AI understanding check showing:
   - Alignment and clarity scores
   - What AI actually understood about your site
   - Priority mismatches
   - Recommendations

6. **Technical Tab** - Technical analysis including:
   - Category scores (Crawlability, Structure, Schema Coverage, Content Clarity)
   - Chunking analysis
   - Extractability metrics

## Usage

### Interactive Mode (Default)

```bash
ai-lighthouse audit https://example.com
```

This will launch the interactive UI with tab navigation. Use:
- **← →** arrow keys to navigate between tabs
- **1-6** number keys to jump to specific tabs
- **Ctrl+C** to exit

### Interactive Mode with LLM Analysis

```bash
ai-lighthouse audit https://example.com --enable-llm --llm-provider openai --llm-api-key YOUR_KEY
```

### Interactive Mode with All Features

```bash
ai-lighthouse audit https://example.com \
  --enable-llm \
  --enable-chunking \
  --enable-extractability \
  --enable-hallucination \
  --llm-provider openai \
  --llm-api-key YOUR_KEY
```

### Export Modes (Non-interactive)

For automated workflows, you can export to various formats:

```bash
# JSON export (for CI/CD)
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

## UI Components

All UI components are built with React and Ink, located in `src/ui/`:

- `AuditReportUI.tsx` - Main container with tab navigation
- `components/ScoreDisplay.tsx` - Animated score display with gradient
- `components/OverviewSection.tsx` - Overview tab with dimensions
- `components/IssuesSection.tsx` - Issues list with filtering
- `components/AIUnderstandingSection.tsx` - LLM analysis display
- `components/HallucinationSection.tsx` - Hallucination risk display
- `components/MessageAlignmentSection.tsx` - Message alignment display
- `components/TechnicalSection.tsx` - Technical metrics display

## Design System

### Colors

- **Critical**: Red
- **High**: Magenta/Orange
- **Medium**: Yellow
- **Low**: Blue
- **Success**: Green
- **Info**: Cyan

### Icons

- 📊 Overview
- ⚠️ Issues
- 🧠 AI Understanding
- ⚠️ Hallucination Risk
- 🔍 Message Alignment
- ⚙️ Technical

### Borders

- Rounded borders for primary sections
- Single borders for nested content
- Color-coded borders matching severity/status

## Development

### Running in Development

```bash
pnpm dev audit https://example.com
```

### Type Checking

```bash
pnpm check-types
```

### Building

The CLI uses `tsx` runtime, so no build step is required. For distribution:

```bash
pnpm build
```

## Architecture

The CLI now supports two modes:

1. **Interactive Mode** - Uses Ink to render React components in the terminal
2. **Export Mode** - Traditional CLI output with spinners and formatted text

The mode is automatically selected based on the `--output` flag:
- `--output interactive` (default) - Interactive UI
- `--output json|html|pdf|lhr|csv` - Export modes

## Comparison with Web Version

The CLI UI now matches the web version's functionality:

| Feature | Web | CLI |
|---------|-----|-----|
| Score Display | ✅ | ✅ |
| Tab Navigation | ✅ | ✅ |
| AI Understanding | ✅ | ✅ |
| Hallucination Risk | ✅ | ✅ |
| Message Alignment | ✅ | ✅ |
| Technical Metrics | ✅ | ✅ |
| Issues List | ✅ | ✅ |
| Quick Wins | ✅ | ✅ |
| Dimension Scores | ✅ | ✅ |
| Progress Bars | ✅ | ✅ |
| Color Coding | ✅ | ✅ |
| Interactive Navigation | ✅ | ✅ |
| Animations | ✅ | ✅ (Spinners) |

## Future Enhancements

Potential improvements for the CLI UI:

- [ ] Fuzzy search/filter in issues tab
- [ ] Export current view to file
- [ ] Side-by-side comparison mode
- [ ] Chart visualizations (using ASCII art)
- [ ] Custom color themes
- [ ] Keyboard shortcuts help overlay
- [ ] Persistent session state
- [ ] History/comparison with previous audits
