/**
 * Crawler Module Exports
 * Multi-page website crawling with aggregated analysis
 */

export {
  crawlSite,
  type CrawlOptions,
  type CrawlResult,
  type CrawlProgress,
  type PageCrawlResult,
  type SiteIssue,
} from './crawler.js';

export {
  CrawlQueue,
  type CrawlQueueOptions,
  type QueuedUrl,
  type QueueStats,
} from './queue.js';

export {
  fetchRobotsTxt,
  parseRobotsTxt,
  isPathAllowed,
  fetchSitemapUrls,
  type RobotsTxtRules,
  type RobotsParseResult,
} from './robots.js';

export {
  discoverLinks,
  extractNavigationPages,
  isPriorityPath,
  type DiscoveredLink,
  type DiscoveryOptions,
} from './discovery.js';
