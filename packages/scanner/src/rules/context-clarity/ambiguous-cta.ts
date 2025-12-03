import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-030`,
  title: 'Ambiguous call-to-action elements',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['cta', 'clarity', 'usability'],
  priority: 9,
  description: 'Detects call-to-action elements with unclear or generic text.'
})
export class AmbiguousCtaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for buttons with generic text
    const buttons = $('button, a.button, a.btn, [role="button"]');
    const genericPhrases = ['click here', 'click', 'submit', 'go', 'ok'];
    const vagueButtons: string[] = [];

    buttons.each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (genericPhrases.includes(text)) {
        vagueButtons.push(text);
      }
    });

    if (vagueButtons.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-030`,
      title: 'Ambiguous call-to-action elements',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${vagueButtons.length} button(s) with generic text like "click" or "submit". Clear CTA text helps AI agents understand actions.`,
      remediation: 'Use descriptive button text that explains the action: "Download PDF", "Subscribe to Newsletter", etc.',
      impactScore: 12,
      location: { url },
      evidence: [`Generic buttons: ${vagueButtons.slice(0, 3).join(', ')}`],
      tags: ['cta', 'clarity', 'usability'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    };
  }
}
