import { EFFORT_LEVEL, IMPACT_LEVEL, Issue } from '../types.js';

/**
 * Calculate impact level from impact score
 */
export function calculateImpactLevel(impactScore: number): IMPACT_LEVEL {
  if (impactScore >= 41) return IMPACT_LEVEL.CRITICAL;
  if (impactScore >= 31) return IMPACT_LEVEL.HIGH;
  if (impactScore >= 21) return IMPACT_LEVEL.MEDIUM;
  if (impactScore >= 11) return IMPACT_LEVEL.LOW;
  return IMPACT_LEVEL.MINIMAL;
}

/**
 * Estimate effort level based on issue type and characteristics
 * This is a heuristic - rules can override this
 */
export function estimateEffortLevel(issue: Issue): EFFORT_LEVEL {
  const { id, tags = [], category } = issue;

  // Quick wins (< 30 minutes)
  const quickPatterns = [
    'missing-canonical',
    'missing-viewport',
    'missing-meta-description',
    'missing-og-tags',
    'missing-h1',
    'missing-page-title',
    'missing-alt-text'
  ];

  // Easy fixes (30min - 2 hours)
  const easyPatterns = [
    'sitemap',
    'robots',
    'publish-date',
    'schema',
    'breadcrumb',
    'heading-hierarchy'
  ];

  // Moderate fixes (2-8 hours)
  const moderatePatterns = [
    'redirect',
    'content-density',
    'formatting',
    'semantic-html',
    'structured-data'
  ];

  // Significant fixes (1-3 days)
  const significantPatterns = [
    'pre-rendering',
    'client-side-rendering',
    'extractability',
    'chunk',
    'transcript',
    'accessibility'
  ];

  // Check ID patterns
  for (const pattern of quickPatterns) {
    if (id.toLowerCase().includes(pattern)) {
      return EFFORT_LEVEL.QUICK;
    }
  }

  for (const pattern of easyPatterns) {
    if (id.toLowerCase().includes(pattern)) {
      return EFFORT_LEVEL.EASY;
    }
  }

  for (const pattern of moderatePatterns) {
    if (id.toLowerCase().includes(pattern)) {
      return EFFORT_LEVEL.MODERATE;
    }
  }

  for (const pattern of significantPatterns) {
    if (id.toLowerCase().includes(pattern)) {
      return EFFORT_LEVEL.SIGNIFICANT;
    }
  }

  // Check tags
  if (tags.includes('quick-win')) return EFFORT_LEVEL.QUICK;
  if (tags.includes('easy-fix')) return EFFORT_LEVEL.EASY;
  if (tags.includes('requires-refactor')) return EFFORT_LEVEL.SIGNIFICANT;
  if (tags.includes('major-refactor')) return EFFORT_LEVEL.MAJOR;

  // Default based on category
  if (category === 'CRAWL') return EFFORT_LEVEL.EASY;
  if (category === 'KG') return EFFORT_LEVEL.MODERATE;
  if (category === 'CI') return EFFORT_LEVEL.MODERATE;

  return EFFORT_LEVEL.MODERATE;
}

/**
 * Calculate priority score for sorting issues
 * Higher score = higher priority (quick wins with high impact)
 */
export function calculatePriorityScore(issue: Issue): number {
  const impactScore = issue.impactScore || 0;

  const effortWeights = {
    [EFFORT_LEVEL.QUICK]: 5,
    [EFFORT_LEVEL.EASY]: 4,
    [EFFORT_LEVEL.MODERATE]: 3,
    [EFFORT_LEVEL.SIGNIFICANT]: 2,
    [EFFORT_LEVEL.MAJOR]: 1
  };

  const effortLevel = issue.effortLevel || estimateEffortLevel(issue);
  const effortWeight = effortWeights[effortLevel];

  // Priority = Impact * Effort Weight * Confidence
  return impactScore * effortWeight * (issue.confidence || 1);
}

/**
 * Enrich an issue with effort and impact metadata
 */
export function enrichIssueMetadata(issue: Issue): Issue {
  if (!issue.impactLevel) {
    issue.impactLevel = calculateImpactLevel(issue.impactScore);
  }

  if (!issue.effortLevel) {
    issue.effortLevel = estimateEffortLevel(issue);
  }

  return issue;
}

/**
 * Enrich multiple issues with metadata
 */
export function enrichIssuesMetadata(issues: Issue[]): Issue[] {
  return issues.map(enrichIssueMetadata);
}

/**
 * Sort issues by priority (high priority first)
 */
export function sortByPriority(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
}

/**
 * Get quick wins - high impact, low effort
 */
export function getQuickWins(issues: Issue[]): Issue[] {
  return issues.filter((issue) => {
    const effort = issue.effortLevel || estimateEffortLevel(issue);
    const impact = issue.impactLevel || calculateImpactLevel(issue.impactScore);

    return (
      (effort === EFFORT_LEVEL.QUICK || effort === EFFORT_LEVEL.EASY) &&
      (impact === IMPACT_LEVEL.HIGH || impact === IMPACT_LEVEL.CRITICAL || impact === IMPACT_LEVEL.MEDIUM)
    );
  });
}
