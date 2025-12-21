/**
 * Output formatter for AI-Lighthouse audit results
 * Formats scan results into a standardized audit report structure
 */

import { ScanResult, Issue, SEVERITY, CATEGORY } from './types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Standardized audit output format
 */
export interface AuditReport {
  version: string;
  audit_id: string;
  scanned_at: string;
  input: {
    requested_url: string;
    final_url: string;
    status_code: number;
    redirect_chain: string[];
  };
  scores: {
    crawlability: number;
    structure: number;
    schema_coverage: number;
    content_clarity: number;
    ai_readiness: number;
    overall: number;
  };
  entities: Array<{
    type: string;
    name: string;
    description?: string;
    source: string;
    sameAs?: string[];
    productDetails?: {
      price?: string;
      currency?: string;
      availability?: string;
    };
    brand?: string;
    url?: string;
    image?: string;
  }>;
  issues: Array<{
    id: string;
    severity: string;
    message: string;
    evidence: string | null;
    suggested_fix: string;
    impact: string;
    category: string;
    scoreImpact?: number; // Estimated score improvement if fixed
    rule_id?: string; // Rule ID for reference
  }>;
  recommendations: Array<{
    issue_id: string;
    fix: string;
    impact: string;
  }>;
  detailed_scoring?: {
    overall_score: number;
    grade: string;
    category_scores: Array<{
      category: string;
      score: number;
      grade: string;
      issues: number;
      weight: number;
    }>;
    severity_breakdown: Record<string, number>;
  };
  raw?: {
    pages: string[];
  };
}

/**
 * Map internal categories to audit score categories
 */
function mapCategoryToScore(category: CATEGORY): keyof AuditReport['scores'] | null {
  const mapping: Partial<Record<CATEGORY, keyof AuditReport['scores']>> = {
    [CATEGORY.CRAWL]: 'crawlability',
    [CATEGORY.AIREAD]: 'structure',
    [CATEGORY.KG]: 'schema_coverage',
    [CATEGORY.EXTRACT]: 'schema_coverage',
    [CATEGORY.TECH]: 'structure',
    [CATEGORY.A11Y]: 'content_clarity',
    [CATEGORY.CHUNK]: 'content_clarity',
  };
  return mapping[category] || null;
}

/**
 * Calculate category-based scores for audit format
 */
function calculateAuditScores(result: ScanResult): AuditReport['scores'] {
  const scoring = result.scoring!;
  
  // Initialize scores at 100
  const scores = {
    crawlability: 100,
    structure: 100,
    schema_coverage: 100,
    content_clarity: 100,
    ai_readiness: 100,
    overall: scoring.overallScore,
  };

  // Map our categories to audit score categories
  const categoryScoreMap: Record<keyof Omit<AuditReport['scores'], 'overall' | 'ai_readiness'>, number[]> = {
    crawlability: [],
    structure: [],
    schema_coverage: [],
    content_clarity: [],
  };

  // Collect scores by audit category
  for (const cs of scoring.categoryScores) {
    const auditCategory = mapCategoryToScore(cs.category);
    if (auditCategory && auditCategory !== 'overall' && auditCategory !== 'ai_readiness') {
      categoryScoreMap[auditCategory].push(cs.score);
    }
  }

  // Average scores for each audit category
  for (const [category, scoreList] of Object.entries(categoryScoreMap)) {
    if (scoreList.length > 0) {
      const avg = scoreList.reduce((sum, s) => sum + s, 0) / scoreList.length;
      scores[category as keyof typeof categoryScoreMap] = Math.round(avg);
    }
  }

  // AI readiness is a weighted average of all categories
  scores.ai_readiness = Math.round(scoring.overallScore);

  return scores;
}

/**
 * Map severity to audit format
 */
function mapSeverity(severity: SEVERITY): string {
  return severity.toLowerCase();
}

/**
 * Map category to audit category
 */
function mapCategory(category: CATEGORY): string {
  const mapping: Partial<Record<CATEGORY, string>> = {
    [CATEGORY.AIREAD]: 'structure',
    [CATEGORY.EXTRACT]: 'schema',
    [CATEGORY.CHUNK]: 'content',
    [CATEGORY.CRAWL]: 'crawl',
    [CATEGORY.KG]: 'schema',
    [CATEGORY.TECH]: 'technical',
    [CATEGORY.A11Y]: 'accessibility',
    [CATEGORY.LLMLOCAL]: 'optimization',
    [CATEGORY.LLMAPI]: 'optimization',
    [CATEGORY.LLMCON]: 'optimization',
    [CATEGORY.HALL]: 'content',
    [CATEGORY.GAPS]: 'content',
    [CATEGORY.DRIFT]: 'content',
    [CATEGORY.CI]: 'citation',
    [CATEGORY.DX]: 'technical',
    [CATEGORY.MISC]: 'other',
  };
  return mapping[category] || 'other';
}

/**
 * Extract entities from issues (looking for entity detector results)
 */
