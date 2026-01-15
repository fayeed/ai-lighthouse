/**
 * Site Crawler
 * Crawls multiple pages of a website and aggregates results
 */

import { CheerioAPI } from 'cheerio';
import { ScanResult, ScanOptions, Issue } from '../types.js';
import { fetchHtml, parseHtml } from '../utils.js';
import { analyzeUrlWithRules } from '../scanWithRules.js';
import { CrawlQueue, CrawlQueueOptions } from './queue.js';
import { fetchRobotsTxt, isPathAllowed, fetchSitemapUrls, RobotsTxtRules } from './robots.js';
import { discoverLinks, extractNavigationPages, isPriorityPath } from './discovery.js';

export interface CrawlOptions extends Omit<Partial<ScanOptions>, 'onProgress'> {
  maxPages: number;
  maxDepth: number;
  maxConcurrency: number;
  crawlDelay: number;
  respectRobotsTxt: boolean;
  includeSitemap: boolean;
  includeSubdomains: boolean;
  excludePatterns?: string[];
  priorityPaths?: string[];
  onPageComplete?: (result: PageCrawlResult) => void;
  onProgress?: (progress: CrawlProgress) => void;
}

export interface PageCrawlResult {
  url: string;
  depth: number;
  success: boolean;
  scanResult?: ScanResult;
  error?: string;
  linksDiscovered: number;
  crawlTime: number;
}

export interface CrawlProgress {
  pagesCompleted: number;
  pagesFailed: number;
  pagesRemaining: number;
  totalPages: number;
  currentUrl?: string;
  percentComplete: number;
  estimatedTimeRemaining?: number;
}

export interface CrawlResult {
  startUrl: string;
  domain: string;
  startTime: number;
  endTime: number;
  duration: number;

  // Page results
  pages: PageCrawlResult[];
  pagesScanned: number;
  pagesFailed: number;

  // Aggregated scores
  aggregatedScores: {
    overall: number;
    seo: number;
    pseo: number;
    aeo: number;
    geo: number;
    aiReadiness: number;
  };

  // Site-wide issues (deduplicated and prioritized)
  siteIssues: SiteIssue[];

  // Aggregated analysis
  siteAnalysis: {
    totalLinks: { internal: number; external: number; broken: number };
    totalImages: { total: number; withAlt: number; withoutAlt: number };
    schemaTypes: string[];
    commonIssues: { issue: string; count: number; severity: string }[];
    topRecommendations: string[];
  };

  // Robots.txt info
  robotsTxt: {
    accessible: boolean;
    crawlDelay?: number;
    sitemaps: string[];
  };
}

export interface SiteIssue extends Issue {
  affectedPages: string[];
  occurrence: number;
}

const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxPages: 50,
  maxDepth: 3,
  maxConcurrency: 3,
  crawlDelay: 1000,
  respectRobotsTxt: true,
  includeSitemap: true,
  includeSubdomains: false,
  enableLLM: false, // Disable LLM for crawls by default (expensive)
  enableHallucinationDetection: false,
  minImpactScore: 5,
  minConfidence: 0.6,
};

/**
 * Crawl a website and analyze multiple pages
 */
