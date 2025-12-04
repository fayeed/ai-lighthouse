/**
 * FAQ Generation
 * 
 * Generates suggested FAQ entries that a page should answer.
 * Uses LLM for intelligent Q&A extraction when available,
 * falls back to heuristic extraction of question patterns.
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';

export interface FAQEntry {
  question: string;
  suggestedAnswer: string;
  importance: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  source: 'llm' | 'heuristic' | 'schema';
}

export interface FAQResult {
  faqs: FAQEntry[];
  summary: {
    totalFAQs: number;
    byImportance: {
      high: number;
      medium: number;
      low: number;
    };
    averageConfidence: number;
  };
}

/**
 * Extract clean text content from HTML
 */
function extractTextContent($: CheerioAPI): string {
  const clone = $.load($.html());
  
  // Remove non-content elements
  clone('script').remove();
  clone('style').remove();
  clone('noscript').remove();
  clone('svg').remove();
  clone('iframe').remove();
  clone('nav').remove();
  clone('header').remove();
  clone('footer').remove();
  clone('aside').remove();
  
  // Get main content
  const main = clone('main, article, [role="main"]');
  if (main.length > 0) {
    return main.text();
  }
  
  const body = clone('body');
  if (body.length > 0) {
    return body.text();
  }
  
  return clone.root().text();
}

/**
 * Extract FAQs using LLM
 */
async function generateFAQsWithLLM(
  text: string,
  pageTitle: string,
  llmConfig: LLMConfig
): Promise<FAQEntry[]> {
  const runner = new LLMRunner(llmConfig);
  
  // Limit context size
  const context = text.slice(0, 4000);
  
  const prompt = `Analyze this webpage content and generate a list of FAQ (Frequently Asked Questions) that this page should answer.

Page Title: ${pageTitle}

Content:
"""
${context}
"""

Generate 5-10 FAQ items that:
1. Address the most important questions visitors would have
2. Can be answered from the content provided
3. Cover different aspects (what, why, how, when, pricing, features, etc.)
4. Are ranked by importance (high/medium/low)

For each FAQ, provide:
- question: Clear, specific question a visitor would ask
- suggestedAnswer: Concise answer (2-3 sentences) based on the content
- importance: "high" (critical info), "medium" (useful), or "low" (nice to have)
- confidence: 0.0-1.0 (how confident you are the answer is accurate)

Return ONLY a JSON array (no other text):
[
  {
    "question": "What is this product/service?",
    "suggestedAnswer": "Brief answer based on content...",
    "importance": "high",
    "confidence": 0.95
  }
]

Guidelines:
- Prioritize questions about: purpose, features, pricing, how to use, benefits, requirements
- Use natural language (how people actually ask)
- Keep questions specific and actionable
- Answers should be clear and factual
- Only include if you can answer from the content
- Avoid yes/no questions (prefer "What/How/Why")`;

  try {
    const response = await runner.callWithSystem(
      'You are an expert at understanding user intent and creating helpful FAQ sections. Generate accurate, useful FAQ items.',
      prompt,
      {
        maxTokens: 2000,
        temperature: 0.3
      }
    );
    
    const llmFAQs = JSON.parse(response.content);
    
    if (!Array.isArray(llmFAQs)) {
      console.error('LLM returned non-array FAQ response');
      return [];
    }
    
    const faqs: FAQEntry[] = [];
    
    for (const item of llmFAQs) {
      if (!item.question || !item.suggestedAnswer) {
        continue;
      }
      
      faqs.push({
        question: item.question,
        suggestedAnswer: item.suggestedAnswer,
        importance: item.importance || 'medium',
        confidence: Math.min(1.0, item.confidence || 0.8),
        source: 'llm'
      });
    }
    
    return faqs;
  } catch (err) {
    console.error('LLM FAQ generation failed:', err);
    return [];
  }
}

/**
 * Extract FAQs using heuristics (non-LLM fallback)
 * Looks for:
 * - Question-like headings (H2, H3 starting with question words)
 * - Existing FAQ schema markup
 * - Common question patterns in text
 */
