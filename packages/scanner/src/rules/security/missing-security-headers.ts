import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-011`,
  title: 'Password inputs lacking proper autocomplete',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.LOW,
  tags: ['security', 'forms', 'autocomplete'],
  priority: 10,
  description: 'Password input(s) without proper autocomplete attributes. This affects password manager integration.'
})
export class MissingSecurityHeadersRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for password inputs without autocomplete
    const passwordInputs = $('input[type="password"]');
    let passwordsWithoutAutocomplete = 0;
    
    passwordInputs.each((_, el) => {
      const autocomplete = $(el).attr('autocomplete');
      if (!autocomplete || (autocomplete !== 'current-password' && autocomplete !== 'new-password')) {
        passwordsWithoutAutocomplete++;
      }
    });

    if (passwordsWithoutAutocomplete > 0) {
      return {
        id: `${CATEGORY.TECH}-011`,
        title: 'Password inputs lacking proper autocomplete',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${passwordsWithoutAutocomplete} password input(s) without proper autocomplete attributes. This affects password manager integration.`,
        remediation: 'Add autocomplete="current-password" or autocomplete="new-password" to password inputs.',
        impactScore: 5,
        location: { url, selector: 'input[type="password"]' },
        evidence: [`Password inputs without autocomplete: ${passwordsWithoutAutocomplete}`],
        tags: ['security', 'forms', 'autocomplete'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
