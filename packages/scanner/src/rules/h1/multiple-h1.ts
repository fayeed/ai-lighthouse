import { Rule, RuleContext, BaseRule } from '../registry.js';
import { Issue, CATEGORY, SEVERITY } from '../../types.js';

@Rule({
  id: `${CATEGORY.AIREAD}-002`,
  title: 'Multiple H1 Headings',
  category: CATEGORY.MISC, // Changed from AIREAD - not an AI issue
  defaultSeverity: SEVERITY.INFO,
  tags: ['seo', 'best-practice', 'legacy'],
  priority: 2,
  description: 'Checks if the HTML document contains multiple H1 headings. Note: This is a legacy SEO concern and does NOT affect AI readability.'
})
export class MultipleH1Rule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { $, url } = ctx;
    const h1s = $('h1').filter((_, el) => $(el).text().trim().length > 0);
    
    // Only flag if there are excessive H1s (more than 5), suggesting confusion
    if (h1s.length > 5) {
      const snippet = h1s.first().text().trim().slice(0, 200);
      return {
        id: `${CATEGORY.AIREAD}-002`,
        title: 'Multiple H1 Headings (Info Only)',
        severity: SEVERITY.INFO,
        category: CATEGORY.MISC,
        description: `The page has ${h1s.length} H1 headings. This is fine for AI systems and modern SEO. HTML5 allows multiple H1s when used with semantic sections. Only flagging for your awareness.`,
        remediation: 'Optional: If not using semantic HTML5 sectioning (article, section, nav), consider a single H1 for the main page topic. AI systems handle multiple H1s without issue.',
        impactScore: 2, // Minimal impact
        location: { url, selector: 'h1', textSnippet: snippet },
        evidence: [`count: ${h1s.length}`, '✅ AI systems handle this fine', '✅ HTML5 compliant'],
        tags: ['seo', 'best-practice', 'legacy'],
        confidence: 0.5, // Low confidence it's even an issue
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
