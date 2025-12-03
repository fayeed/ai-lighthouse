import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-020`,
  title: 'Missing internal links',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'navigation', 'structure'],
  priority: 10,
  description: 'Detects pages with insufficient internal linking. Internal links help AI understand site structure.'
})
export class MissingInternalLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const currentDomain = new URL(url).hostname;
    const mainContent = $('main, article, [role="main"]').first();
    const contentArea = mainContent.length > 0 ? mainContent : $('body');
    
    const allLinks = contentArea.find('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;

    allLinks.each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        if (href.startsWith('/') || href.startsWith('#')) {
          internalLinks++;
        } else {
          const linkUrl = new URL(href, url);
          if (linkUrl.hostname === currentDomain) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        }
      } catch (e) {
        // Invalid URL
      }
    });

    const wordCount = contentArea.text().split(/\s+/).length;
    
    // For pages with substantial content, expect at least some internal links
    if (wordCount > 500 && internalLinks === 0) {
      return {
        id: `${CATEGORY.AIREAD}-020`,
        title: 'Missing internal links',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'Page has substantial content but no internal links. Internal links help AI agents discover related content and understand site structure.',
        remediation: 'Add contextual internal links to related pages and resources on your site.',
        impactScore: 15,
        location: { url },
        evidence: [`Word count: ${wordCount}`, `Internal links: ${internalLinks}`, `External links: ${externalLinks}`],
        tags: ['links', 'navigation', 'structure'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
