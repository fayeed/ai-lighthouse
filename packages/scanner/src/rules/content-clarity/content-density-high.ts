import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-090`,
  title: 'Content density too high',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['density', 'structure', 'formatting'],
  priority: 7,
  description: 'Content-to-code ratio is too high. May lack proper structure and formatting.'
})
export class ContentDensityHighRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Content density check
    const textLength = bodyText.replace(/\s+/g, ' ').trim().length;
    const htmlLength = $.html().length;
    const contentRatio = textLength / htmlLength;
    
    if (contentRatio > 0.6) {
      return {
        id: `${CATEGORY.AIREAD}-090`,
        title: 'Content density too high',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Content-to-code ratio is ${(contentRatio * 100).toFixed(1)}%. May lack proper structure and formatting.`,
        remediation: 'Add semantic HTML structure, headings, and formatting to improve organization.',
        impactScore: 8,
        location: { url },
        evidence: [`Content ratio: ${(contentRatio * 100).toFixed(1)}%`],
        tags: ['density', 'structure', 'formatting'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
