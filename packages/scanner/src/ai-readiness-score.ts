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
  confidence: number; // 0-1, how confident we are in the score
  
  // Core dimensions
  dimensions: {
    contentQuality: DimensionScore;      // Clear, substantive, well-structured
    discoverability: DimensionScore;     // Crawlable, indexable, findable
    extractability: DimensionScore;      // Easy to parse and extract
    comprehensibility: DimensionScore;   // Clear messaging, good structure
    trustworthiness: DimensionScore;     // Accurate, verified, hallucination-resistant
  };
  
  // Score breakdown for transparency
  scoreBreakdown: {
    rawScore: number;           // Before normalization
    normalizedScore: number;    // After curve adjustment
    adjustments: {
      balancePenalty: number;   // Penalty for unbalanced dimensions
      criticalPenalty: number;  // Penalty for critical weaknesses
      weaknessPenalty: number;  // Penalty for multiple weak areas
      excellenceBonus: number;  // Bonus for excellence across all dimensions
      totalAdjustment: number;  // Net adjustment
    };
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
  confidence: number;         // 0-1, based on data availability
  issues: Array<{
    title: string;
    severity: SEVERITY;
    impact: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  dataAvailability: {         // What data was used for scoring
    hasIssues: boolean;
    hasLLMData: boolean;
    hasExtractability: boolean;
    hasHallucinationReport: boolean;
    hasEntityData: boolean;
  };
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
  
  // Base weights (can be adjusted dynamically)
  const baseWeights = {
    contentQuality: 0.30,      // Most important
    comprehensibility: 0.25,   // Very important
    extractability: 0.20,      // Important
    discoverability: 0.15,     // Important
    trustworthiness: 0.10,     // Important but often not measurable
  };
  
  // Adjust weights based on data confidence
  // If a dimension has low confidence, reduce its weight and redistribute
  const adjustedWeights = adjustWeightsByConfidence(baseWeights, dimensions);
  
  // Calculate weighted average with adjusted weights
  const rawScore = Object.entries(dimensions).reduce((sum, [key, dim]) => {
    return sum + (dim.score * adjustedWeights[key as keyof typeof adjustedWeights]);
  }, 0);
  
  // Calculate overall confidence
  const overallConfidence = Object.values(dimensions).reduce((sum, dim) => 
    sum + dim.confidence, 0) / 5;
  
  // Apply score normalization curve and get breakdown
  const { normalizedScore, breakdown } = normalizeScoreWithBreakdown(rawScore, dimensions);
  
  const grade = getGrade(normalizedScore);
  const quickWins = identifyQuickWins(result.issues);
  const roadmap = buildRoadmap(result.issues, dimensions);
  const benchmark = calculateBenchmark(normalizedScore, dimensions);
  const aiPerspective = assessAIPerspective(result, dimensions);
  
  return {
    overall: Math.round(normalizedScore * 10) / 10, // Round to 1 decimal
    grade,
    confidence: Math.round(overallConfidence * 100) / 100,
    dimensions,
    scoreBreakdown: {
      rawScore: Math.round(rawScore * 10) / 10,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
      adjustments: breakdown,
    },
    quickWins,
    roadmap,
    benchmark,
    aiPerspective,
  };
}

/**
 * Adjust dimension weights based on confidence levels
 * Low-confidence dimensions get reduced weight, redistributed to high-confidence ones
 */
function adjustWeightsByConfidence(
  baseWeights: Record<string, number>,
  dimensions: AIReadinessScore['dimensions']
): Record<string, number> {
  const adjusted: Record<string, number> = { ...baseWeights };
  let totalReduction = 0;
  let redistributableKeys: string[] = [];
  
  // Reduce weights for low-confidence dimensions
  for (const [key, dim] of Object.entries(dimensions)) {
    if (dim.confidence < 0.7) {
      const reduction = baseWeights[key] * (1 - dim.confidence) * 0.5; // Reduce by up to 50%
      adjusted[key] -= reduction;
      totalReduction += reduction;
    } else if (dim.confidence >= 0.9) {
      redistributableKeys.push(key);
    }
  }
  
  // Redistribute reduced weight to high-confidence dimensions
  if (totalReduction > 0 && redistributableKeys.length > 0) {
    const redistributionPerKey = totalReduction / redistributableKeys.length;
    for (const key of redistributableKeys) {
      adjusted[key] += redistributionPerKey;
    }
  }
  
  // Ensure weights still sum to 1.0
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(adjusted)) {
    adjusted[key] /= sum;
  }
  
  return adjusted;
}

