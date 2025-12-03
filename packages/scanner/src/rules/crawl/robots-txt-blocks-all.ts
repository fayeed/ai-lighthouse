import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-008`,
  title: 'Page has noindex directive',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['noindex', 'robots', 'indexing'],
  priority: 40,
  description: 'Meta robots tag contains "noindex". This prevents AI crawlers from indexing the page.'
})
export class RobotsTxtBlocksAllRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const robotsMetaTag = $('meta[name="robots"]').attr('content');
    
    if (!robotsMetaTag) {
      return null;
    }

    const noindex = robotsMetaTag.toLowerCase().includes('noindex');
    
    if (noindex) {
      return {
        id: `${CATEGORY.CRAWL}-008`,
        title: 'Page has noindex directive',
        serverity: SEVERITY.CRITICAL,
        category: CATEGORY.CRAWL,
        description: 'Meta robots tag contains "noindex". This prevents AI crawlers from indexing the page.',
        remediation: 'Remove "noindex" from meta robots tag if you want AI crawlers to index this page.',
        impactScore: 40,
        location: { url },
        evidence: [`Meta robots: ${robotsMetaTag}`],
        tags: ['noindex', 'robots', 'indexing'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
