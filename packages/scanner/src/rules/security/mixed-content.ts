import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-008`,
  title: 'Mixed content detected',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['security', 'mixed-content', 'https'],
  priority: 10,
  description: 'HTTPS page loading HTTP resource(s). Mixed content is blocked by browsers and raises security concerns.'
})
export class MixedContentRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for mixed content (HTTPS page loading HTTP resources)
    const isHttps = url.startsWith('https://');
    if (isHttps) {
      const httpResources = $('script[src^="http:"], link[href^="http:"], img[src^="http:"], iframe[src^="http:"]').length;
      if (httpResources > 0) {
        return {
          id: `${CATEGORY.TECH}-008`,
          title: 'Mixed content detected',
          severity: SEVERITY.HIGH,
          category: CATEGORY.TECH,
          description: `HTTPS page loading ${httpResources} HTTP resource(s). Mixed content is blocked by browsers and raises security concerns.`,
          remediation: 'Update all resource URLs to use HTTPS or protocol-relative URLs (//).',
          impactScore: 25,
          location: { url },
          evidence: [`HTTP resources on HTTPS page: ${httpResources}`],
          tags: ['security', 'mixed-content', 'https'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
