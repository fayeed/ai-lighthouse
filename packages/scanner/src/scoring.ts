import { Issue, SEVERITY, CATEGORY } from './types.js';

/**
 * Severity weight multipliers for impact scoring
 */
const SEVERITY_WEIGHTS: Record<SEVERITY, number> = {
  [SEVERITY.INFO]: 0,
  [SEVERITY.LOW]: 1,
  [SEVERITY.MEDIUM]: 2.5,
  [SEVERITY.HIGH]: 5,
  [SEVERITY.CRITICAL]: 10,
};

/**
 * Category importance weights (1.0 = baseline)
 * Higher weights mean issues in that category affect the score more
 */
const CATEGORY_WEIGHTS: Record<CATEGORY, number> = {
  [CATEGORY.AIREAD]: 1.5,      // AI readability is crucial
  [CATEGORY.EXTRACT]: 1.4,     // Data extraction quality
  [CATEGORY.CHUNK]: 1.3,       // Content chunking for embeddings
  [CATEGORY.CRAWL]: 1.2,       // Crawlability affects discoverability
  [CATEGORY.A11Y]: 1.2,        // Accessibility matters
  [CATEGORY.KG]: 1.1,          // Knowledge graph / structured data
  [CATEGORY.TECH]: 1.0,        // Technical SEO
  [CATEGORY.LLMLOCAL]: 1.0,    // Local LLM optimization
  [CATEGORY.LLMAPI]: 1.0,      // API LLM optimization
  [CATEGORY.LLMCON]: 0.9,      // LLM confidence
  [CATEGORY.HALL]: 0.9,        // Hallucination prevention
  [CATEGORY.GAPS]: 0.8,        // Content gaps
  [CATEGORY.DRIFT]: 0.8,       // Content drift
  [CATEGORY.CI]: 0.7,          // Citation issues
  [CATEGORY.DX]: 0.6,          // Developer experience
  [CATEGORY.MISC]: 0.5,        // Miscellaneous
};

/**
 * Individual category score details
 */
export interface CategoryScore {
  category: CATEGORY;
  score: number;           // 0-100
  issueCount: number;
  totalImpact: number;
  weight: number;
  issues: {
    severity: SEVERITY;
    count: number;
    impact: number;
  }[];
}

/**
 * Overall scoring result
 */
export interface ScoringResult {
  overallScore: number;    // 0-100 weighted average
  categoryScores: CategoryScore[];
  totalIssues: number;
  severityBreakdown: Record<SEVERITY, number>;
  maxPossibleScore: number;
  normalizedScore: number; // Adjusted for category weights
}

/**
 * Calculate weighted impact for an issue
 */
function calculateWeightedImpact(issue: Issue): number {
  const severityWeight = SEVERITY_WEIGHTS[issue.serverity] || SEVERITY_WEIGHTS[SEVERITY.LOW];
  const categoryWeight = CATEGORY_WEIGHTS[issue.category] || 1.0;
  const baseImpact = issue.impactScore || 0;
  
  return baseImpact * severityWeight * categoryWeight;
}

/**
 * Calculate score for a single category (0-100)
 */
function calculateCategoryScore(issues: Issue[], category: CATEGORY): CategoryScore {
  const categoryIssues = issues.filter(i => i.category === category);
  
  if (categoryIssues.length === 0) {
    return {
      category,
      score: 100,
      issueCount: 0,
      totalImpact: 0,
      weight: CATEGORY_WEIGHTS[category] || 1.0,
      issues: [],
    };
  }

  // Group by severity
  const severityMap = new Map<SEVERITY, { count: number; impact: number }>();
  let totalWeightedImpact = 0;

  for (const issue of categoryIssues) {
    const severity = issue.serverity;
    const weightedImpact = calculateWeightedImpact(issue);
    totalWeightedImpact += weightedImpact;

    if (!severityMap.has(severity)) {
      severityMap.set(severity, { count: 0, impact: 0 });
    }
    const entry = severityMap.get(severity)!;
    entry.count++;
    entry.impact += weightedImpact;
  }

  // Calculate score: Start at 100, deduct based on weighted impact
  // Using logarithmic scale to prevent single issues from dominating
  const penalty = Math.min(100, totalWeightedImpact * 2); // 2x multiplier for sensitivity
  const score = Math.max(0, 100 - penalty);

  return {
    category,
    score: Math.round(score * 10) / 10, // Round to 1 decimal
    issueCount: categoryIssues.length,
    totalImpact: Math.round(totalWeightedImpact * 10) / 10,
    weight: CATEGORY_WEIGHTS[category] || 1.0,
    issues: Array.from(severityMap.entries()).map(([severity, data]) => ({
      severity,
      count: data.count,
      impact: Math.round(data.impact * 10) / 10,
    })),
  };
}

