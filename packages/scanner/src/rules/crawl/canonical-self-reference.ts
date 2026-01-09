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

      // Normalize URLs for comparison:
      // - Remove trailing slashes from pathname
      // - Compare origin + pathname (ignore query params and hash as canonical often strips these)
      const normalizeUrl = (u: URL): string => {
        const pathname = u.pathname.replace(/\/+$/, '') || '/';
        return `${u.origin}${pathname}`.toLowerCase();
      };

      const normalizedCurrent = normalizeUrl(currentUrl);
      const normalizedCanonical = normalizeUrl(canonicalUrl);

      // If normalized URLs match, canonical is pointing to the same page
      if (normalizedCurrent === normalizedCanonical) {
        return null;
      }

      // Check if canonical is just the current URL without query params (valid use case)
      if (currentUrl.search && !canonicalUrl.search) {
        const currentWithoutQuery = `${currentUrl.origin}${currentUrl.pathname}`.toLowerCase().replace(/\/+$/, '') || '/';
        if (currentWithoutQuery === normalizedCanonical) {
          return null; // Canonical correctly points to clean URL without query params
        }
      }

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
    } catch (e) {
      // Invalid URL - handled by canonical-mismatch rule
      return null;
    }
  }
}
