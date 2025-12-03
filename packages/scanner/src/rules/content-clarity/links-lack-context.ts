import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-102`,
  title: 'Internal links lack context',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['links', 'context', 'navigation'],
  priority: 7,
  description: 'Internal links with non-descriptive anchor text found.'
})
export class LinksLackContextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Internal link context
    const internalLinks = $('a[href^="/"], a[href^="' + new URL(url).origin + '"]');
    let linksWithoutContext = 0;
    
    internalLinks.each((_, el) => {
      const linkText = $(el).text().trim();
      if (linkText.length < 3 || /^(here|click|link|more)$/i.test(linkText)) {
        linksWithoutContext++;
      }
    });
    
    if (linksWithoutContext > 0) {
      return {
        id: `${CATEGORY.AIREAD}-102`,
        title: 'Internal links lack context',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${linksWithoutContext} internal link(s) with non-descriptive anchor text.`,
        remediation: 'Use descriptive anchor text that explains where the link leads.',
        impactScore: 8,
        location: { url },
        evidence: [`Links without context: ${linksWithoutContext}`],
        tags: ['links', 'context', 'navigation'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