/**
 * Calculate overall score across all categories
 */
export function calculateScore(issues: Issue[]): ScoringResult {
  // Get all unique categories present in issues
  const categoriesWithIssues = new Set(issues.map(i => i.category));
  const allCategories = Object.values(CATEGORY);
  
  // Calculate scores for all categories
  const categoryScores: CategoryScore[] = allCategories.map(category =>
    calculateCategoryScore(issues, category)
  );

  // Calculate weighted overall score
  // Only consider categories that have issues or are important
  const scoredCategories = categoryScores.filter(cs => 
    cs.issueCount > 0 || cs.weight >= 1.0
  );

  let weightedSum = 0;
  let totalWeight = 0;

  for (const cs of scoredCategories) {
    weightedSum += cs.score * cs.weight;
    totalWeight += cs.weight;
  }

  const overallScore = totalWeight > 0 
    ? Math.round((weightedSum / totalWeight) * 10) / 10
    : 100;

  // Severity breakdown
  const severityBreakdown: Record<SEVERITY, number> = {
    [SEVERITY.INFO]: 0,
    [SEVERITY.LOW]: 0,
    [SEVERITY.MEDIUM]: 0,
    [SEVERITY.HIGH]: 0,
    [SEVERITY.CRITICAL]: 0,
  };

  for (const issue of issues) {
    severityBreakdown[issue.serverity]++;
  }

  // Calculate normalized score (0-100 scale considering all possible categories)
  const maxPossibleWeight = allCategories.reduce(
    (sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 1.0),
    0
  );
  const normalizedScore = Math.round((weightedSum / maxPossibleWeight) * 10) / 10;

  return {
    overallScore,
    categoryScores: categoryScores.sort((a, b) => a.score - b.score), // Sort by score ascending (worst first)
    totalIssues: issues.length,
    severityBreakdown,
    maxPossibleScore: 100,
    normalizedScore,
  };
}

/**
 * Get a letter grade based on score
 */
export function getLetterGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Generate a human-readable summary of the scoring
 */
export function generateScoringSummary(result: ScoringResult): string {
  const grade = getLetterGrade(result.overallScore);
  const lines: string[] = [];

  lines.push(`Overall Score: ${result.overallScore}/100 (Grade: ${grade})`);
  lines.push(`Total Issues: ${result.totalIssues}`);
  lines.push('');
  
  // Severity breakdown
  lines.push('Severity Breakdown:');
  for (const [severity, count] of Object.entries(result.severityBreakdown)) {
    if (count > 0) {
      lines.push(`  ${severity.toUpperCase()}: ${count}`);
    }
  }
  lines.push('');

  // Category scores (show only categories with issues or low scores)
  lines.push('Category Scores:');
  const problematicCategories = result.categoryScores
    .filter(cs => cs.issueCount > 0 || cs.score < 100)
    .slice(0, 10); // Top 10 problematic

  for (const cs of problematicCategories) {
    const gradeStr = getLetterGrade(cs.score);
    lines.push(`  ${cs.category}: ${cs.score}/100 (${gradeStr}) - ${cs.issueCount} issues`);
  }

  return lines.join('\n');
}