/**
 * Normalize overall score using a curve that rewards balanced performance
 * Sites with one critical weakness should score lower than well-rounded sites
 * Returns both the normalized score and a detailed breakdown
 */
function normalizeScoreWithBreakdown(
  rawScore: number, 
  dimensions: AIReadinessScore['dimensions']
): { 
  normalizedScore: number; 
  breakdown: AIReadinessScore['scoreBreakdown']['adjustments'] 
} {
  // Calculate variance in dimension scores
  const scores = Object.values(dimensions).map(d => d.score);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Penalize high variance (unbalanced optimization)
  // Sites should be well-rounded, not excellent in one area and poor in another
  const balancePenalty = Math.round(Math.min(10, stdDev / 3) * 10) / 10; // Max 10 point penalty
  
  // Check for critical weaknesses (any dimension below 50)
  const hasCriticalWeakness = scores.some(s => s < 50);
  const criticalPenalty = hasCriticalWeakness ? 5 : 0;
  
  // Check for multiple weak areas (2+ dimensions below 70)
  const weakDimensions = scores.filter(s => s < 70).length;
  const weaknessPenalty = weakDimensions >= 2 ? (weakDimensions - 1) * 2 : 0;
  
  // Apply bonus for excellence (all dimensions above 85)
  const allExcellent = scores.every(s => s >= 85);
  const excellenceBonus = allExcellent ? 3 : 0;
  
  const totalAdjustment = -balancePenalty - criticalPenalty - weaknessPenalty + excellenceBonus;
  const normalizedScore = Math.max(0, Math.min(100, rawScore + totalAdjustment));
  
  return {
    normalizedScore,
    breakdown: {
      balancePenalty: Math.round(balancePenalty * 10) / 10,
      criticalPenalty,
      weaknessPenalty,
      excellenceBonus,
      totalAdjustment: Math.round(totalAdjustment * 10) / 10,
    },
  };
}

/**
 * Normalize overall score using a curve that rewards balanced performance
 * Sites with one critical weakness should score lower than well-rounded sites
 */
function normalizeScore(rawScore: number, dimensions: AIReadinessScore['dimensions']): number {
  const { normalizedScore } = normalizeScoreWithBreakdown(rawScore, dimensions);
  return normalizedScore;
}

/**
 * Assess content quality dimension
 */
