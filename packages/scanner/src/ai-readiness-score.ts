/**
 * AI Readiness Scoring - Comprehensive assessment of AI/LLM optimization
 * 
 * Provides a holistic view of how well content is optimized for AI consumption,
 * with actionable insights and clear improvement paths.
 */

import { Issue, CATEGORY, SEVERITY, ScanResult } from './types.js';

export interface AIReadinessScore {
  overall: number; // 0-100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  
  // Core dimensions
  dimensions: {
    contentQuality: DimensionScore;      // Clear, substantive, well-structured
    discoverability: DimensionScore;     // Crawlable, indexable, findable
    extractability: DimensionScore;      // Easy to parse and extract
    comprehensibility: DimensionScore;   // Clear messaging, good structure
    trustworthiness: DimensionScore;     // Accurate, verified, hallucination-resistant
  };
  
  // Quick wins - high-impact, easy fixes
  quickWins: Array<{
    issue: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    fix: string;
  }>;
  
  // Priority roadmap
  roadmap: {
    immediate: string[];    // Critical fixes (< 1 day)
    shortTerm: string[];    // Important improvements (1-7 days)
    longTerm: string[];     // Strategic enhancements (> 7 days)
  };
  
  // Benchmarking
  benchmark: {
    topPercentile: number;      // Where you rank (0-100 percentile)
    bestInClass: number;        // What top sites achieve
    improvement: number;        // Potential score gain
  };
  
  // AI agent perspective
  aiPerspective: {
    canUnderstand: boolean;
    canExtract: boolean;
    canIndex: boolean;
    canAnswer: boolean;
    confidence: number;         // 0-1
    mainBlockers: string[];
  };
}

export interface DimensionScore {
  score: number;              // 0-100
  weight: number;             // How much this affects overall
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  issues: Array<{
    title: string;
    severity: SEVERITY;
    impact: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

/**
 * Calculate comprehensive AI readiness score
 */
export function calculateAIReadiness(result: ScanResult): AIReadinessScore {
  const dimensions = {
    contentQuality: assessContentQuality(result),
    discoverability: assessDiscoverability(result),
    extractability: assessExtractability(result),
    comprehensibility: assessComprehensibility(result),
    trustworthiness: assessTrustworthiness(result),
  };
  
  // Weighted average (not all dimensions are equal)
  const weights = {
    contentQuality: 0.30,      // Most important
    comprehensibility: 0.25,   // Very important
    extractability: 0.20,      // Important
    discoverability: 0.15,     // Important
    trustworthiness: 0.10,     // Important but often not measurable
  };
  
  const overall = Object.entries(dimensions).reduce((sum, [key, dim]) => {
    return sum + (dim.score * weights[key as keyof typeof weights]);
  }, 0);
  
  const grade = getGrade(overall);
  const quickWins = identifyQuickWins(result.issues);
  const roadmap = buildRoadmap(result.issues, dimensions);
  const benchmark = calculateBenchmark(overall, dimensions);
  const aiPerspective = assessAIPerspective(result, dimensions);
  
  return {
    overall: Math.round(overall),
    grade,
    dimensions,
    quickWins,
    roadmap,
    benchmark,
    aiPerspective,
  };
}

/**
 * Assess content quality dimension
 */
function assessContentQuality(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    [CATEGORY.AIREAD, CATEGORY.EXTRACT].includes(i.category)
  );
  
  const score = calculateDimensionScore(relevantIssues);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Check for strengths
  const wordCount = extractWordCount(result);
  if (wordCount >= 500) strengths.push(`Substantial content (${wordCount} words)`);
  if (result.llm?.structureQuality === 'excellent') strengths.push('Excellent content structure');
  if (result.llm?.readingLevel && result.llm.readingLevel.grade >= 8) {
    strengths.push('Appropriate reading level');
  }
  
  // Check for weaknesses
  const thinContent = relevantIssues.find(i => i.title.includes('Thin content'));
  if (thinContent) weaknesses.push('Insufficient content depth');
  
  const clarityIssues = relevantIssues.filter(i => i.title.includes('clarity'));
  if (clarityIssues.length > 0) weaknesses.push('Content clarity issues');
  
  const recommendation = score < 60 
    ? 'Add substantial, well-structured content with clear headings and organization'
    : score < 80
    ? 'Improve content structure and readability with better headings and paragraphs'
    : 'Maintain high content quality standards';
  
  return {
    score,
    weight: 0.30,
    status: getStatus(score),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
  };
}

/**
 * Assess discoverability dimension
 */
function assessDiscoverability(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    [CATEGORY.CRAWL, CATEGORY.TECH].includes(i.category)
  );
  