export async function crawlSite(
  startUrl: string,
  options: Partial<CrawlOptions> = {}
): Promise<CrawlResult> {
  const config = { ...DEFAULT_CRAWL_OPTIONS, ...options };
  const startTime = Date.now();

  // Parse base URL
  const baseUrl = new URL(startUrl);
  const domain = baseUrl.hostname;

  // Initialize queue
  const queue = new CrawlQueue({
    maxConcurrency: config.maxConcurrency,
    maxDepth: config.maxDepth,
    maxUrls: config.maxPages,
    crawlDelay: config.crawlDelay,
  });

  // Fetch and parse robots.txt
  let robotsRules: RobotsTxtRules = { allowedPaths: ['*'], disallowedPaths: [], sitemaps: [] };
  let robotsAccessible = false;

  if (config.respectRobotsTxt) {
    const robotsResult = await fetchRobotsTxt(baseUrl.origin);
    robotsAccessible = robotsResult.accessible;
    robotsRules = robotsResult.rules;

    if (robotsRules.crawlDelay) {
      queue.setCrawlDelay(robotsRules.crawlDelay);
    }
  }

  // Add start URL
  queue.add(startUrl, 0, 100);

  // Fetch sitemap URLs if enabled
  if (config.includeSitemap) {
    // Use sitemaps from robots.txt, or fallback to standard /sitemap.xml location
    const sitemapUrls = robotsRules.sitemaps.length > 0
      ? robotsRules.sitemaps
      : [`${baseUrl.origin}/sitemap.xml`];

    for (const sitemapUrl of sitemapUrls.slice(0, 3)) {
      const urls = await fetchSitemapUrls(sitemapUrl, config.maxPages);
      for (const url of urls) {
        try {
          const pathname = new URL(url).pathname;
          if (isPathAllowed(pathname, robotsRules)) {
            const priority = isPriorityPath(url) ? 40 : 20;
            queue.add(url, 1, priority);
          }
        } catch {
          // Invalid URL
        }
      }
    }
  }

  // Crawl pages
  const pageResults: PageCrawlResult[] = [];
  const excludePatterns = (config.excludePatterns || []).map(p => new RegExp(p, 'i'));

  const reportProgress = () => {
    const stats = queue.stats;
    const progress: CrawlProgress = {
      pagesCompleted: stats.completed,
      pagesFailed: stats.failed,
      pagesRemaining: stats.pending,
      totalPages: Math.min(stats.total, config.maxPages),
      percentComplete: Math.round((stats.completed / Math.min(stats.total, config.maxPages)) * 100),
    };
    config.onProgress?.(progress);
  };

  // Process queue
  while (!queue.isComplete && pageResults.length < config.maxPages) {
    const item = await queue.next();
    if (!item) {
      // Wait a bit and try again if there are still pending items
      if (queue.hasPending) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      break;
    }

    const pageStartTime = Date.now();

    try {
      // Check robots.txt
      const pathname = new URL(item.url).pathname;
      if (config.respectRobotsTxt && !isPathAllowed(pathname, robotsRules)) {
        queue.complete(item.url);
        continue;
      }

      // Check exclude patterns
      if (excludePatterns.some(p => p.test(item.url))) {
        queue.complete(item.url);
        continue;
      }

      // Report progress
      reportProgress();

      // Scan the page
      const scanResult = await analyzeUrlWithRules(item.url, {
        ...config,
        onProgress: (step, progress) => {
          config.onProgress?.({
            pagesCompleted: queue.stats.completed,
            pagesFailed: queue.stats.failed,
            pagesRemaining: queue.stats.pending,
            totalPages: Math.min(queue.stats.total, config.maxPages),
            currentUrl: item.url,
            percentComplete: Math.round(
              ((queue.stats.completed + progress / 100) / Math.min(queue.stats.total, config.maxPages)) * 100
            ),
          });
        },
      });

      // Discover links from this page
      const html = await fetchHtml(item.url, config.timeoutMs || 15000);
      const $ = parseHtml(html.text || '');

      const discoveredLinks = discoverLinks($, {
        baseUrl: item.url,
        includeSubdomains: config.includeSubdomains,
        maxLinksPerPage: 50,
      });

      // Add discovered links to queue
      let linksAdded = 0;
      for (const link of discoveredLinks) {
        try {
          const linkPath = new URL(link.url).pathname;
          if (isPathAllowed(linkPath, robotsRules)) {
            if (queue.add(link.url, item.depth + 1, link.priority)) {
              linksAdded++;
            }
          }
        } catch {
          // Invalid URL
        }
      }

      const pageResult: PageCrawlResult = {
        url: item.url,
        depth: item.depth,
        success: true,
        scanResult,
        linksDiscovered: linksAdded,
        crawlTime: Date.now() - pageStartTime,
      };

      pageResults.push(pageResult);
      queue.complete(item.url);
      config.onPageComplete?.(pageResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const pageResult: PageCrawlResult = {
        url: item.url,
        depth: item.depth,
        success: false,
        error: errorMessage,
        linksDiscovered: 0,
        crawlTime: Date.now() - pageStartTime,
      };

      pageResults.push(pageResult);
      queue.fail(item.url);
      config.onPageComplete?.(pageResult);
    }

    reportProgress();
  }

  const endTime = Date.now();

  // Aggregate results
  return aggregateCrawlResults(
    startUrl,
    domain,
    startTime,
    endTime,
    pageResults,
    robotsAccessible,
    robotsRules
  );
}

/**
 * Aggregate results from all crawled pages
 */
function aggregateCrawlResults(
  startUrl: string,
  domain: string,
  startTime: number,
  endTime: number,
  pages: PageCrawlResult[],
  robotsAccessible: boolean,
  robotsRules: RobotsTxtRules
): CrawlResult {
  const successfulPages = pages.filter(p => p.success && p.scanResult);
  const failedPages = pages.filter(p => !p.success);

  // Calculate aggregated scores
  const scores = {
    overall: 0,
    seo: 0,
    pseo: 0,
    aeo: 0,
    geo: 0,
    aiReadiness: 0,
  };

  if (successfulPages.length > 0) {
    for (const page of successfulPages) {
      const result = page.scanResult!;
      scores.overall += result.scoring?.overallScore || 0;
      scores.seo += result.seo?.score || 0;
      scores.pseo += result.pseo?.score || 0;
      scores.aeo += result.aeo?.score || 0;
      scores.geo += result.geo?.score || 0;
    }

    const count = successfulPages.length;
    scores.overall = Math.round(scores.overall / count);
    scores.seo = Math.round(scores.seo / count);
    scores.pseo = Math.round(scores.pseo / count);
    scores.aeo = Math.round(scores.aeo / count);
    scores.geo = Math.round(scores.geo / count);
    scores.aiReadiness = Math.round(
      (scores.overall + scores.geo) / 2
    );
  }

  // Aggregate issues across pages
  const issueMap = new Map<string, SiteIssue>();

  for (const page of successfulPages) {
    for (const issue of page.scanResult!.issues) {
      const key = `${issue.id}-${issue.title}`;

      if (issueMap.has(key)) {
        const existing = issueMap.get(key)!;
        existing.occurrence++;
        if (!existing.affectedPages.includes(page.url)) {
          existing.affectedPages.push(page.url);
        }
      } else {
        issueMap.set(key, {
          ...issue,
          affectedPages: [page.url],
          occurrence: 1,
        });
      }
    }
  }

  // Sort issues by occurrence and impact
  const siteIssues = Array.from(issueMap.values())
    .sort((a, b) => {
      const scoreA = a.occurrence * a.impactScore;
      const scoreB = b.occurrence * b.impactScore;
      return scoreB - scoreA;
    })
    .slice(0, 50);

  // Aggregate site-wide analysis
  const siteAnalysis = {
    totalLinks: { internal: 0, external: 0, broken: 0 },
    totalImages: { total: 0, withAlt: 0, withoutAlt: 0 },
    schemaTypes: [] as string[],
    commonIssues: [] as { issue: string; count: number; severity: string }[],
    topRecommendations: [] as string[],
  };

  const schemaSet = new Set<string>();

  for (const page of successfulPages) {
    const result = page.scanResult!;

    // Aggregate links
    if (result.seo) {
      siteAnalysis.totalLinks.internal += result.seo.links.internal;
      siteAnalysis.totalLinks.external += result.seo.links.external;
      siteAnalysis.totalLinks.broken += result.seo.links.broken;
      siteAnalysis.totalImages.total += result.seo.images.total;
      siteAnalysis.totalImages.withAlt += result.seo.images.withAlt;
      siteAnalysis.totalImages.withoutAlt += result.seo.images.withoutAlt;
    }

    // Collect schema types
    if (result.pseo?.schemaReadiness.schemaTypes) {
      for (const type of result.pseo.schemaReadiness.schemaTypes) {
        schemaSet.add(type);
      }
    }
  }

  siteAnalysis.schemaTypes = Array.from(schemaSet);

  // Get common issues
  const issueCountMap = new Map<string, { count: number; severity: string }>();
  for (const issue of siteIssues) {
    issueCountMap.set(issue.title, {
      count: issue.occurrence,
      severity: issue.severity,
    });
  }

  siteAnalysis.commonIssues = Array.from(issueCountMap.entries())
    .map(([issue, data]) => ({ issue, ...data }))
    .slice(0, 10);

  // Top recommendations
  const recommendationSet = new Set<string>();
  for (const page of successfulPages.slice(0, 10)) {
    const result = page.scanResult!;
    for (const rec of result.seo?.recommendations || []) {
      recommendationSet.add(rec);
    }
    for (const rec of result.geo?.recommendations || []) {
      recommendationSet.add(rec);
    }
  }
  siteAnalysis.topRecommendations = Array.from(recommendationSet).slice(0, 10);

  return {
    startUrl,
    domain,
    startTime,
    endTime,
    duration: endTime - startTime,
    pages,
    pagesScanned: successfulPages.length,
    pagesFailed: failedPages.length,
    aggregatedScores: scores,
    siteIssues,
    siteAnalysis,
    robotsTxt: {
      accessible: robotsAccessible,
      crawlDelay: robotsRules.crawlDelay,
      sitemaps: robotsRules.sitemaps,
    },
  };
}