function assessContentQuality(result: ScanResult): DimensionScore {
  const relevantIssues = result.issues.filter(i => 
    [CATEGORY.AIREAD, CATEGORY.EXTRACT].includes(i.category)
  );
  
  let score = calculateDimensionScore(relevantIssues);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Track data availability
  const hasLLMData = !!(result.llm?.summary);
  const hasChunking = !!(result.chunking);
  const hasEntities = !!(result.entities);
  
  // Calculate confidence based on data availability
  let confidence = 0.6; // Base confidence from issues alone
  if (hasLLMData) confidence += 0.25;
  if (hasChunking) confidence += 0.1;
  if (hasEntities) confidence += 0.05;
  
  // Check for strengths using available data
  const wordCount = extractWordCount(result);
  if (wordCount >= 500) strengths.push(`Substantial content (${wordCount} words)`);
  
  if (result.llm) {
    if (result.llm.structureQuality === 'excellent') {
      strengths.push('Excellent content structure');
      score = Math.min(100, score + 2); // Bonus for excellent structure
    } else if (result.llm.structureQuality === 'good') {
      strengths.push('Good content structure');
      score = Math.min(100, score + 1);
    }
    
    if (result.llm.readingLevel) {
      if (result.llm.readingLevel.grade >= 8 && result.llm.readingLevel.grade <= 14) {
        strengths.push(`Appropriate reading level (Grade ${result.llm.readingLevel.grade})`);
      } else if (result.llm.readingLevel.grade < 6) {
        weaknesses.push('Content may be too simplistic');
      } else if (result.llm.readingLevel.grade > 16) {
        weaknesses.push('Content may be too complex');
      }
    }
    
    if (result.llm.keyTopics && result.llm.keyTopics.length > 3) {
      strengths.push(`Clear topic coverage (${result.llm.keyTopics.length} topics)`);
    }
    
    if (result.llm.technicalDepth) {
      strengths.push(`Technical depth: ${result.llm.technicalDepth}`);
    }
  }
  
  // Check chunking quality
  if (result.chunking) {
    if (result.chunking.averageNoiseRatio < 0.2) {
      strengths.push('Low noise ratio in content');
    } else if (result.chunking.averageNoiseRatio > 0.4) {
      weaknesses.push('High noise ratio');
      score = Math.max(0, score - 3);
    }
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
    score: Math.round(score * 10) / 10,
    weight: 0.30,
    status: getStatus(score),
    confidence: Math.min(1.0, confidence),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
    dataAvailability: {
      hasIssues: relevantIssues.length > 0,
      hasLLMData,
      hasExtractability: hasChunking,
      hasHallucinationReport: false,
      hasEntityData: hasEntities,
    },
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
  
  // Confidence based on data availability (crawl/tech issues are always available)
  const confidence = 0.95;
  
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
    confidence,
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
    dataAvailability: {
      hasIssues: relevantIssues.length > 0,
      hasLLMData: false,
      hasExtractability: false,
      hasHallucinationReport: false,
      hasEntityData: false,
    },
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
  let confidence = 0.6; // Base confidence
  
  if (result.extractability) {
    score = result.extractability.score.extractabilityScore;
    confidence = 1.0; // Full confidence when we have extractability data
  }
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (result.extractability) {
    const ext = result.extractability;
    
    // Server-rendered content analysis
    if (ext.score.serverRenderedPercent >= 90) {
      strengths.push(`${ext.score.serverRenderedPercent}% server-rendered`);
    } else if (ext.score.serverRenderedPercent >= 70) {
      strengths.push(`${ext.score.serverRenderedPercent}% server-rendered (good)`);
    } else {
      weaknesses.push(`Only ${ext.score.serverRenderedPercent}% server-rendered`);
    }
    
    // Text extractability
    if (ext.contentTypes.text.percentage >= 90) {
      strengths.push(`${ext.contentTypes.text.percentage}% text extractable`);
    } else if (ext.contentTypes.text.percentage >= 75) {
      strengths.push(`${ext.contentTypes.text.percentage}% text extractable (acceptable)`);
    } else {
      weaknesses.push(`Only ${ext.contentTypes.text.percentage}% text extractable`);
    }
    
    // Hidden content penalty
    if (ext.score.hiddenContentPercent > 20) {
      weaknesses.push(`${ext.score.hiddenContentPercent}% hidden content`);
      score = Math.max(0, score - (ext.score.hiddenContentPercent / 5));
    }
    
    // Interactive content consideration
    if (ext.score.interactiveContentPercent > 30) {
      weaknesses.push(`High interactive content (${ext.score.interactiveContentPercent}%)`);
    }
    
    // Images and links
    if (ext.contentTypes.images.percentage >= 80) {
      strengths.push('Good image accessibility');
    }
    if (ext.contentTypes.links.percentage >= 90) {
      strengths.push('Links are well-structured');
    }
    
    // Structured data
    if (ext.contentTypes.structured.percentage >= 70) {
      strengths.push('Good structured data coverage');
    } else if (ext.contentTypes.structured.percentage < 30) {
      weaknesses.push('Limited structured data');
    }
  }
  
  const recommendation = score < 60
    ? 'Critical: Move content to server-rendered HTML, remove dynamic/hidden content'
    : score < 80
    ? 'Improve: Reduce client-side rendering and hidden content'
    : 'Maintain high extractability with server-side rendering';
  
  return {
    score: Math.round(score * 10) / 10,
    weight: 0.20,
    status: getStatus(score),
    confidence,
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
    dataAvailability: {
      hasIssues: relevantIssues.length > 0,
      hasLLMData: false,
      hasExtractability: !!result.extractability,
      hasHallucinationReport: false,
      hasEntityData: false,
    },
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
  
  let score = calculateDimensionScore(relevantIssues);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Track data availability for confidence
  const hasLLMData = !!(result.llm?.summary);
  const hasEntities = !!(result.entities);
  const hasMirrorReport = !!(result.mirrorReport);
  
  let confidence = 0.7; // Base confidence from issues
  if (hasLLMData) confidence += 0.2;
  if (hasEntities) confidence += 0.05;
  if (hasMirrorReport) confidence += 0.05;
  
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
  
  // LLM comprehension insights
  if (result.llm) {
    if (result.llm.summary) {
      strengths.push('AI can generate clear summary');
      score = Math.min(100, score + 2);
    }
    
    if (result.llm.pageType) {
      strengths.push(`Clear page type (${result.llm.pageType})`);
    }
    
    if (result.llm.keyTopics && result.llm.keyTopics.length >= 3) {
      strengths.push(`Well-defined topics (${result.llm.keyTopics.length} identified)`);
    } else if (result.llm.keyTopics && result.llm.keyTopics.length < 2) {
      weaknesses.push('Limited topic clarity');
    }
    
    if (result.llm.topEntities && result.llm.topEntities.length >= 5) {
      strengths.push('Rich entity recognition');
    }
  }
  
  // Entity extraction quality
  if (result.entities) {
    const highConfPercent = (result.entities.summary.highConfidence / result.entities.summary.totalEntities) * 100;
    if (highConfPercent >= 70) {
      strengths.push(`High-confidence entity extraction (${highConfPercent.toFixed(0)}%)`);
    } else if (highConfPercent < 40) {
      weaknesses.push('Low entity extraction confidence');
    }
  }
  
  // Mirror report - messaging alignment
  if (result.mirrorReport) {
    if (result.mirrorReport.summary.alignmentScore >= 80) {
      strengths.push('Clear messaging alignment');
      score = Math.min(100, score + 3);
    } else if (result.mirrorReport.summary.alignmentScore < 60) {
      weaknesses.push('Poor messaging alignment');
      score = Math.max(0, score - 5);
    }
    
    if (result.mirrorReport.summary.critical > 0) {
      weaknesses.push(`${result.mirrorReport.summary.critical} critical messaging mismatches`);
    }
  }
  
  const recommendation = score < 60
    ? 'Critical: Fix heading structure, add schema.org markup, improve semantic HTML'
    : score < 80
    ? 'Improve: Enhance heading hierarchy and structured data completeness'
    : 'Maintain clear structure with proper headings and schema';
  
  return {
    score: Math.round(score * 10) / 10,
    weight: 0.25,
    status: getStatus(score),
    confidence: Math.min(1.0, confidence),
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
    dataAvailability: {
      hasIssues: relevantIssues.length > 0,
      hasLLMData,
      hasExtractability: false,
      hasHallucinationReport: false,
      hasEntityData: hasEntities,
    },
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
  let confidence = 0.5; // Low confidence without hallucination report
  
  if (result.hallucinationReport) {
    score = Math.max(0, 100 - result.hallucinationReport.hallucinationRiskScore);
    confidence = 0.95; // High confidence with hallucination report
  }
  
  // Penalize based on issues with diminishing returns
  if (relevantIssues.length > 0) {
    const penalty = Math.min(20, relevantIssues.length * 3);
    score = Math.max(0, score - penalty);
  }
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (result.hallucinationReport) {
    const report = result.hallucinationReport;
    
    if (report.hallucinationRiskScore < 20) {
      strengths.push('Low hallucination risk');
    } else if (report.hallucinationRiskScore < 40) {
      strengths.push('Moderate hallucination risk');
    } else {
      weaknesses.push('Elevated hallucination risk');
    }
    
    // Fact verification analysis
    if (report.factCheckSummary) {
      const verifiedPercent = (report.factCheckSummary.verifiedFacts / report.factCheckSummary.totalFacts) * 100;
      if (verifiedPercent >= 70) {
        strengths.push(`${verifiedPercent.toFixed(0)}% facts verified`);
      } else if (verifiedPercent < 40) {
        weaknesses.push(`Only ${verifiedPercent.toFixed(0)}% facts verified`);
        score = Math.max(0, score - 10);
      }
      
      if (report.factCheckSummary.contradictions > 0) {
        weaknesses.push(`${report.factCheckSummary.contradictions} contradictions found`);
        score = Math.max(0, score - (report.factCheckSummary.contradictions * 5));
      }
      
      if (report.factCheckSummary.ambiguities > 3) {
        weaknesses.push(`${report.factCheckSummary.ambiguities} ambiguities`);
      }
    }
    
    // High-severity triggers
    const criticalTriggers = report.triggers.filter(t => 
      t.severity === SEVERITY.CRITICAL || t.severity === SEVERITY.HIGH
    );
    if (criticalTriggers.length > 0) {
      weaknesses.push(`${criticalTriggers.length} high-risk hallucination triggers`);
    }
  } else {
    // No hallucination report - provide generic assessment
    weaknesses.push('Hallucination risk not assessed');
  }
  
  const recommendation = score < 60
    ? 'Add citations, dates, and factual grounding to reduce AI hallucination risk'
    : score < 80
    ? 'Improve factual clarity and add more verifiable information'
    : 'Content has good factual grounding';
  
  return {
    score: Math.round(score * 10) / 10,
    weight: 0.10,
    status: getStatus(score),
    confidence,
    issues: relevantIssues.map(formatIssue),
    strengths,
    weaknesses,
    recommendation,
    dataAvailability: {
      hasIssues: relevantIssues.length > 0,
      hasLLMData: false,
      hasExtractability: false,
      hasHallucinationReport: !!result.hallucinationReport,
      hasEntityData: false,
    },
  };
}

/**
 * Calculate dimension score from issues
 * Uses diminishing returns to prevent single issues from over-penalizing
 */
function calculateDimensionScore(issues: Issue[]): number {
  if (issues.length === 0) return 98; // Near perfect if no issues
  
  // Enhanced severity multipliers based on real impact
  const severityWeights = {
    [SEVERITY.CRITICAL]: 4.0,  // Severe impact
    [SEVERITY.HIGH]: 2.5,      // Significant impact
    [SEVERITY.MEDIUM]: 1.2,    // Moderate impact
    [SEVERITY.LOW]: 0.6,       // Minor impact
    [SEVERITY.INFO]: 0.2,      // Minimal impact
  };
  
  // Calculate weighted penalties with diminishing returns
  let totalPenalty = 0;
  let issueCount = 0;
  
  // Sort by severity and impact for consistent processing
  const sortedIssues = [...issues].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    const aDiff = (severityOrder[a.severity] || 0) * 10 + a.impactScore;
    const bDiff = (severityOrder[b.severity] || 0) * 10 + b.impactScore;
    return bDiff - aDiff;
  });
  
  for (const issue of sortedIssues) {
    const severityWeight = severityWeights[issue.severity] || 1.0;
    const baseImpact = issue.impactScore || 10;
    
    // Apply diminishing returns: later issues have less impact
    // This prevents being overwhelmed by many small issues
    const diminishingFactor = Math.pow(0.85, issueCount);
    const weightedImpact = baseImpact * severityWeight * diminishingFactor;
    
    totalPenalty += weightedImpact;
    issueCount++;
  }
  
  // Apply logarithmic scaling to penalty to create a more gradual curve
  // This prevents scores from dropping too quickly
  const scaledPenalty = totalPenalty > 0 
    ? Math.log(1 + totalPenalty) * 8 // Logarithmic scaling factor
    : 0;
  
  const score = Math.max(0, Math.min(100, 100 - scaledPenalty));
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Identify quick wins - high impact, low effort
 * Enhanced with ROI (Return on Investment) calculation
 */
function identifyQuickWins(issues: Issue[]): AIReadinessScore['quickWins'] {
  // Calculate ROI score for each issue (impact / effort)
  const issuesWithROI = issues.map(issue => {
    const effort = estimateEffort(issue);
    const effortScore = effort === 'low' ? 1 : effort === 'medium' ? 3 : 8;
    const roi = issue.impactScore / effortScore;
    const isQuick = isQuickFix(issue);
    
    return {
      issue,
      effort,
      roi,
      isQuick,
    };
  });
  
  // Filter and sort by ROI
  const quickWins = issuesWithROI
    .filter(item => 
      item.issue.impactScore >= 12 && // Lower threshold but require good ROI
      (item.isQuick || item.roi >= 5) // Either a quick fix OR high ROI
    )
    .sort((a, b) => {
      // Prioritize: 1) High ROI, 2) Low effort, 3) High impact
      if (Math.abs(b.roi - a.roi) > 2) return b.roi - a.roi;
      if (a.effort !== b.effort) {
        const effortOrder = { low: 0, medium: 1, high: 2 };
        return effortOrder[a.effort] - effortOrder[b.effort];
      }
      return b.issue.impactScore - a.issue.impactScore;
    })
    .slice(0, 5)
    .map(item => ({
      issue: item.issue.title,
      impact: item.issue.impactScore,
      effort: item.effort,
      fix: item.issue.remediation,
    }));
  
  return quickWins;
}

/**
 * Build prioritized roadmap
 */
function buildRoadmap(issues: Issue[], dimensions: AIReadinessScore['dimensions']): AIReadinessScore['roadmap'] {
  const critical = issues.filter(i => 
    i.severity === SEVERITY.CRITICAL || 
    (i.severity === SEVERITY.HIGH && i.impactScore >= 20)
  );
  
  const high = issues.filter(i => 
    i.severity === SEVERITY.HIGH && i.impactScore >= 15 && i.impactScore < 20
  );
  
  const medium = issues.filter(i => 
    i.severity === SEVERITY.MEDIUM && i.impactScore >= 10
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
 * Uses statistical modeling based on distribution of real sites
 */
function calculateBenchmark(overall: number, dimensions: AIReadinessScore['dimensions']): AIReadinessScore['benchmark'] {
  // Statistical distribution based on analysis of real sites:
  // - Average site: ~60-65
  // - Good site: ~75-80
  // - Excellent site: ~85-90
  // - Best-in-class: ~92-96
  
  // Use cumulative distribution function (CDF) for more accurate percentile
  // Assuming roughly normal distribution with mean=65, std=15
  const mean = 65;
  const stdDev = 15;
  const zScore = (overall - mean) / stdDev;
  
  // Approximate CDF using error function approximation
  const erf = (x: number) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429;
    const erfApprox = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return x < 0 ? -erfApprox : erfApprox;
  };
  
  const percentile = Math.round((1 + erf(zScore / Math.sqrt(2))) * 50);
  const topPercentile = Math.max(1, Math.min(99, percentile));
  
  // Best in class calculation based on dimension strength
  const avgDimensionScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0) / 5;
  const bestInClass = avgDimensionScore >= 85 ? 96 : avgDimensionScore >= 75 ? 94 : 92;
  
  const improvement = Math.max(0, bestInClass - overall);
  
  return {
    topPercentile,
    bestInClass,
    improvement: Math.round(improvement * 10) / 10,
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
  // More realistic grading curve - harder to get A+, easier to avoid F
  // Based on analysis of real-world AI-optimized sites
  if (score >= 95) return 'A+';  // Exceptional - top 1% sites
  if (score >= 90) return 'A';   // Excellent - well optimized
  if (score >= 85) return 'A-';  // Very good - minor improvements needed
  if (score >= 80) return 'B+';  // Good - solid foundation
  if (score >= 75) return 'B';   // Above average - some gaps
  if (score >= 70) return 'B-';  // Average - needs work
  if (score >= 65) return 'C+';  // Below average - multiple issues
  if (score >= 60) return 'C';   // Poor - significant issues
  if (score >= 55) return 'C-';  // Very poor - major issues
  if (score >= 45) return 'D';   // Critical - fundamental problems
  return 'F';                     // Failing - unusable by AI
}

function getStatus(score: number): DimensionScore['status'] {
  if (score >= 90) return 'excellent';  // A or A+
  if (score >= 75) return 'good';       // B range
  if (score >= 60) return 'needs-work'; // C range
  return 'critical';                     // D or F
}

function formatIssue(issue: Issue) {
  return {
    title: issue.title,
    severity: issue.severity,
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
  lines.push(`Score Confidence: ${(score.confidence * 100).toFixed(0)}%`);
  lines.push(`Top ${score.benchmark.topPercentile}% of sites`);
  lines.push(`Improvement potential: +${score.benchmark.improvement} points to best-in-class\n`);
  
  // Add score breakdown for transparency
  if (score.scoreBreakdown) {
    lines.push('═══ Score Calculation ═══');
    lines.push(`Raw Score: ${score.scoreBreakdown.rawScore}/100`);
    
    const adj = score.scoreBreakdown.adjustments;
    if (adj.totalAdjustment !== 0) {
      lines.push('Adjustments:');
      if (adj.balancePenalty > 0) {
        lines.push(`  - Balance penalty: -${adj.balancePenalty} (uneven dimension scores)`);
      }
      if (adj.criticalPenalty > 0) {
        lines.push(`  - Critical weakness: -${adj.criticalPenalty} (dimension < 50)`);
      }
      if (adj.weaknessPenalty > 0) {
        lines.push(`  - Multiple weaknesses: -${adj.weaknessPenalty} (2+ dimensions < 70)`);
      }
      if (adj.excellenceBonus > 0) {
        lines.push(`  + Excellence bonus: +${adj.excellenceBonus} (all dimensions ≥ 85)`);
      }
      lines.push(`Total Adjustment: ${adj.totalAdjustment >= 0 ? '+' : ''}${adj.totalAdjustment}`);
    }
    lines.push(`Final Score: ${score.scoreBreakdown.normalizedScore}/100\n`);
  }
  
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
    
    const confidenceIndicator = dim.confidence >= 0.9 ? '●' : dim.confidence >= 0.7 ? '◐' : '○';
    
    lines.push(`\n${statusEmoji} ${name}: ${dim.score}/100 (${dim.status}) ${confidenceIndicator}`);
    lines.push(`  Weight: ${(dim.weight * 100).toFixed(0)}% | Confidence: ${(dim.confidence * 100).toFixed(0)}%`);
    
    if (dim.strengths.length > 0) {
      lines.push('  Strengths: ' + dim.strengths.join(', '));
    }
    if (dim.weaknesses.length > 0) {
      lines.push('  Weaknesses: ' + dim.weaknesses.join(', '));
    }
    lines.push(`  → ${dim.recommendation}`);
  }
  
  if (score.quickWins.length > 0) {
    lines.push('\n═══ Quick Wins (High ROI) ═══');
    score.quickWins.forEach((win, i) => {
      const effortEmoji = win.effort === 'low' ? '⚡' : win.effort === 'medium' ? '⚙️' : '🔨';
      lines.push(`\n${i + 1}. ${effortEmoji} ${win.issue}`);
      lines.push(`   Impact: ${win.impact} | Effort: ${win.effort}`);
      lines.push(`   Fix: ${win.fix.slice(0, 100)}${win.fix.length > 100 ? '...' : ''}`);
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
