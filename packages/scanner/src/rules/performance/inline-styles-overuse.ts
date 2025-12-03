import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-004`,
  title: 'Large HTML document size',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['performance', 'size', 'optimization'],
  priority: 14,
  description: 'Large HTML files slow down initial page load and consume more crawl budget.'
})
export class InlineStylesOveruseRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, html } = ctx;

    // Check HTML size
    const htmlSize = Buffer.byteLength(html, 'utf8');
    const htmlSizeKB = Math.round(htmlSize / 1024);
    
    if (htmlSizeKB > 100) {
      return {
        id: `${CATEGORY.TECH}-004`,
        title: 'Large HTML document size',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `HTML document is ${htmlSizeKB}KB. Large HTML files slow down initial page load and consume more crawl budget.`,
        remediation: 'Reduce HTML size by removing unnecessary markup, inline styles, and comments. Consider code splitting or pagination.',
        impactScore: 20,
        location: { url },
        evidence: [`HTML size: ${htmlSizeKB}KB`],
        tags: ['performance', 'size', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
