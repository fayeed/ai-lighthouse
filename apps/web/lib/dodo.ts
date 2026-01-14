/**
 * Dodo Payments Integration
 * Handles subscription management, checkout, and webhooks
 */

import { prisma } from './prisma';

// Dodo Payments API configuration
const DODO_API_URL = process.env.DODO_API_URL || 'https://api.dodopayments.com';
const DODO_API_KEY = process.env.DODO_API_KEY!;
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET!;

// Product IDs (configure these in Dodo dashboard)
export const DODO_PRODUCTS = {
  PRO_MONTHLY: process.env.DODO_PRO_MONTHLY_PRODUCT_ID!,
  PRO_YEARLY: process.env.DODO_PRO_YEARLY_PRODUCT_ID!,
  ENTERPRISE_MONTHLY: process.env.DODO_ENTERPRISE_MONTHLY_PRODUCT_ID!,
  ENTERPRISE_YEARLY: process.env.DODO_ENTERPRISE_YEARLY_PRODUCT_ID!,
};

interface DodoCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

interface DodoSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface DodoCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  subscription_id?: string;
}

/**
 * Make authenticated request to Dodo API
 */
async function dodoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
 * Create or get Dodo customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a Dodo customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { dodoCustomerId: true },
  });

  if (subscription?.dodoCustomerId) {
    return subscription.dodoCustomerId;
  }

  // Create new customer in Dodo
  const customer = await dodoRequest<DodoCustomer>('/v1/customers', {
    method: 'POST',
    body: JSON.stringify({
      email,
      name,
      metadata: { userId },
    }),
  });

  // Save customer ID to database
  await prisma.subscription.upsert({
    where: { userId },
    update: { dodoCustomerId: customer.id },
    create: {
      userId,
      dodoCustomerId: customer.id,
      plan: 'FREE',
      status: 'ACTIVE',
      scansPerMonth: 5,
      pagesPerScan: 1,
    },
  });

  return customer.id;
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  name: string | undefined,
  plan: 'PRO' | 'ENTERPRISE',
  interval: 'MONTHLY' | 'YEARLY',
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const customerId = await getOrCreateCustomer(userId, email, name);

  const productId = plan === 'PRO'
    ? (interval === 'MONTHLY' ? DODO_PRODUCTS.PRO_MONTHLY : DODO_PRODUCTS.PRO_YEARLY)
    : (interval === 'MONTHLY' ? DODO_PRODUCTS.ENTERPRISE_MONTHLY : DODO_PRODUCTS.ENTERPRISE_YEARLY);

  const session = await dodoRequest<DodoCheckoutSession>('/v1/checkout/sessions', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      line_items: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, plan, interval },
    }),
  });

  return session.url;
}

/**
 * Create customer portal session for managing subscription
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { dodoCustomerId: true },
  });

  if (!subscription?.dodoCustomerId) {
    throw new Error('No subscription found for user');
  }

  const session = await dodoRequest<{ url: string }>('/v1/billing_portal/sessions', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: subscription.dodoCustomerId,
      return_url: returnUrl,
    }),
  });

  return session.url;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { dodoSubscriptionId: true },
  });

  if (!subscription?.dodoSubscriptionId) {
    throw new Error('No active subscription found');
  }

  await dodoRequest(`/v1/subscriptions/${subscription.dodoSubscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      cancel_at_period_end: true,
    }),
  });

  await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    },
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto');
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
 * Handle webhook events from Dodo
 */
export async function handleWebhookEvent(
  eventId: string,
  eventType: string,
  data: any
): Promise<void> {
  // Check if we've already processed this event
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });

  if (existing?.processed) {
    return; // Skip duplicate events
  }

  // Store the event
  await prisma.webhookEvent.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      eventType,
      payload: data,
    },
  });

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdate(data.subscription);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data.subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(data.invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(data.invoice);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (error) {
    // Store the error
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { error: String(error) },
    });
    throw error;
  }
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(subscription: DodoSubscription): Promise<void> {
  // Find user by customer ID
  const userSubscription = await prisma.subscription.findFirst({
    where: { dodoCustomerId: subscription.customer_id },
  });

  if (!userSubscription) {
    console.error(`No user found for customer: ${subscription.customer_id}`);
    return;
  }

  // Determine plan from product ID
  let plan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE';
  let interval: 'MONTHLY' | 'YEARLY' = 'MONTHLY';

  if (subscription.product_id === DODO_PRODUCTS.PRO_MONTHLY) {
    plan = 'PRO';
    interval = 'MONTHLY';
  } else if (subscription.product_id === DODO_PRODUCTS.PRO_YEARLY) {
    plan = 'PRO';
    interval = 'YEARLY';
  } else if (subscription.product_id === DODO_PRODUCTS.ENTERPRISE_MONTHLY) {
    plan = 'ENTERPRISE';
    interval = 'MONTHLY';
  } else if (subscription.product_id === DODO_PRODUCTS.ENTERPRISE_YEARLY) {
    plan = 'ENTERPRISE';
    interval = 'YEARLY';
  }

  // Map Dodo status to our status
  const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' | 'PAUSED'> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    trialing: 'TRIALING',
    paused: 'PAUSED',
  };

  // Update subscription in database
  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      dodoSubscriptionId: subscription.id,
      dodoProductId: subscription.product_id,
      plan,
      billingInterval: interval,
      status: statusMap[subscription.status] || 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start),
      currentPeriodEnd: new Date(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // Set limits based on plan
      scansPerMonth: plan === 'FREE' ? 5 : 999999,
      pagesPerScan: plan === 'FREE' ? 1 : 999999,
      llmAnalysisEnabled: plan !== 'FREE',
      fullCrawlEnabled: plan !== 'FREE',
      apiAccessEnabled: plan !== 'FREE',
    },
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: DodoSubscription): Promise<void> {
  const userSubscription = await prisma.subscription.findFirst({
    where: { dodoSubscriptionId: subscription.id },
  });

  if (!userSubscription) {
    return;
  }

  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      // Downgrade to free at period end
      plan: 'FREE',
      scansPerMonth: 5,
      pagesPerScan: 1,
      llmAnalysisEnabled: false,
      fullCrawlEnabled: false,
      apiAccessEnabled: false,
    },
  });
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: any): Promise<void> {
  // Payment succeeded - subscription should already be updated
  // This can be used for sending receipts or updating payment history
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: any): Promise<void> {
  const userSubscription = await prisma.subscription.findFirst({
    where: { dodoCustomerId: invoice.customer_id },
  });

  if (!userSubscription) {
    return;
  }

  // Update status to past due
  await prisma.subscription.update({
    where: { userId: userSubscription.userId },
    data: {
      status: 'PAST_DUE',
    },
  });
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  if (!subscription) {
    return null;
  }

  // Get current usage
  const now = new Date();
  const usage = await prisma.usageRecord.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  return {
    plan: subscription.plan,
    status: subscription.status,
    billingInterval: subscription.billingInterval,
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
    },
  };
}
