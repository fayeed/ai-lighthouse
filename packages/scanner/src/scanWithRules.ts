// packages/scanner/src/scan_with_rules.ts

import { CATEGORY, Issue, ScanOptions, ScanResult, SEVERITY } from "./types.js";
import { fetchHtml, parseHtml, estimateTokenCount } from "./utils.js";
import { runRegisteredRules } from "./rules/runner.js";
import { calculateScore } from "./scoring.js";
import { chunkContent } from "./chunker.js";
import { buildExtractabilityMap, analyzeContentTypeExtractability } from "./extractability.js";
import { generateLLMComprehension } from "./llm/comprehension.js";
import { detectHallucinations, hallucinationTriggersToIssues } from "./llm/hallucination.js";
import { extractNamedEntities } from "./llm/entities.js";
import { generateFAQs } from "./llm/faq.js";
import { runMirrorTest } from "./llm/mirror.js";
import "./rules/index.js";

export async function analyzeUrlWithRules(url: string, opts?: ScanOptions): Promise<ScanResult> {
  const options: ScanOptions = { timeoutMs: 15000, maxChunkTokens: 1200, ...opts };
  let html: string | undefined;
  const issues = [];
  let llmLimitExceeded = false;

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

  const $ = parseHtml(html || '');

  const ctx = { 
    url, 
    html: html || '', 
    $, 
    options,
    response: fetched.response
  };
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

  // Detailed chunking analysis (if enabled)
  let chunking;
  if (options.enableChunking !== false) { // Enabled by default
    chunking = chunkContent($, {
      maxTokensPerChunk: options.maxChunkTokens || 500,
      includeHtml: false,
      strategy: options.chunkingStrategy || 'auto'
    });
  }

  // Extractability mapping (if enabled)
  let extractability;
  if (options.enableExtractability !== false) { // Enabled by default
    const map = buildExtractabilityMap($, {
      maxNodes: 500,
      includeHidden: true,
      minTextLength: 5
    });
    
    const contentTypes = analyzeContentTypeExtractability($);
    
    extractability = {
      score: map.score,
      summary: map.summary,
      contentTypes,
      issues: map.issues,
      recommendations: map.recommendations
    };
  }

  // LLM comprehension analysis (if enabled)
  let llm;
  let hallucinationReport;
  let entities;
  let faqs;
  let mirrorReport;

  if (options.enableLLM && options.llmConfig) {
    try {
      console.log('[LLM] Starting parallel LLM operations');
      const llmStartTime = Date.now();

      // Run all LLM operations in parallel
      const [
        comprehensionResult,
        hallucinationResult,
        entityResult,
        faqResult,
        mirrorResult
      ] = await Promise.all([
        // Comprehension
        generateLLMComprehension($, url, {
          provider: options.llmConfig.provider,
          apiKey: options.llmConfig.apiKey,
          baseUrl: options.llmConfig.baseUrl,
          model: options.llmConfig.model,
          maxTokens: options.llmConfig.maxTokens,
          temperature: options.llmConfig.temperature
        }).catch(error => {
          console.error('LLM comprehension failed:', error);
          return null;
        }),

        // Hallucination detection
        (options.enableHallucinationDetection !== false
          ? detectHallucinations($, url, {
              provider: options.llmConfig.provider,
              apiKey: options.llmConfig.apiKey,
              baseUrl: options.llmConfig.baseUrl,
              model: options.llmConfig.model
            }).catch(error => {
              console.error('Hallucination detection failed:', error);
              return null;
            })
          : Promise.resolve(null)
        ),

        // Entity extraction
        extractNamedEntities($, {
          enableLLM: true,
          llmConfig: options.llmConfig,
          minConfidence: 0.5
        }).catch(error => {
          console.error('Entity extraction failed:', error);
          return null;
        }),

        // FAQ generation
        generateFAQs($, {
          enableLLM: true,
          llmConfig: options.llmConfig,
          maxFAQs: 15
        }).catch(error => {
          console.error('FAQ generation failed:', error);
          return null;
        }),

        // Mirror test
        runMirrorTest($, {
          provider: options.llmConfig.provider,
          apiKey: options.llmConfig.apiKey,
          baseUrl: options.llmConfig.baseUrl,
          model: options.llmConfig.model,
          maxTokens: options.llmConfig.maxTokens,
          temperature: options.llmConfig.temperature
        }).catch(error => {
          console.error('Mirror test failed:', error);
          return null;
        })
      ]);

      const llmDuration = Date.now() - llmStartTime;
      console.log(`[LLM] All parallel operations completed in ${llmDuration}ms`);

      // Process comprehension result
      if (comprehensionResult) {
        llm = {
          summary: comprehensionResult.summary,
          pageType: comprehensionResult.pageType,
          topEntities: comprehensionResult.topEntities,
          questions: comprehensionResult.questions,
          suggestedFAQ: comprehensionResult.suggestedFAQ,
          readingLevel: comprehensionResult.readingLevel,
          keyTopics: comprehensionResult.keyTopics,
          sentiment: comprehensionResult.sentiment,
          technicalDepth: comprehensionResult.technicalDepth,
          structureQuality: comprehensionResult.structureQuality,
          pageTypeInsights: comprehensionResult.pageTypeInsights
        };
      }

      // Process hallucination result
      if (hallucinationResult) {
        const hallucinationIssues = hallucinationTriggersToIssues(hallucinationResult);
        issues.push(...hallucinationIssues);

        hallucinationReport = {
          hallucinationRiskScore: hallucinationResult.hallucinationRiskScore,
          triggers: hallucinationResult.triggers.map(t => ({
            type: t.type,
            severity: t.severity,
            description: t.description,
            confidence: t.confidence
          })),
          factCheckSummary: hallucinationResult.factCheckSummary,
          recommendations: hallucinationResult.recommendations,
          verifications: hallucinationResult.verifications,
        };
      }

      // Process entity result
      if (entityResult) {
        entities = {
          entities: entityResult.entities.map(e => ({
            name: e.name,
            type: e.type,
            confidence: e.confidence,
            locator: e.locator,
            metadata: e.metadata
          })),
          summary: entityResult.summary,
          schemaMapping: entityResult.schemaMapping
        };
      }

      // Process FAQ result
      if (faqResult) {
        faqs = {
          faqs: faqResult.faqs.map(f => ({
            question: f.question,
            suggestedAnswer: f.suggestedAnswer,
            importance: f.importance,
            confidence: f.confidence,
            source: f.source
          })),
          summary: faqResult.summary
        };
      }

      // Process mirror result
      if (mirrorResult) {
        mirrorReport = mirrorResult;
        
        // Add critical mismatches as issues
        for (const mismatch of mirrorResult.mismatches) {
          if (mismatch.severity === 'critical' || mismatch.severity === 'major') {
            issues.push({
              id: `LLMCONF-MIRROR-${mismatch.field.toUpperCase()}`,
              title: `AI Misunderstanding: ${mismatch.field}`,
              severity: mismatch.severity === 'critical' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
              category: CATEGORY.LLMCON,
              description: mismatch.description,
              remediation: mismatch.recommendation,
              impactScore: mismatch.severity === 'critical' ? 8 : 6,
              location: { url },
              tags: ['ai-interpretation', 'messaging', 'mirror-test'],
              confidence: mismatch.confidence,
              timestamp: new Date().toISOString()
            } as Issue);
          }
        }
      }

    } catch (error) {
      console.error('LLM operations failed:', error);
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
          title: 'LLM Operations Failed',
          severity: SEVERITY.LOW,
          category: CATEGORY.LLMAPI,
          description: `Failed to complete LLM operations: ${errorMessage}`,
          remediation: 'Check LLM API credentials and configuration.',
          impactScore: 5,
          location: { url },
          tags: ['llm', 'api'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }
  } else if (options.enableHallucinationDetection !== false) {
    // Run hallucination detection without LLM (local heuristics only)
    try {
      const report = await detectHallucinations($, url, undefined);
      const hallucinationIssues = hallucinationTriggersToIssues(report);
      issues.push(...hallucinationIssues);

      hallucinationReport = {
        hallucinationRiskScore: report.hallucinationRiskScore,
        triggers: report.triggers.map(t => ({
          type: t.type,
          severity: t.severity,
          description: t.description,
          confidence: t.confidence
        })),
        factCheckSummary: report.factCheckSummary,
        recommendations: report.recommendations,
        verifications: report.verifications,
      };
    } catch (error) {
      console.error('Hallucination detection failed:', error);
    }
  }

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

  return {
    url,
    timestamp: new Date().getTime(),
    issues: filteredIssues, // Return filtered issues
    scores,
    scoring: filteredScoring, // Use filtered scoring
    chunking,
    extractability,
    llm, // High-level comprehension analysis
    // @ts-ignore
    hallucinationReport,
    entities, // Detailed entity extraction with metadata
    faqs, // Detailed FAQ generation with sources
    mirrorReport,
    llmLimitExceeded // Flag indicating if LLM rate limit was hit
  };
}
