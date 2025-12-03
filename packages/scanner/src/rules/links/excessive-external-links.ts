import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-043`,
  title: 'No internal links',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'internal-linking', 'site-structure'],
  priority: 11,
  description: 'Checks if the page has internal links to help AI crawlers discover and understand site structure.'
})
export class ExcessiveExternalLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const links = $('a[href]');
    
    // Analyze internal vs external links
    let internalLinks = 0;
    let externalLinks = 0;
    const currentDomain = new URL(url).hostname;

    links.each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
            internalLinks++;
          } else if (href.startsWith('http')) {
            const linkDomain = new URL(href).hostname;
            if (linkDomain === currentDomain) {
              internalLinks++;
            } else {
              externalLinks++;
            }
          } else {
            internalLinks++;
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    if (internalLinks === 0 && externalLinks > 0) {
      return {
        id: `${CATEGORY.AIREAD}-043`,
        title: 'No internal links',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page has no internal links. Internal linking helps AI crawlers discover and understand site structure.',
        remediation: 'Add internal links to related content, category pages, or navigation elements.',
        impactScore: 20,
        location: { url },
        evidence: [`Internal links: 0`, `External links: ${externalLinks}`],
        tags: ['links', 'internal-linking', 'site-structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
