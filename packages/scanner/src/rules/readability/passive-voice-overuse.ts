import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-048`,
  title: 'No text emphasis used',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['emphasis', 'content', 'semantic'],
  priority: 13,
  description: 'Checks for proper use of emphasis elements to help AI identify important concepts and keywords.'
})
export class PassiveVoiceOveruseRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for proper use of emphasis (strong, em)
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const strongTags = $('strong, b').length;
    const emTags = $('em, i').length;
    const totalWords = mainContent.split(/\s+/).length;
    
    if (totalWords > 500 && strongTags === 0 && emTags === 0) {
      return {
        id: `${CATEGORY.AIREAD}-048`,
        title: 'No text emphasis used',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content lacks emphasis elements (<strong>, <em>). Emphasis helps AI identify important concepts and keywords.',
        remediation: 'Use <strong> for important content and <em> for emphasis. This helps AI understand which parts are most significant.',
        impactScore: 5,
        location: { url },
        evidence: [`Word count: ${totalWords}`, 'No emphasis elements found'],
        tags: ['emphasis', 'content', 'semantic'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
