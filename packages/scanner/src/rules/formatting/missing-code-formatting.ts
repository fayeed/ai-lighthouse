import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-026`,
  title: 'Code blocks missing semantic markup',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['code', 'semantic', 'formatting'],
  priority: 11,
  description: 'Detects code blocks without proper <code> element wrapping.'
})
export class MissingCodeFormattingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for code blocks with proper formatting
    const preBlocks = $('pre');
    
    if (preBlocks.length === 0) {
      return null;
    }

    let poorlyFormattedCode = 0;
    preBlocks.each((_, el) => {
      const pre = $(el);
      const hasCode = pre.find('code').length > 0;
      if (!hasCode && pre.text().trim().length > 50) {
        poorlyFormattedCode++;
      }
    });

    if (poorlyFormattedCode === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-026`,
      title: 'Code blocks missing semantic markup',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Found ${poorlyFormattedCode} <pre> block(s) without <code> elements. Wrapping code in <code> tags helps AI agents identify programming content.`,
      remediation: 'Wrap code content in <pre><code> tags instead of just <pre>. This semantic markup helps AI distinguish code from regular preformatted text.',
      impactScore: 10,
      location: { url, selector: 'pre' },
      evidence: [`Pre blocks without code tags: ${poorlyFormattedCode}`],
      tags: ['code', 'semantic', 'formatting'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
