import { CATEGORY, Issue, SEVERITY, EFFORT_LEVEL, IMPACT_LEVEL } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-010`,
  title: 'Missing or invalid sitemap',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['sitemap', 'discoverability', 'seo', 'crawl-budget'],
  priority: 30,
  description: 'No valid sitemap.xml found or sitemap not referenced in robots.txt. AI crawlers rely on sitemaps for efficient content discovery.'
})
export class MissingSitemapRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, options } = ctx;
    const issues: Issue[] = [];

    try {
      // Parse the base URL
      const baseUrl = new URL(url);
      const origin = baseUrl.origin;

      // Check for sitemap.xml
      const sitemapUrl = `${origin}/sitemap.xml`;
      const robotsTxtUrl = `${origin}/robots.txt`;

      let sitemapExists = false;
      let sitemapInRobotsTxt = false;
      let robotsTxtExists = false;

      // Check if sitemap.xml exists
      try {
        const sitemapResponse = await fetch(sitemapUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(options?.timeoutMs || 5000)
        });

        if (sitemapResponse.ok) {
          sitemapExists = true;

          // Validate it's XML
          const contentType = sitemapResponse.headers.get('content-type') || '';
          if (!contentType.includes('xml') && !contentType.includes('text')) {
            issues.push({
              id: `${CATEGORY.CRAWL}-010-invalid`,
              title: 'Invalid sitemap content type',
              severity: SEVERITY.MEDIUM,
              category: CATEGORY.CRAWL,
              description: `Sitemap exists but has incorrect content-type: ${contentType}. Should be application/xml or text/xml.`,
              remediation: 'Ensure sitemap.xml is served with proper XML content-type headers.',
              impactScore: 15,
              effortLevel: EFFORT_LEVEL.QUICK,
              impactLevel: IMPACT_LEVEL.LOW,
              location: { url: sitemapUrl },
              evidence: [`Content-Type: ${contentType}`],
              tags: ['sitemap', 'content-type'],
              confidence: 1,
              timestamp: new Date().toISOString()
            } as Issue);
          }
        }
      } catch (error) {
        // Sitemap doesn't exist or timed out
      }

      // Check robots.txt for sitemap reference
      try {
        const robotsResponse = await fetch(robotsTxtUrl, {
          signal: AbortSignal.timeout(options?.timeoutMs || 5000)
        });

        if (robotsResponse.ok) {
          robotsTxtExists = true;
          const robotsTxt = await robotsResponse.text();

          // Check if sitemap is declared in robots.txt
          if (robotsTxt.toLowerCase().includes('sitemap:')) {
            sitemapInRobotsTxt = true;
          }
        }
      } catch (error) {
        // robots.txt doesn't exist or timed out
      }

      // Generate issues based on findings
      if (!sitemapExists) {
        issues.push({
          id: `${CATEGORY.CRAWL}-010`,
          title: 'Missing sitemap.xml',
          severity: SEVERITY.HIGH,
          category: CATEGORY.CRAWL,
          description: 'No sitemap.xml found at the standard location. AI crawlers and search engines use sitemaps to discover content efficiently.',
          remediation: 'Create a sitemap.xml file at the root of your domain listing all important pages. Include lastmod dates and priority hints.',
          impactScore: 30,
          effortLevel: EFFORT_LEVEL.EASY,
          impactLevel: IMPACT_LEVEL.MEDIUM,
          location: { url: sitemapUrl },
          evidence: ['No sitemap.xml found at /sitemap.xml'],
          tags: ['sitemap', 'discoverability', 'seo'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      if (robotsTxtExists && sitemapExists && !sitemapInRobotsTxt) {
        issues.push({
          id: `${CATEGORY.CRAWL}-010-not-in-robots`,
          title: 'Sitemap not declared in robots.txt',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'Sitemap exists but is not referenced in robots.txt. While not critical, declaring the sitemap in robots.txt helps crawlers discover it.',
          remediation: 'Add "Sitemap: https://yourdomain.com/sitemap.xml" to your robots.txt file.',
          impactScore: 15,
          effortLevel: EFFORT_LEVEL.QUICK,
          impactLevel: IMPACT_LEVEL.LOW,
          location: { url: robotsTxtUrl },
          evidence: ['Sitemap exists but not declared in robots.txt'],
          tags: ['sitemap', 'robots-txt', 'best-practice'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }

    } catch (error) {
      // URL parsing error or other issues - skip this rule
      return null;
    }

    return issues.length > 0 ? issues : null;
  }
}
