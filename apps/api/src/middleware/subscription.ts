/**
 * Subscription-based middleware for API
 * Validates user subscriptions and enforces tier limits
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../index.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';

// Tier limits configuration
export const TIER_LIMITS = {
  FREE: {
    scansPerMonth: 5,
    pagesPerScan: 1,
    maxPagesPerCrawl: 1, // No crawling
    llmEnabled: false,
    fullCrawlEnabled: false,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 10, // 10 requests per 15 minutes
  },
  PRO: {
    scansPerMonth: -1, // Unlimited
    pagesPerScan: -1, // Unlimited
    maxPagesPerCrawl: 50, // Up to 50 pages per crawl
    llmEnabled: true,
    fullCrawlEnabled: true,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // 100 requests per 15 minutes
  },
  ENTERPRISE: {
    scansPerMonth: -1,
    pagesPerScan: -1,
    maxPagesPerCrawl: 100, // Up to 100 pages per crawl
    llmEnabled: true,
    fullCrawlEnabled: true,
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 500, // 500 requests per 15 minutes
  },
  ANONYMOUS: {
    scansPerMonth: 3, // Lower than logged-in free
    pagesPerScan: 1,
    maxPagesPerCrawl: 1, // No crawling
    llmEnabled: false,
    fullCrawlEnabled: false,
    rateLimitWindowMs: 60 * 60 * 1000, // 1 hour
    rateLimitMax: 5, // 5 requests per hour
  },
};

interface UserContext {
  userId: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'ANONYMOUS';
  limits: typeof TIER_LIMITS.FREE;
  usage: {
    scansUsed: number;
    scansRemaining: number;
  };
}

declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext;
    }
  }
}

/**
 * Extract API key from request
 */
function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.headers['x-api-key'] as string || null;
}

/**
 * Extract session token from request
 */
function extractSessionToken(req: Request): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('next-auth.session-token='));
  if (sessionCookie) {
    return sessionCookie.split('=')[1];
  }
  return null;
}

/**
 * Get user from API key
 */
async function getUserFromApiKey(apiKey: string) {
  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!key || !key.isActive) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return key.user;
  } catch (error) {
    logger.error('Error fetching user from API key', { error });
    return null;
  }
}

/**
 * Get user from session token
 */
async function getUserFromSession(sessionToken: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!session || session.expires < new Date()) return null;
    return session.user;
  } catch (error) {
    logger.error('Error fetching user from session', { error });
    return null;
  }
}

/**
 * Get current month's usage for a user
 */
async function getUserUsage(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
    });

    return usage?.scansUsed || 0;
  } catch (error) {
    logger.error('Error fetching user usage', { error, userId });
    return 0;
  }
}

/**
 * Get anonymous usage by IP
 */
async function getAnonymousUsage(ip: string): Promise<number> {
  try {
    const now = new Date();
    const monthKey = `anon:usage:${ip}:${now.getFullYear()}-${now.getMonth() + 1}`;
    const count = await redisClient.get(monthKey);
    return parseInt(count?.toString() || '0', 10);
  } catch (error) {
    logger.error('Error fetching anonymous usage', { error, ip });
    return 0;
  }
}

/**
 * Increment anonymous usage
 */
async function incrementAnonymousUsage(ip: string): Promise<void> {
  try {
    const now = new Date();
    const monthKey = `anon:usage:${ip}:${now.getFullYear()}-${now.getMonth() + 1}`;
    await redisClient.incr(monthKey);
    // Expire after 45 days
    await redisClient.expire(monthKey, 45 * 24 * 60 * 60);
  } catch (error) {
    logger.error('Error incrementing anonymous usage', { error, ip });
  }
}

/**
 * Subscription validation middleware
 * Attaches user context to request and validates limits
 */
export async function subscriptionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = extractApiKey(req);
    const sessionToken = extractSessionToken(req);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    let user = null;

    // Try API key first
    if (apiKey) {
      user = await getUserFromApiKey(apiKey);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid or expired',
        });
      }
    }
    // Then try session
    else if (sessionToken) {
      user = await getUserFromSession(sessionToken);
    }

    // Build user context
    if (user) {
      const plan = user.subscription?.plan || 'FREE';
      const limits = TIER_LIMITS[plan as keyof typeof TIER_LIMITS];
      const scansUsed = await getUserUsage(user.id);
      const scansRemaining = limits.scansPerMonth === -1
        ? -1
        : Math.max(0, limits.scansPerMonth - scansUsed);

      req.userContext = {
        userId: user.id,
        plan: plan as any,
        limits,
        usage: {
          scansUsed,
          scansRemaining,
        },
      };

      logger.info('Authenticated request', {
        userId: user.id,
        plan,
        scansUsed,
        scansRemaining,
      });
    } else {
      // Anonymous user
      const scansUsed = await getAnonymousUsage(ip);
      const limits = TIER_LIMITS.ANONYMOUS;
      const scansRemaining = Math.max(0, limits.scansPerMonth - scansUsed);

      req.userContext = {
        userId: null,
        plan: 'ANONYMOUS',
        limits,
        usage: {
          scansUsed,
          scansRemaining,
        },
      };

      logger.info('Anonymous request', {
        ip,
        scansUsed,
        scansRemaining,
      });
    }

    next();
  } catch (error) {
    logger.error('Subscription middleware error', { error });
    // Don't fail the request, just continue as anonymous
    req.userContext = {
      userId: null,
      plan: 'ANONYMOUS',
      limits: TIER_LIMITS.ANONYMOUS,
      usage: { scansUsed: 0, scansRemaining: TIER_LIMITS.ANONYMOUS.scansPerMonth },
    };
    next();
  }
}

