import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-012`,
  title: 'Meta description too long',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['meta', 'description', 'optimization'],
  priority: 8,
  description: 'Checks if meta description exceeds recommended length.'
})
export class MetaDescriptionTooLongRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const metaDesc = $('meta[name="description"]').attr('content');
    if (!metaDesc || metaDesc.trim().length <= 160) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-012`,
      title: 'Meta description too long',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Meta description is ${metaDesc.length} characters. Descriptions over 160 characters may be truncated.`,
      remediation: 'Shorten the meta description to 150-160 characters while keeping key information.',
      impactScore: 8,
      location: { url },
      evidence: [`Description length: ${metaDesc.length} chars`],
      tags: ['meta', 'description', 'optimization'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