  const score = calculateDimensionScore(relevantIssues);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Check robots/crawlability
  const robotsBlocked = relevantIssues.find(i => i.id.includes('robots'));
  if (!robotsBlocked) strengths.push('Crawlers can access content');
  else weaknesses.push('Content blocked from crawlers');
  
  // Check canonical
  const canonicalIssue = relevantIssues.find(i => i.title.includes('canonical'));
  if (!canonicalIssue) strengths.push('Proper canonical configuration');
  else weaknesses.push('Canonical URL issues');
  
  const recommendation = score < 60
    ? 'Fix critical crawlability issues - ensure content is accessible to AI crawlers'
    : score < 80
    ? 'Optimize meta tags and canonicals for better indexing'
    : 'Maintain good crawlability practices';
  
  return {
    score,
    weight: 0.15,
    status: getStatus(score),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
  };
}

/**
 * Assess extractability dimension
 */
function assessExtractability(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    i.category === CATEGORY.EXTRACT
  );
  
  let score = 50; // Start with baseline
  
  if (result.extractability) {
    score = result.extractability.score.extractabilityScore;
  }
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (result.extractability) {
    const ext = result.extractability;
    
    if (ext.score.serverRenderedPercent >= 90) {
      strengths.push(`${ext.score.serverRenderedPercent}% server-rendered`);
    } else {
      weaknesses.push(`Only ${ext.score.serverRenderedPercent}% server-rendered`);
    }
    
    if (ext.contentTypes.text.percentage >= 90) {
      strengths.push(`${ext.contentTypes.text.percentage}% text extractable`);
    } else {
      weaknesses.push(`Only ${ext.contentTypes.text.percentage}% text extractable`);
    }
  }
  
  const recommendation = score < 60
    ? 'Critical: Move content to server-rendered HTML, remove dynamic/hidden content'
    : score < 80
    ? 'Improve: Reduce client-side rendering and hidden content'
    : 'Maintain high extractability with server-side rendering';
  
  return {
    score,
    weight: 0.20,
    status: getStatus(score),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
  };
}

/**
 * Assess comprehensibility dimension
 */
function assessComprehensibility(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    [CATEGORY.AIREAD, CATEGORY.KG].includes(i.category) &&
    (i.title.includes('structure') || i.title.includes('heading') || i.title.includes('schema'))
  );
  
  const score = calculateDimensionScore(relevantIssues);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Check structure
  const h1Issue = relevantIssues.find(i => i.title.includes('H1') || i.title.includes('h1'));
  if (!h1Issue) strengths.push('Proper H1 structure');
  else weaknesses.push('H1 structure issues');
  
  // Check schema
  const schemaIssues = relevantIssues.filter(i => i.title.includes('schema') || i.title.includes('JSON-LD'));
  if (schemaIssues.length === 0) {
    strengths.push('Good structured data implementation');
  } else {
    weaknesses.push('Structured data issues');
  }
  
  // LLM comprehension
  if (result.llm?.summary) {
    strengths.push('AI can generate clear summary');
  }
  
  const recommendation = score < 60
    ? 'Critical: Fix heading structure, add schema.org markup, improve semantic HTML'
    : score < 80
    ? 'Improve: Enhance heading hierarchy and structured data completeness'
    : 'Maintain clear structure with proper headings and schema';
  
  return {
    score,
    weight: 0.25,
    status: getStatus(score),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
  };
}

/**
 * Assess trustworthiness dimension
 */
function assessTrustworthiness(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    i.category === CATEGORY.HALL
  );
  
  let score = 85; // Default high unless issues found
  
  if (result.hallucinationReport) {
    score = Math.max(0, 100 - result.hallucinationReport.hallucinationRiskScore);
  }
  
  // Penalize if many issues
  score -= relevantIssues.length * 5;
  score = Math.max(0, score);
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (result.hallucinationReport) {
    if (result.hallucinationReport.hallucinationRiskScore < 20) {
      strengths.push('Low hallucination risk');
    } else {
      weaknesses.push('Elevated hallucination risk');
    }
  }
  
  const recommendation = score < 60
    ? 'Add citations, dates, and factual grounding to reduce AI hallucination risk'
    : score < 80
    ? 'Improve factual clarity and add more verifiable information'
    : 'Content has good factual grounding';
  
  return {
    score,
    weight: 0.10,
    status: getStatus(score),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
  };
}

/**
 * Calculate dimension score from issues
 */
