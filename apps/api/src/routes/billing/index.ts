/**
 * Billing Routes (Dodo Payments)
 * Handles subscription checkout, portal, and webhooks
 */

import express from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../utils/logger.js';
import { getCurrentUser, requireAuth } from '../auth/index.js';
import { cancelDrip } from '../../services/drip.js';

export const billingRouter = express.Router();

// Internal API secret for web app proxy requests
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

/**
 * Middleware that accepts either regular auth OR internal web app requests
 */
async function requireAuthOrInternal(req: express.Request, res: express.Response, next: express.NextFunction) {
  const internalSecret = req.headers['x-internal-secret'] as string;
  const userId = req.headers['x-user-id'] as string;

  // Check for internal web app request
  if (INTERNAL_API_SECRET && internalSecret === INTERNAL_API_SECRET && userId) {
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as any).user = user;
    return next();
  }

  // Fall back to regular auth
  return requireAuth(req, res, next);
}

// Dodo Payments configuration
const DODO_API_KEY = process.env.DODO_API_KEY!;
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET!;
const DODO_API_URL = process.env.DODO_API_URL || 'https://api.dodopayments.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Product/Price IDs from Dodo Payments dashboard
const PRICE_IDS = {
  pro_monthly: process.env.DODO_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.DODO_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  enterprise_monthly: process.env.DODO_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
  enterprise_yearly: process.env.DODO_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
};

// Plan limits configuration
const PLAN_LIMITS = {
  FREE: {
    scansPerMonth: 5,
    pagesPerScan: 1,
    llmAnalysisEnabled: false,
    fullCrawlEnabled: false,
    apiAccessEnabled: false,
  },
  PRO: {
    scansPerMonth: -1, // Unlimited
    pagesPerScan: -1, // Unlimited
    llmAnalysisEnabled: true,
    fullCrawlEnabled: true,
    apiAccessEnabled: true,
  },
  ENTERPRISE: {
    scansPerMonth: -1,
    pagesPerScan: -1,
    llmAnalysisEnabled: true,
    fullCrawlEnabled: true,
    apiAccessEnabled: true,
  },
};

/**
 * Helper to make Dodo API requests
 */
async function dodoRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${DODO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Dodo API error: ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/billing/checkout
 * Create a checkout session for subscription
 */
billingRouter.post('/checkout', requireAuthOrInternal, async (req, res) => {
  try {
    const user = (req as any).user;
    const { plan, interval = 'monthly' } = req.body;

    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid billing interval' });
    }

    // Get the appropriate price ID
    const priceKey = `${plan.toLowerCase()}_${interval}` as keyof typeof PRICE_IDS;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return res.status(400).json({ error: 'Price not found for this plan' });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription?.status === 'ACTIVE' && existingSubscription.plan !== 'FREE') {
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'You already have an active subscription. Please manage it from the billing portal.',
        portalUrl: '/api/billing/portal',
      });
    }

    // Create or get Dodo customer
    let customerId = existingSubscription?.dodoCustomerId;

    if (!customerId) {
      const customer = await dodoRequest('/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
          },
        }),
      });
      customerId = customer.id;

      // Store customer ID
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { dodoCustomerId: customerId },
        create: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          dodoCustomerId: customerId,
          ...PLAN_LIMITS.FREE,
        },
      });
    }

    // Create checkout session
    const session = await dodoRequest('/v1/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        mode: 'subscription',
        line_items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
        cancel_url: `${FRONTEND_URL}/pricing?checkout=cancelled`,
        metadata: {
          userId: user.id,
          plan,
          interval,
        },
      }),
    });

    logger.info('Checkout session created', {
      userId: user.id,
      plan,
      interval,
      sessionId: session.id,
    });

    res.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error('Checkout session error', { error });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * GET /api/billing/portal
 * Create a billing portal session for managing subscription
 */
