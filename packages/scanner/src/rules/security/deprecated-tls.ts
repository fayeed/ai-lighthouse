import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-012`,
  title: 'External scripts without integrity checks',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['security', 'sri', 'scripts'],
  priority: 10,
  description: 'External script(s) without Subresource Integrity (SRI) checks. This poses security risks.'
})
export class DeprecatedTlsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for external scripts from potentially untrusted sources
    const externalScripts = $('script[src]');
    const untrustedDomains = ['unknown-cdn.com', 'suspicious-analytics.com']; // Example list
    let scriptsFromUntrustedSources = 0;
    
    externalScripts.each((_, el) => {
      const src = $(el).attr('src');
      const integrity = $(el).attr('integrity');
      
      if (src && src.startsWith('http') && !integrity) {
        scriptsFromUntrustedSources++;
      }
    });

    if (scriptsFromUntrustedSources > 0) {
      return {
        id: `${CATEGORY.TECH}-012`,
        title: 'External scripts without integrity checks',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `Found ${scriptsFromUntrustedSources} external script(s) without Subresource Integrity (SRI) checks. This poses security risks.`,
        remediation: 'Add integrity and crossorigin attributes to external script tags for SRI verification.',
        impactScore: 15,
        location: { url },
        evidence: [`Scripts without SRI: ${scriptsFromUntrustedSources}`],
        tags: ['security', 'sri', 'scripts'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