/**
 * Check if user can perform a scan
 */
export function canScanMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ctx = req.userContext;

  if (!ctx) {
    return res.status(500).json({
      error: 'Internal error',
      message: 'User context not available',
    });
  }

  // Check scan limit (skip for unlimited plans)
  if (ctx.limits.scansPerMonth !== -1 && ctx.usage.scansRemaining <= 0) {
    const upgradeMessage = ctx.plan === 'ANONYMOUS'
      ? 'Sign up for free to get 5 scans per month, or upgrade to Pro for unlimited scans.'
      : ctx.plan === 'FREE'
      ? 'Upgrade to Pro for unlimited scans.'
      : 'Contact support to increase your limits.';

    return res.status(429).json({
      error: 'Scan limit reached',
      message: `You've used all ${ctx.limits.scansPerMonth} scans for this month. ${upgradeMessage}`,
      usage: ctx.usage,
      upgradeUrl: '/pricing',
    });
  }

  next();
}

/**
 * Enforce LLM access based on subscription
 */
export function enforceLLMAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ctx = req.userContext;

  if (!ctx) {
    return next();
  }

  // If LLM is requested but not allowed, disable it with warning
  if (req.body.enableLLM && !ctx.limits.llmEnabled) {
    req.body.enableLLM = false;
    (req as any).llmDowngradeWarning = {
      type: 'llm_not_available',
      message: 'LLM analysis is only available on Pro and Enterprise plans.',
      upgradeUrl: '/pricing',
    };
  }

  next();
}

/**
 * Enforce full crawl access based on subscription
 */
export function enforceFullCrawlAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ctx = req.userContext;

  if (!ctx) {
    return next();
  }

  // If full crawl is requested but not allowed, limit to 1 page
  if (req.body.maxPages > 1 && !ctx.limits.fullCrawlEnabled) {
    req.body.maxPages = 1;
    (req as any).crawlDowngradeWarning = {
      type: 'full_crawl_not_available',
      message: 'Full domain crawling is only available on Pro and Enterprise plans. Limiting to single page.',
      upgradeUrl: '/pricing',
    };
  }

  next();
}

/**
 * Increment usage after successful scan
 */
export async function incrementUsage(
  userId: string | null,
  ip: string,
  pagesScanned: number = 1,
  usedLLM: boolean = false
) {
  try {
    if (userId) {
      const now = new Date();
      await prisma.usageRecord.upsert({
        where: {
          userId_month_year: {
            userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          scansUsed: { increment: 1 },
          pagesScanned: { increment: pagesScanned },
          llmCalls: usedLLM ? { increment: 1 } : undefined,
        },
        create: {
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          scansUsed: 1,
          pagesScanned,
          llmCalls: usedLLM ? 1 : 0,
        },
      });
    } else {
      await incrementAnonymousUsage(ip);
    }
  } catch (error) {
    logger.error('Error incrementing usage', { error, userId, ip });
  }
}

/**
 * Tier-based rate limiter
 */
export function tierBasedRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip rate limiting in development
  if (!config.rateLimit.enabled) {
    return next();
  }

  const ctx = req.userContext;
  if (!ctx) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = ctx.userId ? `rl:user:${ctx.userId}` : `rl:anon:${ip}`;
  const windowMs = ctx.limits.rateLimitWindowMs;
  const max = ctx.limits.rateLimitMax;

  // Use Redis for rate limiting
  (async () => {
    try {
      const now = Date.now();
      const data = await redisClient.get(key);
      let tracker = data ? JSON.parse(data.toString()) : null;

      if (!tracker || now > tracker.resetTime) {
        tracker = { count: 0, resetTime: now + windowMs };
      }

      if (tracker.count >= max) {
        const remainingTime = Math.ceil((tracker.resetTime - now) / 1000 / 60);

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
          retryAfter: Math.ceil((tracker.resetTime - now) / 1000),
          limit: max,
          used: tracker.count,
        });
      }

      tracker.count++;
      await redisClient.set(key, JSON.stringify(tracker), {
        PX: windowMs,
      });

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - tracker.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(tracker.resetTime / 1000));

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error });
      next(); // Don't block on errors
    }
  })();
}
