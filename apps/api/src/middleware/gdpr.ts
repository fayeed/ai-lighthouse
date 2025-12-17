/**
 * GDPR Compliance Middleware
 * Implements data privacy and user rights according to GDPR requirements
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../index.js';
import { logger } from '../utils/logger.js';

// Data retention configuration (all temporary/cached data only)
export const GDPR_CONFIG = {
  AUDIT_CACHE_TTL: 30 * 24 * 60 * 60, // 30 days - audit results cache
  RATE_LIMIT_TTL: 15 * 60, // 15 minutes - rate limit counters
  ABUSE_TRACKING_TTL: 60 * 60, // 1 hour - abuse detection
  JOB_TTL: 60 * 60, // 1 hour - async job status
};

export interface DataAccessRequest {
  ip: string;
  timestamp: string;
  requestId: string;
  status: 'pending' | 'completed' | 'failed';
  data?: any;
}

/**
 * Handle data access request (GDPR Article 15)
 * Returns only temporary cached data - no persistent user data exists
 */
export async function handleDataAccessRequest(ip: string): Promise<DataAccessRequest> {
  const requestId = `dar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const data: any = {
      requestId,
      ip: ip.replace(/\d+$/, '***'), // Masked IP
      timestamp: new Date().toISOString(),
      note: 'AI Lighthouse does not store persistent user data. Only temporary cache and rate limit data is shown below.',
      temporaryData: {},
    };

    // Gather rate limit data (temporary, expires automatically)
    const rateLimitKeys = await redisClient.keys(`rl:*:${ip}`);
    if (rateLimitKeys.length > 0) {
      data.temporaryData.rateLimits = [];
      for (const key of rateLimitKeys) {
        const limitData = await redisClient.get(key);
        if (limitData) {
          const ttl = await redisClient.ttl(key);
          data.temporaryData.rateLimits.push({
            type: key.includes('llm') ? 'LLM (expires in 1 hour)' : 'General (expires in 15 minutes)',
            expiresIn: `${ttl} seconds`,
            note: 'This data is automatically deleted when the time window expires',
          });
        }
      }
    }

    // Gather abuse tracking data (temporary, expires in 1 hour)
    const abuseKeys = await redisClient.keys(`abuse:*:${ip}`);
    if (abuseKeys.length > 0) {
      data.temporaryData.abuseTracking = [];
      for (const key of abuseKeys) {
        const abuseData = await redisClient.get(key);
        if (abuseData) {
          const ttl = await redisClient.ttl(key);
          data.temporaryData.abuseTracking.push({
            expiresIn: `${ttl} seconds`,
            note: 'Abuse detection data is automatically deleted after 1 hour',
          });
        }
      }
    }

    // Note about audit results
    data.temporaryData.auditCache = {
      note: 'Audit results are cached for 30 days for performance. Cache keys are based on URL content hash, not user identity. No association with your IP is stored.',
    };

    const request: DataAccessRequest = {
      ip,
      timestamp: new Date().toISOString(),
      requestId,
      status: 'completed',
      data,
    };

    // Store the request for 30 days
    await redisClient.setEx(
      `gdpr:access:${requestId}`,
      30 * 24 * 60 * 60,
      JSON.stringify(request)
    );

    logger.info('Data access request completed', { ip, requestId });
    return request;
  } catch (error: any) {
    logger.error('Data access request failed', { error: error.message, ip });
    
    const failedRequest: DataAccessRequest = {
      ip,
      timestamp: new Date().toISOString(),
      requestId,
      status: 'failed',
    };
    
    return failedRequest;
  }
}

/**
 * Handle data deletion request (GDPR Article 17 - Right to be forgotten)
 * Deletes only temporary cached data - all data auto-expires anyway
 */
export async function handleDataDeletionRequest(ip: string): Promise<{
  success: boolean;
  deletedItems: string[];
  message: string;
  note: string;
}> {
  const deletedItems: string[] = [];

  try {
    // Delete rate limit data (would expire in 15 min - 1 hour anyway)
    const rateLimitKeys = await redisClient.keys(`rl:*:${ip}`);
    for (const key of rateLimitKeys) {
      await redisClient.del(key);
      deletedItems.push('rate-limit');
    }

    // Delete abuse tracking (would expire in 1 hour anyway)
    const abuseKeys = await redisClient.keys(`abuse:*:${ip}`);
    for (const key of abuseKeys) {
      await redisClient.del(key);
      deletedItems.push('abuse-tracking');
    }

    // Delete fingerprint data (would expire in 10 minutes anyway)
    const fingerprintKeys = await redisClient.keys(`fingerprint:${ip}:*`);
    for (const key of fingerprintKeys) {
      await redisClient.del(key);
      deletedItems.push('fingerprint');
    }

    logger.info('Data deletion request completed', { ip, deletedItems: deletedItems.length });

    return {
      success: true,
      deletedItems,
      message: deletedItems.length > 0 
        ? `Deleted ${deletedItems.length} temporary data item(s)`
        : 'No data found to delete',
      note: 'AI Lighthouse does not store persistent user data. All data shown was temporary and would have automatically expired within 1 hour to 30 days.',
    };
  } catch (error: any) {
    logger.error('Data deletion request failed', { error: error.message, ip });
    
    return {
      success: false,
      deletedItems,
      message: 'Failed to delete all data. Some items may have been deleted.',
      note: 'AI Lighthouse does not store persistent user data. All data was temporary and would have automatically expired within 1 hour to 30 days.',
    };
  }
}

/**
 * Handle data portability request (GDPR Article 20)
 */
export async function handleDataPortabilityRequest(ip: string): Promise<{
  success: boolean;
  data?: any;
  format: 'json';
  message: string;
}> {
  try {
    const accessRequest = await handleDataAccessRequest(ip);
    
    if (accessRequest.status === 'completed') {
      return {
        success: true,
        data: accessRequest.data,
        format: 'json',
        message: 'Your data is ready for export in JSON format',
      };
    }

    return {
      success: false,
      format: 'json',
      message: 'Failed to retrieve your data',
    };
  } catch (error: any) {
    logger.error('Data portability request failed', { error: error.message, ip });
    
    return {
      success: false,
      format: 'json',
      message: 'An error occurred while preparing your data',
    };
  }
}

/**
 * Note: Automatic cleanup is handled by Redis TTL (expiry)
 * All data has automatic expiry set, so manual cleanup is not needed:
 * - Rate limits: 15 min - 1 hour TTL
 * - Abuse tracking: 1 hour TTL  
 * - Async jobs: 1 hour TTL
 * - Audit cache: 30 days TTL
 * 
 * This function is kept for reference but not needed in normal operation.
 */
export async function cleanupExpiredData(): Promise<{
  cleaned: number;
  errors: number;
  note: string;
}> {
  logger.info('Cleanup check: All data uses Redis TTL for automatic expiry');
  
  return { 
    cleaned: 0, 
    errors: 0,
    note: 'No manual cleanup needed - all data auto-expires via Redis TTL'
  };
}

/**
 * Get privacy information for transparency
 */
export function getPrivacyInfo() {
  return {
    statement: 'AI Lighthouse does NOT store any persistent user data. All data is temporary and automatically expires.',
    temporaryDataUsed: [
      'IP address - Used only for rate limiting and abuse prevention (expires: 15 min - 1 hour)',
      'URL content hash - Used for caching audit results (expires: 30 days, not linked to users)',
      'Rate limit counters - Temporary counters (expires: 15 minutes for general, 1 hour for LLM)',
      'Async job IDs - Temporary job status (expires: 1 hour)',
    ],
    dataNotCollected: [
      'No user accounts or authentication',
      'No email addresses',
      'No names or personal information',
      'No cookies (except functional)',
      'No analytics or tracking',
      'No persistent logs of user activity',
    ],
    dataRetention: {
      rateLimits: '15 minutes (general) or 1 hour (LLM) - then auto-deleted',
      auditCache: '30 days - content-based cache, not user-based',
      asyncJobs: '1 hour - then auto-deleted',
      abuseTracking: '1 hour - then auto-deleted',
    },
    dataProcessing: {
      purpose: 'Service operation: rate limiting, caching, abuse prevention',
      legalBasis: 'Legitimate interest (service security and performance)',
      thirdParties: 'LLM providers receive website content ONLY if you enable LLM features (opt-in)',
      thirdPartyData: 'Your IP address is NEVER shared with third parties',
    },
    userRights: [
      'Right to access temporary data (GDPR Article 15)',
      'Right to deletion of temporary data (GDPR Article 17)',
      'Right to data portability (GDPR Article 20)',
      'Note: No persistent data exists to delete or export',
    ],
    contact: 'For questions: https://github.com/fayeed/ai-lighthouse/issues',
    lastUpdated: '2025-12-17',
  };
}
