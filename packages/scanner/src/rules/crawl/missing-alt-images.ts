import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-015`,
  title: 'Pagination without rel prev/next',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.LOW,
  tags: ['pagination', 'navigation', 'crawling'],
  priority: 8,
  description: 'Page appears to have pagination but lacks rel="prev"/rel="next" links. These help AI crawlers understand page sequences.'
})
export class MissingAltImagesRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const prevLink = $('link[rel="prev"]').attr('href');
    const nextLink = $('link[rel="next"]').attr('href');
    const paginationLinks = $('a[href*="page="], a[href*="?p="], a[aria-label*="next" i], a[aria-label*="previous" i]').length;
    
    if (paginationLinks > 0 && !prevLink && !nextLink) {
      return {
        id: `${CATEGORY.CRAWL}-015`,
        title: 'Pagination without rel prev/next',
        serverity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: 'Page appears to have pagination but lacks rel="prev"/rel="next" links. These help AI crawlers understand page sequences.',
        remediation: 'Add <link rel="prev" href="..."> and <link rel="next" href="..."> tags for paginated content.',
        impactScore: 8,
        location: { url },
        evidence: [`Pagination links found: ${paginationLinks}`],
        tags: ['pagination', 'navigation', 'crawling'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
