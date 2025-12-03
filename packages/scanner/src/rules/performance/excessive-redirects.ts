import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-006`,
  title: 'Excessive iframes',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.LOW,
  tags: ['performance', 'iframes', 'complexity'],
  priority: 14,
  description: 'Multiple iframes can significantly slow down page load and complicate content extraction for AI.'
})
export class ExcessiveRedirectsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for iframes (can be resource-intensive)
    const iframes = $('iframe').length;
    
    if (iframes > 3) {
      return {
        id: `${CATEGORY.TECH}-006`,
        title: 'Excessive iframes',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${iframes} iframe elements. Multiple iframes can significantly slow down page load and complicate content extraction for AI.`,
        remediation: 'Reduce the number of iframes. Consider alternative approaches like lazy loading or direct content embedding.',
        impactScore: 12,
        location: { url },
        evidence: [`Iframes: ${iframes}`],
        tags: ['performance', 'iframes', 'complexity'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
