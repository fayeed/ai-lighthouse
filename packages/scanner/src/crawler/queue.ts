/**
 * Crawl Queue
 * Manages URL queue with concurrency control and deduplication
 */

export interface QueuedUrl {
  url: string;
  depth: number;
  priority: number;
  addedAt: number;
}

export interface CrawlQueueOptions {
  maxConcurrency: number;
  maxDepth: number;
  maxUrls: number;
  crawlDelay: number; // milliseconds between requests
  respectRobotsDelay: boolean;
}

export interface QueueStats {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  total: number;
  maxUrls: number;
}

export class CrawlQueue {
  private pending: QueuedUrl[] = [];
  private inProgress: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private options: CrawlQueueOptions;
  private lastRequestTime: number = 0;

  constructor(options: Partial<CrawlQueueOptions> = {}) {
    this.options = {
      maxConcurrency: 3,
      maxDepth: 3,
      maxUrls: 100,
      crawlDelay: 1000,
      respectRobotsDelay: true,
      ...options,
    };
  }

  /**
   * Add URL to queue if not already processed
   */
  add(url: string, depth: number = 0, priority: number = 0): boolean {
    const normalized = this.normalizeUrl(url);

    if (this.hasUrl(normalized)) {
      return false;
    }

    if (depth > this.options.maxDepth) {
      return false;
    }

    if (this.totalUrls >= this.options.maxUrls) {
      return false;
    }

    this.pending.push({
      url: normalized,
      depth,
      priority,
      addedAt: Date.now(),
    });

    // Sort by priority (higher first), then by depth (lower first)
    this.pending.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.depth - b.depth;
    });

    return true;
  }

  /**
   * Add multiple URLs
   */
  addMany(urls: string[], depth: number = 0, priority: number = 0): number {
    let added = 0;
    for (const url of urls) {
      if (this.add(url, depth, priority)) {
        added++;
      }
    }
    return added;
  }

  /**
   * Get next URL to process (respecting concurrency and delay)
   */
  async next(): Promise<QueuedUrl | null> {
    // Check concurrency limit
    if (this.inProgress.size >= this.options.maxConcurrency) {
      return null;
    }

    // Check if queue is empty
    if (this.pending.length === 0) {
      return null;
    }

    // Respect crawl delay
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.options.crawlDelay) {
      await this.delay(this.options.crawlDelay - timeSinceLastRequest);
    }

    const item = this.pending.shift();
    if (!item) return null;

    this.inProgress.add(item.url);
    this.lastRequestTime = Date.now();

    return item;
  }

  /**
   * Mark URL as completed
   */
  complete(url: string): void {
    const normalized = this.normalizeUrl(url);
    this.inProgress.delete(normalized);
    this.completed.add(normalized);
  }

  /**
   * Mark URL as failed
   */
  fail(url: string): void {
    const normalized = this.normalizeUrl(url);
    this.inProgress.delete(normalized);
    this.failed.add(normalized);
  }

  /**
   * Check if URL has been seen
   */
  hasUrl(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    return (
      this.pending.some(p => p.url === normalized) ||
      this.inProgress.has(normalized) ||
      this.completed.has(normalized) ||
      this.failed.has(normalized)
    );
  }

  /**
   * Check if crawl is complete
   */
  get isComplete(): boolean {
    return this.pending.length === 0 && this.inProgress.size === 0;
  }

  /**
   * Check if there are pending URLs
   */
  get hasPending(): boolean {
    return this.pending.length > 0;
  }

  /**
   * Get queue statistics
   */
  get stats(): QueueStats {
    return {
      pending: this.pending.length,
      inProgress: this.inProgress.size,
      completed: this.completed.size,
      failed: this.failed.size,
      total: this.totalUrls,
      maxUrls: this.options.maxUrls,
    };
  }

  /**
   * Total URLs processed or in queue
   */
  get totalUrls(): number {
    return (
      this.pending.length +
      this.inProgress.size +
      this.completed.size +
      this.failed.size
    );
  }

  /**
   * Get all completed URLs
   */
  get completedUrls(): string[] {
    return Array.from(this.completed);
  }

  /**
   * Get all failed URLs
   */
  get failedUrls(): string[] {
    return Array.from(this.failed);
  }

  /**
   * Update crawl delay (e.g., from robots.txt)
   */
  setCrawlDelay(delay: number): void {
    if (this.options.respectRobotsDelay && delay > 0) {
      this.options.crawlDelay = Math.max(this.options.crawlDelay, delay * 1000);
    }
  }

  /**
   * Normalize URL for deduplication
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, fragment, and some common tracking params
      parsed.hash = '';
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('ref');

      let normalized = parsed.toString();
      if (normalized.endsWith('/') && parsed.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
