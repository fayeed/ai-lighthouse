/**
 * Content chunking system for AI-Lighthouse
 * Splits page content into semantic chunks based on headings and structure
 */

import { CheerioAPI } from 'cheerio';
import { estimateTokenCount } from './utils.js';

export interface ContentChunk {
  id: string;                    // Unique chunk identifier
  startSelector: string;         // CSS selector for chunk start
  endSelector?: string;          // CSS selector for chunk end
  tokenCount: number;            // Estimated token count
  text: string;                  // Chunk text content
  heading?: string;              // Heading text if chunk starts with heading
  headingLevel?: number;         // Heading level (1-6)
  noiseRatio: number;            // Ratio of non-content to content (0-1)
  wordCount: number;             // Word count
  characterCount: number;        // Character count
  hasCode: boolean;              // Contains code blocks
  hasLists: boolean;             // Contains lists
  hasTables: boolean;            // Contains tables
  htmlSnippet?: string;          // HTML of chunk (optional)
}

export interface ChunkingResult {
  chunks: ContentChunk[];
  totalTokens: number;
  totalChunks: number;
  averageTokensPerChunk: number;
  averageNoiseRatio: number;
  chunkingStrategy: string;
}

/**
 * Calculate noise ratio for a chunk
 * Noise = (whitespace + punctuation + html_tags) / total_chars
 */
function calculateNoiseRatio(text: string, $: CheerioAPI, element?: any): number {
  if (!text || text.length === 0) return 1.0;

  const totalChars = text.length;
  
  // Count whitespace
  const whitespaceCount = (text.match(/\s/g) || []).length;
  
  // Count excessive punctuation (consecutive or repetitive)
  const excessivePunctuation = (text.match(/[.,!?;:]{2,}/g) || []).length;
  
  // Estimate script/style content if element provided
  let scriptStyleChars = 0;
  if (element) {
    const $el = $(element);
    scriptStyleChars = $el.find('script, style').text().length;
  }
  
  // Noise = (whitespace * 0.5 + excessive_punct + script/style) / total
  const noise = (whitespaceCount * 0.5 + excessivePunctuation * 10 + scriptStyleChars) / totalChars;
  
  return Math.min(1.0, noise);
}

/**
 * Extract chunks based on heading structure
 */
function chunkByHeadings($: CheerioAPI, container: any): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  const headings = container.find('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    // No headings - treat entire content as one chunk
    return chunkByParagraphs($, container);
  }

  headings.each((index: number, heading: any) => {
    const $heading = $(heading);
    const headingText = $heading.text().trim();
    const headingLevel = parseInt(heading.tagName.charAt(1));
    
    // Get content until next heading of same or higher level
    const nextHeadings = $heading.nextAll('h1, h2, h3, h4, h5, h6').toArray();
    let endElement = null;
    
    for (const nextHeading of nextHeadings) {
      const nextLevel = parseInt(nextHeading.tagName.charAt(1));
      if (nextLevel <= headingLevel) {
        endElement = nextHeading;
        break;
      }
    }
    
    // Extract content between headings
    let content = '';
    let currentEl = $heading.next()[0];
    const elements = [];
    
    while (currentEl && currentEl !== endElement) {
      elements.push(currentEl);
      content += $(currentEl).text() + ' ';
      currentEl = $(currentEl).next()[0];
    }
    
    const fullText = headingText + '\n' + content.trim();
    const tokenCount = estimateTokenCount(fullText);
    const noiseRatio = calculateNoiseRatio(content, $, elements[0]);
    
    // Generate selector
    const headingId = $heading.attr('id');
    const startSelector = headingId 
      ? `#${headingId}`
      : `${heading.tagName}:contains("${headingText.substring(0, 30)}")`;
    
    chunks.push({
      id: `chunk-${index + 1}`,
      startSelector,
      tokenCount,
      text: fullText,
      heading: headingText,
      headingLevel,
      noiseRatio: Math.round(noiseRatio * 100) / 100,
      wordCount: fullText.split(/\s+/).length,
      characterCount: fullText.length,
      hasCode: elements.some(el => $(el).is('pre, code')),
      hasLists: elements.some(el => $(el).is('ul, ol, li')),
      hasTables: elements.some(el => $(el).is('table')),
    });
  });
  
  return chunks;
}

/**
 * Fallback: chunk by paragraphs when no headings
 */
