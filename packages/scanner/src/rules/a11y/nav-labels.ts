import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-005`,
  title: 'Navigation without labels',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.LOW,
  tags: ['navigation', 'labels', 'accessibility'],
  priority: 12,
  description: 'Checks that navigation sections have labels to help AI agents distinguish between them.'
})
export class NavLabelsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const navs = $('nav');
    let navsWithoutHeadings = 0;
    
    navs.each((_, el) => {
      const nav = $(el);
      const hasHeading = nav.find('h1, h2, h3, h4, h5, h6').length > 0;
      const ariaLabel = nav.attr('aria-label');
      const ariaLabelledby = nav.attr('aria-labelledby');
      
      if (!hasHeading && !ariaLabel && !ariaLabelledby) {
        navsWithoutHeadings++;
      }
    });

    if (navsWithoutHeadings > 0) {
      return {
        id: `${CATEGORY.A11Y}-005`,
        title: 'Navigation without labels',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `Found ${navsWithoutHeadings} <nav> element(s) without headings or ARIA labels. Labels help AI agents distinguish between different navigation sections.`,
        remediation: 'Add aria-label to <nav> elements (e.g., aria-label="Main navigation") or include a heading within the nav.',
        impactScore: 10,
        location: { url, selector: 'nav' },
        evidence: [`Unlabeled navigation sections: ${navsWithoutHeadings}`],
        tags: ['navigation', 'labels', 'accessibility'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
