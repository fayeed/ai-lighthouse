/**
 * LLM Mirror Test
 * 
 * Tests how AI interprets a page by asking "What does this page say the product does?"
 * Compares LLM interpretation against intended messaging from H1, meta tags, and structured data.
 * Identifies misunderstandings and messaging gaps that could confuse AI assistants.
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';

export interface IntendedMessaging {
  productName?: string;
  tagline?: string;
  description?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  pricing?: string;
  category?: string;
  source: 'h1' | 'meta' | 'schema' | 'hero';
}

export interface LLMInterpretation {
  productName?: string;
  purpose?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  pricing?: string;
  category?: string;
  confidence: number; // 0-1, how confident the LLM is in its interpretation
}

export interface Mismatch {
  field: string;
  intended: string;
  interpreted: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  recommendation: string;
  confidence: number; // 0-1, how confident we are this is a real mismatch
}

export interface MirrorReport {
  intendedMessaging: IntendedMessaging[];
  llmInterpretation: LLMInterpretation;
  mismatches: Mismatch[];
  summary: {
    totalMismatches: number;
    critical: number;
    major: number;
    minor: number;
    alignmentScore: number; // 0-100, how well intended matches interpreted
    clarityScore: number; // 0-100, how clear the messaging is
  };
  recommendations: string[];
}

/**
 * Extract intended messaging from structured sources
 */
function extractIntendedMessaging($: CheerioAPI): IntendedMessaging[] {
  const messaging: IntendedMessaging[] = [];
  
  // 1. From H1 and hero section
  const h1 = $('h1').first().text().trim();
  if (h1) {
    const heroSection = $('h1').first().closest('section, div[class*="hero"], header');
    const heroText = heroSection.find('p').first().text().trim();
    
    messaging.push({
      productName: h1,
      description: heroText || undefined,
      source: 'hero'
    });
  }
  
  // 2. From meta tags
  const metaTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  const metaDescription = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content');
  
  if (metaTitle || metaDescription) {
    messaging.push({
      productName: metaTitle,
      description: metaDescription,
      source: 'meta'
    });
  }
  
  // 3. From Schema.org structured data
  const schemas = $('script[type="application/ld+json"]');
  schemas.each((_, elem) => {
    try {
      const content = $(elem).html();
      if (!content) return;
      
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type'] === 'SoftwareApplication') {
          const schemaMsg: IntendedMessaging = {
            source: 'schema'
          };
          
          if (item.name) schemaMsg.productName = item.name;
          if (item.description) schemaMsg.description = item.description;
          if (item.category) schemaMsg.category = item.category;
          
          // Features from properties or offers
          if (item.features && Array.isArray(item.features)) {
            schemaMsg.keyFeatures = item.features;
          }
          
          // Pricing from offers
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            const prices = offers.map((o: any) => o.price).filter(Boolean);
            if (prices.length > 0) {
              schemaMsg.pricing = prices.join(', ');
            }
          }
          
          // Target audience
          if (item.audience?.audienceType) {
            schemaMsg.targetAudience = item.audience.audienceType;
          }
          
          messaging.push(schemaMsg);
        }
        
        // Organization schema might contain product info
        if (item['@type'] === 'Organization' && item.name) {
          messaging.push({
            productName: item.name,
            description: item.description,
            source: 'schema'
          });
        }
      }
    } catch (err) {
      // Ignore invalid JSON
    }
  });
  
  return messaging;
}

/**
 * Get LLM interpretation of the page
 */
