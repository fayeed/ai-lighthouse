import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-044`,
  title: 'External links missing rel attributes',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['links', 'security', 'best-practices'],
  priority: 11,
  description: 'Checks if external links have rel attributes to help AI understand link relationships.'
})
export class MissingNofollowExternalRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const currentDomain = new URL(url).hostname;

    // Check for external links without rel attributes
    const externalLinksNoRel = $('a[href^="http"]').filter((_, el) => {
      const href = $(el).attr('href');
      const rel = $(el).attr('rel');
      try {
        if (href) {
          const linkDomain = new URL(href).hostname;
          return linkDomain !== currentDomain && !rel;
        }
      } catch (e) {
        // Invalid URL
      }
      return false;
    }).length;

    if (externalLinksNoRel > 0) {
      return {
        id: `${CATEGORY.AIREAD}-044`,
        title: 'External links missing rel attributes',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${externalLinksNoRel} external link(s) without rel attributes. While not critical, rel attributes help AI understand link relationships.`,
        remediation: 'Add rel="noopener" for security, rel="nofollow" for untrusted links, or rel="sponsored" for paid links.',
        impactScore: 5,
        location: { url },
        evidence: [`External links without rel: ${externalLinksNoRel}`],
        tags: ['links', 'security', 'best-practices'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
