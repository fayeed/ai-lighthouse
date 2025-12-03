import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-104`,
  title: 'Intrusive popups detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['popups', 'ux', 'accessibility'],
  priority: 8,
  description: 'Multiple popup/modal elements detected. These interfere with AI crawling.'
})
export class IntrusivePopupsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // No popups detected
    const popupIndicators = $('[class*="popup" i], [class*="modal" i], [class*="overlay" i]').filter((_, el) => {
      const display = $(el).css('display');
      const visibility = $(el).css('visibility');
      return display !== 'none' && visibility !== 'hidden';
    });
    
    if (popupIndicators.length > 2) {
      return {
        id: `${CATEGORY.AIREAD}-104`,
        title: 'Intrusive popups detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${popupIndicators.length} popup/modal elements. These interfere with AI crawling.`,
        remediation: 'Minimize popups and ensure they don\'t block content from crawlers.',
        impactScore: 15,
        location: { url },
        evidence: [`Popup elements: ${popupIndicators.length}`],
        tags: ['popups', 'ux', 'accessibility'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