function extractEntities(result: ScanResult): AuditReport['entities'] {
  const entities: AuditReport['entities'] = [];

  // Find entity detector issue (INFO severity with entity data)
  const entityIssue = result.issues.find(
    issue => issue.id === 'EXTRACT-002' && issue.severity === SEVERITY.INFO
  );

  if (entityIssue && entityIssue.evidence) {
    try {
      // Entity data is stored in evidence as JSON
      const entityData = JSON.parse(entityIssue.evidence[0] || '{}');
      
      if (entityData.entityType && entityData.name) {
        entities.push({
          type: entityData.entityType,
          name: entityData.name,
          description: entityData.description,
          source: 'jsonld',
          sameAs: entityData.sameAsLinks,
          productDetails: entityData.productDetails,
          brand: entityData.brand,
          url: entityData.url,
          image: entityData.image,
        });
      }
    } catch (e) {
      // If parsing fails, skip entity extraction
    }
  }

  return entities;
}

/**
 * Generate recommendations from high priority issues
 */
function generateRecommendations(issues: Issue[]): AuditReport['recommendations'] {
  const recommendations: AuditReport['recommendations'] = [];

  // Get critical and high severity issues
  const priorityIssues = issues
    .filter(i => i.severity === SEVERITY.CRITICAL || i.severity === SEVERITY.HIGH)
    .sort((a, b) => {
      // Sort by severity then impact
      if (a.severity === SEVERITY.CRITICAL && b.severity !== SEVERITY.CRITICAL) return -1;
      if (a.severity !== SEVERITY.CRITICAL && b.severity === SEVERITY.CRITICAL) return 1;
      return b.impactScore - a.impactScore;
    })
    .slice(0, 10); // Top 10 recommendations

  for (const issue of priorityIssues) {
    recommendations.push({
      issue_id: issue.id,
      fix: issue.remediation,
      impact: mapSeverity(issue.severity),
    });
  }

  return recommendations;
}

/**
 * Format issues for audit output
 */
function formatIssues(issues: Issue[]): AuditReport['issues'] {
  return issues
    .filter(i => i.severity !== SEVERITY.INFO) // Exclude INFO issues from main list
    .map(issue => ({
      id: issue.id,
      severity: mapSeverity(issue.severity),
      message: issue.title,
      evidence: issue.evidence && issue.evidence.length > 0 
        ? issue.evidence.join(', ') 
        : null,
      suggested_fix: issue.remediation,
      impact: mapSeverity(issue.severity),
      category: mapCategory(issue.category),
      scoreImpact: issue.scoreImpact,
      rule_id: issue.id,
    }));
}

/**
 * Get letter grade from score
 */
function getLetterGrade(score: number): string {
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
 * Format scan result into standardized audit report
 */
export function formatAuditReport(
  result: ScanResult,
  options: {
    includeRaw?: boolean;
    includeDetailedScoring?: boolean;
  } = {}
): AuditReport {
  const { includeRaw = false, includeDetailedScoring = true } = options;

  const scoring = result.scoring!;
  const auditId = uuidv4();
  const scannedAt = new Date(result.timestamp || Date.now()).toISOString();

  // Calculate audit scores
  const scores = calculateAuditScores(result);

  // Extract entities
  const entities = extractEntities(result);

  // Format issues
  const issues = formatIssues(result.issues);

  // Generate recommendations
  const recommendations = generateRecommendations(result.issues);

  // Build report
  const report: AuditReport = {
    version: '1.0.0',
    audit_id: auditId,
    scanned_at: scannedAt,
    input: {
      requested_url: result.url,
      final_url: result.url,
      status_code: 200, // Would need to be passed from fetch result
      redirect_chain: [],
    },
    scores,
    entities,
    issues,
    recommendations,
  };

  // Add detailed scoring if requested
  if (includeDetailedScoring) {
    report.detailed_scoring = {
      overall_score: scoring.overallScore,
      grade: getLetterGrade(scoring.overallScore),
      category_scores: scoring.categoryScores
        .filter(cs => cs.issueCount > 0)
        .map(cs => ({
          category: cs.category,
          score: cs.score,
          grade: getLetterGrade(cs.score),
          issues: cs.issueCount,
          weight: cs.weight,
        })),
      severity_breakdown: Object.fromEntries(
        Object.entries(scoring.severityBreakdown).map(([k, v]) => [k.toLowerCase(), v])
      ),
    };
  }

  // Add raw HTML if requested
  if (includeRaw) {
    report.raw = {
      pages: [result.issues[0]?.location?.textSnippet || '<!doctype html> ... truncated ...'],
    };
  }

  return report;
}

/**
 * Export audit report as JSON string
 */
export function exportAuditReport(
  result: ScanResult,
  options: {
    pretty?: boolean;
    includeRaw?: boolean;
    includeDetailedScoring?: boolean;
  } = {}
): string {
  const { pretty = true, ...reportOptions } = options;
  const report = formatAuditReport(result, reportOptions);
  return JSON.stringify(report, null, pretty ? 2 : 0);
}
