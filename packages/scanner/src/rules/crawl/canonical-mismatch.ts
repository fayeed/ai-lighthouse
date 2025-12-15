import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-005`,
  title: 'Invalid canonical URL format',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['canonical', 'validation', 'url'],
  priority: 22,
  description: 'Canonical URL has invalid format or cannot be parsed. AI crawlers may ignore it.'
})
export class CanonicalMismatchRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const canonical = $('link[rel="canonical"]').attr('href');
    
    if (!canonical) {
      return null;
    }

    try {
      const currentUrl = new URL(url);
      const canonicalUrl = new URL(canonical, url);
      
      // Check if canonical resolves (basic check)
      if (canonical.startsWith('http')) {
        const validUrl = /^https?:\/\/.+/.test(canonical);
        if (!validUrl) {
          return {
            id: `${CATEGORY.CRAWL}-005`,
            title: 'Invalid canonical URL format',
            severity: SEVERITY.HIGH,
            category: CATEGORY.CRAWL,
            description: 'Canonical URL has invalid format. AI crawlers may ignore it.',
            remediation: 'Ensure canonical URL is a valid absolute URL (starts with http:// or https://).',
            impactScore: 22,
            location: { url },
            evidence: [`Canonical: ${canonical}`],
            tags: ['canonical', 'validation', 'url'],
            confidence: 1,
            timestamp: new Date().toISOString()
          } as Issue;
        }
      }
    } catch (e) {
      return {
        id: `${CATEGORY.CRAWL}-005`,
        title: 'Invalid canonical URL format',
        severity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'Canonical URL cannot be parsed. AI crawlers may ignore it.',
        remediation: 'Ensure canonical URL is a valid absolute URL.',
        impactScore: 22,
        location: { url },
        evidence: [`Canonical: ${canonical}`],
        tags: ['canonical', 'validation', 'url'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
