/**
 * Unified LLM Analysis - Single-call content analysis
 *
 * Consolidates multiple LLM operations into a single call for:
 * - Reduced latency (1 call instead of 5)
 * - Lower token usage (shared context)
 * - Better coherence (single model understanding)
 *
 * Combines:
 * - Content comprehension (summary, page type, entities)
 * - SEO metadata suggestions
 * - Hallucination risk detection
 * - FAQ generation
 * - Key questions identification
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';
import { safeJSONParse } from './helpers.js';

export interface UnifiedAnalysisResult {
  // Comprehension
  summary: string;
  pageType: string;
  pageTypeInsights: string[];
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  technicalDepth: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  structureQuality: 'poor' | 'fair' | 'good' | 'excellent';
  readingLevel: {
    grade: number;
    description: string;
  };

  // Entities (top 5-7)
  topEntities: Array<{
    name: string;
    type: string;
    relevance: number;
  }>;

  // SEO
  suggestedTitle: string;
  suggestedMeta: string;
  keywords: string[];

  // Questions & FAQs
  questions: Array<{
    question: string;
    category: 'what' | 'why' | 'how' | 'when' | 'where' | 'who';
    difficulty: 'basic' | 'intermediate' | 'advanced';
  }>;
  suggestedFAQ: Array<{
    question: string;
    suggestedAnswer: string;
    importance: 'high' | 'medium' | 'low';
  }>;

  // Hallucination Risk
  hallucinationRisk: {
    score: number; // 0-100
    triggers: Array<{
      type: 'unverified_claim' | 'vague_statement' | 'missing_source' | 'inconsistency';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  };
}

/**
 * Sanitize HTML to reduce token usage
 * Removes unnecessary elements and extracts clean text
 */
export function sanitizeHtmlForLLM($: CheerioAPI): string {
  // Clone to avoid modifying original
  const clone = $.root().clone();
  const $clone = $.load(clone.html() || '');

  // Remove non-content elements
  $clone('script, style, noscript, svg, iframe, canvas, video, audio').remove();
  $clone('nav, footer, aside, [role="navigation"], [role="banner"], [role="complementary"]').remove();
  $clone('.nav, .menu, .sidebar, .footer, .header, .advertisement, .ad, .cookie-banner').remove();
  $clone('[aria-hidden="true"], [hidden]').remove();
  $clone('form, input, select, textarea, button').remove();
  $clone('img, picture, figure').remove(); // Remove images but keep figcaption
  $clone('link, meta').remove();

  // Get main content area
  let mainContent = $clone('main, article, [role="main"], .content, .main-content, #content, #main');
  if (mainContent.length === 0) {
    mainContent = $clone('body');
  }

  // Extract text with basic structure preservation
  let text = '';

  // Extract title
  const title = $clone('title').text().trim();
  if (title) {
    text += `Title: ${title}\n\n`;
  }

  // Extract meta description
  const metaDesc = $clone('meta[name="description"]').attr('content');
  if (metaDesc) {
    text += `Description: ${metaDesc}\n\n`;
  }

  // Extract headings and their content
  mainContent.find('h1, h2, h3, h4, h5, h6, p, li, td, blockquote, figcaption').each((_, el) => {
    const tagName = (el as any).tagName?.toLowerCase() || '';
    const elementText = $clone(el).text().trim();

    if (elementText.length > 5) {
      if (tagName.startsWith('h')) {
        const level = tagName.charAt(1);
        text += `${'#'.repeat(parseInt(level))} ${elementText}\n\n`;
      } else if (tagName === 'li') {
        text += `- ${elementText}\n`;
      } else {
        text += `${elementText}\n\n`;
      }
    }
  });

  // Clean up whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Limit to ~4000 tokens worth of content (~16000 chars)
  const maxLength = 12000;
  if (text.length > maxLength) {
    // Try to cut at a sentence boundary
    const cutPoint = text.lastIndexOf('.', maxLength);
    if (cutPoint > maxLength * 0.8) {
      text = text.substring(0, cutPoint + 1) + '\n\n[Content truncated...]';
    } else {
      text = text.substring(0, maxLength) + '\n\n[Content truncated...]';
    }
  }

  return text;
}

/**
 * Extract structured data for additional context
 */
