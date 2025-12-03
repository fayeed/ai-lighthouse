import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-002`,
  title: 'Excessive external stylesheets',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.LOW,
  tags: ['performance', 'css', 'optimization'],
  priority: 14,
  description: 'Multiple CSS files increase page load time.'
})
export class RenderBlockingResourcesRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const externalStyles = $('link[rel="stylesheet"][href]').filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && (href.startsWith('http') || href.startsWith('//')));
    }).length;

    if (externalStyles > 5) {
      return {
        id: `${CATEGORY.TECH}-002`,
        title: 'Excessive external stylesheets',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${externalStyles} external stylesheet files. Multiple CSS files increase page load time.`,
        remediation: 'Combine CSS files, consider critical CSS inlining, and minimize external stylesheet requests.',
        impactScore: 10,
        location: { url },
        evidence: [`External stylesheets: ${externalStyles}`],
        tags: ['performance', 'css', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
