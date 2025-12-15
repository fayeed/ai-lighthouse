import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-010`,
  title: 'Missing meta description',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['meta', 'description', 'context'],
  priority: 8,
  description: 'Checks for meta description. Descriptions help AI agents understand page content and purpose.'
})
export class MissingMetaDescriptionRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.trim().length >= 50) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-010`,
      title: 'Missing or short meta description',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: 'The page lacks a proper meta description. Descriptions help AI agents understand page content and purpose.',
      remediation: 'Add a meta description tag with 150-160 characters that summarizes the page content.',
      impactScore: 20,
      location: { url },
      evidence: [`Description length: ${metaDesc?.length || 0} chars`],
      tags: ['meta', 'description', 'context'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
