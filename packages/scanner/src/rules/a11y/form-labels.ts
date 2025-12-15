import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-002`,
  title: 'Form inputs without labels',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['forms', 'labels', 'accessibility'],
  priority: 12,
  description: 'Checks that form inputs have associated labels to help AI agents understand form purpose.'
})
export class FormLabelsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const inputs = $('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, select');
    let inputsWithoutLabels = 0;
    
    inputs.each((_, el) => {
      const input = $(el);
      const id = input.attr('id');
      const ariaLabel = input.attr('aria-label');
      const ariaLabelledby = input.attr('aria-labelledby');
      const hasLabel = id && $(`label[for="${id}"]`).length > 0;
      
      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        inputsWithoutLabels++;
      }
    });

    if (inputsWithoutLabels > 0) {
      return {
        id: `${CATEGORY.A11Y}-002`,
        title: 'Form inputs without labels',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.A11Y,
        description: `Found ${inputsWithoutLabels} form input(s) without associated labels or ARIA labels. Labels help AI agents understand form purpose and context.`,
        remediation: 'Add <label> elements associated with inputs via for/id attributes, or use aria-label/aria-labelledby attributes.',
        impactScore: 15,
        location: { url, selector: 'input, textarea, select' },
        evidence: [`Unlabeled inputs: ${inputsWithoutLabels}`],
        tags: ['forms', 'labels', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
