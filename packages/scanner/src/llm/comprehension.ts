/**
 * LLM Comprehension - Generate AI-readable summaries and insights
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';

export interface Entity {
  name: string;
  type: string;
  relevance: number; // 0-1
  mentions?: number;
}

export interface Question {
  question: string;
  category: 'what' | 'why' | 'how' | 'when' | 'where' | 'who';
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface FAQItem {
  question: string;
  suggestedAnswer: string;
  importance: 'high' | 'medium' | 'low';
}

export interface LLMComprehension {
  summary: string;
  topEntities: Entity[];
  questions: Question[];
  suggestedFAQ: FAQItem[];
  readingLevel: {
    grade: number;
    description: string;
  };
  keyTopics: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  technicalDepth?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
  "keyTopics": ["topic1", "topic2", "topic3"],
  "topEntities": [
    {"name": "Entity Name", "type": "Person|Organization|Product|Concept", "relevance": 0.9},
  ],
  "readingLevel": {"grade": 10, "description": "High school level"},
  "technicalDepth": "beginner|intermediate|advanced|expert",
  "sentiment": "positive|neutral|negative"
}

Focus on entities that are central to understanding the content. Limit to top 5-7 entities.`;

  return { system, user };
}

/**
 * Generate questions prompt
 */
function getQuestionsPrompt(content: string, summary: string): { system: string; user: string } {
  const system = `You are an expert at generating insightful questions about content to help AI agents understand what information users might seek.

Generate questions that:
1. Cover different aspects of the content
2. Range from basic to advanced understanding
3. Help identify gaps in the content
4. Would be useful for FAQ generation`;

  const user = `Based on this content summary and full text, generate questions that users might ask:

Summary: ${summary}

Content: ${content.substring(0, 3000)}...

Provide your response in JSON format:
{
  "questions": [
    {"question": "What is...", "category": "what", "difficulty": "basic"},
    {"question": "How does...", "category": "how", "difficulty": "intermediate"},
  ]
}

Generate 5-8 diverse questions covering what, why, how, when, where, who.`;

  return { system, user };
}

/**
 * Generate FAQ prompt
 */
function getFAQPrompt(content: string, questions: Question[]): { system: string; user: string } {
  const system = `You are an expert at creating helpful FAQ sections for websites.
Generate FAQ items that:
1. Address common user questions
2. Provide clear, concise answers
3. Are directly answerable from the content
4. Help improve content discoverability`;

  const user = `Based on the content and these potential questions, generate 3-5 FAQ items:

Questions to consider:
${questions.map(q => `- ${q.question}`).join('\n')}

Content:
${content.substring(0, 3000)}...

Provide your response in JSON format:
{
  "suggestedFAQ": [
    {
      "question": "Frequently asked question?",
      "suggestedAnswer": "Clear, concise answer based on content",
      "importance": "high|medium|low"
    }
  ]
}

Only include FAQs that can be answered from the provided content.`;

  return { system, user };
}

/**
 * Parse LLM JSON response safely
 */
function parseLLMJSON<T>(content: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try direct parse
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse LLM JSON response:', e);
    return null;
  }
}

/**
 * Generate LLM comprehension analysis
 */
export async function generateLLMComprehension(
  $: CheerioAPI,
  url: string,
  config: LLMConfig
): Promise<LLMComprehension> {
  const runner = new LLMRunner(config);
  const content = extractTextContent($);

  // Step 1: Generate summary and extract entities
  const summaryPrompt = getSummaryPrompt(content, url);
  const summaryResponse = await runner.callWithSystem(
    summaryPrompt.system,
    summaryPrompt.user,
    { temperature: 0.3 } // Lower temperature for more consistent output
  );

  const summaryData = parseLLMJSON<{
    summary: string;
    keyTopics: string[];
    topEntities: Entity[];
    readingLevel: { grade: number; description: string };
    technicalDepth: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    sentiment: 'positive' | 'neutral' | 'negative';
  }>(summaryResponse.content);

  if (!summaryData) {
    throw new Error('Failed to parse summary response from LLM');
  }

  // Step 2: Generate questions
  const questionsPrompt = getQuestionsPrompt(content, summaryData.summary);
  const questionsResponse = await runner.callWithSystem(
    questionsPrompt.system,
    questionsPrompt.user,
    { temperature: 0.5 }
  );

  const questionsData = parseLLMJSON<{ questions: Question[] }>(questionsResponse.content);
  const questions = questionsData?.questions || [];

  // Step 3: Generate FAQ suggestions
  const faqPrompt = getFAQPrompt(content, questions);
  const faqResponse = await runner.callWithSystem(
    faqPrompt.system,
    faqPrompt.user,
    { temperature: 0.4 }
  );

  const faqData = parseLLMJSON<{ suggestedFAQ: FAQItem[] }>(faqResponse.content);
  const suggestedFAQ = faqData?.suggestedFAQ || [];

  return {
    summary: summaryData.summary,
    topEntities: summaryData.topEntities,
    questions,
    suggestedFAQ,
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
    maxTokens: 500
  });

  const data = parseLLMJSON<{ summary: string; keyPoints: string[] }>(response.content);
  
  return {
    summary: data?.summary || 'Summary generation failed',
    keyPoints: data?.keyPoints || []
  };
}
