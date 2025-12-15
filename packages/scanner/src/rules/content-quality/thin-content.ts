import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-018`,
  title: 'Thin content detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['quality', 'content', 'value'],
  priority: 10,
  description: 'Detects pages with insufficient content. Thin content provides little value to AI agents.'
})
export class ThinContentRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const mainContent = $('main, article, [role="main"]').first();
    const contentArea = mainContent.length > 0 ? mainContent : $('body');
    const text = contentArea.text().trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount >= 300) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-018`,
      title: 'Thin content detected',
      severity: SEVERITY.HIGH,
      category: CATEGORY.AIREAD,
      description: `Page contains only ${wordCount} words of content. Thin content provides little value to AI agents and users.`,
      remediation: 'Add substantial, valuable content to the page. Aim for at least 300 words of meaningful content.',
      impactScore: 25,
      location: { url },
      evidence: [`Word count: ${wordCount}`],
      tags: ['quality', 'content', 'value'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
