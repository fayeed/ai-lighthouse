import { Rule, RuleContext, BaseRule } from '../registry.js';
import { Issue, CATEGORY, SEVERITY } from '../../types.js';

@Rule({
  id: `${CATEGORY.AIREAD}-001`,
  title: 'Missing H1',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['seo', 'accessibility'],
  priority: 10,
  description: 'Checks if the HTML document contains at least one H1 heading.'
})
export class MissingH1Rule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { $, url } = ctx;
    const h1s = $('h1').filter((_, el) => $(el).text().trim().length > 0);
    
    if (h1s.length === 0) {
      return {
        id: `${CATEGORY.AIREAD}-001`,
        title: 'Missing H1',
        serverity: SEVERITY.CRITICAL,
        category: CATEGORY.AIREAD,
        description: 'The HTML document does not contain any H1 headings.',
        remediation: 'Add at least one H1 heading to the HTML document to improve accessibility and SEO.',
        impactScore: 40,
        location: { url },
        evidence: ['No <h1> tags found in the document.'],
        tags: ['seo', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
