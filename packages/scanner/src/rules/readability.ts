import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-046`,
  title: 'Content readability and structure',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['readability', 'content', 'structure'],
  priority: 13,
  description: 'Analyzes content readability factors: paragraph length, sentence structure, and content organization.'
})
export class ReadabilityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for very long paragraphs
    const paragraphs = $('p');
    let longParagraphs = 0;
    let totalParas = 0;
    
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        totalParas++;
        if (text.length > 1000) {
          longParagraphs++;
        }
      }
    });

    if (longParagraphs > 0 && totalParas > 0 && (longParagraphs / totalParas) > 0.3) {
      issues.push({
        id: `${CATEGORY.AIREAD}-046`,
        title: 'Excessively long paragraphs',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `${longParagraphs} paragraph(s) exceed 1000 characters. Long paragraphs are harder for AI to process and extract key information.`,
        remediation: 'Break long paragraphs into smaller, focused paragraphs. Aim for 3-5 sentences per paragraph.',
        impactScore: 10,
        location: { url },
        evidence: [
          `Long paragraphs: ${longParagraphs}`,
          `Total paragraphs: ${totalParas}`,
          `Percentage: ${((longParagraphs / totalParas) * 100).toFixed(1)}%`
        ],
        tags: ['readability', 'paragraphs', 'content'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for lack of paragraph breaks (wall of text)
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const contentLength = mainContent.trim().length;
    const paragraphCount = $('main p, article p').length || $('p').length;
    
    if (contentLength > 2000 && paragraphCount < 3) {
      issues.push({
        id: `${CATEGORY.AIREAD}-047`,
        title: 'Wall of text - insufficient paragraph breaks',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content has ${contentLength} characters but only ${paragraphCount} paragraph(s). Large blocks of unstructured text are difficult for AI to parse.`,
        remediation: 'Break content into smaller paragraphs with clear topic separation. Add headings to organize content sections.',
        impactScore: 15,
        location: { url },
        evidence: [
          `Content length: ${contentLength} chars`,
          `Paragraphs: ${paragraphCount}`,
          `Avg chars per paragraph: ${Math.round(contentLength / Math.max(1, paragraphCount))}`
        ],
        tags: ['readability', 'structure', 'paragraphs'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper use of emphasis (strong, em)
    const strongTags = $('strong, b').length;
    const emTags = $('em, i').length;
    const totalWords = mainContent.split(/\s+/).length;
    
    if (totalWords > 500 && strongTags === 0 && emTags === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-048`,
        title: 'No text emphasis used',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content lacks emphasis elements (<strong>, <em>). Emphasis helps AI identify important concepts and keywords.',
        remediation: 'Use <strong> for important content and <em> for emphasis. This helps AI understand which parts are most significant.',
        impactScore: 5,
        location: { url },
        evidence: [`Word count: ${totalWords}`, 'No emphasis elements found'],
        tags: ['emphasis', 'content', 'semantic'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper list usage vs fake lists
    const lists = $('ul, ol').length;
    const listItems = $('li').length;
    
    // Look for patterns that should be lists but aren't
    const potentialListPatterns = mainContent.match(/(\n|^)[\d]+\.\s|\n[-•*]\s/g);
    const potentialListCount = potentialListPatterns ? potentialListPatterns.length : 0;
    
    if (potentialListCount > 3 && lists === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-049`,
        title: 'Unstructured lists detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${potentialListCount} potential list items using bullets or numbers in plain text. These should be proper HTML lists.`,
        remediation: 'Convert plain text lists (using -, •, or 1., 2., etc.) to semantic <ul> or <ol> elements.',
        impactScore: 15,
        location: { url },
        evidence: [`Potential list items: ${potentialListCount}`],
        tags: ['lists', 'structure', 'semantic'],
        confidence: 0.75,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for date/time information
    const timeElements = $('time[datetime]').length;
    const datePatterns = mainContent.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi);
    const hasDates = datePatterns && datePatterns.length > 0;
    
    if (hasDates && timeElements === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-050`,
        title: 'Dates not marked up with time elements',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content contains dates but they are not wrapped in <time> elements. Machine-readable dates help AI understand temporal context.',
        remediation: 'Wrap dates in <time datetime="YYYY-MM-DD"> elements to make them machine-readable.',
        impactScore: 8,
        location: { url },
        evidence: [`Date patterns found: ${datePatterns?.length || 0}`],
        tags: ['time', 'dates', 'semantic'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for abbreviations without expansions
    const abbrs = $('abbr[title]').length;
    const potentialAbbrs = mainContent.match(/\b[A-Z]{2,}\b/g);
    const potentialAbbrCount = potentialAbbrs ? new Set(potentialAbbrs).size : 0;
    
    if (potentialAbbrCount > 5 && abbrs === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-051`,
        title: 'Abbreviations without markup',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${potentialAbbrCount} potential abbreviation(s) without <abbr> markup. Expanded abbreviations help AI understand specialized terms.`,
        remediation: 'Use <abbr title="Full Name">ABBR</abbr> to provide expansions for abbreviations and acronyms.',
        impactScore: 8,
        location: { url },
        evidence: [`Potential abbreviations: ${potentialAbbrCount}`, `Marked up: ${abbrs}`],
        tags: ['abbreviations', 'semantic', 'clarity'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper quote usage
    const quotes = $('q, blockquote').length;
    const quoteMarks = mainContent.match(/["'""].*?["'""]|«.*?»/g);
    const quoteMarkCount = quoteMarks ? quoteMarks.length : 0;
    
    if (quoteMarkCount > 3 && quotes === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-052`,
        title: 'Quotes not properly marked up',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${quoteMarkCount} quotation(s) using quote marks but no <q> or <blockquote> elements. Semantic quote markup helps AI identify quoted content.`,
        remediation: 'Use <q> for inline quotes and <blockquote> for longer quotations instead of plain quote marks.',
        impactScore: 5,
        location: { url },
        evidence: [`Quote marks found: ${quoteMarkCount}`, `Semantic quotes: ${quotes}`],
        tags: ['quotes', 'semantic', 'markup'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
