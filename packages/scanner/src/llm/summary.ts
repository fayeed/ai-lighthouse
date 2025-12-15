/**
 * AI-Readable Summaries
 * 
 * Generates optimized summaries for LLM ingestion plus metadata suggestions.
 * These summaries are designed to be easily consumed by AI agents and search engines.
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';

export interface AISummary {
  summaryShort: string;      // 2-3 sentences, optimized for LLM quick understanding
  summaryLong: string;       // 1-2 paragraphs, comprehensive overview
  suggestedTitle: string;    // SEO-optimized title
  suggestedMeta: string;     // Meta description (150-160 chars)
  keywords: string[];        // Key terms for indexing
  pageType?: string;         // Inferred page type (e.g., "Blog Post", "Product Page", "Documentation")
  readabilityScore?: number; // 0-100, how clear/accessible the content is
  structureQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Extract clean content for summarization
 */
function extractMainContent($: CheerioAPI): {
  title: string;
  headings: string[];
  paragraphs: string[];
  fullText: string;
} {
  // Remove noise
  $('script, style, noscript, svg, iframe, nav, footer, header, aside, .advertisement, .cookie-notice').remove();
  
  // Get title
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
  
  // Get headings
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 3) {
      headings.push(text);
    }
  });
  
  // Get paragraphs
  const paragraphs: string[] = [];
  const main = $('main').length > 0 ? $('main') : $('article').length > 0 ? $('article') : $('body');
  main.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20) { // Minimum meaningful length
      paragraphs.push(text);
    }
  });
  
  // Get full text (limited)
  const fullText = main.text()
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000); // Limit for LLM efficiency
  
  return { title, headings, paragraphs, fullText };
}

/**
 * Generate AI-readable summaries using LLM
 */
