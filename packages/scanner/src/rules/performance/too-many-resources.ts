import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-001`,
  title: 'Excessive external scripts',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['performance', 'scripts', 'optimization'],
  priority: 14,
  description: 'Too many external resources slow down page loading and may impact AI crawler efficiency.'
})
export class TooManyResourcesRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for excessive external resources
    const externalScripts = $('script[src]').filter((_, el) => {
      const src = $(el).attr('src');
      return !!(src && (src.startsWith('http') || src.startsWith('//')));
    }).length;

    if (externalScripts > 10) {
      return {
        id: `${CATEGORY.TECH}-001`,
        title: 'Excessive external scripts',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `Found ${externalScripts} external script files. Too many external resources slow down page loading and may impact AI crawler efficiency.`,
        remediation: 'Bundle and minify scripts, consider lazy loading non-critical scripts, and reduce third-party dependencies.',
        impactScore: 15,
        location: { url },
        evidence: [`External scripts: ${externalScripts}`],
        tags: ['performance', 'scripts', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
