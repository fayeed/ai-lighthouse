import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-105`,
  title: 'Invalid fragment identifiers',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['fragments', 'links', 'navigation'],
  priority: 7,
  description: 'Links with fragment identifiers that don\'t exist on the page.'
})
export class InvalidFragmentIdentifiersRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Fragment identifier usage
    const fragmentLinks = $('a[href*="#"]').filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && href.includes('#') && href.split('#')[1].length > 0);
    });
    
    if (fragmentLinks.length > 0) {
      let invalidFragments = 0;
      fragmentLinks.each((_, el) => {
        const href = $(el).attr('href') || '';
        const fragment = href.split('#')[1];
        // Escape special characters in CSS selector
        const escapedFragment = fragment.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
        const target = $(`#${escapedFragment}, [name="${escapedFragment}"]`);
        if (target.length === 0) {
          invalidFragments++;
        }
      });
      
      if (invalidFragments > 0) {
        return {
          id: `${CATEGORY.AIREAD}-105`,
          title: 'Invalid fragment identifiers',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Found ${invalidFragments} link(s) with fragment identifiers that don't exist on the page.`,
          remediation: 'Ensure all # fragment links point to valid IDs or named anchors.',
          impactScore: 6,
          location: { url },
          evidence: [`Invalid fragments: ${invalidFragments}/${fragmentLinks.length}`],
          tags: ['fragments', 'links', 'navigation'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
