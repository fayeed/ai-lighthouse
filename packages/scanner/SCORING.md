# AI-Lighthouse Scoring System

## Overview

The scoring system provides comprehensive analysis of web pages for AI/LLM optimization, calculating both category-specific and overall scores based on issue severity and category importance.

## Scoring Components

### 1. Severity Weights
Each issue severity has a multiplier that affects its impact:
- **INFO**: 0x (no impact on score)
- **LOW**: 1x
- **MEDIUM**: 2.5x
- **HIGH**: 5x
- **CRITICAL**: 10x

### 2. Category Weights
Different categories have different importance levels:
- **AIREAD** (1.5x): AI readability - most crucial for LLM comprehension
- **EXTRACT** (1.4x): Data extraction quality
- **CHUNK** (1.3x): Content chunking for embeddings
- **CRAWL** (1.2x): Crawlability and discoverability
- **A11Y** (1.2x): Accessibility
- **KG** (1.1x): Knowledge graph/structured data
- **TECH** (1.0x): Technical SEO
- **LLMLOCAL** (1.0x): Local LLM optimization
- **LLMAPI** (1.0x): API LLM optimization
- And others with lower weights...

### 3. Score Calculation

**Per Issue Impact:**
```
Weighted Impact = BaseImpact × SeverityWeight × CategoryWeight
```

**Category Score:**
```
Penalty = min(100, TotalWeightedImpact × 2)
CategoryScore = max(0, 100 - Penalty)
```

**Overall Score:**
```
OverallScore = Σ(CategoryScore × CategoryWeight) / Σ(CategoryWeight)
```

## Score Ranges & Grades

- **95-100 (A+)**: Excellent - minimal issues
- **90-94 (A)**: Very Good
- **85-89 (A-)**: Good
- **80-84 (B+)**: Above Average
- **75-79 (B)**: Average
- **70-74 (B-)**: Below Average
- **65-69 (C+)**: Fair
- **60-64 (C)**: Poor
- **55-59 (C-)**: Very Poor
- **50-54 (D)**: Critical Issues
- **0-49 (F)**: Failing - major problems

## Usage Example

```typescript
import { analyzeUrlWithRules } from '@ai-lighthouse/scanner';
import { generateScoringSummary, getLetterGrade } from '@ai-lighthouse/scanner/scoring';

const result = await analyzeUrlWithRules('https://example.com');

// Access comprehensive scoring
console.log('Overall Score:', result.scoring.overallScore);
console.log('Grade:', getLetterGrade(result.scoring.overallScore));

// View category breakdown
result.scoring.categoryScores.forEach(cs => {
  if (cs.issueCount > 0) {
    console.log(`${cs.category}: ${cs.score}/100 - ${cs.issueCount} issues`);
  }
});

// Human-readable summary
console.log(generateScoringSummary(result.scoring));
```

## ScoringResult Interface

```typescript
interface ScoringResult {
  overallScore: number;           // 0-100 weighted average
  categoryScores: CategoryScore[]; // Individual category scores
  totalIssues: number;            // Total number of issues found
  severityBreakdown: Record<SEVERITY, number>; // Count by severity
  maxPossibleScore: number;       // Always 100
  normalizedScore: number;        // Score normalized across all categories
}

interface CategoryScore {
  category: CATEGORY;             // Category name
  score: number;                  // 0-100
  issueCount: number;             // Number of issues in this category
  totalImpact: number;            // Sum of weighted impacts
  weight: number;                 // Category importance weight
  issues: {                       // Breakdown by severity
    severity: SEVERITY;
    count: number;
    impact: number;
  }[];
}
```

## Interpreting Results

### High Priority Categories (Weight ≥ 1.2)
Focus on these first as they have the most impact:
1. **AIREAD**: Content must be structured for LLM comprehension
2. **EXTRACT**: Structured data must be properly formatted
3. **CHUNK**: Content size must fit within token windows
4. **CRAWL**: Pages must be discoverable
5. **A11Y**: Accessible content is also AI-readable

### Example Output

```
Overall Score: 78.5/100 (Grade: B)
Total Issues: 12

Severity Breakdown:
  CRITICAL: 1
  HIGH: 3
  MEDIUM: 5
  LOW: 3

Category Scores:
  CHUNK: 65.0/100 (C+) - 1 issues
  AIREAD: 72.5/100 (B-) - 4 issues
  CRAWL: 85.0/100 (A-) - 2 issues
  EXTRACT: 90.0/100 (A) - 1 issues
  A11Y: 95.0/100 (A+) - 1 issues
```

## Best Practices

1. **Target 85+ Overall Score**: Aim for A- or better for optimal AI/LLM performance
2. **Prioritize CRITICAL/HIGH Issues**: Address these first regardless of category
3. **Focus on High-Weight Categories**: AIREAD, EXTRACT, and CHUNK issues have outsized impact
4. **Monitor Trends**: Track scores over time to measure improvements
5. **Balance Categories**: Don't ignore low-scoring categories even if weighted less

## Advanced Features

### Normalized Score
The `normalizedScore` considers ALL possible categories (not just those with issues), giving a more conservative score that accounts for the full scope of optimization.

### Category Weights Customization
You can adjust category weights in `scoring.ts` to match your specific priorities:

```typescript
const CATEGORY_WEIGHTS: Record<CATEGORY, number> = {
  [CATEGORY.AIREAD]: 2.0,  // Increase importance
  [CATEGORY.EXTRACT]: 1.8,
  // ... other categories
};
```

### Severity Weights Customization
Similarly, adjust how much each severity level affects scoring:

```typescript
const SEVERITY_WEIGHTS: Record<SEVERITY, number> = {
  [SEVERITY.CRITICAL]: 15,  // Make critical issues even more impactful
  [SEVERITY.HIGH]: 7,
  // ... other severities
};
```
