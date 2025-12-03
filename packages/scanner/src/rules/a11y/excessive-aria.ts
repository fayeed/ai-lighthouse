import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-007`,
  title: 'Excessive ARIA usage',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.LOW,
  tags: ['aria', 'semantic', 'best-practices'],
  priority: 12,
  description: 'Checks for overuse of ARIA attributes that can add noise for AI parsing.'
})
export class ExcessiveAriaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const elementsWithAria = $('[aria-label], [aria-labelledby], [aria-describedby], [role]').length;
    const totalElements = $('*').length;
    const ariaRatio = totalElements > 0 ? (elementsWithAria / totalElements) : 0;

    if (ariaRatio > 0.3) {
      return {
        id: `${CATEGORY.A11Y}-007`,
        title: 'Excessive ARIA usage',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `${(ariaRatio * 100).toFixed(1)}% of elements have ARIA attributes. Overuse of ARIA can add noise for AI parsing.`,
        remediation: 'Use semantic HTML5 elements instead of ARIA roles where possible. ARIA should supplement, not replace, semantic HTML.',
        impactScore: 5,
        location: { url },
        evidence: [
          `Elements with ARIA: ${elementsWithAria}`,
          `Total elements: ${totalElements}`,
          `Ratio: ${(ariaRatio * 100).toFixed(1)}%`
        ],
        tags: ['aria', 'semantic', 'best-practices'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
