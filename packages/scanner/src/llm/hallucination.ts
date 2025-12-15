/**
 * Hallucination Detection - AI Misunderstanding Reports
 * 
 * Detects potential hallucination triggers by:
 * 1. Extracting facts from content using LLM
 * 2. Cross-checking facts against actual DOM content
 * 3. Detecting contradictions in page text (dates, numbers)
 * 4. Reporting mismatches as hallucination risks
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';
import { safeJSONParse } from './helpers.js';
import { SEVERITY, CATEGORY, Issue } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExtractedFact {
  id: string;
  statement: string;
  category: 'date' | 'number' | 'name' | 'location' | 'concept' | 'relationship';
  confidence: number; // 0-1
  sourceContext?: string; // Where LLM found this
}

export interface FactVerification {
  fact: ExtractedFact;
  verified: boolean;
  evidence: {
    found: boolean;
    selector?: string;
    textSnippet?: string;
    similarity?: number; // 0-1
  };
  contradictions?: {
    conflictingStatement: string;
    selector: string;
    textSnippet: string;
  }[];
}

export interface HallucinationTrigger {
  type: 'missing_fact' | 'contradiction' | 'ambiguity' | 'inconsistency';
  severity: SEVERITY;
  description: string;
  facts: ExtractedFact[];
  verifications: FactVerification[];
  evidence: string[];
  confidence: number; // 0-1
}

export interface MisunderstandingReport {
  url: string;
  timestamp: string;
  triggers: HallucinationTrigger[];
  factCheckSummary: {
    totalFacts: number;
    verifiedFacts: number;
    unverifiedFacts: number;
    contradictions: number;
    ambiguities: number;
  };
  verifications: FactVerification[];
  recommendations: string[];
  hallucinationRiskScore: number; // 0-100
}

/**
 * Extract text content with context
 */
function extractTextWithContext($: CheerioAPI): Array<{ text: string; selector: string }> {
  const results: Array<{ text: string; selector: string }> = [];
  
  // Extract from semantic elements
  const semanticSelectors = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'li', 'td', 'th', 'blockquote', 'figcaption',
    'dt', 'dd', 'summary', 'article', 'section'
  ];
  
  semanticSelectors.forEach(selector => {
    $(selector).each((index: number, element: any) => {
      const text = $(element).text().trim();
      if (text.length > 10) { // Minimum length
        results.push({
          text,
          selector: `${selector}:nth-of-type(${index + 1})`
        });
      }
    });
  });
  
  return results;
}

/**
 * Extract facts using LLM
 */
async function extractFactsWithLLM(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<ExtractedFact[]> {
  const runner = new LLMRunner(config);
  
  // Get main content
  const main = $('main').length > 0 ? $('main') : $('body');
  const content = main.text().replace(/\s+/g, ' ').trim().substring(0, 5000);
  
  const system = `You are an expert fact extractor. Extract concrete, verifiable facts from web content.
Focus on:
- Specific dates, times, years
- Numbers, quantities, measurements
- Names of people, organizations, products
- Locations, addresses
- Relationships between entities
- Technical specifications

For each fact, categorize it and assess your confidence (0-1).`;

  const user = `Extract 5-10 key verifiable facts from this content:

URL: ${url}
Content: ${content}

Respond in JSON format:
{
  "facts": [
    {
      "statement": "Specific fact statement",
      "category": "date|number|name|location|concept|relationship",
      "confidence": 0.9,
      "sourceContext": "Brief context where this was mentioned"
    }
  ]
}

Only include facts that can be verified in the content. Avoid opinions or interpretations.`;

  const response = await runner.callWithSystem(system, user, {
    temperature: 0.1, // Very low for factual extraction
    maxTokens: 1000
  });

  // Parse response
  try {
    const data = safeJSONParse(response.content, 'LLM fact extraction');
    
    return data.facts.map((f: any) => ({
      id: uuidv4(),
      statement: f.statement,
      category: f.category,
      confidence: f.confidence || 0.5,
      sourceContext: f.sourceContext
    }));
  } catch (error) {
    console.error('Failed to parse LLM fact extraction:', error);
    return [];
  }
}

/**
 * Verify facts against DOM content
 */
function verifyFacts(
  facts: ExtractedFact[],
  $: CheerioAPI
): FactVerification[] {
  const contentBlocks = extractTextWithContext($);
  const verifications: FactVerification[] = [];
  
  for (const fact of facts) {
    const verification: FactVerification = {
      fact,
      verified: false,
      evidence: { found: false }
    };
    
    // Search for fact in content
    const factTokens = fact.statement.toLowerCase().split(/\s+/);
    let bestMatch = { similarity: 0, block: null as any };
    
    for (const block of contentBlocks) {
      const blockText = block.text.toLowerCase();
      
      // Check if fact tokens are in this block
      const matchedTokens = factTokens.filter(token => 
        blockText.includes(token) && token.length > 3
      );
      const similarity = matchedTokens.length / factTokens.length;
      
      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity, block };
      }
    }
    
    if (bestMatch.similarity > 0.5) {
      verification.verified = true;
      verification.evidence = {
        found: true,
        selector: bestMatch.block.selector,
        textSnippet: bestMatch.block.text.substring(0, 200),
        similarity: bestMatch.similarity
      };
    }
    
    // Check for contradictions
    verification.contradictions = findContradictions(fact, contentBlocks);
    
    verifications.push(verification);
  }
  
  return verifications;
}

