import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-028`,
  title: 'Missing structured navigation',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['navigation', 'semantic', 'structure'],
  priority: 9,
  description: 'Checks for proper navigation structure to help AI agents understand site organization.'
})
export class MissingStructuredNavigationRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | null> {
    const { url, $ } = ctx;

    // Check for navigation elements
    const nav = $('nav');
    if (nav.length > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-028`,
      title: 'Missing structured navigation',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: 'The page lacks a <nav> element. Structured navigation helps AI agents understand site organization.',
      remediation: 'Wrap your main navigation in a <nav> element to provide semantic structure.',
      impactScore: 15,
      location: { url },
      evidence: ['No <nav> element found'],
      tags: ['navigation', 'semantic', 'structure'],
      confidence: 1,
      timestamp: new Date().toISOString()
    };
  }
}
