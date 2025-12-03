import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-029`,
  title: 'Missing search functionality',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['search', 'navigation', 'usability'],
  priority: 9,
  description: 'Checks for site search functionality which helps AI agents discover content.'
})
export class MissingSearchFunctionalityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for search input fields
    const searchInputs = $('input[type="search"], input[name*="search" i], input[id*="search" i], [role="search"]');
    if (searchInputs.length > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-029`,
      title: 'Missing search functionality',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: 'The page lacks visible search functionality. Search helps AI agents discover and understand site content.',
      remediation: 'Add a search input with role="search" or type="search" to help users and AI agents find content.',
      impactScore: 8,
      location: { url },
      evidence: ['No search input found'],
      tags: ['search', 'navigation', 'usability'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    };
  }
}
