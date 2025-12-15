import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-086`,
  title: 'Features not clearly listed',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['features', 'product', 'structure'],
  priority: 7,
  description: 'Product page lacks a clear features or benefits section with structured lists.'
})
export class FeaturesNotListedRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hasProductSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && (content.includes('"Product"') || content.includes('"Offer"')));
    }).length > 0;

    const hasFeaturesList = $('[class*="feature" i], [id*="feature" i]').find('ul, ol').length > 0;
    const hasFeatureHeading = $('h2, h3, h4').filter((_, el) => {
      return /features|benefits|advantages/i.test($(el).text());
    }).length > 0;
    
    if (hasProductSchema && !hasFeaturesList && !hasFeatureHeading) {
      return {
        id: `${CATEGORY.AIREAD}-086`,
        title: 'Features not clearly listed',
        severity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product page lacks a clear features or benefits section with structured lists.',
        remediation: 'Add a "Features" or "Benefits" section with bullet points or ordered list.',
        impactScore: 10,
        location: { url },
        evidence: ['No structured features list found'],
        tags: ['features', 'product', 'structure'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
