/**
 * Robots.txt Parser
 * Parses and respects robots.txt rules for crawling
 */

export interface RobotsTxtRules {
  allowedPaths: string[];
  disallowedPaths: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

export interface RobotsParseResult {
  accessible: boolean;
  rules: RobotsTxtRules;
  raw?: string;
}

/**
 * Fetch and parse robots.txt for a domain
 */
export async function fetchRobotsTxt(
  baseUrl: string,
  userAgent: string = 'Lighthouse-Scanner'
): Promise<RobotsParseResult> {
  try {
    const url = new URL('/robots.txt', baseUrl);
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        accessible: false,
        rules: { allowedPaths: ['*'], disallowedPaths: [], sitemaps: [] },
      };
    }

    const text = await response.text();
    return {
      accessible: true,
      rules: parseRobotsTxt(text, userAgent),
      raw: text,
    };
  } catch (error) {
    return {
      accessible: false,
      rules: { allowedPaths: ['*'], disallowedPaths: [], sitemaps: [] },
    };
  }
}

/**
 * Parse robots.txt content
 */
export function parseRobotsTxt(content: string, userAgent: string): RobotsTxtRules {
  const lines = content.split('\n').map(l => l.trim());
  const rules: RobotsTxtRules = {
    allowedPaths: [],
    disallowedPaths: [],
    sitemaps: [],
  };

  let isRelevantUserAgent = false;
  let hasSpecificUserAgent = false;

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line) continue;

    const [directive, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    if (!directive || !value) continue;

    const directiveLower = directive.toLowerCase().trim();

    // Handle User-agent directive
    if (directiveLower === 'user-agent') {
      const agent = value.toLowerCase();
      if (agent === '*' && !hasSpecificUserAgent) {
        isRelevantUserAgent = true;
      } else if (agent === userAgent.toLowerCase() || userAgent.toLowerCase().includes(agent)) {
        isRelevantUserAgent = true;
        hasSpecificUserAgent = true;
        // Reset rules for specific user agent
        rules.allowedPaths = [];
        rules.disallowedPaths = [];
      } else if (hasSpecificUserAgent) {
        // We found our specific agent, ignore others
        isRelevantUserAgent = false;
      }
      continue;
    }

    // Only process rules for relevant user agent
    if (!isRelevantUserAgent) continue;

    switch (directiveLower) {
      case 'allow':
        rules.allowedPaths.push(value);
        break;
      case 'disallow':
        if (value) rules.disallowedPaths.push(value);
        break;
      case 'crawl-delay':
        const delay = parseFloat(value);
        if (!isNaN(delay)) rules.crawlDelay = delay;
        break;
      case 'sitemap':
        rules.sitemaps.push(value);
        break;
    }
  }

  return rules;
}

/**
 * Check if a path is allowed by robots.txt rules
 */
export function isPathAllowed(path: string, rules: RobotsTxtRules): boolean {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Check disallowed paths first (more specific rules take precedence)
  let isDisallowed = false;
  let longestDisallowMatch = 0;

  for (const pattern of rules.disallowedPaths) {
    if (matchesPattern(normalizedPath, pattern)) {
      if (pattern.length > longestDisallowMatch) {
        longestDisallowMatch = pattern.length;
        isDisallowed = true;
      }
    }
  }

  // Check allowed paths (can override disallowed)
  let longestAllowMatch = 0;

  for (const pattern of rules.allowedPaths) {
    if (matchesPattern(normalizedPath, pattern)) {
      if (pattern.length > longestAllowMatch) {
        longestAllowMatch = pattern.length;
      }
    }
  }

  // Longer match wins, allow takes precedence on tie
  if (longestAllowMatch >= longestDisallowMatch) {
    return true;
  }

  return !isDisallowed;
}

/**
 * Simple pattern matching for robots.txt rules
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\$/g, '$') + (pattern.endsWith('$') ? '' : '.*')
    );
    return regex.test(path);
  }

  // Handle end anchor
  if (pattern.endsWith('$')) {
    return path === pattern.slice(0, -1);
  }

  // Simple prefix match
  return path.startsWith(pattern);
}

/**
 * Extract sitemap URLs from robots.txt
 */
export async function fetchSitemapUrls(
  sitemapUrl: string,
  maxUrls: number = 1000
): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return [];

    const text = await response.text();
    const urls: string[] = [];

    // Check if it's a sitemap index
    if (text.includes('<sitemapindex')) {
      const sitemapMatches = text.matchAll(/<loc>([^<]+)<\/loc>/g);
      for (const match of sitemapMatches) {
        if (urls.length >= maxUrls) break;
        // Recursively fetch child sitemaps
        const childUrls = await fetchSitemapUrls(match[1], maxUrls - urls.length);
        urls.push(...childUrls);
      }
    } else {
      // Regular sitemap
      const urlMatches = text.matchAll(/<loc>([^<]+)<\/loc>/g);
      for (const match of urlMatches) {
        if (urls.length >= maxUrls) break;
        urls.push(match[1]);
      }
    }

    return urls;
  } catch (error) {
    return [];
  }
}
