import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-041`,
  title: 'Link structure and navigation issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'navigation', 'crawlability'],
  priority: 11,
  description: 'Analyzes link structure for AI crawler navigation: internal links, external links, and link attributes.'
})
export class LinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    const links = $('a[href]');
    const totalLinks = links.length;

    if (totalLinks === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-041`,
        title: 'No links found',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page contains no links. This creates a dead-end for AI crawlers and limits content discoverability.',
        remediation: 'Add relevant internal and external links to improve navigation and content relationships.',
        impactScore: 30,
        location: { url },
        evidence: ['No <a href> elements found'],
        tags: ['links', 'navigation', 'crawlability'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
      return issues;
    }

    // Check for broken link patterns
    const emptyLinks = $('a[href=""], a[href="#"]').length;
    const javascriptLinks = $('a[href^="javascript:"]').length;
    
    if (emptyLinks > 0 || javascriptLinks > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-042`,
        title: 'Non-functional links detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${emptyLinks + javascriptLinks} link(s) with empty hrefs, "#", or javascript: URLs. AI crawlers cannot follow these links.`,
        remediation: 'Replace javascript: and empty href links with proper URLs. Use buttons for non-navigation actions.',
        impactScore: 15,
        location: { url },
        evidence: [
          `Empty/hash links: ${emptyLinks}`,
          `JavaScript links: ${javascriptLinks}`
        ],
        tags: ['links', 'crawlability', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

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
      issues.push({
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
      } as Issue);
    }

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
      issues.push({
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
      } as Issue);
    }

    // Check for link density (too many links can indicate spam)
    const bodyText = $('body').text().trim();
    const textLength = bodyText.length;
    const linkDensity = textLength > 0 ? (totalLinks / (textLength / 100)) : 0;

    if (linkDensity > 5) {
      issues.push({
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
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
