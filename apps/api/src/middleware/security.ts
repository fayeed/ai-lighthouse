import { Request, Response, NextFunction } from 'express';
import { logger, logSuspiciousActivity } from '../utils/logger.js';
import { redisClient } from '../index.js';

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */
export const requestTimeout = (timeoutMs: number = 120000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          timeout: timeoutMs
        });
        
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process. Please try again.',
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

/**
 * Request fingerprinting for abuse detection
 * Creates a fingerprint based on IP, user-agent, and behavior patterns
 */
export const requestFingerprint = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const fingerprint = `${ip}:${userAgent}`;
  
  // Store fingerprint for abuse tracking
  (req as any).fingerprint = fingerprint;
  
  next();
};

/**
 * Abuse detection middleware
 * Detects patterns of abusive behavior without requiring authentication
 */
export const abuseDetection = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const fingerprint = (req as any).fingerprint || ip;
  
  try {
    // Track request patterns
    const now = Date.now();
    const windowKey = `abuse:${fingerprint}`;
    const suspicionKey = `suspicion:${fingerprint}`;
    
    // Get current tracking data
    const trackingData = await redisClient.get(windowKey);
    const tracking = trackingData ? JSON.parse(trackingData.toString()) : {
      requests: [],
      suspicionScore: 0,
      firstSeen: now
    };
    
    // Add current request
    tracking.requests.push(now);
    
    // Keep only last 10 minutes of requests (prevents memory growth)
    const tenMinutesAgo = now - (10 * 60 * 1000);
    tracking.requests = tracking.requests.filter((t: number) => t > tenMinutesAgo);
    
    // Limit array size to prevent memory issues (max 100 entries)
    if (tracking.requests.length > 100) {
      tracking.requests = tracking.requests.slice(-100);
    }
    
    // Calculate suspicion score based on patterns
    let suspicionScore = 0;
    
    // Pattern 1: Too many requests in short time (more than 20 in 10 min)
    if (tracking.requests.length > 20) {
      suspicionScore += 30;
      logSuspiciousActivity(ip, 'High request frequency', { 
        count: tracking.requests.length,
        window: '10min'
      });
    }
    
    // Pattern 2: Rapid-fire requests (more than 5 in 1 minute)
    const oneMinuteAgo = now - 60000;
    const recentRequests = tracking.requests.filter((t: number) => t > oneMinuteAgo);
    if (recentRequests.length > 5) {
      suspicionScore += 40;
      logSuspiciousActivity(ip, 'Rapid-fire requests', { 
        count: recentRequests.length,
        window: '1min'
      });
    }
    
    // Pattern 3: No user agent or suspicious user agent
    const userAgent = req.get('user-agent') || '';
    if (!userAgent || userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawler')) {
      // Exception for legitimate bots
      const legitimateBots = ['googlebot', 'bingbot', 'slackbot', 'twitterbot'];
      const isLegitimate = legitimateBots.some(bot => userAgent.toLowerCase().includes(bot));
      
      if (!isLegitimate) {
        suspicionScore += 20;
      }
    }
    
    tracking.suspicionScore = suspicionScore;
    
    // Store updated tracking
    await redisClient.set(windowKey, JSON.stringify(tracking), {
      EX: 600 // 10 minutes
    });
    
    // If suspicion score is too high, return error
    if (suspicionScore >= 70) {
      logSuspiciousActivity(ip, 'Abuse threshold exceeded', {
        suspicionScore,
        requestCount: tracking.requests.length
      });
      
      // Store in longer-term ban list
      await redisClient.set(suspicionKey, 'blocked', {
        EX: 3600 // 1 hour ban
      });
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Unusual activity detected. Please try again later.',
        retryAfter: 3600
      });
    }
    
    // Check if previously flagged
    const isSuspicious = await redisClient.get(suspicionKey);
    if (isSuspicious === 'blocked') {
      logSuspiciousActivity(ip, 'Previously blocked user attempting access', {});
      
      return res.status(429).json({
        error: 'Access temporarily restricted',
        message: 'Please try again later.',
        retryAfter: 3600
      });
    }
    
    // Add suspicion score to request for logging
    (req as any).suspicionScore = suspicionScore;
    
    next();
  } catch (error) {
    // Don't block request if abuse detection fails
    logger.error('Abuse detection error', { error });
    next();
  }
};

/**
 * URL validation middleware
 * Additional layer to prevent SSRF attacks
 */
export const validateUrlSecurity = (req: Request, res: Response, next: NextFunction) => {
  const url = req.body?.url;
  
  if (!url) {
    return next();
  }
  
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block cloud metadata endpoints (SSRF protection)
    const blockedHosts = [
      '169.254.169.254', // AWS metadata
      'metadata.google.internal', // GCP metadata
      '100.100.100.200', // Azure metadata
      'fd00:ec2::254' // AWS IPv6 metadata
    ];
    
    if (blockedHosts.includes(hostname)) {
      logSuspiciousActivity(req.ip || 'unknown', 'Attempted SSRF attack', { url });
      
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'This URL cannot be audited for security reasons.'
      });
    }
    
    next();
  } catch (error) {
    next(); // Let Zod validation handle invalid URLs
  }
};

/**
 * Content-Type validation
 * Ensure requests have proper content type
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json'
      });
    }
  }
  
  next();
};

/**
 * Request size limiter
 * Already handled by express.json() but adding explicit check
 */
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body size exceeds 1MB limit'
    });
  }
  
  next();
};