function generateFAQsHeuristic($: CheerioAPI): FAQEntry[] {
  const faqs: FAQEntry[] = [];
  const seen = new Set<string>();
  
  // 1. Extract from FAQ schema markup
  const faqSchemas = $('script[type="application/ld+json"]');
  faqSchemas.each((_, elem) => {
    try {
      const content = $(elem).html();
      if (!content) return;
      
      const data = JSON.parse(content);
      const schemas = Array.isArray(data) ? data : [data];
      
      for (const schema of schemas) {
        if (schema['@type'] === 'FAQPage' && Array.isArray(schema.mainEntity)) {
          for (const entity of schema.mainEntity) {
            if (entity['@type'] === 'Question' && entity.name) {
              const question = entity.name;
              const answer = entity.acceptedAnswer?.text || entity.acceptedAnswer?.name || '';
              
              const key = question.toLowerCase();
              if (!seen.has(key) && answer) {
                seen.add(key);
                faqs.push({
                  question,
                  suggestedAnswer: answer.slice(0, 300), // Limit length
                  importance: 'high', // Schema FAQs are intentional
                  confidence: 1.0,
                  source: 'schema'
                });
              }
            }
          }
        }
      }
    } catch (err) {
      // Ignore invalid JSON
    }
  });
  
  // 2. Extract question-like headings
  const questionWords = /^(what|why|how|when|where|who|which|can|should|is|are|do|does|will|would|could)\b/i;
  
  $('h2, h3, h4').each((_, elem) => {
    const heading = $(elem).text().trim();
    
    // Must be a question (ends with ?) or starts with question word
    if (heading.endsWith('?') || questionWords.test(heading)) {
      const key = heading.toLowerCase();
      
      if (!seen.has(key) && heading.length >= 10 && heading.length <= 200) {
        seen.add(key);
        
        // Try to find answer in next sibling paragraph
        let answer = '';
        const nextP = $(elem).next('p');
        if (nextP.length > 0) {
          answer = nextP.text().trim().slice(0, 300);
        }
        
        // If no answer, try next few elements
        if (!answer) {
          const nextElements = $(elem).nextUntil('h2, h3, h4').slice(0, 2);
          answer = nextElements.text().trim().slice(0, 300);
        }
        
        if (answer && answer.length >= 20) {
          faqs.push({
            question: heading.endsWith('?') ? heading : heading + '?',
            suggestedAnswer: answer,
            importance: 'medium',
            confidence: 0.7,
            source: 'heuristic'
          });
        }
      }
    }
  });
  
  // 3. Extract common question patterns from text
  const text = extractTextContent($);
  const questionPatterns = [
    /(?:^|\n)([A-Z][^.!?]*(?:what|why|how|when|where|who)[^.!?]*\?)/gi,
    /(?:^|\n)((?:What|Why|How|When|Where|Who|Can|Should|Is|Are|Do|Does|Will)[^.!?]{10,150}\?)/g
  ];
  
  for (const pattern of questionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const question = match[1].trim();
      const key = question.toLowerCase();
      
      if (!seen.has(key) && question.length >= 15 && question.length <= 200) {
        seen.add(key);
        
        // Try to find answer in text after question
        const afterQuestion = text.slice(match.index + question.length, match.index + question.length + 500);
        const sentences = afterQuestion.split(/[.!?]+/).slice(0, 3);
        const answer = sentences.join('. ').trim();
        
        if (answer && answer.length >= 30) {
          faqs.push({
            question,
            suggestedAnswer: answer.slice(0, 300),
            importance: 'low',
            confidence: 0.5,
            source: 'heuristic'
          });
        }
      }
    }
  }
  
  // 4. Generate common questions based on page structure
  const hasHero = $('h1').length > 0;
  const hasPricing = $('[class*="price"], [id*="price"], [class*="pricing"], [id*="pricing"]').length > 0;
  const hasFeatures = $('[class*="feature"], [id*="feature"]').length > 0;
  const hasContact = $('[class*="contact"], [id*="contact"], a[href^="mailto:"], a[href^="tel:"]').length > 0;
  
  const title = $('h1').first().text().trim() || $('title').text().trim();
  const productName = title.split(/[-–—|]/)[0].trim();
  
  // Generate contextual questions based on what's on the page
  if (hasHero && productName && !seen.has('what is ' + productName.toLowerCase())) {
    const firstP = $('h1').first().nextAll('p').first().text().trim();
    if (firstP && firstP.length > 50) {
      faqs.push({
        question: `What is ${productName}?`,
        suggestedAnswer: firstP.slice(0, 300),
        importance: 'high',
        confidence: 0.6,
        source: 'heuristic'
      });
    }
  }
  
  if (hasPricing && !seen.has('pricing')) {
    faqs.push({
      question: 'How much does it cost?',
      suggestedAnswer: 'Pricing information is available on this page. Please refer to the pricing section for detailed cost information.',
      importance: 'high',
      confidence: 0.5,
      source: 'heuristic'
    });
  }
  
  if (hasFeatures && !seen.has('features')) {
    const featureList = $('[class*="feature"]').first().text().trim();
    if (featureList && featureList.length > 50) {
      faqs.push({
        question: 'What are the key features?',
        suggestedAnswer: featureList.slice(0, 300),
        importance: 'medium',
        confidence: 0.6,
        source: 'heuristic'
      });
    }
  }
  
  if (hasContact && !seen.has('contact')) {
    const email = $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '');
    const phone = $('a[href^="tel:"]').first().text().trim();
    
    if (email || phone) {
      const contactInfo = [email, phone].filter(Boolean).join(' or ');
      faqs.push({
        question: 'How can I get in touch?',
        suggestedAnswer: `You can contact us at ${contactInfo}`,
        importance: 'medium',
        confidence: 0.7,
        source: 'heuristic'
      });
    }
  }
  
  return faqs;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(faqs: FAQEntry[]): FAQResult['summary'] {
  const byImportance = {
    high: faqs.filter(f => f.importance === 'high').length,
    medium: faqs.filter(f => f.importance === 'medium').length,
    low: faqs.filter(f => f.importance === 'low').length
  };
  
  const averageConfidence = faqs.length > 0
    ? faqs.reduce((sum, f) => sum + f.confidence, 0) / faqs.length
    : 0;
  
  return {
    totalFAQs: faqs.length,
    byImportance,
    averageConfidence
  };
}

