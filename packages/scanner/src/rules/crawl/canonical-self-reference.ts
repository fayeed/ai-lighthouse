import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-004`,
  title: 'Canonical points to different URL',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['canonical', 'url', 'duplicate-content'],
  priority: 20,
  description: 'Canonical URL differs from current page URL. This tells AI crawlers to index a different URL.'
})
export class CanonicalSelfReferenceRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const canonical = $('link[rel="canonical"]').attr('href');
    
    if (!canonical) {
      return null;
    }

    try {
      const currentUrl = new URL(url);
      const canonicalUrl = new URL(canonical, url);
      
      if (currentUrl.href !== canonicalUrl.href) {
        return {
          id: `${CATEGORY.CRAWL}-004`,
          title: 'Canonical points to different URL',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'Canonical URL differs from current page URL. This tells AI crawlers to index a different URL.',
          remediation: 'Ensure canonical URL matches the current page URL unless intentionally consolidating duplicate content.',
          impactScore: 20,
          location: { url },
          evidence: [`Current: ${currentUrl.href}`, `Canonical: ${canonicalUrl.href}`],
          tags: ['canonical', 'url', 'duplicate-content'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    } catch (e) {
      // Invalid URL - handled by canonical-mismatch rule
      return null;
    }

    return null;
  }
}