function extractStructuredData($: CheerioAPI): string {
  const structuredData: string[] = [];

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        structuredData.push(`Schema.org: ${parsed['@type'] || 'Unknown type'}`);
      }
    } catch {
      // Ignore parse errors
    }
  });

  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogType = $('meta[property="og:type"]').attr('content');

  if (ogTitle || ogDesc || ogType) {
    structuredData.push(`OpenGraph: ${ogType || 'page'} - ${ogTitle || ''}`);
  }

  return structuredData.length > 0 ? `\nStructured Data: ${structuredData.join(', ')}` : '';
}

/**
 * Build the unified analysis prompt
 */
function buildUnifiedPrompt(content: string, url: string, structuredData: string): { system: string; user: string } {
  const system = `You are an expert content analyzer for AI systems and search engines.
Analyze web content to extract structured information that helps AI agents understand, index, and accurately represent the page.
Be concise, factual, and focus on extractable information. Avoid speculation.`;

  const user = `Analyze this webpage and provide a comprehensive structured analysis.

URL: ${url}
${structuredData}

CONTENT:
${content}

Provide analysis in JSON format:
{
  "summary": "2-3 sentence summary of main content and purpose",
  "pageType": "Homepage|Product Page|Blog Post|Documentation|Landing Page|FAQ|About Page|Contact Page|Pricing Page|Portfolio|Case Study|News Article|Tutorial|Guide|Service Page|Career Page|Other",
  "pageTypeInsights": ["3-5 specific recommendations for this page type to improve AI understanding"],
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "sentiment": "positive|neutral|negative",
  "technicalDepth": "beginner|intermediate|advanced|expert",
  "structureQuality": "poor|fair|good|excellent",
  "readingLevel": {"grade": 10, "description": "High school level"},

  "topEntities": [
    {"name": "Entity Name", "type": "Person|Organization|Product|Technology|Concept", "relevance": 0.9}
  ],

  "suggestedTitle": "SEO-optimized title (50-60 chars, include primary keyword)",
  "suggestedMeta": "Meta description (150-160 chars, action-oriented)",
  "keywords": ["primary-keyword", "secondary-keyword", "related-term"],

  "questions": [
    {"question": "What question would users ask?", "category": "what|why|how|when|where|who", "difficulty": "basic|intermediate|advanced"}
  ],
  "suggestedFAQ": [
    {"question": "Common question?", "suggestedAnswer": "Brief helpful answer", "importance": "high|medium|low"}
  ],

  "hallucinationRisk": {
    "score": 25,
    "triggers": [
      {"type": "unverified_claim|vague_statement|missing_source|inconsistency", "description": "Specific issue", "severity": "low|medium|high|critical"}
    ],
    "recommendations": ["Specific improvement to reduce AI hallucination risk"]
  }
}

Guidelines:
- topEntities: Only 5-7 most important entities central to understanding
- questions: 3-5 questions users would actually ask
- suggestedFAQ: 2-3 high-value FAQs that the page should answer
- hallucinationRisk.triggers: Only flag real issues (vague claims, missing sources, unverifiable statements)
- hallucinationRisk.score: 0-100 where 0=no risk, 100=high risk of AI misrepresenting content`;

  return { system, user };
}

/**
 * Run unified LLM analysis - single call for all content understanding
 */