async function getLLMInterpretation(
  $: CheerioAPI,
  llmConfig: LLMConfig
): Promise<LLMInterpretation> {
  const runner = new LLMRunner(llmConfig);
  
  // Extract main content for LLM analysis
  const clone = $.load($.html());
  
  // Remove non-content elements
  clone('script').remove();
  clone('style').remove();
  clone('noscript').remove();
  clone('svg').remove();
  clone('iframe').remove();
  clone('nav').remove();
  clone('footer').remove();
  clone('aside').remove();
  
  // Get main content
  let content = '';
  const main = clone('main, article, [role="main"]');
  if (main.length > 0) {
    content = main.text();
  } else {
    content = clone('body').text();
  }
  
  // Limit context size
  content = content.replace(/\s+/g, ' ').trim().slice(0, 3000);
  
  const pageTitle = $('title').text().trim();
  const h1 = $('h1').first().text().trim();
  
  const prompt = `You are analyzing a webpage to understand what an AI assistant would learn from it.

Page Title: ${pageTitle}
Main Heading: ${h1}

Page Content:
"""
${content}
"""

Answer these questions as if you're an AI assistant seeing this page for the first time:

1. What is the name of the product/service?
2. What is its main purpose? (1-2 sentences)
3. What are the key features or capabilities? (list 3-5)
4. Who is the target audience?
5. What is the pricing model? (if mentioned)
6. What category/industry is this in?
7. How confident are you in your understanding? (0.0-1.0)

Return ONLY valid JSON (no other text):
{
  "productName": "Name of product/service",
  "purpose": "What it does in 1-2 sentences",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "targetAudience": "Who should use this",
  "pricing": "Pricing model if mentioned, or null",
  "category": "Industry/category",
  "confidence": 0.85
}

IMPORTANT:
- Only include information explicitly stated on the page
- If something is unclear or not mentioned, use null
- Be honest about your confidence level
- Don't make assumptions or fill in gaps`;

  try {
    const response = await runner.callWithSystem(
      'You are an expert at analyzing web content and understanding product messaging. Be precise and only report what you can verify from the content.',
      prompt,
      {
        maxTokens: 1000,
        temperature: 0.2 // Low temperature for consistent interpretation
      }
    );
    
    const interpretation = JSON.parse(response.content);
    
    return {
      productName: interpretation.productName || undefined,
      purpose: interpretation.purpose || undefined,
      keyFeatures: interpretation.keyFeatures || undefined,
      targetAudience: interpretation.targetAudience || undefined,
      pricing: interpretation.pricing || undefined,
      category: interpretation.category || undefined,
      confidence: Math.min(1.0, interpretation.confidence || 0.5)
    };
  } catch (err) {
    console.error('LLM interpretation failed:', err);
    throw new Error(`Failed to get LLM interpretation: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Compare intended messaging with LLM interpretation
 */
function findMismatches(
  intended: IntendedMessaging[],
  interpreted: LLMInterpretation
): Mismatch[] {
  const mismatches: Mismatch[] = [];
  
  // Consolidate intended messaging (prefer schema > meta > hero)
  const consolidated: Partial<IntendedMessaging> = {};
  
  for (const msg of intended) {
    if (msg.productName && !consolidated.productName) {
      consolidated.productName = msg.productName;
    }
    if (msg.description && !consolidated.description) {
      consolidated.description = msg.description;
    }
    if (msg.keyFeatures && !consolidated.keyFeatures) {
      consolidated.keyFeatures = msg.keyFeatures;
    }
    if (msg.targetAudience && !consolidated.targetAudience) {
      consolidated.targetAudience = msg.targetAudience;
    }
    if (msg.pricing && !consolidated.pricing) {
      consolidated.pricing = msg.pricing;
    }
    if (msg.category && !consolidated.category) {
      consolidated.category = msg.category;
    }
  }
  
  // 1. Product name mismatch
  if (consolidated.productName && interpreted.productName) {
    const intended_lower = consolidated.productName.toLowerCase();
    const interpreted_lower = interpreted.productName.toLowerCase();
    
    // Check if names are significantly different (not just minor variations)
    if (!intended_lower.includes(interpreted_lower.split(/\s+/)[0]) &&
        !interpreted_lower.includes(intended_lower.split(/\s+/)[0])) {
      mismatches.push({
        field: 'productName',
        intended: consolidated.productName,
        interpreted: interpreted.productName,
        severity: 'critical',
        description: `AI interprets the product name as "${interpreted.productName}" but page metadata says "${consolidated.productName}"`,
        recommendation: 'Ensure H1, title tag, and meta tags consistently use the same product name. Add Schema.org Product markup with clear name.',
        confidence: 0.9
      });
    }
  } else if (consolidated.productName && !interpreted.productName) {
    mismatches.push({
      field: 'productName',
      intended: consolidated.productName,
      interpreted: 'Not identified',
      severity: 'critical',
      description: 'AI could not identify the product name from the page content',
      recommendation: 'Make the product name more prominent in H1, hero section, and opening paragraphs. Add Schema.org markup.',
      confidence: 0.85
    });
  }
  
  // 2. Purpose/description mismatch
  if (consolidated.description && interpreted.purpose) {
    const intendedWords = new Set(consolidated.description.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const interpretedWords = new Set(interpreted.purpose.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    
    // Calculate word overlap
    const overlap = [...intendedWords].filter(w => interpretedWords.has(w)).length;
    const similarity = overlap / Math.max(intendedWords.size, interpretedWords.size);
    
    if (similarity < 0.3) {
      mismatches.push({
        field: 'purpose',
        intended: consolidated.description,
        interpreted: interpreted.purpose,
        severity: 'major',
        description: `AI understands the purpose as "${interpreted.purpose}" which differs significantly from intended description "${consolidated.description}"`,
        recommendation: 'Clarify the main value proposition in the hero section and meta description. Use clear, simple language.',
        confidence: 0.8
      });
    }
  } else if (consolidated.description && !interpreted.purpose) {
    mismatches.push({
      field: 'purpose',
      intended: consolidated.description,
      interpreted: 'Unclear',
      severity: 'major',
      description: 'AI could not clearly understand what the product does',
      recommendation: 'Add a clear, concise description in the first paragraph. Start with "This is..." or "We help you...".',
      confidence: 0.75
    });
  }
  
  // 3. Target audience mismatch
  if (consolidated.targetAudience && interpreted.targetAudience) {
    const intended_lower = consolidated.targetAudience.toLowerCase();
    const interpreted_lower = interpreted.targetAudience.toLowerCase();
    
    if (!intended_lower.includes(interpreted_lower) && 
        !interpreted_lower.includes(intended_lower)) {
      mismatches.push({
        field: 'targetAudience',
        intended: consolidated.targetAudience,
        interpreted: interpreted.targetAudience,
        severity: 'major',
        description: `AI thinks target audience is "${interpreted.targetAudience}" but intended for "${consolidated.targetAudience}"`,
        recommendation: 'Explicitly state target audience early in the page. Use phrases like "For developers..." or "Perfect for teams...".',
        confidence: 0.7
      });
    }
  }
  
  // 4. Pricing mismatch
  if (consolidated.pricing && interpreted.pricing) {
    if (!interpreted.pricing.toLowerCase().includes('free') && 
        consolidated.pricing.toLowerCase().includes('free')) {
      mismatches.push({
        field: 'pricing',
        intended: consolidated.pricing,
        interpreted: interpreted.pricing,
        severity: 'major',
        description: `Product is free but AI interprets pricing as "${interpreted.pricing}"`,
        recommendation: 'Make "free" or "open source" messaging more prominent. Add pricing schema markup.',
        confidence: 0.8
      });
    }
  } else if (consolidated.pricing && !interpreted.pricing) {
    mismatches.push({
      field: 'pricing',
      intended: consolidated.pricing,
      interpreted: 'Not found',
      severity: 'minor',
      description: 'Pricing information not clear to AI',
      recommendation: 'Add clear pricing section or "Free" badge. Include Schema.org Offer markup.',
      confidence: 0.65
    });
  }
  
  // 5. Category mismatch
  if (consolidated.category && interpreted.category) {
    const intended_lower = consolidated.category.toLowerCase();
    const interpreted_lower = interpreted.category.toLowerCase();
    
    // Different categories might indicate confusion about what product does
    if (!intended_lower.includes(interpreted_lower) && 
        !interpreted_lower.includes(intended_lower)) {
      mismatches.push({
        field: 'category',
        intended: consolidated.category,
        interpreted: interpreted.category,
        severity: 'minor',
        description: `AI categorizes this as "${interpreted.category}" but schema says "${consolidated.category}"`,
        recommendation: 'Use consistent industry terms throughout the page. Add applicationCategory in Schema.org markup.',
        confidence: 0.6
      });
    }
  }
  
  return mismatches;
}

/**
 * Calculate alignment and clarity scores
 */
function calculateScores(
  mismatches: Mismatch[],
  interpreted: LLMInterpretation
): { alignmentScore: number; clarityScore: number } {
  // Alignment score: how well intended matches interpreted
  let alignmentScore = 100;
  
  for (const mismatch of mismatches) {
    if (mismatch.severity === 'critical') {
      alignmentScore -= 30 * mismatch.confidence;
    } else if (mismatch.severity === 'major') {
      alignmentScore -= 20 * mismatch.confidence;
    } else {
      alignmentScore -= 10 * mismatch.confidence;
    }
  }
  
  alignmentScore = Math.max(0, Math.min(100, alignmentScore));
  
  // Clarity score: based on LLM confidence and completeness
  let clarityScore = interpreted.confidence * 100;
  
  // Penalize missing information
  const fields = [
    interpreted.productName,
    interpreted.purpose,
    interpreted.keyFeatures,
    interpreted.targetAudience
  ];
  const completeness = fields.filter(Boolean).length / fields.length;
  clarityScore *= completeness;
  
  clarityScore = Math.max(0, Math.min(100, clarityScore));
  
  return { alignmentScore, clarityScore };
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(
  mismatches: Mismatch[],
  interpreted: LLMInterpretation,
  scores: { alignmentScore: number; clarityScore: number }
): string[] {
  const recommendations: string[] = [];
  
  // Add mismatch-specific recommendations
  for (const mismatch of mismatches) {
    if (!recommendations.includes(mismatch.recommendation)) {
      recommendations.push(mismatch.recommendation);
    }
  }
  
  // General recommendations based on scores
  if (scores.alignmentScore < 70) {
    recommendations.push('Review and align all messaging sources (H1, meta tags, schema markup) to use consistent terminology.');
  }
  
  if (scores.clarityScore < 60) {
    recommendations.push('Simplify and clarify the main value proposition in the hero section and first paragraph.');
  }
  
  if (interpreted.confidence < 0.6) {
    recommendations.push('Content may be ambiguous or unclear to AI. Use more direct, declarative statements about what the product does.');
  }
  
  if (!interpreted.productName) {
    recommendations.push('Add clear product name in H1 and Schema.org markup to help AI identify the product.');
  }
  
  if (!interpreted.purpose) {
    recommendations.push('Add a clear elevator pitch in the first 1-2 sentences explaining what the product does and who it\'s for.');
  }
  
  if (!interpreted.keyFeatures || interpreted.keyFeatures.length < 3) {
    recommendations.push('Make key features more prominent using bullet points or feature cards near the top of the page.');
  }
  
  return recommendations;
}

/**
 * Run the LLM Mirror Test
 * 
 * @param $ - Cheerio instance
 * @param llmConfig - LLM configuration
 * @returns Mirror test report with intended vs interpreted messaging
 */
export async function runMirrorTest(
  $: CheerioAPI,
  llmConfig: LLMConfig
): Promise<MirrorReport> {
  // 1. Extract intended messaging from structured sources
  const intendedMessaging = extractIntendedMessaging($);
  
  if (intendedMessaging.length === 0) {
    throw new Error('No intended messaging found. Page needs H1, meta tags, or Schema.org markup.');
  }
  
  // 2. Get LLM interpretation
  const llmInterpretation = await getLLMInterpretation($, llmConfig);
  
  // 3. Find mismatches
  const mismatches = findMismatches(intendedMessaging, llmInterpretation);
  
  // 4. Calculate scores
  const scores = calculateScores(mismatches, llmInterpretation);
  
  // 5. Generate recommendations
  const recommendations = generateRecommendations(mismatches, llmInterpretation, scores);
  
  // 6. Build summary
  const summary = {
    totalMismatches: mismatches.length,
    critical: mismatches.filter(m => m.severity === 'critical').length,
    major: mismatches.filter(m => m.severity === 'major').length,
    minor: mismatches.filter(m => m.severity === 'minor').length,
    alignmentScore: Math.round(scores.alignmentScore),
    clarityScore: Math.round(scores.clarityScore)
  };
  
  return {
    intendedMessaging,
    llmInterpretation,
    mismatches,
    summary,
    recommendations
  };
}

/**
 * Quick mirror test that returns just the alignment score
 */
export async function quickMirrorTest(
  $: CheerioAPI,
  llmConfig: LLMConfig
): Promise<number> {
  try {
    const report = await runMirrorTest($, llmConfig);
    return report.summary.alignmentScore;
  } catch (err) {
    console.error('Quick mirror test failed:', err);
    return 0;
  }
}
