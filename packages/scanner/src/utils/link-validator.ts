/**
 * Link Validator
 * Checks HTTP status codes of links to detect broken links
 */

import type { BrokenLinkDetail } from '../types.js';

export interface LinkToValidate {
  url: string;
  anchorText: string;
  isInternal: boolean;
  sourceUrl: string;
}

export interface LinkValidationOptions {
  timeout?: number;
  concurrency?: number;
  userAgent?: string;
  maxLinks?: number;
}

export interface LinkValidationResult {
  brokenLinks: BrokenLinkDetail[];
  checkedCount: number;
  brokenCount: number;
}

const DEFAULT_USER_AGENT = 'ai-lighthouse-scanner/1.0 (+https://example.com)';
const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|data:|blob:)/i;

async function checkLink(
  link: LinkToValidate,
  timeout: number,
  userAgent: string
): Promise<BrokenLinkDetail | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // Try HEAD first (faster)
    let response = await fetch(link.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
    });

    // Fall back to GET if HEAD is not allowed
    if (response.status === 405 || response.status === 501) {
      const getController = new AbortController();
      const getTimer = setTimeout(() => getController.abort(), timeout);
      try {
        response = await fetch(link.url, {
          method: 'GET',
          signal: getController.signal,
          headers: { 'User-Agent': userAgent },
          redirect: 'follow',
        });
      } finally {
        clearTimeout(getTimer);
      }
    }

    if (response.status >= 400) {
      return {
        url: link.url,
        sourceUrl: link.sourceUrl,
        anchorText: link.anchorText,
        statusCode: response.status,
        isInternal: link.isInternal,
      };
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Aborted = timeout
    const isTimeout = message.includes('abort');
    return {
      url: link.url,
      sourceUrl: link.sourceUrl,
      anchorText: link.anchorText,
      statusCode: 0,
      error: isTimeout ? 'Request timed out' : message,
      isInternal: link.isInternal,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function withConcurrencyLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p = fn(item).then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

export async function validateLinks(
  links: LinkToValidate[],
  options: LinkValidationOptions = {}
): Promise<LinkValidationResult> {
  const timeout = options.timeout ?? 5000;
  const concurrency = options.concurrency ?? 5;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const maxLinks = options.maxLinks ?? 50;

  // Filter out non-HTTP links and limit count
  const toCheck = links
    .filter(l => !SKIP_SCHEMES.test(l.url))
    .filter(l => {
      try {
        const proto = new URL(l.url).protocol;
        return proto === 'http:' || proto === 'https:';
      } catch {
        return false;
      }
    })
    .slice(0, maxLinks);

  const brokenLinks: BrokenLinkDetail[] = [];

  await withConcurrencyLimit(toCheck, concurrency, async (link) => {
    const result = await checkLink(link, timeout, userAgent);
    if (result) {
      brokenLinks.push(result);
    }
  });

  return {
    brokenLinks,
    checkedCount: toCheck.length,
    brokenCount: brokenLinks.length,
  };
}
