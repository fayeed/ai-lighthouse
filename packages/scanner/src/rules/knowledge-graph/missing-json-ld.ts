import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.KG}-001`,
  title: 'No Schema.org structured data',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['schema', 'json-ld', 'knowledge-graph'],
  priority: 10,
  description: 'Checks for JSON-LD structured data. This prevents AI from building knowledge graphs from your content.'
})
export class MissingJsonLdRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for JSON-LD
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-001`,
      title: 'No Schema.org structured data',
      severity: SEVERITY.HIGH,
      category: CATEGORY.KG,
      description: 'The page lacks Schema.org structured data in JSON-LD format. This prevents AI from building knowledge graphs from your content.',
      remediation: 'Add Schema.org structured data using JSON-LD. Consider Organization, Person, Article, Product, or other relevant schemas.',
      impactScore: 30,
      location: { url },
      evidence: ['No JSON-LD structured data found'],
      tags: ['schema', 'json-ld', 'knowledge-graph'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
