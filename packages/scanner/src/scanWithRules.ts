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

const fetched = await fetchHtml(url, options.timeoutMs!, options.userAgent);
  if (fetched.status >= 400) {
    issues.push({
      id: 'MISC-002',
      title: 'HTTP error fetching page',
      serverity: SEVERITY.LOW,
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

  const tokenEstimate = estimateTokenCount(mainText);
  if (tokenEstimate > (options.maxChunkTokens || 1200)) {
    issues.push({
      id: 'CHUNK-001',
      title: 'Chunk exceeds recommended token/window size',
      serverity: SEVERITY.CRITICAL,
      category: CATEGORY.CHUNK,
      description: `Main content appears to be long (${tokenEstimate} tokens) and may exceed model context windows. Consider splitting into smaller sections or paginating content.`,
      remediation: 'Break content into smaller semantic sections using headings or create separate pages for distinct topics.',
      impactScore: 40,
      location: { url },
      evidence: [`tokens:${tokenEstimate}`],
      tags: ['chunking','embeddings'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue);
  }

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
  if (options.enableLLM && options.llmConfig) {
    try {
      const comprehension = await generateLLMComprehension($, url, {
        provider: options.llmConfig.provider,
        apiKey: options.llmConfig.apiKey,
        baseUrl: options.llmConfig.baseUrl,
        model: options.llmConfig.model,
        maxTokens: options.llmConfig.maxTokens,
        temperature: options.llmConfig.temperature
      });

      llm = {
        summary: comprehension.summary,
        topEntities: comprehension.topEntities,
        questions: comprehension.questions,
        suggestedFAQ: comprehension.suggestedFAQ,
        readingLevel: comprehension.readingLevel,
        keyTopics: comprehension.keyTopics,
        sentiment: comprehension.sentiment,
        technicalDepth: comprehension.technicalDepth,
        structureQuality: comprehension.structureQuality
      };
    } catch (error) {
      console.error('LLM comprehension failed:', error);
      // Add issue about LLM failure
      issues.push({
        id: 'LLMAPI-001',
        title: 'LLM Comprehension Failed',
        serverity: SEVERITY.LOW,
        category: CATEGORY.LLMAPI,
        description: `Failed to generate LLM comprehension: ${error instanceof Error ? error.message : 'Unknown error'}`,
        remediation: 'Check LLM API credentials and configuration.',
        impactScore: 5,
        location: { url },
        tags: ['llm', 'api'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }
  }

  // Hallucination detection (if enabled)
  let hallucinationReport;
  if (options.enableHallucinationDetection !== false) { // Enabled by default when LLM is available
    try {
      // Use LLM if available and enabled, otherwise use local heuristics only
      const llmConfig = (options.enableLLM && options.llmConfig) ? {
        provider: options.llmConfig.provider,
        apiKey: options.llmConfig.apiKey,
        baseUrl: options.llmConfig.baseUrl,
        model: options.llmConfig.model
      } : undefined;

      const report = await detectHallucinations($, url, llmConfig);
      
      // Convert triggers to issues
      const hallucinationIssues = hallucinationTriggersToIssues(report);
      issues.push(...hallucinationIssues);

      // Add to result
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

  // Named entity extraction (uses dedicated entity extractor)
  let entities;
  if (options.enableLLM && options.llmConfig) {
    try {
      const entityResult = await extractNamedEntities($, {
        enableLLM: true,
        llmConfig: options.llmConfig,
        minConfidence: 0.5
      });
      
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
    } catch (error) {
      console.error('Entity extraction failed:', error);
    }
  }

  // FAQ generation (uses dedicated FAQ generator)
  let faqs;
  if (options.enableLLM && options.llmConfig) {
    try {
      const faqResult = await generateFAQs($, {
        enableLLM: true,
        llmConfig: options.llmConfig,
        maxFAQs: 15
      });
      
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
    } catch (error) {
      console.error('FAQ generation failed:', error);
    }
  }

  // LLM Mirror Test (requires LLM)
  let mirrorReport;
  if (options.enableLLM && options.llmConfig) {
    try {
      const report = await runMirrorTest($, {
        provider: options.llmConfig.provider,
        apiKey: options.llmConfig.apiKey,
        baseUrl: options.llmConfig.baseUrl,
        model: options.llmConfig.model,
        maxTokens: options.llmConfig.maxTokens,
        temperature: options.llmConfig.temperature
      });

      console.log('Mirror Test Report:', report);
      
      mirrorReport = report;
      
      // Add critical mismatches as issues
      for (const mismatch of report.mismatches) {
        if (mismatch.severity === 'critical' || mismatch.severity === 'major') {
          issues.push({
            id: `LLMCONF-MIRROR-${mismatch.field.toUpperCase()}`,
            title: `AI Misunderstanding: ${mismatch.field}`,
            serverity: mismatch.severity === 'critical' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
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
    } catch (error) {
      console.error('Mirror test failed:', error);
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
    .slice(0, maxCount); // Limit count

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
    mirrorReport
  };
}