/**
 * Generate FAQ suggestions for a page
 * 
 * @param $ - Cheerio instance
 * @param options - Generation options
 * @returns FAQ result with entries and summary
 */
export async function generateFAQs(
  $: CheerioAPI,
  options?: {
    enableLLM?: boolean;
    llmConfig?: LLMConfig;
    maxFAQs?: number;
  }
): Promise<FAQResult> {
  let faqs: FAQEntry[] = [];
  
  const pageTitle = $('title').text().trim() || $('h1').first().text().trim();
  const text = extractTextContent($);
  
  // 1. Try LLM generation first if enabled
  if (options?.enableLLM && options.llmConfig) {
    try {
      const llmFAQs = await generateFAQsWithLLM(text, pageTitle, options.llmConfig);
      faqs.push(...llmFAQs);
    } catch (error) {
      console.error('LLM FAQ generation failed, falling back to heuristics:', error);
    }
  }
  
  // 2. Always run heuristic extraction (can find schema FAQs, question headings)
  const heuristicFAQs = generateFAQsHeuristic($);
  
  // Merge: deduplicate by question text (case-insensitive)
  const faqMap = new Map<string, FAQEntry>();
  
  // Add LLM FAQs first (higher priority)
  for (const faq of faqs) {
    const key = faq.question.toLowerCase().trim();
    faqMap.set(key, faq);
  }
  
  // Add heuristic FAQs if not already present
  for (const faq of heuristicFAQs) {
    const key = faq.question.toLowerCase().trim();
    if (!faqMap.has(key)) {
      faqMap.set(key, faq);
    } else {
      // If LLM and heuristic found same question, boost confidence
      const existing = faqMap.get(key)!;
      existing.confidence = Math.min(1.0, (existing.confidence + faq.confidence) / 2);
    }
  }
  
  faqs = Array.from(faqMap.values());
  
  // 3. Sort by importance and confidence
  faqs.sort((a, b) => {
    // Sort by importance first
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
    if (importanceDiff !== 0) return importanceDiff;
    
    // Then by confidence
    return b.confidence - a.confidence;
  });
  
  // 4. Limit number of FAQs
  if (options?.maxFAQs) {
    faqs = faqs.slice(0, options.maxFAQs);
  }
  
  const summary = calculateSummary(faqs);
  
  return {
    faqs,
    summary
  };
}

/**
 * Generate FAQs quickly without LLM (heuristic-only)
 */
export async function generateFAQsQuick($: CheerioAPI): Promise<FAQResult> {
  return generateFAQs($, { enableLLM: false });
}