function chunkByParagraphs($: CheerioAPI, container: any, maxTokens = 500): ContentChunk[] {
  const chunks: ContentChunk[] = [];
  const paragraphs = container.find('p');
  
  if (paragraphs.length === 0) {
    // No paragraphs - return entire content as single chunk
    const text = container.text().trim();
    return [{
      id: 'chunk-1',
      startSelector: 'body',
      tokenCount: estimateTokenCount(text),
      text,
      noiseRatio: calculateNoiseRatio(text, $),
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      hasCode: false,
      hasLists: false,
      hasTables: false,
    }];
  }
  
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  let firstParagraphIndex = 0;
  
  paragraphs.each((index: number, p: any) => {
    const $p = $(p);
    const text = $p.text().trim();
    const tokens = estimateTokenCount(text);
    
    if (currentTokens + tokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        id: `chunk-${chunkIndex + 1}`,
        startSelector: `p:nth-of-type(${firstParagraphIndex + 1})`,
        tokenCount: currentTokens,
        text: currentChunk.trim(),
        noiseRatio: calculateNoiseRatio(currentChunk, $),
        wordCount: currentChunk.split(/\s+/).length,
        characterCount: currentChunk.length,
        hasCode: false,
        hasLists: false,
        hasTables: false,
      });
      
      // Start new chunk
      currentChunk = text + '\n\n';
      currentTokens = tokens;
      firstParagraphIndex = index;
      chunkIndex++;
    } else {
      currentChunk += text + '\n\n';
      currentTokens += tokens;
    }
  });
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk-${chunkIndex + 1}`,
      startSelector: `p:nth-of-type(${firstParagraphIndex + 1})`,
      tokenCount: currentTokens,
      text: currentChunk.trim(),
      noiseRatio: calculateNoiseRatio(currentChunk, $),
      wordCount: currentChunk.split(/\s+/).length,
      characterCount: currentChunk.length,
      hasCode: false,
      hasLists: false,
      hasTables: false,
    });
  }
  
  return chunks;
}

/**
 * Main chunking function
 * Analyzes page structure and returns semantic chunks
 */
export function chunkContent($: CheerioAPI, options: {
  maxTokensPerChunk?: number;
  includeHtml?: boolean;
  strategy?: 'auto' | 'heading-based' | 'paragraph-based';
} = {}): ChunkingResult {
  const { maxTokensPerChunk = 500, includeHtml = false, strategy: forcedStrategy } = options;
  
  // Find main content container
  const main = $('main');
  const article = $('article');
  const container = main.length ? main.first() 
                  : article.length ? article.first()
                  : $('body');
  
  // Determine chunking strategy
  const hasHeadings = container.find('h1, h2, h3, h4, h5, h6').length > 0;
  let strategy: string;
  let chunks: ContentChunk[] = [];
  
  if (forcedStrategy) {
    if (forcedStrategy === 'auto') {
      strategy = hasHeadings ? 'heading-based' : 'paragraph-based';
    } else {
      strategy = forcedStrategy;
    }
  } else {
    strategy = hasHeadings ? 'heading-based' : 'paragraph-based';
  }
  
  if (strategy === 'heading-based') {
    if (!hasHeadings) {
      chunks = chunkByParagraphs($, container, maxTokensPerChunk);
      strategy = 'paragraph-based (fallback)';
    } else {
      chunks = chunkByHeadings($, container);
    }
  } else {
    chunks = chunkByParagraphs($, container, maxTokensPerChunk);
  }
  
  if (includeHtml) {
    chunks = chunks.map(chunk => ({
      ...chunk,
      htmlSnippet: container.html()?.substring(0, 500)
    }));
  }
  
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
  const totalChunks = chunks.length;
  const averageTokensPerChunk = totalChunks > 0 ? Math.round(totalTokens / totalChunks) : 0;
  const averageNoiseRatio = totalChunks > 0 
    ? chunks.reduce((sum, c) => sum + c.noiseRatio, 0) / totalChunks
    : 0;
  
  return {
    chunks,
    totalTokens,
    totalChunks,
    averageTokensPerChunk,
    averageNoiseRatio: Math.round(averageNoiseRatio * 100) / 100,
    chunkingStrategy: strategy,
  };
}

/**
 * Analyze chunk quality
 */
export function analyzeChunkQuality(chunk: ContentChunk): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check token count
  if (chunk.tokenCount > 1000) {
    issues.push('Chunk is very large (>1000 tokens)');
    recommendations.push('Split into smaller sections using subheadings');
  } else if (chunk.tokenCount < 50) {
    issues.push('Chunk is very small (<50 tokens)');
    recommendations.push('Consider merging with adjacent chunks');
  }
  
  // Check noise ratio
  if (chunk.noiseRatio > 0.5) {
    issues.push('High noise ratio (>50%)');
    recommendations.push('Remove excessive whitespace, comments, or non-content elements');
  }
  
  // Check heading
  if (!chunk.heading) {
    issues.push('Chunk lacks a clear heading');
    recommendations.push('Add descriptive heading to improve context');
  }
  
  // Determine quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (issues.length === 0) {
    quality = 'excellent';
  } else if (issues.length === 1) {
    quality = 'good';
  } else if (issues.length === 2) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }
  
  return { quality, issues, recommendations };
}
