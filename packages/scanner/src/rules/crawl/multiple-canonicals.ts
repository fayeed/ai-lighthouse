import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-006`,
  title: 'Canonical and noindex conflict',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['canonical', 'noindex', 'conflict'],
  priority: 25,
  description: 'Page has both canonical tag and noindex directive. This sends conflicting signals to AI crawlers.'
})
export class MultipleCanonicalsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const canonical = $('link[rel="canonical"]').attr('href');
    const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
    
    if (canonical && robotsMeta.includes('noindex')) {
      return {
        id: `${CATEGORY.CRAWL}-006`,
        title: 'Canonical and noindex conflict',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'Page has both canonical tag and noindex directive. This sends conflicting signals to AI crawlers.',
        remediation: 'Remove canonical tag from noindexed pages, or remove noindex if page should be indexed.',
        impactScore: 25,
        location: { url },
        evidence: [`Canonical: ${canonical}`, `Robots: ${robotsMeta}`],
        tags: ['canonical', 'noindex', 'conflict'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
