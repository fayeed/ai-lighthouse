import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-037`,
  title: 'Images missing alt text',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['images', 'alt-text', 'accessibility'],
  priority: 13,
  description: 'Checks for images without alt attributes. Alt text is crucial for AI agents to understand image content.'
})
export class MissingAltTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const images = $('img');
    
    if (images.length === 0) {
      return null;
    }

    const imagesWithoutAlt: string[] = [];
    
    images.each((_, el) => {
      const img = $(el);
      const alt = img.attr('alt');
      const src = img.attr('src') || 'unknown';
      
      if (alt === undefined) {
        imagesWithoutAlt.push(src.substring(0, 50));
      }
    });

    if (imagesWithoutAlt.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-037`,
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
    } as Issue;
  }
}