/**
 * Find contradictions in content
 */
function findContradictions(
  fact: ExtractedFact,
  contentBlocks: Array<{ text: string; selector: string }>
): Array<{ conflictingStatement: string; selector: string; textSnippet: string }> {
  const contradictions: Array<{ conflictingStatement: string; selector: string; textSnippet: string }> = [];
  
  // Extract key values from fact
  if (fact.category === 'date') {
    const datePattern = /\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
    const factDates = fact.statement.match(datePattern) || [];
    
    if (factDates.length > 0) {
      for (const block of contentBlocks) {
        const blockDates = block.text.match(datePattern) || [];
        
        // Look for different dates in similar context
        for (const blockDate of blockDates) {
          if (!factDates.some(fd => normalizeDate(fd) === normalizeDate(blockDate))) {
            // Check if contexts are similar (potential contradiction)
            const contextSimilar = checkContextSimilarity(fact.statement, block.text);
            if (contextSimilar > 0.3) {
              contradictions.push({
                conflictingStatement: block.text,
                selector: block.selector,
                textSnippet: block.text.substring(0, 200)
              });
            }
          }
        }
      }
    }
  }
  
  if (fact.category === 'number') {
    const numberPattern = /\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|thousand|percent|%|dollars?|\$))?\b/gi;
    const factNumbers = fact.statement.match(numberPattern) || [];
    
    if (factNumbers.length > 0) {
      for (const block of contentBlocks) {
        const blockNumbers = block.text.match(numberPattern) || [];
        
        for (const blockNum of blockNumbers) {
          if (!factNumbers.some(fn => normalizeNumber(fn) === normalizeNumber(blockNum))) {
            const contextSimilar = checkContextSimilarity(fact.statement, block.text);
            if (contextSimilar > 0.3) {
              contradictions.push({
                conflictingStatement: block.text,
                selector: block.selector,
                textSnippet: block.text.substring(0, 200)
              });
            }
          }
        }
      }
    }
  }
  
  return contradictions;
}

/**
 * Normalize date for comparison
 */
function normalizeDate(dateStr: string): string {
  // Simple normalization - extract year
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : dateStr.toLowerCase();
}

/**
 * Normalize number for comparison
 */
function normalizeNumber(numStr: string): string {
  // Remove formatting and extract base number
  const cleaned = numStr.replace(/[,$%\s]/g, '').toLowerCase();
  // Extract just the numeric part
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/);
  return match ? match[1] : cleaned;
}

/**
 * Check context similarity (simple word overlap)
 */
function checkContextSimilarity(text1: string, text2: string): number {
  const tokens1 = text1.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  const tokens2 = text2.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  
  const common = tokens1.filter(t => tokens2.includes(t));
  return common.length / Math.max(tokens1.length, tokens2.length);
}

/**
 * Detect local contradictions without LLM
 */
