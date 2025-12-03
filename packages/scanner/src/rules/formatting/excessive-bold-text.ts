import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-022`,
  title: 'Excessive bold text',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['formatting', 'emphasis', 'readability'],
  priority: 11,
  description: 'Detects overuse of bold text which reduces emphasis effectiveness.'
})
export class ExcessiveBoldTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const boldElements = $('strong, b');
    const totalText = $('body').text().trim();
    let boldText = '';

    boldElements.each((_, el) => {
      boldText += $(el).text();
    });

    if (boldElements.length === 0) {
      return null;
    }

    const boldRatio = boldText.length / Math.max(totalText.length, 1);

    if (boldRatio > 0.15) {
      return {
        id: `${CATEGORY.AIREAD}-022`,
        title: 'Excessive bold text',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `${(boldRatio * 100).toFixed(1)}% of text is bold. Overuse of bold reduces its effectiveness for emphasis.`,
        remediation: 'Reserve bold text for truly important content. Consider using headings or other semantic markup instead.',
        impactScore: 8,
        location: { url },
        evidence: [`Bold ratio: ${(boldRatio * 100).toFixed(1)}%`, `Bold elements: ${boldElements.length}`],
        tags: ['formatting', 'emphasis', 'readability'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
