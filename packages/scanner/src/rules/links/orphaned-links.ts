import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-045`,
  title: 'High link density',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['links', 'spam-signals', 'quality'],
  priority: 11,
  description: 'Checks if link density is too high, which may be seen as spammy by AI crawlers.'
})
export class OrphanedLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const links = $('a[href]');
    const totalLinks = links.length;

    // Check for link density (too many links can indicate spam)
    const bodyText = $('body').text().trim();
    const textLength = bodyText.length;
    const linkDensity = textLength > 0 ? (totalLinks / (textLength / 100)) : 0;

    if (linkDensity > 5) {
      return {
        id: `${CATEGORY.AIREAD}-045`,
        title: 'High link density',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Link density is ${linkDensity.toFixed(2)} links per 100 characters. High link density may be seen as spammy by AI crawlers.`,
        remediation: 'Reduce the number of links relative to content. Focus on high-value, relevant links.',
        impactScore: 10,
        location: { url },
        evidence: [
          `Total links: ${totalLinks}`,
          `Text length: ${textLength} chars`,
          `Density: ${linkDensity.toFixed(2)} links/100 chars`
        ],
        tags: ['links', 'spam-signals', 'quality'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
