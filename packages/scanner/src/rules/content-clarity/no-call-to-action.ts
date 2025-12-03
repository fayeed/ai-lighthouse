import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-099`,
  title: 'No clear call-to-action',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['cta', 'conversion', 'ux'],
  priority: 7,
  description: 'Product/service page lacks clear call-to-action buttons or links.'
})
export class NoCallToActionRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hasProductSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && (content.includes('"Product"') || content.includes('"Offer"')));
    }).length > 0;

    // Call-to-action present
    const ctaButtons = $('button, a').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return /buy|purchase|sign up|subscribe|download|get started|contact|learn more|try|demo/i.test(text);
    });
    
    if (ctaButtons.length === 0 && hasProductSchema) {
      return {
        id: `${CATEGORY.AIREAD}-099`,
        title: 'No clear call-to-action',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product/service page lacks clear call-to-action buttons or links.',
        remediation: 'Add prominent CTAs like "Buy Now", "Sign Up", or "Get Started".',
        impactScore: 10,
        location: { url },
        evidence: ['No CTA buttons detected'],
        tags: ['cta', 'conversion', 'ux'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
