import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-012`,
  title: 'Meta refresh redirect detected',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['redirect', 'meta-refresh', 'performance'],
  priority: 18,
  description: 'Page uses meta refresh redirect. AI crawlers prefer server-side 301/302 redirects for better performance.'
})
export class OrphanPageRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
    
    if (metaRefresh) {
      return {
        id: `${CATEGORY.CRAWL}-012`,
        title: 'Meta refresh redirect detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CRAWL,
        description: 'Page uses meta refresh redirect. AI crawlers prefer server-side 301/302 redirects for better performance.',
        remediation: 'Use server-side HTTP 301 or 302 redirects instead of meta refresh.',
        impactScore: 18,
        location: { url },
        evidence: [`Meta refresh: ${metaRefresh}`],
        tags: ['redirect', 'meta-refresh', 'performance'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
