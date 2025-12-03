import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-049`,
  title: 'Unstructured lists detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['lists', 'structure', 'semantic'],
  priority: 13,
  description: 'Detects plain text lists that should be converted to semantic HTML lists.'
})
export class ComplexWordsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for proper list usage vs fake lists
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const lists = $('ul, ol').length;
    
    // Look for patterns that should be lists but aren't
    const potentialListPatterns = mainContent.match(/(\n|^)[\d]+\.\s|\n[-•*]\s/g);
    const potentialListCount = potentialListPatterns ? potentialListPatterns.length : 0;
    
    if (potentialListCount > 3 && lists === 0) {
      return {
        id: `${CATEGORY.AIREAD}-049`,
        title: 'Unstructured lists detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${potentialListCount} potential list items using bullets or numbers in plain text. These should be proper HTML lists.`,
        remediation: 'Convert plain text lists (using -, •, or 1., 2., etc.) to semantic <ul> or <ol> elements.',
        impactScore: 15,
        location: { url },
        evidence: [`Potential list items: ${potentialListCount}`],
        tags: ['lists', 'structure', 'semantic'],
        confidence: 0.75,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
