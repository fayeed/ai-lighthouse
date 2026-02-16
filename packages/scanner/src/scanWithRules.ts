// packages/scanner/src/scan_with_rules.ts

import { CATEGORY, Issue, ScanOptions, ScanResult, SEVERITY } from "./types.js";
import { fetchHtml, parseHtml, estimateTokenCount } from "./utils.js";
import { runRegisteredRules } from "./rules/runner.js";
import { calculateScore } from "./scoring.js";
import { chunkContent } from "./chunker.js";
import { buildExtractabilityMap, analyzeContentTypeExtractability } from "./extractability.js";
import { runUnifiedAnalysis, runQuickAnalysis, sanitizeHtmlForLLM } from "./llm/unified-analysis.js";
import {
  analyzeSEO,
  seoIssuesToScannerIssues,
  analyzePSEO,
  pseoIssuesToScannerIssues,
  analyzeAEO,
  aeoIssuesToScannerIssues,
  analyzeGEO,
  geoIssuesToScannerIssues,
  analyzeAnswerGap,
  answerGapIssuesToScannerIssues,
} from "./analysis/index.js";
import { detectTechnology } from "./utils/tech-detector.js";
import { attachFixGuides } from "./guides/index.js";
import "./rules/index.js";

export async function analyzeUrlWithRules(url: string, opts?: ScanOptions): Promise<ScanResult> {
  const options: ScanOptions = { timeoutMs: 15000, maxChunkTokens: 1200, ...opts };
  const reportProgress = options.onProgress || (() => {});
  let html: string | undefined;
  const issues = [];
  let llmLimitExceeded = false;

  reportProgress('fetch', 5);
  const fetched = await fetchHtml(url, options.timeoutMs!, options.userAgent);
  if (fetched.status >= 400) {
    issues.push({
      id: 'MISC-002',
      title: 'HTTP error fetching page',
      severity: SEVERITY.LOW,
      category: CATEGORY.MISC,
      description: `Failed to fetch page; HTTP status ${fetched.status}`,
      remediation: 'Check URL and network; ensure the page is accessible.',
      impactScore: 2,
      location: { url },
      evidence: [String(fetched.status)],
      tags: ['network'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue);
  }
  html = fetched.text;

  reportProgress('parse', 10);
  const $ = parseHtml(html || '');

  // Detect CMS/framework technology
  const detectedTech = detectTechnology($, html || '');

  const ctx = {
    url,
    html: html || '',
    $,
    options,
    response: fetched.response
  };
  
  reportProgress('rules', 15);
  const rulesIssues = await runRegisteredRules(ctx);
  if (rulesIssues && rulesIssues.length) issues.push(...rulesIssues);

  // token estimate and chunking score (basic)
  const mainText = (() => {
    const selectors = ['main', 'article', 'body'];
    for (const s of selectors) {
      const el = $(s);
      if (el && el.length) {
        const text = el.text().replace(/\s+/g, ' ').trim();
        if (text.length > 0) return text;
      }
    }
    return $('body').text().replace(/\s+/g, ' ').trim();
  })();

  // Note: Chunk size validation is now handled by the ChunkRule in rules/chunk.ts
  // to avoid duplication and ensure consistency

  const categoryMap: Record<string, number[]> = {};
  for (const it of issues) {
    if (!categoryMap[it.category]) categoryMap[it.category] = [];
    categoryMap[it.category].push(it.impactScore);
  }

  // Legacy simple scores (for backward compatibility)
  const scores: Record<string, number> = {};
  for (const cat of Object.keys(categoryMap)) {
    const sum = categoryMap[cat].reduce((a, b) => a + b, 0);
    const penalty = Math.min(sum, 100);
    scores[cat] = Math.max(0, Math.round(100 - penalty));
  }

  // New comprehensive scoring system
  const scoring = calculateScore(issues);

  reportProgress('extract', 25);
  
  // Run chunking and extractability in parallel (non-LLM operations)
  const [chunking, extractability] = await Promise.all([
    // Detailed chunking analysis (if enabled)
    options.enableChunking !== false
      ? Promise.resolve(chunkContent($, {
          maxTokensPerChunk: options.maxChunkTokens || 500,
          includeHtml: false,
          strategy: options.chunkingStrategy || 'auto'
        }))
      : Promise.resolve(undefined),
    
    // Extractability mapping (if enabled)
    options.enableExtractability !== false
      ? Promise.resolve((() => {
          const map = buildExtractabilityMap($, {
            maxNodes: 500,
            includeHidden: true,
            minTextLength: 5
          });
          
          const contentTypes = analyzeContentTypeExtractability($);
          
          return {
            score: map.score,
            summary: map.summary,
            contentTypes,
            issues: map.issues,
            recommendations: map.recommendations
          };
        })())
      : Promise.resolve(undefined)
  ]);

  // LLM comprehension analysis (if enabled)
  let llm;
  let hallucinationReport;

  if (options.enableLLM && options.llmConfig) {
    try {
      reportProgress('llm', 35);
      const llmStartTime = Date.now();

      // Single unified LLM call for all content analysis
      const unifiedResult = await runUnifiedAnalysis($, url, {
        provider: options.llmConfig.provider,
        apiKey: options.llmConfig.apiKey,
        baseUrl: options.llmConfig.baseUrl,
        model: options.llmConfig.model,
        maxTokens: options.llmConfig.maxTokens,
        temperature: options.llmConfig.temperature
      });

      const llmDuration = Date.now() - llmStartTime;
      console.log(`Unified LLM analysis completed in ${llmDuration}ms`);

      reportProgress('processing', 85);

      // Process unified result into expected format
      if (unifiedResult) {
        // Fill in heuristic data for any fields the LLM returned empty
        const heuristic = runQuickAnalysis($, url);

        llm = {
          summary: unifiedResult.summary,
          pageType: unifiedResult.pageType,
          topEntities: unifiedResult.topEntities?.length ? unifiedResult.topEntities : (heuristic.topEntities || []),
          questions: unifiedResult.questions?.length ? unifiedResult.questions : (heuristic.questions || []),
          suggestedFAQ: unifiedResult.suggestedFAQ?.length ? unifiedResult.suggestedFAQ : (heuristic.suggestedFAQ || []),
          readingLevel: unifiedResult.readingLevel,
          keyTopics: unifiedResult.keyTopics,
          sentiment: unifiedResult.sentiment,
          technicalDepth: unifiedResult.technicalDepth,
          structureQuality: unifiedResult.structureQuality,
          pageTypeInsights: unifiedResult.pageTypeInsights,
          // SEO suggestions from unified analysis
          suggestedTitle: unifiedResult.suggestedTitle,
          suggestedMeta: unifiedResult.suggestedMeta,
          keywords: unifiedResult.keywords
        };

        // Build hallucination report from unified analysis
        if (unifiedResult.hallucinationRisk) {
          hallucinationReport = {
            hallucinationRiskScore: unifiedResult.hallucinationRisk.score,
            triggers: unifiedResult.hallucinationRisk.triggers.map(t => ({
              type: t.type,
              severity: t.severity === 'critical' ? SEVERITY.CRITICAL :
                       t.severity === 'high' ? SEVERITY.HIGH :
                       t.severity === 'medium' ? SEVERITY.MEDIUM : SEVERITY.LOW,
              description: t.description,
              confidence: 0.8
            })),
            recommendations: unifiedResult.hallucinationRisk.recommendations,
            factCheckSummary: {
              totalFacts: unifiedResult.hallucinationRisk.triggers.length,
              verifiedFacts: 0,
              unverifiedFacts: unifiedResult.hallucinationRisk.triggers.length,
              contradictions: 0,
              ambiguities: 0
            },
            verifications: []
          };

          // Add high-severity hallucination triggers as issues
          for (const trigger of unifiedResult.hallucinationRisk.triggers) {
            if (trigger.severity === 'high' || trigger.severity === 'critical') {
              issues.push({
                id: `LLMCONF-HALLUC-${trigger.type.toUpperCase()}`,
                title: `Hallucination Risk: ${trigger.type.replace(/_/g, ' ')}`,
                severity: trigger.severity === 'critical' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
                category: CATEGORY.LLMCON,
                description: trigger.description,
                remediation: 'Add specific details, sources, or citations to reduce AI hallucination risk.',
                impactScore: trigger.severity === 'critical' ? 8 : 6,
                location: { url },
                tags: ['hallucination-risk', 'ai-safety', trigger.type],
                confidence: 0.8,
                timestamp: new Date().toISOString()
              } as Issue);
            }
          }
        }
      }

    } catch (error) {
      console.error('Unified LLM analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isRateLimit = errorMessage.includes('Rate limit exceeded') ||
                          errorMessage.includes('rate limit') ||
                          errorMessage.includes('free-models-per-day') ||
                          errorMessage.includes('quota exceeded');

      if (isRateLimit) {
        llmLimitExceeded = true;
      } else {
        // Add issue about LLM failure (only for non-rate-limit errors)
        issues.push({
          id: 'LLMAPI-001',
          title: 'LLM Analysis Failed',
          severity: SEVERITY.LOW,
          category: CATEGORY.LLMAPI,
          description: `Failed to complete LLM analysis: ${errorMessage}`,
          remediation: 'Check LLM API credentials and configuration.',
          impactScore: 5,
          location: { url },
          tags: ['llm', 'api'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }
  } else {
    // Non-LLM scan - use quick heuristic analysis
    reportProgress('processing', 85);
    const quickAnalysis = runQuickAnalysis($, url);
    if (quickAnalysis) {
      llm = {
        summary: quickAnalysis.summary || '',
        pageType: quickAnalysis.pageType || 'Other',
        topEntities: quickAnalysis.topEntities || [],
        questions: quickAnalysis.questions || [],
        suggestedFAQ: quickAnalysis.suggestedFAQ || [],
        keyTopics: quickAnalysis.keyTopics || [],
        pageTypeInsights: quickAnalysis.pageTypeInsights || [],
        // Additional fields from quick analysis
        sentiment: quickAnalysis.sentiment,
        technicalDepth: quickAnalysis.technicalDepth,
        structureQuality: quickAnalysis.structureQuality,
        readingLevel: quickAnalysis.readingLevel,
        suggestedTitle: quickAnalysis.suggestedTitle,
        suggestedMeta: quickAnalysis.suggestedMeta,
        keywords: quickAnalysis.keywords || []
      };
      if (quickAnalysis.hallucinationRisk) {
        hallucinationReport = {
          hallucinationRiskScore: quickAnalysis.hallucinationRisk.score,
          triggers: quickAnalysis.hallucinationRisk.triggers || [],
          recommendations: quickAnalysis.hallucinationRisk.recommendations || [],
          factCheckSummary: { totalFacts: 0, verifiedFacts: 0, unverifiedFacts: 0, contradictions: 0, ambiguities: 0 },
          verifications: []
        };
      }
    }
  }

  reportProgress('scoring', 95);

  // Run optimization analysis (SEO, PSEO, AEO, GEO, Answer Gap)
  const seo = await analyzeSEO({ $, url, options, onProgress: reportProgress });
  const pseo = analyzePSEO({ $, url });
  const aeo = analyzeAEO({ $, url });
  const geo = analyzeGEO({ $, url });
  const answerGap = analyzeAnswerGap({
    $,
    url,
    llmQuestions: llm?.questions,
    llmFAQs: llm?.suggestedFAQ,
  });

  // Add optimization issues to main issues array
  issues.push(...seoIssuesToScannerIssues(seo));
  issues.push(...pseoIssuesToScannerIssues(pseo));
  issues.push(...aeoIssuesToScannerIssues(aeo));
  issues.push(...geoIssuesToScannerIssues(geo));
  issues.push(...answerGapIssuesToScannerIssues(answerGap));

  // Filter issues based on quality thresholds (reduce noise)
  const minImpact = options.minImpactScore ?? 8;
  const minConf = options.minConfidence ?? 0.7;
  const maxCount = options.maxIssues ?? 100;

  const filteredIssues = issues
    .filter(issue => issue.impactScore >= minImpact)
    .filter(issue => (issue.confidence ?? 1.0) >= minConf)
    .sort((a, b) => b.impactScore - a.impactScore) // Sort by impact
    .slice(0, maxCount) // Limit count
    .map(issue => ({
      ...issue,
      scoreImpact: Math.min(20, Math.round((issue.impactScore * 0.15) * 10) / 10)
    })); // Add score impact to each issue

  // Recalculate scoring with filtered issues
  const filteredScoring = calculateScore(filteredIssues);

  // Attach CMS-specific fix guides to issues
  attachFixGuides(filteredIssues);

  return {
    url,
    timestamp: new Date().getTime(),
    detectedTech: detectedTech.platform ? detectedTech : undefined,
    issues: filteredIssues, // Return filtered issues
    scores,
    scoring: filteredScoring, // Use filtered scoring
    chunking,
    extractability,
    llm, // Unified LLM analysis results
    hallucinationReport, // Hallucination risk from unified analysis
    llmLimitExceeded, // Flag indicating if LLM rate limit was hit

    // Optimization Analysis
    seo,
    pseo,
    aeo,
    geo,
    answerGap,
  };
}
