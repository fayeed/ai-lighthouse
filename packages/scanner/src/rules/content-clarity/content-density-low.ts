import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-089`,
  title: 'Content density too low',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['density', 'content-ratio', 'quality'],
  priority: 8,
  description: 'Content-to-code ratio is too low. Too much markup relative to content.'
})
export class ContentDensityLowRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Content density check
    const textLength = bodyText.replace(/\s+/g, ' ').trim().length;
    const htmlLength = $.html().length;
    const contentRatio = textLength / htmlLength;
    
    if (contentRatio < 0.1) {
      return {
        id: `${CATEGORY.AIREAD}-089`,
        title: 'Content density too low',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content-to-code ratio is ${(contentRatio * 100).toFixed(1)}%. Too much markup relative to content.`,
        remediation: 'Increase text content or reduce excessive HTML markup/scripts.',
        impactScore: 15,
        location: { url },
        evidence: [`Content ratio: ${(contentRatio * 100).toFixed(1)}%`, 'Optimal: >10%'],
        tags: ['density', 'content-ratio', 'quality'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
