import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-001`,
  title: 'Crawlability and site navigation',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['crawlability', 'robots', 'sitemap', 'canonical'],
  priority: 5,
  description: 'Checks essential crawlability factors: robots.txt, sitemaps, canonical tags, redirects, and HTTP status.'
})
export class CrawlabilityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $, response } = ctx;
    const issues: Issue[] = [];

    // Check HTTP status
    if (response) {
      const status = response.status;
      
      if (status < 200 || status >= 400) {
        issues.push({
          id: `${CATEGORY.CRAWL}-001`,
          title: 'HTTP status not OK',
          serverity: SEVERITY.CRITICAL,
          category: CATEGORY.CRAWL,
          description: `Page returned HTTP status ${status}. AI crawlers cannot index pages with non-2xx or 3xx status codes.`,
          remediation: 'Ensure the page returns a successful 2xx status code (typically 200 OK).',
          impactScore: 50,
          location: { url },
          evidence: [`HTTP Status: ${status}`],
          tags: ['http', 'status', 'availability'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // Check for soft 404 (200 status but error content)
      const title = $('title').text().toLowerCase();
      const h1 = $('h1').first().text().toLowerCase();
      const isSoft404 = (title.includes('404') || title.includes('not found') || 
                        h1.includes('404') || h1.includes('not found')) && status === 200;
      
      if (isSoft404) {
        issues.push({
          id: `${CATEGORY.CRAWL}-002`,
          title: 'Soft 404 detected',
          serverity: SEVERITY.HIGH,
          category: CATEGORY.CRAWL,
          description: 'Page returns 200 OK but contains "404" or "not found" in title/heading. This confuses AI crawlers.',
          remediation: 'Return proper 404 status code for missing pages instead of 200 OK.',
          impactScore: 30,
          location: { url },
          evidence: [`HTTP Status: ${status}`, `Title: ${title.substring(0, 100)}`],
          tags: ['soft-404', 'status', 'error'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check canonical tag
    const canonical = $('link[rel="canonical"]').attr('href');
    
    if (!canonical) {
      issues.push({
        id: `${CATEGORY.CRAWL}-003`,
        title: 'Missing canonical tag',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'No canonical URL specified. This can cause duplicate content issues for AI crawlers.',
        remediation: 'Add <link rel="canonical" href="..."> to specify the preferred URL version.',
        impactScore: 25,
        location: { url },
        evidence: ['No canonical tag found'],
        tags: ['canonical', 'duplicate-content', 'seo'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    } else {
      // Check if canonical points to self
      try {
        const currentUrl = new URL(url);
        const canonicalUrl = new URL(canonical, url);
        
        if (currentUrl.href !== canonicalUrl.href) {
          issues.push({
            id: `${CATEGORY.CRAWL}-004`,
            title: 'Canonical points to different URL',
            serverity: SEVERITY.MEDIUM,
            category: CATEGORY.CRAWL,
            description: 'Canonical URL differs from current page URL. This tells AI crawlers to index a different URL.',
            remediation: 'Ensure canonical URL matches the current page URL unless intentionally consolidating duplicate content.',
            impactScore: 20,
            location: { url },
            evidence: [`Current: ${currentUrl.href}`, `Canonical: ${canonicalUrl.href}`],
            tags: ['canonical', 'url', 'duplicate-content'],
            confidence: 1,
            timestamp: new Date().toISOString()
          } as Issue);
        }

        // Check if canonical resolves (basic check)
        if (canonical.startsWith('http')) {
          // Could fetch it, but for now just validate format
          const validUrl = /^https?:\/\/.+/.test(canonical);
          if (!validUrl) {
            issues.push({
              id: `${CATEGORY.CRAWL}-005`,
              title: 'Invalid canonical URL format',
              serverity: SEVERITY.HIGH,
              category: CATEGORY.CRAWL,
              description: 'Canonical URL has invalid format. AI crawlers may ignore it.',
              remediation: 'Ensure canonical URL is a valid absolute URL (starts with http:// or https://).',
              impactScore: 22,
              location: { url },
              evidence: [`Canonical: ${canonical}`],
              tags: ['canonical', 'validation', 'url'],
              confidence: 1,
              timestamp: new Date().toISOString()
            } as Issue);
          }
        }
      } catch (e) {
        // Invalid URL
        issues.push({
          id: `${CATEGORY.CRAWL}-005`,
          title: 'Invalid canonical URL format',
          serverity: SEVERITY.HIGH,
          category: CATEGORY.CRAWL,
          description: 'Canonical URL cannot be parsed. AI crawlers may ignore it.',
          remediation: 'Ensure canonical URL is a valid absolute URL.',
          impactScore: 22,
          location: { url },
          evidence: [`Canonical: ${canonical}`],
          tags: ['canonical', 'validation', 'url'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for conflicting canonical and sitemap/robots
    const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
    if (canonical && robotsMeta.includes('noindex')) {
      issues.push({
        id: `${CATEGORY.CRAWL}-006`,
        title: 'Canonical and noindex conflict',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'Page has both canonical tag and noindex directive. This sends conflicting signals to AI crawlers.',
        remediation: 'Remove canonical tag from noindexed pages, or remove noindex if page should be indexed.',
        impactScore: 25,
        location: { url },
        evidence: [`Canonical: ${canonical}`, `Robots: ${robotsMeta}`],
        tags: ['canonical', 'noindex', 'conflict'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check sitemap references in robots meta or links
    const sitemapLinks = $('link[rel="sitemap"]');
    const hasSitemapLink = sitemapLinks.length > 0;
    
    if (!hasSitemapLink) {
      issues.push({
        id: `${CATEGORY.CRAWL}-007`,
        title: 'No sitemap reference in page',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CRAWL,
        description: 'No sitemap link found in page. While not required, sitemap references help AI crawlers discover content.',
        remediation: 'Add <link rel="sitemap" type="application/xml" href="/sitemap.xml"> to help crawlers find your sitemap.',
        impactScore: 15,
        location: { url },
        evidence: ['No sitemap link in HTML'],
        tags: ['sitemap', 'discovery', 'crawling'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check X-Robots-Tag equivalent (meta robots)
    const robotsMetaTag = $('meta[name="robots"]').attr('content');
    if (robotsMetaTag) {
      const noindex = robotsMetaTag.toLowerCase().includes('noindex');
      const nofollow = robotsMetaTag.toLowerCase().includes('nofollow');
      
      if (noindex) {
        issues.push({
          id: `${CATEGORY.CRAWL}-008`,
          title: 'Page has noindex directive',
          serverity: SEVERITY.CRITICAL,
          category: CATEGORY.CRAWL,
          description: 'Meta robots tag contains "noindex". This prevents AI crawlers from indexing the page.',
          remediation: 'Remove "noindex" from meta robots tag if you want AI crawlers to index this page.',
          impactScore: 40,
          location: { url },
          evidence: [`Meta robots: ${robotsMetaTag}`],
          tags: ['noindex', 'robots', 'indexing'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      if (nofollow) {
        issues.push({
          id: `${CATEGORY.CRAWL}-009`,
          title: 'Page has nofollow directive',
          serverity: SEVERITY.HIGH,
          category: CATEGORY.CRAWL,
          description: 'Meta robots tag contains "nofollow". This prevents AI crawlers from following links on the page.',
          remediation: 'Remove "nofollow" from meta robots tag if you want AI crawlers to discover linked pages.',
          impactScore: 30,
          location: { url },
          evidence: [`Meta robots: ${robotsMetaTag}`],
          tags: ['nofollow', 'robots', 'links'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for hreflang self-reference
    const hreflangLinks = $('link[rel="alternate"][hreflang]');
    if (hreflangLinks.length > 0) {
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
        issues.push({
          id: `${CATEGORY.CRAWL}-010`,
          title: 'Missing hreflang self-reference',
          serverity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description: 'Hreflang tags present but no self-reference found. This is a best practice for international SEO.',
          remediation: 'Add a self-referential hreflang link pointing to the current page in its own language.',
          impactScore: 10,
          location: { url },
          evidence: [`Hreflang tags: ${hreflangLinks.length}`, `Page lang: ${htmlLang || 'not set'}`],
          tags: ['hreflang', 'i18n', 'validation'],
          confidence: 0.8,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // Check for valid hreflang syntax
      let invalidHreflang = 0;
      hreflangLinks.each((_, el) => {
        const hreflang = $(el).attr('hreflang');
        if (hreflang && hreflang !== 'x-default' && !/^[a-z]{2}(-[A-Z]{2})?$/.test(hreflang)) {
          invalidHreflang++;
        }
      });

      if (invalidHreflang > 0) {
        issues.push({
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
        } as Issue);
      }
    }

    // Check redirect chains (if we have multiple redirects in URL)
    // This would require tracking redirects during fetch, but we can check for meta refresh
    const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
    if (metaRefresh) {
      const redirectCount = 1; // At least one redirect
      if (redirectCount > 0) {
        issues.push({
          id: `${CATEGORY.CRAWL}-012`,
          title: 'Meta refresh redirect detected',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'Page uses meta refresh redirect. AI crawlers prefer server-side 301/302 redirects for better performance.',
          remediation: 'Use server-side HTTP 301 or 302 redirects instead of meta refresh.',
          impactScore: 18,
          location: { url },
          evidence: [`Meta refresh: ${metaRefresh}`],
          tags: ['redirect', 'meta-refresh', 'performance'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check if homepage (for specific rules)
    const urlObj = new URL(url);
    const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';
    
    if (isHomepage) {
      // Check for proper homepage handling
      const hasH1 = $('h1').length > 0;
      if (!hasH1) {
        issues.push({
          id: `${CATEGORY.CRAWL}-013`,
          title: 'Homepage missing H1',
          serverity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description: 'Homepage has no H1 heading. This is important for AI crawlers to understand your site\'s purpose.',
          remediation: 'Add a clear H1 heading to your homepage describing your site or business.',
          impactScore: 12,
          location: { url },
          evidence: ['No H1 found on homepage'],
          tags: ['homepage', 'h1', 'structure'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for crawl budget optimization indicators
    const totalResources = $('script[src], link[href], img[src], iframe[src]').length;
    if (totalResources > 100) {
      issues.push({
        id: `${CATEGORY.CRAWL}-014`,
        title: 'Excessive external resources',
        serverity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: `Page loads ${totalResources} external resources. This wastes crawl budget and slows down AI crawler processing.`,
        remediation: 'Consolidate resources, use sprite sheets, inline critical assets, and defer non-critical loads.',
        impactScore: 10,
        location: { url },
        evidence: [`Total external resources: ${totalResources}`],
        tags: ['crawl-budget', 'resources', 'performance'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper pagination markup
    const prevLink = $('link[rel="prev"]').attr('href');
    const nextLink = $('link[rel="next"]').attr('href');
    const paginationLinks = $('a[href*="page="], a[href*="?p="], a[aria-label*="next" i], a[aria-label*="previous" i]').length;
    
    if (paginationLinks > 0 && !prevLink && !nextLink) {
      issues.push({
        id: `${CATEGORY.CRAWL}-015`,
        title: 'Pagination without rel prev/next',
        serverity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: 'Page appears to have pagination but lacks rel="prev"/rel="next" links. These help AI crawlers understand page sequences.',
        remediation: 'Add <link rel="prev" href="..."> and <link rel="next" href="..."> tags for paginated content.',
        impactScore: 8,
        location: { url },
        evidence: [`Pagination links found: ${paginationLinks}`],
        tags: ['pagination', 'navigation', 'crawling'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check if robots.txt blocks crawling (we'd need to fetch it)
    // For now, note that crawlers should check this
    if (!robotsMetaTag || !robotsMetaTag.toLowerCase().includes('noindex')) {
      // Page wants to be indexed, ensure it's crawlable
      const allowedByRobotsMeta = !robotsMetaTag || !robotsMetaTag.toLowerCase().includes('nofollow');
      if (allowedByRobotsMeta) {
        // This is good - page is crawlable
      }
    }

    return issues.length > 0 ? issues : null;
  }
}
