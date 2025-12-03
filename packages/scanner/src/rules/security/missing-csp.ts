import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-009`,
  title: 'No Content Security Policy',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.LOW,
  tags: ['security', 'csp', 'headers'],
  priority: 10,
  description: 'No CSP meta tag detected. Content Security Policy helps prevent XSS attacks and signals security awareness to crawlers.'
})
export class MissingCspRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for security-related headers (via meta tags)
    const cspMeta = $('meta[http-equiv="Content-Security-Policy"]').length;
    
    // Note: These are more reliably checked via HTTP headers, but we can detect meta tag usage
    if (cspMeta === 0) {
      return {
        id: `${CATEGORY.TECH}-009`,
        title: 'No Content Security Policy',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: 'No CSP meta tag detected. Content Security Policy helps prevent XSS attacks and signals security awareness to crawlers.',
        remediation: 'Implement Content-Security-Policy header or meta tag to enhance security.',
        impactScore: 10,
        location: { url },
        evidence: ['No CSP detected in meta tags'],
        tags: ['security', 'csp', 'headers'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
