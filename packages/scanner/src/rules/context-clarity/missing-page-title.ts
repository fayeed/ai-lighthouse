import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-035`,
  title: 'Missing or inadequate page title',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['title', 'metadata', 'context'],
  priority: 9,
  description: 'Checks for proper page title. Page titles provide essential context for AI agents.'
})
export class MissingPageTitleRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for page title
    const title = $('title').text().trim();
    if (title && title.length >= 3) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-028`,
      title: 'Missing or inadequate page title',
      severity: SEVERITY.HIGH,
      category: CATEGORY.AIREAD,
      description: 'The page lacks a proper <title> element. Page titles provide essential context for AI agents.',
      remediation: 'Add a descriptive <title> element that clearly describes the page content. Aim for 50-60 characters.',
      impactScore: 25,
      location: { url },
      evidence: [`Title: "${title || 'none'}"`],
      tags: ['title', 'metadata', 'context'],
      confidence: 1,
      timestamp: new Date().toISOString()
    };
  }
}
