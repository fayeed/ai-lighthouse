import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-052`,
  title: 'Quotes not properly marked up',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['quotes', 'semantic', 'markup'],
  priority: 13,
  description: 'Checks that quotations are properly marked up with semantic quote elements.'
})
export class InconsistentHeadingLevelsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for proper quote usage
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const quotes = $('q, blockquote').length;
    const quoteMarks = mainContent.match(/["'""].*?["'""]|«.*?»/g);
    const quoteMarkCount = quoteMarks ? quoteMarks.length : 0;
    
    if (quoteMarkCount > 3 && quotes === 0) {
      return {
        id: `${CATEGORY.AIREAD}-052`,
        title: 'Quotes not properly marked up',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${quoteMarkCount} quotation(s) using quote marks but no <q> or <blockquote> elements. Semantic quote markup helps AI identify quoted content.`,
        remediation: 'Use <q> for inline quotes and <blockquote> for longer quotations instead of plain quote marks.',
        impactScore: 5,
        location: { url },
        evidence: [`Quote marks found: ${quoteMarkCount}`, `Semantic quotes: ${quotes}`],
        tags: ['quotes', 'semantic', 'markup'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
