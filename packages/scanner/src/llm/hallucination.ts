/**
 * Hallucination Detection - AI Misunderstanding Reports
 * 
 * Detects potential hallucination triggers by:
 * 1. Using LLM to extract factual claims from webpage content
 * 2. LLM verifies each claim against its own training data knowledge
 * 3. Unverified claims = high risk (LLM will likely hallucinate or misrepresent)
 * 4. Contradicting claims = critical risk (LLM will provide incorrect information)
 * 5. Detecting internal contradictions (inconsistent dates/numbers on same page)
 * 
 * Key insight: Claims unknown to LLM are at highest risk for hallucination.
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';
import { safeJSONParse } from './helpers.js';
import { SEVERITY, CATEGORY, Issue } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExtractedFact {
  id: string;
  statement: string;
  category: 'date' | 'number' | 'name' | 'location' | 'concept' | 'relationship' | 'vague' | 'missing_detail' | 'unsupported_claim' | 'ambiguous';
  confidence: number; // 0-1
  sourceContext?: string; // Risk description or context
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
 * Extract claims and verify them using LLM in one step
 */
async function extractAndVerifyClaims(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<FactVerification[]> {
  const runner = new LLMRunner(config);
  
  // Get main content, skip navigation
  const mainContent = $('main, article, [role="main"]').length > 0 
    ? $('main, article, [role="main"]')
    : $('body');
  
  const contentCopy = mainContent.clone();
  contentCopy.find('nav, header, footer, aside, [role="navigation"], [role="banner"], .nav, .menu, .sidebar').remove();
  
  const content = contentCopy.text().replace(/\s+/g, ' ').trim().substring(0, 6000);
  
  const system = `You are a fact-checking expert. Your task is to:
1. Extract 8-12 key factual claims from the content (dates, numbers, statistics, company facts, product details)
2. For each claim, determine if you already know it from your training data

Focus on:
- Specific dates, founding years, launch dates
- Quantitative metrics (percentages, numbers, user counts, performance stats)
- Product/company names and their key facts
- Technical specifications
- Verifiable achievements or milestones

IGNORE:
- Navigation menu items
- Generic UI text
- Vague marketing claims without specifics
- Opinions or subjective statements`;

  const user = `Extract factual claims from this webpage and verify if you already know them:

URL: ${url}
Content: ${content}

For each claim, check YOUR TRAINING DATA ONLY (do not just repeat what's on the page):
- "verified": You independently know this fact is true from your training
- "unverified": You don't have this information in your training data, or cannot confirm it
- "contradicts": This conflicts with what you know

Respond in JSON format:
{
  "claims": [
    {
      "statement": "The specific factual claim extracted",
      "category": "date|number|name|metric|location",
      "verification": "verified|unverified|contradicts",
      "explanation": "What you know (or don't know) about this from your training data",
      "confidence": 0.8
    }
  ]
}

Extract 8-12 of the most important, verifiable claims.`;

  const response = await runner.callWithSystem(system, user, {
    temperature: 0.1,
    maxTokens: 2500
  });

  try {
    const data = safeJSONParse(response.content, 'LLM claim extraction and verification');
    
    return data.claims.map((c: any) => {
      const fact: ExtractedFact = {
        id: uuidv4(),
        statement: c.statement,
        category: c.category,
        confidence: c.confidence || 0.7,
        sourceContext: c.explanation
      };
      
      const isVerified = c.verification === 'verified';
      const hasContradiction = c.verification === 'contradicts';
      
      return {
        fact,
        verified: isVerified,
        evidence: {
          found: true,
          textSnippet: c.explanation,
          similarity: isVerified ? 1.0 : 0.0
        },
        contradictions: hasContradiction ? [{
          conflictingStatement: c.explanation,
          selector: 'llm-knowledge',
          textSnippet: c.explanation
        }] : []
      };
    });
  } catch (error) {
    console.error('Failed to parse LLM claim extraction:', error);
    return [];
  }
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
  
  // If LLM config provided, extract and verify claims in one step
  if (config) {
    try {
      // LLM extracts claims AND verifies them against its knowledge
      verifications = await extractAndVerifyClaims($, url, config);
      facts = verifications.map(v => v.fact);

      // Separate by verification status
      const verifiedFacts = verifications.filter(v => v.verified);
      const unverifiedFacts = verifications.filter(v => !v.verified && (!v.contradictions || v.contradictions.length === 0));
      const contradictedFacts = verifications.filter(v => v.contradictions && v.contradictions.length > 0);
      
      // Add trigger for unverified facts
      if (unverifiedFacts.length > 0) {
        triggers.push({
          type: 'missing_fact',
          severity: unverifiedFacts.length > 6 ? SEVERITY.CRITICAL : unverifiedFacts.length > 3 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
          description: `Found ${unverifiedFacts.length} claim${unverifiedFacts.length === 1 ? '' : 's'} that AI cannot verify from training data. High risk of hallucination when AI systems reference this content.`,
          facts: unverifiedFacts.map(v => v.fact),
          verifications: unverifiedFacts,
          evidence: unverifiedFacts.map(v => `"${v.fact.statement}" - ${v.evidence.textSnippet}`),
          confidence: unverifiedFacts.reduce((sum, v) => sum + v.fact.confidence, 0) / unverifiedFacts.length
        });
      }
      
      // Add trigger for contradictions
      if (contradictedFacts.length > 0) {
        triggers.push({
          type: 'contradiction',
          severity: SEVERITY.CRITICAL,
          description: `Found ${contradictedFacts.length} claim${contradictedFacts.length === 1 ? '' : 's'} that contradict AI's training data. AI will likely provide incorrect information.`,
          facts: contradictedFacts.map(v => v.fact),
          verifications: contradictedFacts,
          evidence: contradictedFacts.map(v => `"${v.fact.statement}" - CONFLICT: ${v.evidence.textSnippet}`),
          confidence: contradictedFacts.reduce((sum, v) => sum + v.fact.confidence, 0) / contradictedFacts.length
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
  const unverifiedFacts = verifications.filter(v => !v.verified && (!v.contradictions || v.contradictions.length === 0)).length;
  const contradictions = verifications.filter(v => v.contradictions && v.contradictions.length > 0).length + localTriggers.filter(t => t.type === 'contradiction').length;
  const ambiguities = 0;
  
  // Calculate hallucination risk score
  let riskScore = 0;
  riskScore += unverifiedFacts * 7; // Unknown facts
  riskScore += contradictions * 25; // Contradictions are very serious
  riskScore += localTriggers.length * 10; // Local contradictions
  riskScore = Math.min(riskScore, 100);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (unverifiedFacts > 0) {
    recommendations.push(`${unverifiedFacts} claim${unverifiedFacts === 1 ? '' : 's'} unverifiable by AI - expect potential hallucinations or inaccuracies when AI references your content`);
  }
  if (contradictions > 0) {
    recommendations.push(`${contradictions} contradiction${contradictions === 1 ? '' : 's'} detected - AI will likely provide conflicting or incorrect information`);
  }
  if (verifiedFacts > 0) {
    recommendations.push(`${verifiedFacts} claim${verifiedFacts === 1 ? '' : 's'} verified by AI knowledge - lower hallucination risk for these facts`);
  }
  if (localTriggers.length > 0) {
    recommendations.push(`Review ${localTriggers.length} internal inconsistenc${localTriggers.length === 1 ? 'y' : 'ies'} in dates/numbers`);
  }
  if (riskScore > 60) {
    recommendations.push('High hallucination risk - AI systems may significantly misrepresent your content');
  } else if (riskScore < 20) {
    recommendations.push('Low hallucination risk - content is verifiable and internally consistent');
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
      return 'These facts are not in LLM training data. When AI systems reference your content, they may hallucinate details or provide outdated information. Consider adding context that connects to well-known facts, or expect AI-generated summaries to be less accurate.';
    case 'contradiction':
      return 'Review and resolve contradictory information. Ensure dates, numbers, and facts are consistent throughout the page to prevent AI confusion.';
    case 'ambiguity':
      return 'Clarify ambiguous statements with specific details. AI systems may fill in missing information with plausible but incorrect guesses.';
    case 'inconsistency':
      return 'Standardize information presentation. Ensure consistent formatting and terminology throughout the page.';
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
