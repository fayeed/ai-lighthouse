/**
 * User Management Routes
 * Handles user profile, subscription info, and usage data
 */

import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../utils/logger.js';
import { requireAuth, getCurrentUser } from '../auth/index.js';

export const usersRouter = express.Router();

/**
 * GET /api/users/me
 * Get current user's profile and subscription info
 */
usersRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get current month's usage
    const now = new Date();
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month_year: {
          userId: user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        billingInterval: user.subscription.billingInterval,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        limits: {
          scansPerMonth: user.subscription.scansPerMonth,
          pagesPerScan: user.subscription.pagesPerScan,
          llmAnalysisEnabled: user.subscription.llmAnalysisEnabled,
          fullCrawlEnabled: user.subscription.fullCrawlEnabled,
          apiAccessEnabled: user.subscription.apiAccessEnabled,
        },
      } : {
        plan: 'FREE',
        status: 'ACTIVE',
        limits: {
          scansPerMonth: 5,
          pagesPerScan: 1,
          llmAnalysisEnabled: false,
          fullCrawlEnabled: false,
          apiAccessEnabled: false,
        },
      },
      usage: {
        scansUsed: usage?.scansUsed || 0,
        pagesScanned: usage?.pagesScanned || 0,
        llmCalls: usage?.llmCalls || 0,
        scansRemaining: user.subscription
          ? Math.max(0, user.subscription.scansPerMonth - (usage?.scansUsed || 0))
          : Math.max(0, 5 - (usage?.scansUsed || 0)),
      },
    });
  } catch (error) {
    logger.error('Error getting user profile', { error });
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * PATCH /api/users/me
 * Update current user's profile
 */
usersRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image,
    });
  } catch (error) {
    logger.error('Error updating user profile', { error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/users/me/scans
 * Get user's scan history
 */
usersRouter.get('/me/scans', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 20, offset = 0 } = req.query;

    const scans = await prisma.scan.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        url: true,
        domain: true,
        scanType: true,
        status: true,
        overallScore: true,
        grade: true,
        pagesScanned: true,
        issuesFound: true,
        duration: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.scan.count({
      where: { userId: user.id },
    });

    res.json({
      scans,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + scans.length < total,
      },
    });
  } catch (error) {
    logger.error('Error getting scan history', { error });
    res.status(500).json({ error: 'Failed to get scan history' });
  }
});

/**
 * GET /api/users/me/scans/:scanId
 * Get detailed scan report
 */
usersRouter.get('/me/scans/:scanId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { scanId } = req.params;

    const scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        userId: user.id,
      },
      include: {
        pageResults: true,
        reports: true,
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json(scan);
  } catch (error) {
    logger.error('Error getting scan details', { error });
    res.status(500).json({ error: 'Failed to get scan details' });
  }
});

/**
 * DELETE /api/users/me/scans/:scanId
 * Delete a scan
 */
usersRouter.delete('/me/scans/:scanId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { scanId } = req.params;

    const scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        userId: user.id,
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    await prisma.scan.delete({
      where: { id: scanId },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting scan', { error });
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

/**
 * GET /api/users/me/api-keys
 * Get user's API keys
 */
usersRouter.get('/me/api-keys', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user has API access
    if (!user.subscription?.apiAccessEnabled) {
      return res.status(403).json({
        error: 'API access requires Pro or Enterprise subscription',
        upgradeUrl: '/pricing',
      });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        key: true, // Only show last 4 chars in response
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Mask API keys (show only last 4 chars)
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: `sk_...${key.key.slice(-4)}`,
    }));

    res.json(maskedKeys);
  } catch (error) {
    logger.error('Error getting API keys', { error });
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

/**
 * POST /api/users/me/api-keys
 * Create a new API key
 */
usersRouter.post('/me/api-keys', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    // Check if user has API access
    if (!user.subscription?.apiAccessEnabled) {
      return res.status(403).json({
        error: 'API access requires Pro or Enterprise subscription',
        upgradeUrl: '/pricing',
      });
    }

    // Generate API key
    const crypto = await import('crypto');
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name || 'API Key',
        key: rawKey,
      },
    });

    // Return the full key only on creation
    res.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Show full key only once
      createdAt: apiKey.createdAt,
      message: 'Save this key securely. It will not be shown again.',
    });
  } catch (error) {
    logger.error('Error creating API key', { error });
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * DELETE /api/users/me/api-keys/:keyId
 * Delete an API key
 */
usersRouter.delete('/me/api-keys/:keyId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { keyId } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
      },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting API key', { error });
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * GET /api/users/me/usage
 * Get detailed usage statistics
 */
usersRouter.get('/me/usage', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const now = new Date();

    // Get last 6 months of usage
    const usageHistory = await prisma.usageRecord.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
    });

    // Get current month's scans breakdown
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const scansByDay = await prisma.scan.groupBy({
      by: ['createdAt'],
      where: {
        userId: user.id,
        createdAt: { gte: currentMonthStart },
      },
      _count: true,
    });

    res.json({
      currentMonth: {
        scansUsed: usageHistory[0]?.scansUsed || 0,
        pagesScanned: usageHistory[0]?.pagesScanned || 0,
        llmCalls: usageHistory[0]?.llmCalls || 0,
        limit: user.subscription?.scansPerMonth || 5,
      },
      history: usageHistory.map(u => ({
        month: u.month,
        year: u.year,
        scansUsed: u.scansUsed,
        pagesScanned: u.pagesScanned,
        llmCalls: u.llmCalls,
      })),
    });
  } catch (error) {
    logger.error('Error getting usage stats', { error });
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});