function detectLocalContradictions($: CheerioAPI): HallucinationTrigger[] {
  const triggers: HallucinationTrigger[] = [];
  const contentBlocks = extractTextWithContext($);
  
  // Group by category
  const dateBlocks: Array<{ text: string; selector: string; dates: string[] }> = [];
  const numberBlocks: Array<{ text: string; selector: string; numbers: string[] }> = [];
  
  for (const block of contentBlocks) {
    // Extract dates
    const dates = block.text.match(/\b(19|20)\d{2}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi) || [];
    if (dates.length > 0) {
      dateBlocks.push({ ...block, dates });
    }
    
    // Extract numbers
    const numbers = block.text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|thousand|percent|%|dollars?|\$))?\b/gi) || [];
    if (numbers.length > 0) {
      numberBlocks.push({ ...block, numbers });
    }
  }
  
  // Check for date contradictions
  for (let i = 0; i < dateBlocks.length; i++) {
    for (let j = i + 1; j < dateBlocks.length; j++) {
      const similarity = checkContextSimilarity(dateBlocks[i].text, dateBlocks[j].text);
      
      // Check if discussing same topic (lower threshold)
      const hasSimilarKeywords = similarity > 0.2 || 
        (dateBlocks[i].text.toLowerCase().includes('found') && dateBlocks[j].text.toLowerCase().includes('found')) ||
        (dateBlocks[i].text.toLowerCase().includes('establish') && dateBlocks[j].text.toLowerCase().includes('establish')) ||
        (dateBlocks[i].text.toLowerCase().includes('start') && dateBlocks[j].text.toLowerCase().includes('start'));
      
      if (hasSimilarKeywords) {
        // Similar context but different dates
        const dates1 = dateBlocks[i].dates.map(normalizeDate);
        const dates2 = dateBlocks[j].dates.map(normalizeDate);
        
        const hasOverlap = dates1.some(d => dates2.includes(d));
        const hasConflict = !hasOverlap && dates1.length > 0 && dates2.length > 0;
        
        if (hasConflict) {
          triggers.push({
            type: 'contradiction',
            severity: SEVERITY.HIGH,
            description: `Conflicting dates found: "${dateBlocks[i].dates.join(', ')}" vs "${dateBlocks[j].dates.join(', ')}". Page mentions multiple different years for similar events.`,
            facts: [
              {
                id: uuidv4(),
                statement: dateBlocks[i].text.substring(0, 150),
                category: 'date',
                confidence: 0.8
              },
              {
                id: uuidv4(),
                statement: dateBlocks[j].text.substring(0, 150),
                category: 'date',
                confidence: 0.8
              }
            ],
            verifications: [],
            evidence: [
              `Block 1 (${dateBlocks[i].selector}): ${dateBlocks[i].text.substring(0, 200)}`,
              `Block 2 (${dateBlocks[j].selector}): ${dateBlocks[j].text.substring(0, 200)}`
            ],
            confidence: Math.max(0.6, similarity)
          });
        }
      }
    }
  }
  
  // Check for number contradictions
  for (let i = 0; i < numberBlocks.length; i++) {
    for (let j = i + 1; j < numberBlocks.length; j++) {
      const similarity = checkContextSimilarity(numberBlocks[i].text, numberBlocks[j].text);
      
      // Check for similar context (RAM, memory, specifications, etc.)
      const hasSimilarKeywords = similarity > 0.2 ||
        (numberBlocks[i].text.toLowerCase().includes('ram') && numberBlocks[j].text.toLowerCase().includes('ram')) ||
        (numberBlocks[i].text.toLowerCase().includes('memory') && numberBlocks[j].text.toLowerCase().includes('memory')) ||
        (numberBlocks[i].text.toLowerCase().includes('gb') && numberBlocks[j].text.toLowerCase().includes('gb')) ||
        (numberBlocks[i].text.toLowerCase().includes('accuracy') && numberBlocks[j].text.toLowerCase().includes('accuracy'));
      
      if (hasSimilarKeywords) {
        const nums1 = numberBlocks[i].numbers.map(normalizeNumber);
        const nums2 = numberBlocks[j].numbers.map(normalizeNumber);
        
        // Check if numbers are different
        const hasOverlap = nums1.some(n => nums2.includes(n));
        const hasConflict = !hasOverlap && nums1.length > 0 && nums2.length > 0;
        
        if (hasConflict) {
          triggers.push({
            type: 'contradiction',
            severity: SEVERITY.HIGH,
            description: `Conflicting numbers found: "${numberBlocks[i].numbers.join(', ')}" vs "${numberBlocks[j].numbers.join(', ')}". Page contains inconsistent specifications or metrics.`,
            facts: [
              {
                id: uuidv4(),
                statement: numberBlocks[i].text.substring(0, 150),
                category: 'number',
                confidence: 0.8
              },
              {
                id: uuidv4(),
                statement: numberBlocks[j].text.substring(0, 150),
                category: 'number',
                confidence: 0.8
              }
            ],
            verifications: [],
            evidence: [
              `Block 1 (${numberBlocks[i].selector}): ${numberBlocks[i].text.substring(0, 200)}`,
              `Block 2 (${numberBlocks[j].selector}): ${numberBlocks[j].text.substring(0, 200)}`
            ],
            confidence: Math.max(0.6, similarity)
          });
        }
      }
    }
  }
  
  return triggers;
}

/**
 * Generate hallucination detection report
 */
