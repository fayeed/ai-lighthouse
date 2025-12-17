/**
 * GDPR Compliance Routes
 * Handles user data requests according to GDPR requirements
 */

import express from 'express';
import { 
  handleDataAccessRequest,
  handleDataDeletionRequest,
  handleDataPortabilityRequest,
  getPrivacyInfo 
} from '../middleware/gdpr.js';
import { logger } from '../utils/logger.js';

export const gdprRouter = express.Router();

/**
 * GET /api/gdpr/privacy
 * Get privacy policy information
 */
gdprRouter.get('/privacy', (req, res) => {
  res.json(getPrivacyInfo());
});

/**
 * POST /api/gdpr/access
 * Request access to temporary data (GDPR Article 15)
 * Note: No persistent user data exists - only temporary cache/rate limit data
 */
gdprRouter.post('/access', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const result = await handleDataAccessRequest(ip);
    
    res.json({
      success: result.status === 'completed',
      requestId: result.requestId,
      timestamp: result.timestamp,
      data: result.data,
      note: 'AI Lighthouse does not store persistent user data. This shows only temporary cache and rate limit data that auto-expires.',
    });
  } catch (error: any) {
    logger.error('Data access request failed', { error: error.message, ip });
    res.status(500).json({
      success: false,
      error: 'Failed to process data access request',
      message: error.message,
    });
  }
});

/**
 * POST /api/gdpr/delete
 * Request deletion of temporary data (GDPR Article 17 - Right to be forgotten)
 * Note: All data auto-expires - this just deletes it immediately
 */
gdprRouter.post('/delete', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const result = await handleDataDeletionRequest(ip);
    
    res.json(result);
  } catch (error: any) {
    logger.error('Data deletion request failed', { error: error.message, ip });
    res.status(500).json({
      success: false,
      error: 'Failed to process data deletion request',
      message: error.message,
    });
  }
});

/**
 * POST /api/gdpr/export
 * Request data export (GDPR Article 20 - Data portability)
 * Note: Exports only temporary cache/rate limit data
 */
gdprRouter.post('/export', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  try {
    const result = await handleDataPortabilityRequest(ip);
    
    if (result.success) {
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="ai-lighthouse-temp-data-${Date.now()}.json"`);
      res.json(result.data);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to export data',
        message: result.message,
      });
    }
  } catch (error: any) {
    logger.error('Data portability request failed', { error: error.message, ip });
    res.status(500).json({
      success: false,
      error: 'Failed to process data export request',
      message: error.message,
    });
  }
});
