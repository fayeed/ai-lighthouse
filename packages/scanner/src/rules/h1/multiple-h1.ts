import { Rule, RuleContext, BaseRule } from '../registry.js';
import { Issue, CATEGORY, SEVERITY } from '../../types.js';

@Rule({
  id: `${CATEGORY.AIREAD}-002`,
  title: 'Multiple H1 Headings',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['seo', 'accessibility'],
  priority: 10,
  description: 'Checks if the HTML document contains multiple H1 headings.'
})
export class MultipleH1Rule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { $, url } = ctx;
    const h1s = $('h1').filter((_, el) => $(el).text().trim().length > 0);
    
    if (h1s.length > 1) {
      const snippet = h1s.first().text().trim().slice(0, 200);
      return {
        id: `${CATEGORY.AIREAD}-002`,
        title: 'Multiple H1 Headings',
        severity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: `The HTML document contains multiple H1 headings (${h1s.length} found).`,
        remediation: 'Consider using a single H1 heading for better SEO practices.',
        impactScore: 20,
        location: { url, selector: 'h1', textSnippet: snippet },
        evidence: [`count: ${h1s.length}`],
        tags: ['seo', 'accessibility'],
        confidence: 0.95,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
