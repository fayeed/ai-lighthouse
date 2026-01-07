import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-013`,
  title: 'Missing alternative access methods',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.LOW,
  tags: ['api', 'rss', 'atom', 'alternative-access', 'data-access'],
  priority: 15,
  description: 'No RSS/Atom feeds or API endpoints detected. Alternative access methods make content more accessible to AI systems and aggregators.'
})
export class MissingAlternativeAccessRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    let hasRss = false;
    let hasAtom = false;
    let hasApi = false;
    const foundFeeds: string[] = [];
    const foundApis: string[] = [];

    // 1. Check for RSS/Atom feed links in <head>
    const rssLinks = $('link[type="application/rss+xml"]');
    const atomLinks = $('link[type="application/atom+xml"]');

    if (rssLinks.length > 0) {
      hasRss = true;
      rssLinks.each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).attr('title');
        if (href) {
          foundFeeds.push(`RSS: ${href}${title ? ` (${title})` : ''}`);
        }
      });
    }

    if (atomLinks.length > 0) {
      hasAtom = true;
      atomLinks.each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).attr('title');
        if (href) {
          foundFeeds.push(`Atom: ${href}${title ? ` (${title})` : ''}`);
        }
      });
    }

    // 2. Check for common feed URLs (heuristic)
    const baseUrl = new URL(url);
    const origin = baseUrl.origin;

    const commonFeedPaths = [
      '/feed',
      '/feed.xml',
      '/rss',
      '/rss.xml',
      '/atom.xml',
      '/feeds/posts/default',
      '/blog/feed',
      '/news/feed'
    ];

    // We won't actually fetch these (performance), but check if they're linked
    const allLinks = $('a[href]');
    const linkedFeeds: Set<string> = new Set();

    allLinks.each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const lowerHref = href.toLowerCase();
        if (
          lowerHref.includes('/feed') ||
          lowerHref.includes('/rss') ||
          lowerHref.includes('/atom') ||
          lowerHref.endsWith('.xml')
        ) {
          linkedFeeds.add(href);
        }
      }
    });

    if (linkedFeeds.size > 0) {
      hasRss = true; // Assume at least one is a feed
      linkedFeeds.forEach((feed) => {
        foundFeeds.push(`Linked feed: ${feed}`);
      });
    }

    // 3. Check for API indicators
    const apiIndicators = [
      '/api',
      '/v1/',
      '/v2/',
      '/v3/',
      '/graphql',
      '/rest/',
      'api.',
      '/swagger',
      '/openapi'
    ];

    const text = $('body').text().toLowerCase();
    const htmlContent = $.html().toLowerCase();

    // Check links for API endpoints
    allLinks.each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();

      if (
        apiIndicators.some((indicator) => href.includes(indicator)) ||
        text.includes('api') ||
        text.includes('developer')
      ) {
        hasApi = true;
        foundApis.push(href);
      }
    });

    // Check for API documentation mentions
    if (
      text.includes('api documentation') ||
      text.includes('api docs') ||
      text.includes('developer api') ||
      text.includes('rest api') ||
      text.includes('graphql')
    ) {
      hasApi = true;
      foundApis.push('API documentation mentioned in content');
    }

    // Check for common API meta tags or headers
    const apiMetaTags = $('meta[name="api"], meta[property="api"], link[rel="api"]');
    if (apiMetaTags.length > 0) {
      hasApi = true;
      apiMetaTags.each((_, el) => {
        const content = $(el).attr('content') || $(el).attr('href') || '';
        if (content) {
          foundApis.push(`API meta tag: ${content}`);
        }
      });
    }

    // 4. Generate issues based on findings
    const isLikelyBlogOrNews =
      $('article').length > 0 ||
      text.includes('blog') ||
      text.includes('news') ||
      $('[class*="blog"], [class*="post"], [class*="article"]').length > 3;

    if (!hasRss && !hasAtom && isLikelyBlogOrNews) {
      issues.push({
        id: `${CATEGORY.CRAWL}-013`,
        title: 'Missing RSS/Atom feed',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.CRAWL,
        description:
          'No RSS or Atom feed detected. This appears to be a blog or news site. Feeds make content easily accessible to AI aggregators and RSS readers.',
        remediation:
          'Create an RSS or Atom feed and link it in the <head> section: <link rel="alternate" type="application/rss+xml" title="Feed" href="/feed.xml">',
        impactScore: 20,
        location: { url },
        evidence: ['No RSS/Atom feed links found', 'Site appears to publish content regularly'],
        tags: ['rss', 'atom', 'feeds', 'syndication'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (!hasRss && !hasAtom && !isLikelyBlogOrNews) {
      issues.push({
        id: `${CATEGORY.CRAWL}-013-no-feed`,
        title: 'No content feeds available',
        severity: SEVERITY.INFO,
        category: CATEGORY.CRAWL,
        description:
          'No RSS or Atom feed detected. If this site publishes regularly updated content, consider adding a feed.',
        remediation:
          'If you publish content regularly (blog posts, news, updates), create an RSS or Atom feed to improve discoverability.',
        impactScore: 8,
        location: { url },
        evidence: ['No RSS/Atom feed links found'],
        tags: ['rss', 'atom', 'feeds', 'best-practice'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (!hasApi) {
      const isDataSite =
        text.includes('data') ||
        text.includes('statistics') ||
        text.includes('database') ||
        $('table').length > 3;

      if (isDataSite) {
        issues.push({
          id: `${CATEGORY.CRAWL}-013-no-api`,
          title: 'No API access available',
          severity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description:
            'Site appears to contain structured data but no API endpoint is advertised. APIs enable programmatic access for AI systems and developers.',
          remediation:
            'Consider providing a REST or GraphQL API for programmatic access to your data. Document it prominently.',
          impactScore: 15,
          location: { url },
          evidence: ['No API endpoints found', 'Site appears to contain structured data'],
          tags: ['api', 'data-access', 'structured-data'],
          confidence: 0.6,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Positive reinforcement - if feeds found, note them
    if ((hasRss || hasAtom) && foundFeeds.length > 0) {
      issues.push({
        id: `${CATEGORY.CRAWL}-013-feeds-found`,
        title: 'Content feeds available',
        severity: SEVERITY.INFO,
        category: CATEGORY.CRAWL,
        description: `${foundFeeds.length} feed(s) detected. This improves content accessibility for AI systems.`,
        remediation: 'Ensure feeds are kept up-to-date and include full content when possible.',
        impactScore: 0,
        location: { url },
        evidence: foundFeeds.slice(0, 5), // Limit evidence to first 5
        tags: ['rss', 'atom', 'feeds', 'positive'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (hasApi && foundApis.length > 0) {
      issues.push({
        id: `${CATEGORY.CRAWL}-013-api-found`,
        title: 'API access available',
        severity: SEVERITY.INFO,
        category: CATEGORY.CRAWL,
        description: 'API endpoint(s) detected. This enables programmatic access for AI systems.',
        remediation: 'Ensure API documentation is comprehensive and includes rate limits and authentication details.',
        impactScore: 0,
        location: { url },
        evidence: foundApis.slice(0, 5), // Limit evidence to first 5
        tags: ['api', 'data-access', 'positive'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
