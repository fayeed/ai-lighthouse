import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-085`,
  title: 'Pricing not visible',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['pricing', 'product', 'visibility'],
  priority: 7,
  description: 'Product detected but pricing information is not clearly visible on the page.'
})
export class PricingNotVisibleRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hasPricing = $('[class*="price" i], [id*="price" i], [itemprop="price"]').length > 0;
    const hasProductSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && (content.includes('"Product"') || content.includes('"Offer"')));
    }).length > 0;
    
    if (hasProductSchema && !hasPricing) {
      return {
        id: `${CATEGORY.AIREAD}-085`,
        title: 'Pricing not visible',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product detected but pricing information is not clearly visible on the page.',
        remediation: 'Display pricing information prominently for products/services.',
        impactScore: 8,
        location: { url },
        evidence: ['Product schema present', 'No visible pricing'],
        tags: ['pricing', 'product', 'visibility'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