function calculateDimensionScore(issues: Issue[]): number {
  if (issues.length === 0) return 95; // Near perfect if no issues
  
  // Start at 100, subtract weighted impact
  let penalty = 0;
  for (const issue of issues) {
    const severityMultiplier = 
      issue.serverity === SEVERITY.CRITICAL ? 3 :
      issue.serverity === SEVERITY.HIGH ? 2 :
      issue.serverity === SEVERITY.MEDIUM ? 1 :
      0.5;
    
    penalty += issue.impactScore * severityMultiplier * 0.5;
  }
  
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * Identify quick wins - high impact, low effort
 */
function identifyQuickWins(issues: Issue[]): AIReadinessScore['quickWins'] {
  const quickWins = issues
    .filter(i => i.impactScore >= 15 && isQuickFix(i))
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5)
    .map(issue => ({
      issue: issue.title,
      impact: issue.impactScore,
      effort: estimateEffort(issue),
      fix: issue.remediation,
    }));
  
  return quickWins;
}

/**
 * Build prioritized roadmap
 */
function buildRoadmap(issues: Issue[], dimensions: AIReadinessScore['dimensions']): AIReadinessScore['roadmap'] {
  const critical = issues.filter(i => 
    i.serverity === SEVERITY.CRITICAL || 
    (i.serverity === SEVERITY.HIGH && i.impactScore >= 20)
  );
  
  const high = issues.filter(i => 
    i.serverity === SEVERITY.HIGH && i.impactScore >= 15 && i.impactScore < 20
  );
  
  const medium = issues.filter(i => 
    i.serverity === SEVERITY.MEDIUM && i.impactScore >= 10
  );
  
  return {
    immediate: [
      ...critical.map(i => `🔴 ${i.title}: ${i.remediation.slice(0, 80)}...`),
      ...findDimensionCriticals(dimensions),
    ].slice(0, 5),
    
    shortTerm: [
      ...high.map(i => `🟡 ${i.title}: ${i.remediation.slice(0, 80)}...`),
    ].slice(0, 5),
    
    longTerm: [
      ...medium.map(i => `🟢 ${i.title}: ${i.remediation.slice(0, 80)}...`),
      ...findDimensionImprovements(dimensions),
    ].slice(0, 5),
  };
}

/**
 * Calculate benchmark comparison
 */
function calculateBenchmark(overall: number, dimensions: AIReadinessScore['dimensions']): AIReadinessScore['benchmark'] {
  // Benchmarks based on analysis of top AI-optimized sites
  const topPercentile = Math.min(95, overall * 1.2); // Rough estimate
  const bestInClass = 95; // Best sites typically score 90-95
  const improvement = Math.max(0, bestInClass - overall);
  
  return {
    topPercentile: Math.round(topPercentile),
    bestInClass,
    improvement: Math.round(improvement),
  };
}

/**
 * Assess from AI agent perspective
 */
function assessAIPerspective(result: ScanResult, dimensions: AIReadinessScore['dimensions']): AIReadinessScore['aiPerspective'] {
  const canUnderstand = dimensions.comprehensibility.score >= 70;
  const canExtract = dimensions.extractability.score >= 70;
  const canIndex = dimensions.discoverability.score >= 70;
  const canAnswer = dimensions.contentQuality.score >= 70 && canUnderstand;
  
  const confidence = (
    dimensions.comprehensibility.score +
    dimensions.extractability.score +
    dimensions.contentQuality.score
  ) / 300;
  
  const mainBlockers: string[] = [];
  
  if (dimensions.contentQuality.score < 60) mainBlockers.push('Insufficient or unclear content');
  if (dimensions.extractability.score < 60) mainBlockers.push('Content not easily extractable');
  if (dimensions.comprehensibility.score < 60) mainBlockers.push('Poor structure and organization');
  if (dimensions.discoverability.score < 60) mainBlockers.push('Content not crawlable');
  
  return {
    canUnderstand,
    canExtract,
    canIndex,
    canAnswer,
    confidence: Math.round(confidence * 100) / 100,
    mainBlockers,
  };
}

// Helper functions

