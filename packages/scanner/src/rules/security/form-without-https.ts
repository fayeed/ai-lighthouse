import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-010`,
  title: 'Forms submitting to HTTP',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['security', 'forms', 'https'],
  priority: 10,
  description: 'Form(s) submitting to HTTP URLs. This exposes user data and signals poor security practices.'
})
export class FormWithoutHttpsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for forms without HTTPS action
    const forms = $('form[action]');
    let insecureForms = 0;
    
    forms.each((_, el) => {
      const action = $(el).attr('action');
      if (action && action.startsWith('http://')) {
        insecureForms++;
      }
    });

    if (insecureForms > 0) {
      return {
        id: `${CATEGORY.TECH}-010`,
        title: 'Forms submitting to HTTP',
        severity: SEVERITY.CRITICAL,
        category: CATEGORY.TECH,
        description: `Found ${insecureForms} form(s) submitting to HTTP URLs. This exposes user data and signals poor security practices.`,
        remediation: 'Update form actions to use HTTPS URLs to protect user data in transit.',
        impactScore: 30,
        location: { url, selector: 'form[action^="http:"]' },
        evidence: [`Insecure forms: ${insecureForms}`],
        tags: ['security', 'forms', 'https'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
