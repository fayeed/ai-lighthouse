import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-041`,
  title: 'Link structure and navigation issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'navigation', 'crawlability'],
  priority: 11,
  description: 'Analyzes link structure for AI crawler navigation: internal links, external links, and link attributes.'
})
export class BrokenInternalLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    const links = $('a[href]');
    const totalLinks = links.length;

    if (totalLinks === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-041`,
        title: 'No links found',
        severity: SEVERITY.HIGH,
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
    }

    // Heuristic checks for obviously broken link patterns
    const localhostLinks: string[] = [];
    const placeholderLinks: string[] = [];

    links.each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;

      if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(href)) {
        localhostLinks.push(href);
      }

      if (/^https?:\/\/(www\.)?example\.(com|org|net)/i.test(href)) {
        placeholderLinks.push(href);
      }
    });

    if (localhostLinks.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-041-localhost`,
        title: 'Links pointing to localhost',
        severity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: `Found ${localhostLinks.length} link(s) pointing to localhost. These are inaccessible to users and crawlers.`,
        remediation: 'Replace localhost URLs with production URLs.',
        impactScore: 25,
        location: { url },
        evidence: localhostLinks.slice(0, 5),
        tags: ['links', 'broken', 'crawlability'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (placeholderLinks.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-041-placeholder`,
        title: 'Links pointing to placeholder domains',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${placeholderLinks.length} link(s) pointing to example.com or similar placeholder domains.`,
        remediation: 'Replace placeholder URLs with actual destination URLs.',
        impactScore: 15,
        location: { url },
        evidence: placeholderLinks.slice(0, 5),
        tags: ['links', 'broken', 'crawlability'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
