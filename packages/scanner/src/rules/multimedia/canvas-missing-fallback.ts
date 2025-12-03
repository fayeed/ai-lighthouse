import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-072`,
  title: 'Embedded content without titles',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['iframe', 'embedded', 'accessibility'],
  priority: 12,
  description: 'Checks for iframes without title attributes. Titles help AI understand embedded content purpose.'
})
export class CanvasMissingFallbackRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for embedded content (YouTube, etc.) without fallback
    const iframes = $('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="embed"]');
    
    if (iframes.length === 0) {
      return null;
    }

    let iframesWithoutTitle = 0;
    
    iframes.each((_, el) => {
      const iframe = $(el);
      const hasTitle = !!iframe.attr('title');
      if (!hasTitle) {
        iframesWithoutTitle++;
      }
    });

    if (iframesWithoutTitle === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-072`,
      title: 'Embedded content without titles',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${iframesWithoutTitle} iframe(s) without title attributes. Titles help AI understand embedded content purpose.`,
      remediation: 'Add descriptive title attributes to all iframe elements (e.g., title="YouTube video: Tutorial Name").',
      impactScore: 12,
      location: { url, selector: 'iframe' },
      evidence: [`Iframes without titles: ${iframesWithoutTitle}`],
      tags: ['iframe', 'embedded', 'accessibility'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