export async function generateAISummaries(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<AISummary> {
  const runner = new LLMRunner(config);
  const content = extractMainContent($);
  
  // Build context for LLM
  const context = `
URL: ${url}
Title: ${content.title}

Main Headings:
${content.headings.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Content Preview:
${content.fullText.substring(0, 4000)}
`.trim();

  const system = `You are an expert content analyst and SEO specialist. Your task is to create AI-readable summaries and metadata that:
1. Are clear, concise, and factually accurate
2. Optimized for LLM understanding and search engines
3. Capture the core value proposition
4. Use natural language that both humans and AI can parse

Focus on what the page is about, what value it provides, and who it's for.`;

  const user = `Analyze this web page and generate optimized summaries and metadata.

${context}

Provide your response in JSON format:
{
  "summaryShort": "2-3 sentence summary optimized for quick LLM ingestion",
  "summaryLong": "1-2 paragraph comprehensive overview covering main topics and value",
  "suggestedTitle": "SEO-optimized title (50-60 characters)",
  "suggestedMeta": "Meta description (150-160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "readabilityScore": 75,
  "structureQuality": "good"
}

Guidelines:
- summaryShort: Focus on WHAT the page is and WHO it's for
- summaryLong: Include key topics, benefits, and unique aspects
- suggestedTitle: Include primary keyword, be compelling
- suggestedMeta: Action-oriented, include value proposition
- keywords: 5-10 most relevant terms
- readabilityScore: 0-100 based on clarity and accessibility
- structureQuality: excellent/good/fair/poor based on content organization`;

  const response = await runner.callWithSystem(system, user, {
    temperature: 0.3, // Lower for consistent, factual output
    maxTokens: 1000
  });

  // Parse response
  try {
    const jsonMatch = response.content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response.content;
    const data = JSON.parse(jsonStr);
    
    return {
      summaryShort: data.summaryShort || '',
      summaryLong: data.summaryLong || '',
      suggestedTitle: data.suggestedTitle || content.title,
      suggestedMeta: data.suggestedMeta || '',
      keywords: data.keywords || [],
      readabilityScore: data.readabilityScore,
      structureQuality: data.structureQuality
    };
  } catch (error) {
    console.error('Failed to parse LLM summary response:', error);
    
    // Fallback: extract from unstructured response
    return {
      summaryShort: extractFirstSentences(response.content, 3),
      summaryLong: extractFirstSentences(response.content, 10),
      suggestedTitle: content.title,
      suggestedMeta: extractFirstSentences(response.content, 2).substring(0, 160),
      keywords: []
    };
  }
}

/**
 * Generate fast summaries without full metadata (cheaper/faster)
 */
export async function generateQuickAISummary(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<{ summaryShort: string; summaryLong: string; keywords: string[] }> {
  const runner = new LLMRunner(config);
  const content = extractMainContent($);
  
  const system = 'You are a content summarization expert. Create clear, concise summaries for AI agents.';
  
  const user = `Summarize this web page in two versions:
1. Short (2-3 sentences): Core topic and purpose
2. Long (1-2 paragraphs): Comprehensive overview

Title: ${content.title}
Content: ${content.fullText.substring(0, 3000)}

Also extract 5 key terms.

Respond in JSON:
{
  "summaryShort": "...",
  "summaryLong": "...",
  "keywords": ["term1", "term2", ...]
}`;

  const response = await runner.callWithSystem(system, user, {
    temperature: 0.3,
    maxTokens: 500
  });

  try {
    const jsonMatch = response.content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response.content;
    const data = JSON.parse(jsonStr);
    
    return {
      summaryShort: data.summaryShort || '',
      summaryLong: data.summaryLong || '',
      keywords: data.keywords || []
    };
  } catch (error) {
    console.error('Failed to parse quick summary:', error);
    return {
      summaryShort: extractFirstSentences(response.content, 3),
      summaryLong: extractFirstSentences(response.content, 10),
      keywords: []
    };
  }
}

/**
 * Generate summaries without LLM (heuristic-based)
 */
export function generateLocalAISummary($: CheerioAPI): Partial<AISummary> {
  const content = extractMainContent($);
  
  // Extract title
  const currentTitle = content.title;
  
  // Generate short summary from first paragraph
  const firstPara = content.paragraphs[0] || '';
  const summaryShort = firstPara.substring(0, 300).split('.').slice(0, 3).join('.').trim();
  
  // Generate long summary from first 3 paragraphs
  const summaryLong = content.paragraphs
    .slice(0, 3)
    .join(' ')
    .substring(0, 600)
    .trim();
  
  // Extract keywords from headings and content
  const keywords = extractKeywordsHeuristic(content.headings.join(' ') + ' ' + content.fullText);
  
  // Generate meta description
  const suggestedMeta = summaryShort.substring(0, 160);
  
  // Assess structure quality
  const structureQuality = assessStructureQuality($);
  
  // Basic readability score
  const readabilityScore = calculateReadabilityScore(content.fullText);
  
  return {
    summaryShort: summaryShort || 'No summary available.',
    summaryLong: summaryLong || 'No detailed summary available.',
    suggestedTitle: currentTitle,
    suggestedMeta,
    keywords: keywords.slice(0, 10),
    readabilityScore,
    structureQuality
  };
}

/**
 * Extract keywords using heuristic analysis
 */
function extractKeywordsHeuristic(text: string): string[] {
  // Common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'their', 'them', 'they', 'we', 'you'
  ]);
  
  // Extract words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequency
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top terms
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 15);
}

/**
 * Assess content structure quality
 */
function assessStructureQuality($: CheerioAPI): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 0;
  
  // Check for main content wrapper
  if ($('main').length > 0 || $('article').length > 0) score += 2;
  
  // Check for headings hierarchy
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  if (h1Count === 1 && h2Count > 0) score += 2;
  if (h1Count > 1) score -= 1; // Penalize multiple h1s
  
  // Check for paragraphs
  const pCount = $('p').length;
  if (pCount > 3) score += 1;
  if (pCount > 10) score += 1;
  
  // Check for lists
  if ($('ul, ol').length > 0) score += 1;
  
  // Check for semantic HTML
  if ($('section, article, aside, nav, header, footer').length > 2) score += 1;
  
  if (score >= 7) return 'excellent';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'poor';
}

/**
 * Calculate readability score (simplified Flesch reading ease)
 */
function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simplified Flesch score
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }
  
  return Math.max(1, count);
}

/**
 * Extract first N sentences from text
 */
function extractFirstSentences(text: string, count: number): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, count).join('. ').trim() + '.';
}
