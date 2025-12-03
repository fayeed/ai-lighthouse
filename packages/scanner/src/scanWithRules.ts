// packages/scanner/src/scan_with_rules.ts

import { CATEGORY, Issue, ScanOptions, ScanResult, SEVERITY } from "./types.js";
import { fetchHtml, parseHtml, estimateTokenCount } from "./utils.js";
import { runRegisteredRules } from "./rules/runner.js";
import { calculateScore } from "./scoring.js";
import { chunkContent } from "./chunker.js";
import { buildExtractabilityMap, analyzeContentTypeExtractability } from "./extractability.js";
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
      includeHtml: false
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

  return {
    url,
    timestamp: new Date().getTime(),
    issues,
    scores,
    scoring,
    chunking,
    extractability
  };
}
