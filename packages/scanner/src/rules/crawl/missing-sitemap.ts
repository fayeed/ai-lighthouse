import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-007`,
  title: 'No sitemap reference in page',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['sitemap', 'discovery', 'crawling'],
  priority: 15,
  description: 'No sitemap link found in page. While not required, sitemap references help AI crawlers discover content.'
})
export class MissingSitemapRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const sitemapLinks = $('link[rel="sitemap"]');
    const hasSitemapLink = sitemapLinks.length > 0;
    
    if (!hasSitemapLink) {
      return {
        id: `${CATEGORY.CRAWL}-007`,
        title: 'No sitemap reference in page',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CRAWL,
        description: 'No sitemap link found in page. While not required, sitemap references help AI crawlers discover content.',
        remediation: 'Add <link rel="sitemap" type="application/xml" href="/sitemap.xml"> to help crawlers find your sitemap.',
        impactScore: 15,
        location: { url },
        evidence: ['No sitemap link in HTML'],
        tags: ['sitemap', 'discovery', 'crawling'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
