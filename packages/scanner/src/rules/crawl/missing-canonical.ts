import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-003`,
  title: 'Missing canonical tag',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['canonical', 'duplicate-content', 'seo'],
  priority: 25,
  description: 'No canonical URL specified. This can cause duplicate content issues for AI crawlers.'
})
export class MissingCanonicalRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const canonical = $('link[rel="canonical"]').attr('href');
    
    if (!canonical) {
      return {
        id: `${CATEGORY.CRAWL}-003`,
        title: 'Missing canonical tag',
        severity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'No canonical URL specified. This can cause duplicate content issues for AI crawlers.',
        remediation: 'Add <link rel="canonical" href="..."> to specify the preferred URL version.',
        impactScore: 25,
        location: { url },
        evidence: ['No canonical tag found'],
        tags: ['canonical', 'duplicate-content', 'seo'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
