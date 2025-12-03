import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-034`,
  title: 'Missing language declaration',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['language', 'i18n', 'accessibility'],
  priority: 9,
  description: 'Checks for language declaration. Language helps AI agents apply appropriate language processing.'
})
export class MissingPrimaryLanguageRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | null> {
    const { url, $ } = ctx;

    // Check for language declaration
    const htmlLang = $('html').attr('lang');
    if (htmlLang) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-034`,
      title: 'Missing language declaration',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: 'The HTML element lacks a lang attribute. Language declaration helps AI agents apply appropriate language processing.',
      remediation: 'Add a lang attribute to the <html> element (e.g., lang="en" for English).',
      impactScore: 15,
      location: { url },
      evidence: ['No lang attribute on <html>'],
      tags: ['language', 'i18n', 'accessibility'],
      confidence: 1,
      timestamp: new Date().toISOString()
    };
  }
}