export async function runUnifiedAnalysis(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<UnifiedAnalysisResult> {
  const runner = new LLMRunner(config);

  // Sanitize and extract content
  const content = sanitizeHtmlForLLM($);
  const structuredData = extractStructuredData($);

  // Build prompt
  const { system, user } = buildUnifiedPrompt(content, url, structuredData);

  // Single LLM call
  const response = await runner.callWithSystem(system, user, {
    temperature: 0.3,
    maxTokens: 2500
  });

  const result = safeJSONParse<UnifiedAnalysisResult>(response.content, 'unified analysis');

  if (!result) {
    throw new Error('Failed to parse unified analysis response from LLM');
  }

  // Ensure all required fields have defaults
  return {
    summary: result.summary || 'Summary not available',
    pageType: result.pageType || 'Other',
    pageTypeInsights: Array.isArray(result.pageTypeInsights)
      ? result.pageTypeInsights.filter((i): i is string => typeof i === 'string')
      : [],
    keyTopics: result.keyTopics || [],
    sentiment: result.sentiment || 'neutral',
    technicalDepth: result.technicalDepth || 'intermediate',
    structureQuality: result.structureQuality || 'fair',
    readingLevel: result.readingLevel || { grade: 8, description: 'Middle school level' },
    topEntities: result.topEntities || [],
    suggestedTitle: result.suggestedTitle || '',
    suggestedMeta: result.suggestedMeta || '',
    keywords: result.keywords || [],
    questions: result.questions || [],
    suggestedFAQ: result.suggestedFAQ || [],
    hallucinationRisk: result.hallucinationRisk || {
      score: 0,
      triggers: [],
      recommendations: []
    }
  };
}

/**
 * Quick analysis for non-LLM mode (heuristic-based)
 */
export function runQuickAnalysis($: CheerioAPI, url: string): Partial<UnifiedAnalysisResult> {
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').first().text().trim();

  // Simple page type detection
  const urlLower = url.toLowerCase();
  let pageType = 'Other';
  if (urlLower.includes('/blog') || urlLower.includes('/post')) pageType = 'Blog Post';
  else if (urlLower.includes('/docs') || urlLower.includes('/documentation')) pageType = 'Documentation';
  else if (urlLower.includes('/pricing')) pageType = 'Pricing Page';
  else if (urlLower.includes('/about')) pageType = 'About Page';
  else if (urlLower.includes('/contact')) pageType = 'Contact Page';
  else if (urlLower === new URL(url).origin + '/' || urlLower === new URL(url).origin) pageType = 'Homepage';

  // Extract basic topics from headings
  const keyTopics: string[] = [];
  $('h1, h2, h3').slice(0, 5).each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 50) {
      keyTopics.push(text);
    }
  });

  // Simple reading level estimate based on content length
  const bodyText = $('body').text();
  const wordCount = bodyText.split(/\s+/).length;
  const avgWordLength = bodyText.length / Math.max(wordCount, 1);

  // --- Heuristic entity extraction ---
  const topEntities = extractEntitiesHeuristic($, url);

  // --- Heuristic FAQ and question extraction ---
  const { questions, suggestedFAQ } = extractFAQsHeuristic($);

  return {
    summary: metaDesc || h1 || title || 'No summary available',
    pageType,
    pageTypeInsights: ['Enable AI analysis for page-specific recommendations'],
    keyTopics: keyTopics.slice(0, 5),
    topEntities,
    sentiment: 'neutral',
    technicalDepth: avgWordLength > 6 ? 'intermediate' : 'beginner',
    structureQuality: $('h1').length > 0 && $('h2').length > 0 ? 'good' : 'fair',
    readingLevel: {
      grade: Math.round(avgWordLength * 1.5),
      description: avgWordLength > 6 ? 'Intermediate level' : 'Easy to read'
    },
    suggestedTitle: title,
    suggestedMeta: metaDesc,
    keywords: [],
    questions,
    suggestedFAQ,
    hallucinationRisk: {
      score: 50,
      triggers: [],
      recommendations: ['Enable LLM analysis for detailed hallucination risk assessment']
    }
  };
}

/**
 * Heuristic entity extraction from HTML content
 * Extracts entities from schema.org JSON-LD, meta tags, and prominent text
 */
function extractEntitiesHeuristic($: CheerioAPI, url: string): UnifiedAnalysisResult['topEntities'] {
  const entities: Array<{ name: string; type: string; relevance: number }> = [];
  const seen = new Set<string>();

  const addEntity = (name: string, type: string, relevance: number) => {
    const key = name.toLowerCase();
    if (seen.has(key) || !name || name.length < 2 || name.length > 100) return;
    seen.add(key);
    entities.push({ name, type, relevance });
  };

  // 1. Extract from JSON-LD schema.org
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item.name) addEntity(item.name, item['@type'] || 'thing', 0.9);
        if (item.author?.name) addEntity(item.author.name, 'person', 0.8);
        if (item.publisher?.name) addEntity(item.publisher.name, 'organization', 0.8);
        if (item.brand?.name) addEntity(item.brand.name, 'organization', 0.7);
        if (item.about?.name) addEntity(item.about.name, 'topic', 0.7);
      }
    } catch { /* ignore invalid JSON-LD */ }
  });

  // 2. Extract from Open Graph / meta tags
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName) addEntity(ogSiteName, 'organization', 0.85);

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const articleAuthor = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');
  if (articleAuthor) addEntity(articleAuthor, 'person', 0.8);

  // 3. Extract from hostname as brand/org
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const brandName = hostname.split('.')[0];
    if (brandName && brandName.length > 2) {
      addEntity(brandName.charAt(0).toUpperCase() + brandName.slice(1), 'organization', 0.6);
    }
  } catch { /* ignore */ }

  // 4. Extract from prominent text (strong/bold tags in main content)
  $('main strong, article strong, main b, article b').slice(0, 10).each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length >= 2 && text.length <= 50 && !text.includes('\n')) {
      addEntity(text, 'topic', 0.5);
    }
  });

  return entities.slice(0, 7);
}

