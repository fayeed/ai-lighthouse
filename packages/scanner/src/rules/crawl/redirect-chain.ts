import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-002`,
  title: 'Soft 404 detected',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['soft-404', 'status', 'error'],
  priority: 30,
  description: 'Page returns 200 OK but contains "404" or "not found" content. This confuses AI crawlers.'
})
export class RedirectChainRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $, response } = ctx;

    if (!response) {
      return null;
    }

    const status = response.status;
    const title = $('title').text().toLowerCase();
    const h1 = $('h1').first().text().toLowerCase();
    const isSoft404 = (title.includes('404') || title.includes('not found') || 
                      h1.includes('404') || h1.includes('not found')) && status === 200;
    
    if (isSoft404) {
      return {
        id: `${CATEGORY.CRAWL}-002`,
        title: 'Soft 404 detected',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'Page returns 200 OK but contains "404" or "not found" in title/heading. This confuses AI crawlers.',
        remediation: 'Return proper 404 status code for missing pages instead of 200 OK.',
        impactScore: 30,
        location: { url },
        evidence: [`HTTP Status: ${status}`, `Title: ${title.substring(0, 100)}`],
        tags: ['soft-404', 'status', 'error'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
