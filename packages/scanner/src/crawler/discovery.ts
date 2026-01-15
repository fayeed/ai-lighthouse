/**
 * Link Discovery
 * Extracts and filters internal links from HTML
 */

import type { CheerioAPI } from 'cheerio';

export interface DiscoveredLink {
  url: string;
  text: string;
  rel?: string;
  isNavigation: boolean;
  isFooter: boolean;
  priority: number;
}

export interface DiscoveryOptions {
  baseUrl: string;
  includeSubdomains: boolean;
  excludePatterns: RegExp[];
  maxLinksPerPage: number;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|tar|gz|mp4|mp3|wav|avi|mov)$/i,
  /\.(xml|rss|atom)$/i, // Exclude XML/RSS/Atom feed files
  /^mailto:/i,
  /^tel:/i,
  /^javascript:/i,
  /^#/,
  /\?.*page=/i, // Pagination links (often duplicates)
  /\/feed(\/|$)/i,
  /\/rss(\/|\.xml|$)/i,
  /\/atom(\/|\.xml|$)/i,
  /sitemap.*\.xml$/i, // Exclude sitemap files
];

/**
 * Discover internal links from HTML
 */
export function discoverLinks(
  $: CheerioAPI,
  options: Partial<DiscoveryOptions> = {}
): DiscoveredLink[] {
  const config: DiscoveryOptions = {
    baseUrl: '',
    includeSubdomains: false,
    excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
    maxLinksPerPage: 100,
    ...options,
  };

  if (!config.baseUrl) {
    throw new Error('baseUrl is required for link discovery');
  }

  const baseHost = new URL(config.baseUrl).hostname;
  const links: DiscoveredLink[] = [];
  const seenUrls = new Set<string>();

  $('a[href]').each((_, el) => {
    if (links.length >= config.maxLinksPerPage) return;

    const href = $(el).attr('href');
    if (!href) return;

    // Resolve relative URLs
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, config.baseUrl).toString();
    } catch {
      return; // Invalid URL
    }

    // Check if internal
    const linkHost = new URL(absoluteUrl).hostname;
    const isInternal = config.includeSubdomains
      ? linkHost.endsWith(baseHost) || baseHost.endsWith(linkHost)
      : linkHost === baseHost;

    if (!isInternal) return;

    // Check exclude patterns
    for (const pattern of config.excludePatterns) {
      if (pattern.test(absoluteUrl)) return;
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(absoluteUrl);
    if (seenUrls.has(normalizedUrl)) return;
    seenUrls.add(normalizedUrl);

    // Determine link context
    const parent = $(el).parent();
    const grandparent = parent.parent();
    const isNavigation =
      $(el).closest('nav, [role="navigation"]').length > 0 ||
      parent.is('nav') ||
      grandparent.is('nav');
    const isFooter =
      $(el).closest('footer, [role="contentinfo"]').length > 0 ||
      parent.is('footer') ||
      grandparent.is('footer');
    const isHeader =
      $(el).closest('header, [role="banner"]').length > 0;
    const isMain =
      $(el).closest('main, article, [role="main"]').length > 0;

    // Calculate priority based on link context
    let priority = 0;
    if (isMain) priority += 10; // Content links are most valuable
    if (isNavigation && !isFooter) priority += 5; // Nav links are important
    if (isHeader) priority += 3;
    if (isFooter) priority -= 5; // Footer links are often less important

    const rel = $(el).attr('rel') || '';
    if (rel.includes('nofollow')) priority -= 10;

    links.push({
      url: normalizedUrl,
      text: $(el).text().trim().slice(0, 100),
      rel: rel || undefined,
      isNavigation,
      isFooter,
      priority,
    });
  });

  // Sort by priority
  return links.sort((a, b) => b.priority - a.priority);
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    // Remove common tracking params
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_content');
    parsed.searchParams.delete('utm_term');
    parsed.searchParams.delete('ref');
    parsed.searchParams.delete('source');

    let normalized = parsed.toString();
    // Remove trailing slash (except for root)
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Extract likely important pages from navigation
 */
export function extractNavigationPages($: CheerioAPI, baseUrl: string): string[] {
  const navLinks: string[] = [];
  const seenUrls = new Set<string>();

  // Primary navigation
  $('nav a[href], header a[href], [role="navigation"] a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      const linkHost = new URL(absoluteUrl).hostname;
      const baseHost = new URL(baseUrl).hostname;

      if (linkHost === baseHost && !seenUrls.has(absoluteUrl)) {
        seenUrls.add(absoluteUrl);
        navLinks.push(absoluteUrl);
      }
    } catch {
      // Invalid URL
    }
  });

  return navLinks;
}

/**
 * Common page patterns to prioritize
 */
export const PRIORITY_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/features',
  '/products',
  '/services',
  '/contact',
  '/blog',
  '/docs',
  '/documentation',
  '/help',
  '/support',
  '/faq',
];

/**
 * Check if URL matches priority paths
 */
export function isPriorityPath(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return PRIORITY_PATHS.some(p => pathname === p || pathname === p + '/');
  } catch {
    return false;
  }
}