/**
 * Heuristic FAQ and question extraction from HTML content
 * Extracts from FAQ schema, question headings, and generates from heading content
 */
function extractFAQsHeuristic($: CheerioAPI): {
  questions: UnifiedAnalysisResult['questions'];
  suggestedFAQ: UnifiedAnalysisResult['suggestedFAQ'];
} {
  const suggestedFAQ: UnifiedAnalysisResult['suggestedFAQ'] = [];
  const questions: UnifiedAnalysisResult['questions'] = [];
  const seenQuestions = new Set<string>();

  // 1. Extract from FAQPage JSON-LD schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'FAQPage' && item.mainEntity) {
          const faqEntities = Array.isArray(item.mainEntity) ? item.mainEntity : [item.mainEntity];
          for (const faq of faqEntities) {
            if (faq.name && faq.acceptedAnswer?.text) {
              const q = faq.name.trim();
              if (seenQuestions.has(q.toLowerCase())) continue;
              seenQuestions.add(q.toLowerCase());
              suggestedFAQ.push({
                question: q,
                suggestedAnswer: faq.acceptedAnswer.text.trim().slice(0, 300),
                importance: 'high' as const,
              });
            }
          }
        }
      }
    } catch { /* ignore invalid JSON-LD */ }
  });

  // 2. Extract from question-style headings (h2, h3, h4)
  const questionPatterns = [
    /^what\s/i, /^how\s/i, /^why\s/i, /^when\s/i, /^where\s/i, /^who\s/i,
    /^is\s/i, /^are\s/i, /^can\s/i, /^does\s/i, /^do\s/i, /^should\s/i,
    /\?$/
  ];

  $('h2, h3, h4').each((_, el) => {
    const text = $(el).text().trim();
    if (!text || text.length > 120) return;

    const isQuestion = questionPatterns.some(p => p.test(text));
    if (!isQuestion) return;
    if (seenQuestions.has(text.toLowerCase())) return;
    seenQuestions.add(text.toLowerCase());

    // Get the answer from the next sibling paragraph
    const nextP = $(el).next('p').text().trim();

    // Determine category from question text
    let category: 'what' | 'why' | 'how' | 'when' | 'where' | 'who' = 'what';
    if (/^how\s/i.test(text)) category = 'how';
    else if (/^why\s/i.test(text)) category = 'why';
    else if (/^when\s/i.test(text)) category = 'when';
    else if (/^where\s/i.test(text)) category = 'where';
    else if (/^who\s/i.test(text)) category = 'who';

    questions.push({
      question: text,
      category,
      difficulty: 'basic',
    });

    if (nextP && nextP.length >= 20) {
      suggestedFAQ.push({
        question: text,
        suggestedAnswer: nextP.slice(0, 300),
        importance: nextP.length >= 50 ? 'medium' as const : 'low' as const,
      });
    }
  });

  // 3. Generate implied questions from non-question headings
  if (questions.length < 3) {
    $('h2, h3').each((_, el) => {
      if (questions.length >= 6) return;
      const text = $(el).text().trim();
      if (!text || text.length > 80 || text.length < 5) return;
      if (seenQuestions.has(text.toLowerCase())) return;

      // Skip headings that are already questions
      if (questionPatterns.some(p => p.test(text))) return;

      // Generate a "What is" or "What about" question
      const generatedQ = `What is ${text.toLowerCase()}?`;
      if (seenQuestions.has(generatedQ.toLowerCase())) return;
      seenQuestions.add(generatedQ.toLowerCase());

      const nextP = $(el).next('p').text().trim();
      if (nextP && nextP.length >= 30) {
        questions.push({
          question: generatedQ,
          category: 'what',
          difficulty: 'basic',
        });
        suggestedFAQ.push({
          question: generatedQ,
          suggestedAnswer: nextP.slice(0, 300),
          importance: 'low' as const,
        });
      }
    });
  }

  return {
    questions: questions.slice(0, 8),
    suggestedFAQ: suggestedFAQ.slice(0, 6),
  };
}
