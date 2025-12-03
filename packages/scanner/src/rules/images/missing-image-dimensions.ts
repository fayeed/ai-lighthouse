import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-040`,
  title: 'Missing image dimensions',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['images', 'performance', 'optimization'],
  priority: 13,
  description: 'Checks for images without width/height attributes which can affect layout.'
})
export class MissingImageDimensionsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const images = $('img');
    
    if (images.length === 0) {
      return null;
    }

    let imagesWithoutDimensions = 0;
    
    images.each((_, el) => {
      const img = $(el);
      const hasWidth = img.attr('width') || img.css('width');
      const hasHeight = img.attr('height') || img.css('height');
      
      if (!hasWidth || !hasHeight) {
        imagesWithoutDimensions++;
      }
    });

    if (imagesWithoutDimensions === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-040`,
      title: 'Missing image dimensions',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Found ${imagesWithoutDimensions} image(s) without width/height attributes. While not directly AI-related, this affects page layout stability.`,
      remediation: 'Add width and height attributes to images to prevent layout shifts and improve page performance.',
      impactScore: 5,
      location: { url },
      evidence: [`Images without dimensions: ${imagesWithoutDimensions}`, `Total images: ${images.length}`],
      tags: ['images', 'performance', 'optimization'],
      confidence: 0.8,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
