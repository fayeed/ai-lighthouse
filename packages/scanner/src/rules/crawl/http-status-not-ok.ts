import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-001`,
  title: 'HTTP status not OK',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['http', 'status', 'availability'],
  priority: 50,
  description: 'Page returned non-2xx or non-3xx HTTP status. AI crawlers cannot index pages with error status codes.'
})
export class HttpStatusNotOkRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, response } = ctx;

    if (!response) {
      return null;
    }

    const status = response.status;
    
    if (status < 200 || status >= 400) {
      return {
        id: `${CATEGORY.CRAWL}-001`,
        title: 'HTTP status not OK',
        severity: SEVERITY.CRITICAL,
        category: CATEGORY.CRAWL,
        description: `Page returned HTTP status ${status}. AI crawlers cannot index pages with non-2xx or 3xx status codes.`,
        remediation: 'Ensure the page returns a successful 2xx status code (typically 200 OK).',
        impactScore: 50,
        location: { url },
        evidence: [`HTTP Status: ${status}`],
        tags: ['http', 'status', 'availability'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