export async function detectHallucinations(
  $: CheerioAPI,
  url: string,
  config?: LLMConfig
): Promise<MisunderstandingReport> {
  const triggers: HallucinationTrigger[] = [];
  let facts: ExtractedFact[] = [];
  let verifications: FactVerification[] = [];
  
  // If LLM config provided, do full fact checking
  if (config) {
    try {
      // Extract facts with LLM
      facts = await extractFactsWithLLM($, url, config);
      
      // Verify facts against DOM
      verifications = verifyFacts(facts, $);

      // Separate facts by verification status
      const verifiedFacts = verifications.filter(v => v.verified && (!v.contradictions || v.contradictions.length === 0));
      const unverifiedFacts = verifications.filter(v => !v.verified);
      const contradictedFacts = verifications.filter(v => v.contradictions && v.contradictions.length > 0);
      
      // Add single consolidated trigger with all facts and verifications
      if (verifications.length > 0) {
        triggers.push({
          type: 'missing_fact',
          severity: contradictedFacts.length > 0 ? SEVERITY.CRITICAL : unverifiedFacts.length > 0 ? SEVERITY.HIGH : SEVERITY.LOW,
          description: `Fact extraction complete: ${verifiedFacts.length} verified, ${unverifiedFacts.length} unverified, ${contradictedFacts.length} contradicted`,
          facts: facts, // All extracted facts
          verifications: verifications, // All verifications with status
          evidence: verifications.map(v => v.evidence.textSnippet || v.fact.statement),
          confidence: verifications.reduce((sum, v) => sum + v.fact.confidence, 0) / verifications.length
        });
      }
    } catch (error) {
      console.error('LLM-based hallucination detection failed:', error);
    }
  }
  
  // Always run local heuristic detection
  const localTriggers = detectLocalContradictions($);
  triggers.push(...localTriggers);
  
  // Calculate summary
  const totalFacts = facts.length;
  const verifiedFacts = verifications.filter(v => v.verified).length;
  const unverifiedFacts = verifications.filter(v => !v.verified).length;
  const contradictions = verifications.filter(v => v.contradictions && v.contradictions.length > 0).length;
  const ambiguities = triggers.filter(t => t.type === 'ambiguity').length;
  
  // Calculate hallucination risk score
  let riskScore = 0;
  riskScore += unverifiedFacts * 10; // Unverified facts
  riskScore += contradictions * 20; // Contradictions are serious
  riskScore += ambiguities * 5; // Ambiguities are moderate risk
  riskScore += localTriggers.length * 8; // Local contradictions
  riskScore = Math.min(riskScore, 100);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (unverifiedFacts > 0) {
    recommendations.push(`Verify ${unverifiedFacts} fact(s) that LLM may misinterpret`);
  }
  if (contradictions > 0) {
    recommendations.push(`Resolve ${contradictions} contradiction(s) in content to prevent AI confusion`);
  }
  if (localTriggers.length > 0) {
    recommendations.push(`Review ${localTriggers.length} potential inconsistenc${localTriggers.length === 1 ? 'y' : 'ies'} in dates/numbers`);
  }
  if (riskScore > 50) {
    recommendations.push('High hallucination risk - consider restructuring content for clarity');
  }
  if (triggers.length === 0) {
    recommendations.push('No hallucination triggers detected - content appears consistent');
  }
  
  return {
    url,
    timestamp: new Date().toISOString(),
    triggers,
    factCheckSummary: {
      totalFacts,
      verifiedFacts,
      unverifiedFacts,
      contradictions,
      ambiguities
    },
    verifications,
    recommendations,
    hallucinationRiskScore: riskScore
  };
}

/**
 * Convert hallucination triggers to issues
 */
export function hallucinationTriggersToIssues(
  report: MisunderstandingReport
): Issue[] {
  const issues: Issue[] = [];
  
  for (const trigger of report.triggers) {
    issues.push({
      id: `HALL-${trigger.type.toUpperCase()}-${uuidv4().substring(0, 8)}`,
      title: `Hallucination Trigger: ${trigger.type.replace('_', ' ')}`,
      severity: trigger.severity,
      category: CATEGORY.HALL,
      description: trigger.description,
      remediation: getRemediation(trigger),
      impactScore: getImpactScore(trigger),
      location: { url: report.url },
      evidence: trigger.evidence,
      tags: ['hallucination', 'ai-safety', trigger.type],
      confidence: trigger.confidence,
      timestamp: report.timestamp
    });
  }
  
  return issues;
}

function getRemediation(trigger: HallucinationTrigger): string {
  switch (trigger.type) {
    case 'missing_fact':
      return 'Ensure all important facts are clearly stated in the visible content. Add explicit statements rather than relying on implicit information.';
    case 'contradiction':
      return 'Review and resolve contradictory information. Ensure dates, numbers, and facts are consistent throughout the page.';
    case 'ambiguity':
      return 'Clarify ambiguous statements. Use explicit language and avoid vague references.';
    case 'inconsistency':
      return 'Standardize information presentation. Ensure consistent formatting and terminology.';
    default:
      return 'Review content for potential AI misunderstanding triggers.';
  }
}

function getImpactScore(trigger: HallucinationTrigger): number {
  const baseScores = {
    missing_fact: 25,
    contradiction: 40,
    ambiguity: 15,
    inconsistency: 20
  };
  
  const base = baseScores[trigger.type] || 20;
  const confidenceMultiplier = trigger.confidence;
  
  return Math.round(base * confidenceMultiplier);
}
