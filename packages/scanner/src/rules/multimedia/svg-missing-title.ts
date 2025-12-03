import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-071`,
  title: 'SVGs without accessible descriptions',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['svg', 'accessibility', 'graphics'],
  priority: 12,
  description: 'Checks for SVGs without title elements or aria-label. Descriptive text helps AI understand SVG content.'
})
export class SvgMissingTitleRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for SVG accessibility
    const svgs = $('svg');
    
    if (svgs.length === 0) {
      return null;
    }

    let svgsWithoutTitle = 0;
    
    svgs.each((_, el) => {
      const svg = $(el);
      const hasTitle = svg.find('title').length > 0;
      const hasAriaLabel = !!svg.attr('aria-label');
      const isDecorative = svg.attr('role') === 'presentation' || svg.attr('aria-hidden') === 'true';
      
      if (!hasTitle && !hasAriaLabel && !isDecorative) {
        svgsWithoutTitle++;
      }
    });

    if (svgsWithoutTitle === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-071`,
      title: 'SVGs without accessible descriptions',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Found ${svgsWithoutTitle} SVG(s) without <title> elements or aria-label. Descriptive text helps AI understand SVG content.`,
      remediation: 'Add <title> elements inside SVGs, use aria-label, or mark decorative SVGs with aria-hidden="true".',
      impactScore: 8,
      location: { url, selector: 'svg' },
      evidence: [`SVGs without descriptions: ${svgsWithoutTitle}`],
      tags: ['svg', 'accessibility', 'graphics'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
