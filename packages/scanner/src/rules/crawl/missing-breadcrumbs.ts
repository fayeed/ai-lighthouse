import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-011`,
  title: 'Invalid hreflang syntax',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['hreflang', 'validation', 'i18n'],
  priority: 15,
  description: 'Found hreflang tag(s) with invalid language codes. Use ISO 639-1 format (e.g., "en", "en-US").'
})
export class MissingBreadcrumbsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hreflangLinks = $('link[rel="alternate"][hreflang]');
    
    if (hreflangLinks.length === 0) {
      return null;
    }

    let invalidHreflang = 0;
    hreflangLinks.each((_, el) => {
      const hreflang = $(el).attr('hreflang');
      if (hreflang && hreflang !== 'x-default' && !/^[a-z]{2}(-[A-Z]{2})?$/.test(hreflang)) {
        invalidHreflang++;
      }
    });

    if (invalidHreflang > 0) {
      return {
        id: `${CATEGORY.CRAWL}-011`,
        title: 'Invalid hreflang syntax',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CRAWL,
        description: `Found ${invalidHreflang} hreflang tag(s) with invalid language codes. Use ISO 639-1 format (e.g., "en", "en-US").`,
        remediation: 'Correct hreflang values to use valid ISO 639-1 language codes.',
        impactScore: 15,
        location: { url },
        evidence: [`Invalid hreflang tags: ${invalidHreflang}`],
        tags: ['hreflang', 'validation', 'i18n'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
