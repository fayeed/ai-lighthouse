import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-039`,
  title: 'Decorative images not marked',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['images', 'accessibility', 'decorative'],
  priority: 13,
  description: 'Detects images that appear decorative but are not marked with empty alt text.'
})
export class DecorativeImagesNotMarkedRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const images = $('img');
    
    if (images.length === 0) {
      return null;
    }

    // Check for potentially decorative images with non-empty alt
    const potentiallyDecorative: string[] = [];
    
    images.each((_, el) => {
      const img = $(el);
      const alt = img.attr('alt');
      const src = img.attr('src') || '';
      const classes = img.attr('class') || '';
      
      // Heuristic: images with "decoration", "bg", "icon" in class or src
      const seemsDecorative = 
        classes.includes('decoration') || 
        classes.includes('bg-') || 
        classes.includes('icon-') ||
        src.includes('decoration') ||
        src.includes('/bg/') ||
        src.includes('spacer');
      
      if (seemsDecorative && alt && alt.trim() !== '') {
        potentiallyDecorative.push(src.substring(0, 40));
      }
    });

    if (potentiallyDecorative.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-039`,
      title: 'Decorative images not marked',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Found ${potentiallyDecorative.length} image(s) that appear decorative but have alt text. Decorative images should use alt="" to avoid cluttering AI output.`,
      remediation: 'For purely decorative images, use alt="" or role="presentation" to indicate they can be safely ignored.',
      impactScore: 8,
      location: { url },
      evidence: [`Potentially decorative images: ${potentiallyDecorative.length}`],
      tags: ['images', 'accessibility', 'decorative'],
      confidence: 0.6,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
