import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-015`,
  title: 'Broken heading hierarchy',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['headings', 'hierarchy', 'structure'],
  priority: 12,
  description: 'Detects skipped heading levels. Proper heading hierarchy helps AI agents understand content structure.'
})
export class ImproperHeadingHierarchyRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check heading hierarchy
    const headings = $('h1, h2, h3, h4, h5, h6');
    const headingLevels = headings.map((_, el) => {
      const tagName = $(el).prop('tagName');
      return tagName ? parseInt(tagName.substring(1)) : 0;
    }).get().filter(level => level > 0);
    
    if (headingLevels.length === 0) {
      return null;
    }

    let hasSkippedLevel = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        hasSkippedLevel = true;
        break;
      }
    }

    if (!hasSkippedLevel) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-015`,
      title: 'Broken heading hierarchy',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: 'The page has skipped heading levels (e.g., h1 to h3 without h2). A proper heading hierarchy helps AI agents understand content structure.',
      remediation: 'Ensure heading levels follow sequential order: h1 → h2 → h3. Don\'t skip levels in the hierarchy.',
      impactScore: 15,
      location: { url },
      evidence: [`Heading levels found: ${headingLevels.join(', ')}`],
      tags: ['headings', 'hierarchy', 'structure'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