function getGrade(score: number): AIReadinessScore['grade'] {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

function getStatus(score: number): DimensionScore['status'] {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-work';
  return 'critical';
}

function formatIssue(issue: Issue) {
  return {
    title: issue.title,
    severity: issue.serverity,
    impact: issue.impactScore,
  };
}

function isQuickFix(issue: Issue): boolean {
  const quickFixKeywords = ['missing', 'add', 'include', 'use', 'meta', 'alt', 'title', 'h1'];
  return quickFixKeywords.some(keyword => 
    issue.title.toLowerCase().includes(keyword) || 
    issue.remediation.toLowerCase().includes(keyword)
  );
}

function estimateEffort(issue: Issue): 'low' | 'medium' | 'high' {
  const title = issue.title.toLowerCase();
  const remediation = issue.remediation.toLowerCase();
  
  // Low effort - simple additions
  if (title.includes('missing meta') || title.includes('missing alt') || title.includes('missing title')) {
    return 'low';
  }
  
  // High effort - architectural changes
  if (title.includes('structure') || title.includes('rewrite') || remediation.includes('redesign')) {
    return 'high';
  }
  
  return 'medium';
}

function findDimensionCriticals(dimensions: AIReadinessScore['dimensions']): string[] {
  const criticals: string[] = [];
  
  for (const [name, dim] of Object.entries(dimensions)) {
    if (dim.status === 'critical') {
      criticals.push(`Fix ${name}: ${dim.recommendation}`);
    }
  }
  
  return criticals;
}

function findDimensionImprovements(dimensions: AIReadinessScore['dimensions']): string[] {
  const improvements: string[] = [];
  
  for (const [name, dim] of Object.entries(dimensions)) {
    if (dim.status === 'needs-work' || dim.status === 'good') {
      improvements.push(`Enhance ${name}: ${dim.recommendation}`);
    }
  }
  
  return improvements;
}

function extractWordCount(result: ScanResult): number {
  // Try to get from issues or estimate
  const thinContentIssue = result.issues.find(i => i.title.includes('Thin content'));
  if (thinContentIssue && thinContentIssue.evidence) {
    const match = thinContentIssue.evidence[0]?.match(/(\d+)/);
    if (match) return parseInt(match[1]);
  }
  
  return 500; // Default assumption if not found
}

/**
 * Format AI readiness report as human-readable text
 */
export function formatAIReadinessReport(score: AIReadinessScore): string {
  const lines: string[] = [];
  
  lines.push('╔════════════════════════════════════════════════════════════════╗');
  lines.push('║                   AI READINESS ASSESSMENT                      ║');
  lines.push('╚════════════════════════════════════════════════════════════════╝\n');
  
  lines.push(`Overall Score: ${score.overall}/100 (Grade: ${score.grade})`);
  lines.push(`Top ${score.benchmark.topPercentile}% of sites`);
  lines.push(`Improvement potential: +${score.benchmark.improvement} points to best-in-class\n`);
  
  lines.push('═══ AI Agent Perspective ═══');
  lines.push(`Can Understand: ${score.aiPerspective.canUnderstand ? '✅' : '❌'}`);
  lines.push(`Can Extract: ${score.aiPerspective.canExtract ? '✅' : '❌'}`);
  lines.push(`Can Index: ${score.aiPerspective.canIndex ? '✅' : '❌'}`);
  lines.push(`Can Answer Questions: ${score.aiPerspective.canAnswer ? '✅' : '❌'}`);
  lines.push(`Confidence Level: ${(score.aiPerspective.confidence * 100).toFixed(0)}%`);
  
  if (score.aiPerspective.mainBlockers.length > 0) {
    lines.push(`\nMain Blockers:`);
    score.aiPerspective.mainBlockers.forEach(b => lines.push(`  ⚠️  ${b}`));
  }
  
  lines.push('\n═══ Dimension Scores ═══');
  for (const [name, dim] of Object.entries(score.dimensions)) {
    const statusEmoji = 
      dim.status === 'excellent' ? '🟢' :
      dim.status === 'good' ? '🟡' :
      dim.status === 'needs-work' ? '🟠' : '🔴';
    
    lines.push(`\n${statusEmoji} ${name}: ${dim.score}/100 (${dim.status})`);
    
    if (dim.strengths.length > 0) {
      lines.push('  Strengths: ' + dim.strengths.join(', '));
    }
    if (dim.weaknesses.length > 0) {
      lines.push('  Weaknesses: ' + dim.weaknesses.join(', '));
    }
    lines.push(`  → ${dim.recommendation}`);
  }
  
  if (score.quickWins.length > 0) {
    lines.push('\n═══ Quick Wins (High Impact, Low Effort) ═══');
    score.quickWins.forEach((win, i) => {
      lines.push(`\n${i + 1}. ${win.issue} (Impact: ${win.impact}, Effort: ${win.effort})`);
      lines.push(`   Fix: ${win.fix}`);
    });
  }
  
  lines.push('\n═══ Priority Roadmap ═══');
  
  if (score.roadmap.immediate.length > 0) {
    lines.push('\n🔴 IMMEDIATE (< 1 day):');
    score.roadmap.immediate.forEach(item => lines.push(`   ${item}`));
  }
  
  if (score.roadmap.shortTerm.length > 0) {
    lines.push('\n🟡 SHORT-TERM (1-7 days):');
    score.roadmap.shortTerm.forEach(item => lines.push(`   ${item}`));
  }
  
  if (score.roadmap.longTerm.length > 0) {
    lines.push('\n🟢 LONG-TERM (> 7 days):');
    score.roadmap.longTerm.forEach(item => lines.push(`   ${item}`));
  }
  
  return lines.join('\n');
}
