import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../index.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL (Time To Live) in seconds
  DEFAULT_TTL: 3600, // 1 hour
  AUDIT_TTL: 1800,   // 30 minutes for audit results
  HEALTH_TTL: 60,    // 1 minute for health checks
  
  // Cache key prefix
  PREFIX: 'cache:',
  
  // Cache control headers
  MAX_AGE: 3600, // 1 hour
  STALE_WHILE_REVALIDATE: 7200, // 2 hours
};

/**
 * Generate content fingerprint by fetching and hashing website content
 * This ensures cache invalidation when website content changes
 */
async function generateContentFingerprint(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-Lighthouse-Cache/1.0 (https://github.com/fayeed/ai-lighthouse)',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      logger.warn('Failed to fetch content for fingerprint', {
        url,
        status: response.status,
      });
      return 'no-content';
    }
    
    const html = await response.text();
    
    // Remove common dynamic elements that change frequently
    let cleanedHtml = html
      // Remove script tags (often contain timestamps, analytics)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove inline styles (may contain dynamic values)
      .replace(/style="[^"]*"/gi, '')
      // Remove common timestamp patterns
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
      // Remove session/tracking IDs
      .replace(/[?&](session|sid|token|csrf)=[^&\s"']*/gi, '')
      // Remove common date/time strings
      .replace(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*, \w+ \d{1,2}, \d{4}/gi, '')
      // Remove nonce attributes
      .replace(/nonce="[^"]*"/gi, '');
    
    // Extract stable structural elements for fingerprinting
    const contentElements = [
      // Meta tags (title, description) - usually stable
      cleanedHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '',
      cleanedHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1]?.trim() || '',
      
      // Canonical URL (if present)
      cleanedHtml.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1]?.trim() || '',
      
      // Structural element counts (more stable than content)
      (cleanedHtml.match(/<h1[^>]*>/gi) || []).length.toString(),
      (cleanedHtml.match(/<h2[^>]*>/gi) || []).length.toString(),
      (cleanedHtml.match(/<nav[^>]*>/gi) || []).length.toString(),
      (cleanedHtml.match(/<article[^>]*>/gi) || []).length.toString(),
      (cleanedHtml.match(/<section[^>]*>/gi) || []).length.toString(),
      
      // Content length (bucketed to avoid minor changes)
      // Round to nearest 10KB to tolerate small dynamic content
      Math.round(cleanedHtml.length / 10000).toString(),
      
      // Schema.org markup presence
      cleanedHtml.includes('application/ld+json') ? 'jsonld' : 'no-jsonld',
      
      // Open Graph tags (usually stable)
      cleanedHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1]?.trim() || '',
    ].filter(Boolean).join('|');
    
    // Generate hash of content fingerprint
    const hash = crypto
      .createHash('md5')
      .update(contentElements)
      .digest('hex')
      .substring(0, 12); // Use first 12 chars for brevity
    
    logger.debug('Content fingerprint generated', {
      url,
      fingerprint: hash,
      contentLength: html.length,
    });
    
    return hash;
  } catch (error: any) {
    logger.warn('Failed to generate content fingerprint', {
      url,
      error: error.message,
    });
    // Return fallback fingerprint on error (still allows caching)
    return 'fetch-error';
  }
}

/**
 * Generate a cache key from request parameters and content fingerprint
 */
async function generateCacheKey(req: Request): Promise<string> {
  const { url, enableLLM, provider, model, apiKey } = req.body;
  
  // Generate content fingerprint to detect website changes
  const contentFingerprint = await generateContentFingerprint(url);
  
  // Create a deterministic key based on request parameters + content
  // Note: We exclude the actual API key value for security, just note if present
  const keyParts = [
    CACHE_CONFIG.PREFIX,
    'audit',
    url,
    contentFingerprint, // Include content hash
    enableLLM ? 'llm' : 'no-llm',
    enableLLM ? provider || 'default' : '',
    enableLLM ? model || 'default' : '',
    apiKey ? 'with-key' : 'no-key',
  ].filter(Boolean);
  
  return keyParts.join(':');
}

/**
 * Middleware to cache API responses in Redis
 * @param ttl - Time to live in seconds (default: AUDIT_TTL)
 */
export function cacheMiddleware(ttl: number = CACHE_CONFIG.AUDIT_TTL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET and POST requests
    if (!['GET', 'POST'].includes(req.method)) {
      return next();
    }

    const cacheKey = await generateCacheKey(req);

    try {
      // Try to get cached response
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData.toString());
        
        logger.info('Cache hit', {
          key: cacheKey,
          url: req.body.url,
          ttl: parsedData.ttl,
        });

        // Set cache control headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${CACHE_CONFIG.MAX_AGE}, stale-while-revalidate=${CACHE_CONFIG.STALE_WHILE_REVALIDATE}`);
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(parsedData.data);
      }

      // Cache miss - intercept the response to cache it
      res.setHeader('X-Cache', 'MISS');
      
      const originalJson = res.json.bind(res);
      
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            data,
            cachedAt: new Date().toISOString(),
            ttl,
          };

          // Store in Redis asynchronously (don't block response)
          redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData))
            .then(() => {
              logger.info('Response cached', {
                key: cacheKey,
                url: req.body.url,
                ttl,
                size: JSON.stringify(data).length,
              });
            })
            .catch((err) => {
              logger.error('Cache storage failed', {
                error: err.message,
                key: cacheKey,
              });
            });

          // Set cache control headers
          res.setHeader('Cache-Control', `public, max-age=${CACHE_CONFIG.MAX_AGE}, stale-while-revalidate=${CACHE_CONFIG.STALE_WHILE_REVALIDATE}`);
          res.setHeader('X-Cache-Key', cacheKey);
        }

        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error('Cache middleware error', {
        error: error.message,
        key: cacheKey,
      });
      // On cache error, continue without caching
      next();
    }
  };
}

/**
 * Invalidate cache for a specific URL
 */
export async function invalidateCache(url: string): Promise<void> {
  try {
    // Find all cache keys matching this URL
    const pattern = `${CACHE_CONFIG.PREFIX}audit:${url}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info('Cache invalidated', {
        url,
        keysDeleted: keys.length,
      });
    }
  } catch (error: any) {
    logger.error('Cache invalidation failed', {
      error: error.message,
      url,
    });
  }
}

/**
 * Invalidate all cache entries
 */
export async function invalidateAllCache(): Promise<void> {
  try {
    const pattern = `${CACHE_CONFIG.PREFIX}*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info('All cache invalidated', {
        keysDeleted: keys.length,
      });
    }
  } catch (error: any) {
    logger.error('Cache invalidation failed', {
      error: error.message,
    });
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const pattern = `${CACHE_CONFIG.PREFIX}*`;
    const keys = await redisClient.keys(pattern);
    
    const stats = {
      totalKeys: keys.length,
      totalSize: 0,
      oldestEntry: null as string | null,
      newestEntry: null as string | null,
    };

    if (keys.length > 0) {
      // Sample a few keys to get size estimates
      const sampleSize = Math.min(10, keys.length);
      let totalSampleSize = 0;

      for (let i = 0; i < sampleSize; i++) {
        const data = await redisClient.get(keys[i]);
        if (data) {
          totalSampleSize += data.length;
        }
      }

      // Estimate total size
      stats.totalSize = Math.round((totalSampleSize / sampleSize) * keys.length);
    }

    return stats;
  } catch (error: any) {
    logger.error('Failed to get cache stats', {
      error: error.message,
    });
    return null;
  }
}

export { CACHE_CONFIG };
