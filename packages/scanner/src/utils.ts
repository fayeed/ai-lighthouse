import * as cheerio from 'cheerio';

function nowISO(): string {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  const tokens = text.trim().split(/\s+/).length;

  return tokens;
}

export async function fetchHtml(url: string, timeoutMs: number, userAgent?: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        "user-Agent": userAgent || 'ai-lighthouse-scanner/1.0 (+https://example.com)'
      }
    });
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Convert headers to a plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      text,
      contentType,
      status: response.status,
      headers,
      response
    }
  } finally {
    clearTimeout(id);
  }
}

export function parseHtml(html: string) {
  const $ = cheerio.load(html);
  return $;
}