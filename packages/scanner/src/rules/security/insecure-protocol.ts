import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-007`,
  title: 'Page not served over HTTPS',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['security', 'https', 'ssl'],
  priority: 10,
  description: 'The page is served over HTTP instead of HTTPS. Many AI crawlers prefer or require HTTPS for security.'
})
export class InsecureProtocolRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url } = ctx;

    // Check if URL is HTTPS
    const isHttps = url.startsWith('https://');
    if (!isHttps) {
      return {
        id: `${CATEGORY.TECH}-007`,
        title: 'Page not served over HTTPS',
        serverity: SEVERITY.CRITICAL,
        category: CATEGORY.TECH,
        description: 'The page is served over HTTP instead of HTTPS. Many AI crawlers prefer or require HTTPS for security.',
        remediation: 'Implement HTTPS with a valid SSL/TLS certificate. HTTPS is essential for modern web security.',
        impactScore: 35,
        location: { url },
        evidence: ['Protocol: HTTP'],
        tags: ['security', 'https', 'ssl'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
