/**
 * LLM Comprehension - Generate AI-readable summaries and insights
 * 
 * ARCHITECTURE NOTE:
 * This module provides quick high-level overview in 2 LLM calls.
 * For detailed extraction with confidence scores, locators, and metadata:
 * - Use entities.ts for comprehensive entity extraction
 * - Use faq.ts for comprehensive FAQ generation
 * 
 * This keeps comprehension fast and focused on understanding the content,
 * while dedicated modules provide detailed structured data.
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';
import { safeJSONParse } from './helpers.js';

export interface Question {
  question: string;
  category: 'what' | 'why' | 'how' | 'when' | 'where' | 'who';
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface LLMComprehension {
  summary: string;
  pageType?: string;
  pageTypeInsights?: string[];  // LLM-generated recommendations specific to this page type
  topEntities: Array<{  // Quick overview - use entities.ts for detailed extraction
    name: string;
    type: string;
    relevance: number;
  }>;
  questions: Question[];
  suggestedFAQ: Array<{  // Quick overview - use faq.ts for detailed generation
    question: string;
    suggestedAnswer: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  readingLevel: {
    grade: number;
    description: string;
  };
  keyTopics: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  technicalDepth?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  structureQuality?: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * Extract clean text content from HTML
 */
function extractTextContent($: CheerioAPI): string {
  // Remove script, style, and other non-content elements
  $('script, style, noscript, svg, iframe').remove();
  
  // Get main content
  const main = $('main');
  const article = $('article');
  const body = $('body');
  
  let content = '';
  
  if (main.length > 0) {
    content = main.text();
  } else if (article.length > 0) {
    content = article.text();
  } else {
    content = body.text();
  }
  
  // Clean up whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  // Limit length (for token efficiency)
  const maxLength = 10000;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }
  
  return content;
}

/**
 * Generate summary prompt
 */
function getSummaryPrompt(content: string, url: string): { system: string; user: string } {
  const system = `You are an expert content analyzer for AI-powered search and comprehension systems. 
Your task is to analyze web content and extract structured information that helps AI agents understand and index the page.

Be concise, accurate, and focus on extractable facts and key information.`;

  const user = `Analyze the following web page content and provide a structured analysis.

URL: ${url}

Content:
${content}

Provide your analysis in the following JSON format:
{
  "summary": "A 2-3 sentence summary of the main content and purpose",
  "pageType": "One of: Homepage / Product Page / Blog Post / Documentation / Landing Page / FAQ / About Page / Contact Page / Pricing Page / Portfolio / Case Study / News Article / Tutorial / Guide / Directory / Dashboard / Forum / E-commerce / Service Page / Career Page",
  "pageTypeInsights": [
    "Specific actionable recommendation based on the page type and content",
    "Another insight tailored to this page",
    "3-5 insights total that would improve AI understanding and user value"
  ],
  "keyTopics": ["topic1", "topic2", "topic3"],
  "topEntities": [
    {"name": "Entity Name", "type": "Person|Organization|Product|Concept", "relevance": 0.9},
  ],
  "readingLevel": {"grade": 10, "description": "High school level"},
  "technicalDepth": "beginner|intermediate|advanced|expert",
  "sentiment": "positive|neutral|negative",
  "structureQuality": "good"
}

Focus on entities that are central to understanding the content. Limit to top 5-7 entities.`;

  return { system, user };
}

/**
 * Generate questions prompt
 */
function getQuestionsPrompt(content: string, summary: string): { system: string; user: string } {
  const system = `You are an expert at understanding content and identifying what questions users might have.
Focus on questions that help understand the main purpose and value of the content.`;

  const user = `Based on this content, identify key questions users would ask:

Summary: ${summary}

Content: ${content.substring(0, 2000)}...

Provide your response in JSON format:
{
  "questions": [
    {"question": "What is...", "category": "what", "difficulty": "basic"},
    {"question": "How does...", "category": "how", "difficulty": "intermediate"}
  ],
  "suggestedFAQ": [
    {"question": "Common question?", "suggestedAnswer": "Brief answer", "importance": "high"}
  ]
}

Generate 3-5 questions and 2-3 FAQ items.`;

  return { system, user };
}

/**
 * Parse LLM JSON response safely
 */
function parseLLMJSON<T>(content: string): T | null {
  try {
    return safeJSONParse<T>(content, 'LLM comprehension');
  } catch (e) {
    console.error('Failed to parse LLM JSON response:', e);
    return null;
  }
}

/**
 * Generate LLM comprehension analysis
 * Provides high-level overview - use dedicated extractors for detailed entity/FAQ extraction
 */
export async function generateLLMComprehension(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<LLMComprehension> {
  const runner = new LLMRunner(config);
  const content = extractTextContent($);

  // Single LLM call for efficiency
  const summaryPrompt = getSummaryPrompt(content, url);
  const summaryResponse = await runner.callWithSystem(
    summaryPrompt.system,
    summaryPrompt.user,
    { temperature: 0.3 }
  );

  const summaryData = parseLLMJSON<{
    summary: string;
    pageType?: string;
    pageTypeInsights?: string[];
    keyTopics: string[];
    topEntities: Array<{ name: string; type: string; relevance: number }>;
    readingLevel: { grade: number; description: string };
    technicalDepth: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    sentiment: 'positive' | 'neutral' | 'negative';
    structureQuality: 'poor' | 'fair' | 'good' | 'excellent';
  }>(summaryResponse.content);

  if (!summaryData) {
    throw new Error('Failed to parse summary response from LLM');
  }

  // Single call for questions and quick FAQs
  const questionsPrompt = getQuestionsPrompt(content, summaryData.summary);
  const questionsResponse = await runner.callWithSystem(
    questionsPrompt.system,
    questionsPrompt.user,
    { temperature: 0.5 }
  );

  const questionsData = parseLLMJSON<{
    questions: Question[];
    suggestedFAQ: Array<{ question: string; suggestedAnswer: string; importance: 'high' | 'medium' | 'low' }>;
  }>(questionsResponse.content);

  return {
    summary: summaryData.summary,
    pageType: summaryData.pageType,
    pageTypeInsights: summaryData.pageTypeInsights,
    topEntities: summaryData.topEntities || [],
    questions: questionsData?.questions || [],
    suggestedFAQ: questionsData?.suggestedFAQ || [],
    readingLevel: summaryData.readingLevel,
    keyTopics: summaryData.keyTopics,
    sentiment: summaryData.sentiment,
    technicalDepth: summaryData.technicalDepth
  };
}

/**
 * Generate a quick summary without full analysis (faster/cheaper)
 */
export async function generateQuickSummary(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<{ summary: string; keyPoints: string[] }> {
  const runner = new LLMRunner(config);
  const content = extractTextContent($);

  const prompt = {
    system: 'You are a content summarization expert. Provide concise, accurate summaries.',
    user: `Summarize this web page in 2-3 sentences and extract 3-5 key points:

URL: ${url}
Content: ${content.substring(0, 2000)}...

Respond in JSON: {"summary": "...", "keyPoints": ["point1", "point2", ...]}`
  };

  const response = await runner.callWithSystem(prompt.system, prompt.user, {
    temperature: 0.3,
    maxTokens: 800
  });

  const data = parseLLMJSON<{ summary: string; keyPoints: string[] }>(response.content);
  
  return {
    summary: data?.summary || 'Summary generation failed',
    keyPoints: data?.keyPoints || []
  };
}
