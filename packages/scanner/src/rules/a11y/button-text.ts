import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-003`,
  title: 'Buttons without accessible text',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['buttons', 'accessibility', 'labels'],
  priority: 12,
  description: 'Checks that buttons have text or ARIA labels so AI agents can understand their purpose.'
})
export class ButtonTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const buttons = $('button, [role="button"]');
    let buttonsWithoutText = 0;
    
    buttons.each((_, el) => {
      const button = $(el);
      const text = button.text().trim();
      const ariaLabel = button.attr('aria-label');
      const ariaLabelledby = button.attr('aria-labelledby');
      const title = button.attr('title');
      
      if (!text && !ariaLabel && !ariaLabelledby && !title) {
        buttonsWithoutText++;
      }
    });

    if (buttonsWithoutText > 0) {
      return {
        id: `${CATEGORY.A11Y}-003`,
        title: 'Buttons without accessible text',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.A11Y,
        description: `Found ${buttonsWithoutText} button(s) without text or ARIA labels. AI agents need text to understand button purpose.`,
        remediation: 'Add visible text to buttons, or use aria-label attribute for icon-only buttons.',
        impactScore: 15,
        location: { url, selector: 'button' },
        evidence: [`Buttons without text: ${buttonsWithoutText}`],
        tags: ['buttons', 'accessibility', 'labels'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
