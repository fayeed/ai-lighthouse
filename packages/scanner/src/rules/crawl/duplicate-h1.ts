import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-014`,
  title: 'Excessive external resources',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.LOW,
  tags: ['crawl-budget', 'resources', 'performance'],
  priority: 10,
  description: 'Page loads too many external resources. This wastes crawl budget and slows down AI crawler processing.'
})
export class DuplicateH1Rule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const totalResources = $('script[src], link[href], img[src], iframe[src]').length;
    
    if (totalResources > 100) {
      return {
        id: `${CATEGORY.CRAWL}-014`,
        title: 'Excessive external resources',
        serverity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: `Page loads ${totalResources} external resources. This wastes crawl budget and slows down AI crawler processing.`,
        remediation: 'Consolidate resources, use sprite sheets, inline critical assets, and defer non-critical loads.',
        impactScore: 10,
        location: { url },
        evidence: [`Total external resources: ${totalResources}`],
        tags: ['crawl-budget', 'resources', 'performance'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
