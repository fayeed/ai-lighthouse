import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-009`,
  title: 'Page has nofollow directive',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['nofollow', 'robots', 'links'],
  priority: 30,
  description: 'Meta robots tag contains "nofollow". This prevents AI crawlers from following links on the page.'
})
export class RobotsMetaNoindexRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const robotsMetaTag = $('meta[name="robots"]').attr('content');
    
    if (!robotsMetaTag) {
      return null;
    }

    const nofollow = robotsMetaTag.toLowerCase().includes('nofollow');
    
    if (nofollow) {
      return {
        id: `${CATEGORY.CRAWL}-009`,
        title: 'Page has nofollow directive',
        severity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'Meta robots tag contains "nofollow". This prevents AI crawlers from following links on the page.',
        remediation: 'Remove "nofollow" from meta robots tag if you want AI crawlers to discover linked pages.',
        impactScore: 30,
        location: { url },
        evidence: [`Meta robots: ${robotsMetaTag}`],
        tags: ['nofollow', 'robots', 'links'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
