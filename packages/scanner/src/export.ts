/**
 * Utilities for exporting and formatting scan results
 */

import { ScanResult, ScoringResult, CategoryScore, Issue, SEVERITY } from './types.js';
import { getLetterGrade } from './scoring.js';

/**
 * Export scan result as formatted JSON
 */
export function toJSON(result: ScanResult, pretty = true): string {
  return JSON.stringify(result, null, pretty ? 2 : 0);
}

/**
 * Create a simplified report object
 */
export interface SimplifiedReport {
  url: string;
  timestamp: number;
  grade: string;
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  categories: Array<{
    category: string;
    score: number;
    grade: string;
    issues: number;
  }>;
  topIssues: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
  }>;
}

/**
 * Generate a simplified report from scan result
 */
export function simplifyReport(result: ScanResult): SimplifiedReport {
  const scoring = result.scoring!;
  const criticalCount = scoring.severityBreakdown[SEVERITY.CRITICAL] || 0;
  const highCount = scoring.severityBreakdown[SEVERITY.HIGH] || 0;

  // Top 10 most severe issues
  const topIssues = [...result.issues]
    .filter(i => i.serverity !== SEVERITY.INFO)
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const aDiff = severityOrder[a.serverity];
      const bDiff = severityOrder[b.serverity];
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.impactScore - a.impactScore;
    })
    .slice(0, 10)
    .map(issue => ({
      id: issue.id,
      severity: issue.serverity,
      category: issue.category,
      title: issue.title,
      description: issue.description,
    }));

  // Categories with issues
  const categories = scoring.categoryScores
    .filter(cs => cs.issueCount > 0)
    .sort((a, b) => a.score - b.score)
    .map(cs => ({
      category: cs.category,
      score: cs.score,
      grade: getLetterGrade(cs.score),
      issues: cs.issueCount,
    }));

  return {
    url: result.url,
    timestamp: result.timestamp || Date.now(),
    grade: getLetterGrade(scoring.overallScore),
    overallScore: scoring.overallScore,
    totalIssues: scoring.totalIssues,
    criticalIssues: criticalCount,
    highIssues: highCount,
    categories,
    topIssues,
  };
}

/**
 * Export simplified report as JSON
 */
export function toSimplifiedJSON(result: ScanResult, pretty = true): string {
  const simplified = simplifyReport(result);
  return JSON.stringify(simplified, null, pretty ? 2 : 0);
}

/**
 * Generate CSV of issues
 */
export function toCSV(result: ScanResult): string {
  const lines: string[] = [];
  
  // Header
  lines.push('ID,Category,Severity,Title,Impact,Description,Remediation');
  
  // Issues
  for (const issue of result.issues) {
    const row = [
      issue.id,
      issue.category,
      issue.serverity,
      `"${issue.title.replace(/"/g, '""')}"`,
      issue.impactScore,
      `"${issue.description.replace(/"/g, '""')}"`,
      `"${issue.remediation.replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }
  
  return lines.join('\n');
}

/**
 * Generate markdown report
 */
export function toMarkdown(result: ScanResult): string {
  const scoring = result.scoring!;
  const lines: string[] = [];

  lines.push(`# AI-Lighthouse Scan Report`);
  lines.push('');
  lines.push(`**URL:** ${result.url}`);
  lines.push(`**Timestamp:** ${new Date(result.timestamp!).toISOString()}`);
  lines.push('');

  // Overall Score
  lines.push(`## Overall Score: ${scoring.overallScore}/100 (${getLetterGrade(scoring.overallScore)})`);
  lines.push('');
  lines.push(`**Total Issues:** ${scoring.totalIssues}`);
  lines.push('');

  // Severity Breakdown
  lines.push('### Severity Breakdown');
  lines.push('');
  for (const [severity, count] of Object.entries(scoring.severityBreakdown)) {
    if (count > 0) {
      lines.push(`- **${severity.toUpperCase()}:** ${count}`);
    }
  }
  lines.push('');

  // Category Scores
  lines.push('### Category Scores');
  lines.push('');
  const categoriesWithIssues = scoring.categoryScores
    .filter(cs => cs.issueCount > 0)
    .sort((a, b) => a.score - b.score);

  lines.push('| Category | Score | Grade | Issues | Impact |');
  lines.push('|----------|-------|-------|--------|--------|');
  
  for (const cs of categoriesWithIssues) {
    const grade = getLetterGrade(cs.score);
    lines.push(`| ${cs.category} | ${cs.score}/100 | ${grade} | ${cs.issueCount} | ${cs.totalImpact.toFixed(1)} |`);
  }
  lines.push('');

  // Top Issues
  lines.push('### Top Issues');
  lines.push('');
  
  const topIssues = [...result.issues]
    .filter(i => i.serverity !== SEVERITY.INFO)
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const aDiff = severityOrder[a.serverity];
      const bDiff = severityOrder[b.serverity];
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.impactScore - a.impactScore;
    })
    .slice(0, 10);

  for (let i = 0; i < topIssues.length; i++) {
    const issue = topIssues[i];
    lines.push(`#### ${i + 1}. ${issue.title}`);
    lines.push('');
    lines.push(`- **ID:** ${issue.id}`);
    lines.push(`- **Category:** ${issue.category}`);
    lines.push(`- **Severity:** ${issue.serverity.toUpperCase()}`);
    lines.push(`- **Impact:** ${issue.impactScore}`);
    lines.push('');
    lines.push(`**Description:** ${issue.description}`);
    lines.push('');
    lines.push(`**Remediation:** ${issue.remediation}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Compare two scan results and generate a diff report
 */
export interface ScanComparison {
  scoreChange: number;
  gradeChange: string;
  issueChange: number;
  categoryChanges: Array<{
    category: string;
    scoreBefore: number;
    scoreAfter: number;
    change: number;
  }>;
  newIssues: Issue[];
  resolvedIssues: Issue[];
}

export function compareScans(before: ScanResult, after: ScanResult): ScanComparison {
  const scoringBefore = before.scoring!;
  const scoringAfter = after.scoring!;

  const scoreChange = scoringAfter.overallScore - scoringBefore.overallScore;
  const gradeBefore = getLetterGrade(scoringBefore.overallScore);
  const gradeAfter = getLetterGrade(scoringAfter.overallScore);
  const gradeChange = gradeBefore === gradeAfter 
    ? 'No change' 
    : `${gradeBefore} → ${gradeAfter}`;

  const issueChange = scoringAfter.totalIssues - scoringBefore.totalIssues;

  // Compare categories
  const categoryChanges = scoringAfter.categoryScores
    .map(csAfter => {
      const csBefore = scoringBefore.categoryScores.find(
        cs => cs.category === csAfter.category
      );
      return {
        category: csAfter.category,
        scoreBefore: csBefore?.score || 100,
        scoreAfter: csAfter.score,
        change: csAfter.score - (csBefore?.score || 100),
      };
    })
    .filter(c => c.change !== 0)
    .sort((a, b) => b.change - a.change); // Biggest improvements first

  // Find new and resolved issues
  const beforeIds = new Set(before.issues.map(i => i.id));
  const afterIds = new Set(after.issues.map(i => i.id));

  const newIssues = after.issues.filter(i => !beforeIds.has(i.id));
  const resolvedIssues = before.issues.filter(i => !afterIds.has(i.id));

  return {
    scoreChange,
    gradeChange,
    issueChange,
    categoryChanges,
    newIssues,
    resolvedIssues,
  };
}