billingRouter.post('/portal', requireAuthOrInternal, async (req, res) => {
  try {
    const user = (req as any).user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.dodoCustomerId) {
      return res.status(400).json({
        error: 'No billing account',
        message: 'You do not have an active billing account.',
      });
    }

    // Create portal session
    const session = await dodoRequest('/v1/billing_portal/sessions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: subscription.dodoCustomerId,
        return_url: `${FRONTEND_URL}/dashboard`,
      }),
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error('Portal session error', { error });
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * GET /api/billing/subscription
 * Get current subscription details
 */
billingRouter.get('/subscription', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return res.json({
        plan: 'FREE',
        status: 'ACTIVE',
        limits: PLAN_LIMITS.FREE,
      });
    }

    // Get current usage
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
      plan: subscription.plan,
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: {
        scansPerMonth: subscription.scansPerMonth,
        pagesPerScan: subscription.pagesPerScan,
        llmAnalysisEnabled: subscription.llmAnalysisEnabled,
        fullCrawlEnabled: subscription.fullCrawlEnabled,
        apiAccessEnabled: subscription.apiAccessEnabled,
      },
      usage: {
        scansUsed: usage?.scansUsed || 0,
        pagesScanned: usage?.pagesScanned || 0,
        llmCalls: usage?.llmCalls || 0,
        scansRemaining: subscription.scansPerMonth === -1
          ? -1
          : Math.max(0, subscription.scansPerMonth - (usage?.scansUsed || 0)),
      },
    });
  } catch (error) {
    logger.error('Get subscription error', { error });
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * POST /api/billing/cancel
 * Cancel subscription at period end
 */
billingRouter.post('/cancel', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.dodoSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    // Cancel at period end via Dodo API
    await dodoRequest(`/v1/subscriptions/${subscription.dodoSubscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        cancel_at_period_end: true,
      }),
    });

    // Update local subscription
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: true },
    });

    logger.info('Subscription cancelled', { userId: user.id });

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period.',
    });
  } catch (error) {
    logger.error('Cancel subscription error', { error });
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/billing/resume
 * Resume a cancelled subscription
 */
billingRouter.post('/resume', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.dodoSubscriptionId || !subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'No cancelled subscription to resume' });
    }

    // Resume via Dodo API
    await dodoRequest(`/v1/subscriptions/${subscription.dodoSubscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        cancel_at_period_end: false,
      }),
    });

    // Update local subscription
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: false },
    });

    logger.info('Subscription resumed', { userId: user.id });

    res.json({
      success: true,
      message: 'Subscription has been resumed.',
    });
  } catch (error) {
    logger.error('Resume subscription error', { error });
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

/**
 * Verify Dodo webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', DODO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/billing/webhooks
 * Handle Dodo Payments webhooks
 */
billingRouter.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['dodo-signature'] as string;
    const payload = req.body.toString();

    if (!signature || !verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);

    logger.info('Webhook received', { type: event.type, id: event.id });

    // Store webhook event for idempotency
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      logger.info('Duplicate webhook event', { id: event.id });
      return res.json({ received: true });
    }

    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: event.data,
        processed: true,
        processedAt: new Date(),
      },
    });

    // Process webhook based on type
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated': {
        const subscriptionData = event.data;
        const userId = subscriptionData.metadata?.userId;

        if (!userId) {
          logger.warn('Subscription webhook missing userId', { subscriptionId: subscriptionData.id });
          break;
        }

        const plan = subscriptionData.metadata?.plan?.toUpperCase() || 'PRO';
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.PRO;

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: plan as any,
            status: subscriptionData.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
            dodoSubscriptionId: subscriptionData.id,
            dodoCustomerId: subscriptionData.customer_id,
            billingInterval: subscriptionData.metadata?.interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
            currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
            currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
            ...limits,
          },
          create: {
            userId,
            plan: plan as any,
            status: 'ACTIVE',
            dodoSubscriptionId: subscriptionData.id,
            dodoCustomerId: subscriptionData.customer_id,
            billingInterval: subscriptionData.metadata?.interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
            currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
            currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
            ...limits,
          },
        });

        logger.info('Subscription updated via webhook', { userId, plan });

        // Cancel drip campaign when user upgrades to paid plan
        if (plan !== 'FREE') {
          cancelDrip(userId).catch((err) => {
            logger.error('Failed to cancel drip on upgrade', { userId, error: String(err) });
          });
        }
        break;
      }

      case 'subscription.cancelled': {
        const subscriptionData = event.data;
        const userId = subscriptionData.metadata?.userId;

        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              status: 'CANCELED',
              plan: 'FREE',
              ...PLAN_LIMITS.FREE,
            },
          });

          logger.info('Subscription cancelled via webhook', { userId });
        }
        break;
      }

      case 'payment.failed': {
        const paymentData = event.data;
        const customerId = paymentData.customer_id;

        const subscription = await prisma.subscription.findFirst({
          where: { dodoCustomerId: customerId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });

          logger.warn('Payment failed', { userId: subscription.userId });
        }
        break;
      }

      default:
        logger.info('Unhandled webhook type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
