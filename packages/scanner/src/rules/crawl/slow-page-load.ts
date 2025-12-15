import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-010`,
  title: 'Missing hreflang self-reference',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.LOW,
  tags: ['hreflang', 'i18n', 'validation'],
  priority: 10,
  description: 'Hreflang tags present but no self-reference found. This is a best practice for international SEO.'
})
export class SlowPageLoadRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hreflangLinks = $('link[rel="alternate"][hreflang]');
    
    if (hreflangLinks.length === 0) {
      return null;
    }

    const htmlLang = $('html').attr('lang');
    const hasSelfRef = hreflangLinks.filter((_, el) => {
      const hreflang = $(el).attr('hreflang');
      const href = $(el).attr('href');
      try {
        const linkUrl = new URL(href || '', url);
        const currentUrl = new URL(url);
        return (hreflang === htmlLang || hreflang === 'x-default') && 
               linkUrl.pathname === currentUrl.pathname;
      } catch {
        return false;
      }
    }).length > 0;

    if (!hasSelfRef) {
      return {
        id: `${CATEGORY.CRAWL}-010`,
        title: 'Missing hreflang self-reference',
        severity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: 'Hreflang tags present but no self-reference found. This is a best practice for international SEO.',
        remediation: 'Add a self-referential hreflang link pointing to the current page in its own language.',
        impactScore: 10,
        location: { url },
        evidence: [`Hreflang tags: ${hreflangLinks.length}`, `Page lang: ${htmlLang || 'not set'}`],
        tags: ['hreflang', 'i18n', 'validation'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
