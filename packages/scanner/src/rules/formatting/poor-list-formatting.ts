import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-025`,
  title: 'Poor list formatting',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['lists', 'semantic', 'structure'],
  priority: 11,
  description: 'Detects lists created with divs instead of proper list elements.'
})
export class PoorListFormattingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for fake lists (divs styled like lists)
    const possibleLists = $('div[class*="list"], div[class*="item"]');
    let fakeListCount = 0;
    
    possibleLists.each((_, el) => {
      const children = $(el).children('div[class*="item"]');
      if (children.length > 2) {
        fakeListCount++;
      }
    });

    if (fakeListCount === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-025`,
      title: 'Fake lists using divs',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${fakeListCount} potential list(s) created with <div> elements instead of proper <ul>/<ol> tags. AI agents may not recognize these as lists.`,
      remediation: 'Use semantic <ul> or <ol> elements for lists. This helps AI agents understand the content structure and relationship between items.',
      impactScore: 15,
      location: { url },
      evidence: [`Potential div-based lists: ${fakeListCount}`],
      tags: ['lists', 'semantic', 'structure'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
