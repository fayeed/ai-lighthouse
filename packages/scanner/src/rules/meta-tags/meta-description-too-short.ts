import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-011`,
  title: 'Meta description too short',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['meta', 'description', 'optimization'],
  priority: 8,
  description: 'Checks if meta description is too short to be effective.'
})
export class MetaDescriptionTooShortRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const metaDesc = $('meta[name="description"]').attr('content');
    if (!metaDesc || metaDesc.trim().length >= 50) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-011`,
      title: 'Meta description too short',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Meta description is only ${metaDesc.length} characters. Descriptions should be 150-160 characters for optimal context.`,
      remediation: 'Expand the meta description to 150-160 characters to provide better context.',
      impactScore: 10,
      location: { url },
      evidence: [`Description length: ${metaDesc.length} chars`],
      tags: ['meta', 'description', 'optimization'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
