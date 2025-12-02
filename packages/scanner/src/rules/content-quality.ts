import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-018`,
  title: 'Content quality issues for AI',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['quality', 'accessibility', 'content'],
  priority: 10,
  description: 'Analyzes content quality factors that affect AI comprehension: descriptive headings, alt text, and link text.'
})
export class ContentQualityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for vague/generic headings
    const headings = $('h1, h2, h3, h4, h5, h6');
    const vagueHeadings: string[] = [];
    const vaguePhrases = ['click here', 'read more', 'learn more', 'introduction', 'welcome', 'overview', 'untitled'];
    
    headings.each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text.length < 3 || vaguePhrases.includes(text)) {
        vagueHeadings.push(text.substring(0, 50));
      }
    });

    if (vagueHeadings.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-018`,
        title: 'Vague or non-descriptive headings',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${vagueHeadings.length} heading(s) with generic or non-descriptive text. Clear, descriptive headings help AI agents understand content structure and meaning.`,
        remediation: 'Replace generic headings like "Introduction" or "Overview" with specific, descriptive titles that convey the actual content topic.',
        impactScore: 15,
        location: { url },
        evidence: [`Vague headings: ${vagueHeadings.slice(0, 3).join(', ')}`],
        tags: ['headings', 'content-quality', 'clarity'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for images without alt text
    const images = $('img');
    const imagesWithoutAlt: string[] = [];
    const decorativeImages: string[] = [];
    
    images.each((_, el) => {
      const img = $(el);
      const alt = img.attr('alt');
      const src = img.attr('src') || 'unknown';
      
      if (alt === undefined) {
        imagesWithoutAlt.push(src.substring(0, 50));
      } else if (alt === '') {
        decorativeImages.push(src.substring(0, 50));
      }
    });

    if (imagesWithoutAlt.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-019`,
        title: 'Images missing alt text',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: `Found ${imagesWithoutAlt.length} image(s) without alt attributes. Alt text is crucial for AI agents to understand image content and context.`,
        remediation: 'Add descriptive alt text to all content images. For decorative images, use alt="" to indicate they can be safely ignored.',
        impactScore: 25,
        location: { url, selector: 'img:not([alt])' },
        evidence: [
          `Images without alt: ${imagesWithoutAlt.length}`,
          `Examples: ${imagesWithoutAlt.slice(0, 2).join(', ')}`
        ],
        tags: ['accessibility', 'images', 'alt-text'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for non-descriptive link text
    const links = $('a');
    const badLinkText: string[] = [];
    const badPhrases = ['click here', 'read more', 'here', 'more', 'link', 'this', 'click', 'more info', 'learn more'];
    
    links.each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (badPhrases.includes(text)) {
        badLinkText.push(text);
      }
    });

    if (badLinkText.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-020`,
        title: 'Non-descriptive link text',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${badLinkText.length} link(s) with generic text like "click here" or "read more". Descriptive link text helps AI agents understand link purpose and context.`,
        remediation: 'Use descriptive link text that explains where the link goes or what action it performs. Instead of "click here", use "view the pricing page" or "download the user guide".',
        impactScore: 15,
        location: { url },
        evidence: [`Generic link text found: ${badLinkText.slice(0, 5).join(', ')}`],
        tags: ['links', 'accessibility', 'content-quality'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for empty paragraphs or very short paragraphs that might be spacing hacks
    const paragraphs = $('p');
    let emptyParagraphs = 0;
    
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length === 0 || (text.length < 3 && text.match(/^[&nbsp;\s]+$/))) {
        emptyParagraphs++;
      }
    });

    if (emptyParagraphs > 3) {
      issues.push({
        id: `${CATEGORY.AIREAD}-021`,
        title: 'Excessive empty paragraphs',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${emptyParagraphs} empty <p> elements. These add noise for AI parsing and suggest poor semantic HTML usage.`,
        remediation: 'Remove empty <p> tags used for spacing. Use CSS margins/padding instead for layout control.',
        impactScore: 5,
        location: { url },
        evidence: [`Empty paragraphs: ${emptyParagraphs}`],
        tags: ['content-quality', 'semantic', 'cleanup'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
