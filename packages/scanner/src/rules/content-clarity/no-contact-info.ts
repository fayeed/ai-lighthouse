import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-098`,
  title: 'No contact information',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['contact', 'trust', 'information'],
  priority: 7,
  description: 'Page lacks visible contact information (email, phone, or contact links).'
})
export class NoContactInfoRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Contact info present
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText);
    const hasPhone = /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/.test(bodyText);
    const hasContactLink = $('a[href^="mailto:"], a[href^="tel:"]').length > 0;
    
    if (!hasEmail && !hasPhone && !hasContactLink) {
      return {
        id: `${CATEGORY.AIREAD}-098`,
        title: 'No contact information',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page lacks visible contact information (email, phone, or contact links).',
        remediation: 'Add contact information to improve trust and AI understanding of your organization.',
        impactScore: 8,
        location: { url },
        evidence: ['No email, phone, or contact links found'],
        tags: ['contact', 'trust', 'information'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
