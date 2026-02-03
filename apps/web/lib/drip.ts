/**
 * Drip email campaign logic.
 * Handles enrollment, cancellation, retry, unsubscribe, and processing of scheduled emails.
 */

import { prisma } from './prisma';
import { sendEmail, addToAudience, removeFromAudience } from './email';
import WelcomeEmail from '@/emails/welcome';
import SeoDeepDiveEmail from '@/emails/seo-deep-dive';
import AeoGeoEmail from '@/emails/aeo-geo';
import CaseStudyEmail from '@/emails/case-study';
import UpgradeCtaEmail from '@/emails/upgrade-cta';
import type { DripEmailProps } from '@/emails/types';
import React from 'react';

type TemplateComponent = (props: DripEmailProps) => React.ReactElement;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailighthouse.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_HOURS = [1, 4, 12]; // Backoff: 1h, 4h, 12h

const DRIP_STEPS: Array<{
  index: number;
  name: string;
  delayDays: number;
  subject: string;
  template: TemplateComponent;
}> = [
  { index: 0, name: 'welcome',       delayDays: 0,  subject: 'Your AI Readiness Score is in!',             template: WelcomeEmail },
  { index: 1, name: 'seo_deep_dive', delayDays: 2,  subject: 'What your SEO score really means',           template: SeoDeepDiveEmail },
  { index: 2, name: 'aeo_geo',       delayDays: 5,  subject: 'Is your site ready for AI search engines?',  template: AeoGeoEmail },
  { index: 3, name: 'case_study',    delayDays: 7,  subject: 'How sites like yours improved their scores', template: CaseStudyEmail },
  { index: 4, name: 'upgrade_cta',   delayDays: 10, subject: 'Unlock your full AI optimization toolkit',   template: UpgradeCtaEmail },
];

/**
 * Get or create an unsubscribe token for a user.
 */
async function getUnsubscribeToken(userId: string): Promise<string> {
  const existing = await prisma.dripUnsubscribe.findUnique({
    where: { userId },
  });
  if (existing) return existing.token;

  const record = await prisma.dripUnsubscribe.create({
    data: { userId },
  });
  return record.token;
}

/**
 * Build the unsubscribe URL for a user.
 */
async function getUnsubscribeUrl(userId: string): Promise<string> {
  const token = await getUnsubscribeToken(userId);
  return `${BASE_URL}/api/drip/unsubscribe?token=${token}`;
}

/**
 * Enroll a user in the drip sequence after their first completed scan.
 * Skips if already enrolled or if user is on a paid plan.
 */
export async function enrollUser(userId: string, scanId: string) {
  // Check if already enrolled
  const existing = await prisma.dripEmail.findFirst({
    where: { userId },
  });
  if (existing) return;

  // Check if unsubscribed
  const unsubscribed = await prisma.dripUnsubscribe.findUnique({
    where: { userId },
  });
  if (unsubscribed) return;

  // Check if user is paid (no drip needed)
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  if (subscription && subscription.plan !== 'FREE') return;

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) return;

  // Add to Resend Audience
  await addToAudience(user.email, user.name?.split(' ')[0]);

  // Create all 5 scheduled drip email rows
  const now = new Date();
  const records = DRIP_STEPS.map((step) => ({
    userId,
    stepIndex: step.index,
    stepName: step.name,
    scanId,
    scheduledAt: new Date(now.getTime() + step.delayDays * 24 * 60 * 60 * 1000),
  }));

  await prisma.dripEmail.createMany({ data: records });

  // Send Day 0 welcome email immediately
  await processSingleDrip(userId, 0);
}

/**
 * Cancel all remaining scheduled drip emails for a user (e.g. on upgrade).
 */
export async function cancelDrip(userId: string) {
  await prisma.dripEmail.updateMany({
    where: { userId, status: { in: ['SCHEDULED', 'FAILED'] } },
    data: { status: 'CANCELED' },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email) {
    await removeFromAudience(user.email).catch(() => {});
  }
}

/**
 * Unsubscribe a user from the drip campaign via their token.
 * Returns true if the token was valid and unsubscribe succeeded.
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const record = await prisma.dripUnsubscribe.findUnique({
    where: { token },
  });

  if (!record) return false;

  await cancelDrip(record.userId);
  return true;
}

/**
 * Handle a bounced or complained email from Resend webhook.
 * Cancels the drip and removes from audience.
 */
export async function handleBounceOrComplaint(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return;

  await cancelDrip(user.id);
}

/**
 * Process a single drip email by userId + stepIndex.
 */
async function processSingleDrip(userId: string, stepIndex: number) {
  const drip = await prisma.dripEmail.findUnique({
    where: { userId_stepIndex: { userId, stepIndex } },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!drip || (drip.status !== 'SCHEDULED' && drip.status !== 'FAILED')) return;
  if (drip.status === 'FAILED' && drip.retryCount >= MAX_RETRIES) return;

  const step = DRIP_STEPS[stepIndex];
  if (!step) return;

  // Fetch scan data for personalization
  let scanData: { url: string; overallScore: number | null; grade: string | null } | null = null;
  if (drip.scanId) {
    scanData = await prisma.scan.findUnique({
      where: { id: drip.scanId },
      select: { url: true, overallScore: true, grade: true },
    });
  }

  try {
    const unsubscribeUrl = await getUnsubscribeUrl(userId);
    const TemplateComponent = step.template;
    const emailElement = TemplateComponent({
      userName: drip.user.name || undefined,
      scanUrl: scanData?.url,
      overallScore: scanData?.overallScore,
      grade: scanData?.grade,
      scanId: drip.scanId || undefined,
      unsubscribeUrl,
    });

    const result = await sendEmail(drip.user.email, step.subject, emailElement);

    if (!result) {
      throw new Error('sendEmail returned null');
    }

    await prisma.dripEmail.update({
      where: { id: drip.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        resendId: result.id,
      },
    });
  } catch (error) {
    const newRetryCount = drip.retryCount + 1;
    const canRetry = newRetryCount < MAX_RETRIES;

    await prisma.dripEmail.update({
      where: { id: drip.id },
      data: {
        status: 'FAILED',
        error: String(error),
        retryCount: newRetryCount,
        // Schedule retry with backoff if retries remain
        ...(canRetry && {
          scheduledAt: new Date(
            Date.now() + (RETRY_DELAY_HOURS[newRetryCount - 1] || 12) * 60 * 60 * 1000
          ),
        }),
      },
    });
  }
}

/**
 * Process all due drip emails. Called by the cron endpoint.
 */
export async function processDueDrips(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}> {
  const now = new Date();

  // Fetch both SCHEDULED and FAILED (for retries) emails that are due
  const dueDrips = await prisma.dripEmail.findMany({
    where: {
      status: { in: ['SCHEDULED', 'FAILED'] },
      scheduledAt: { lte: now },
      retryCount: { lt: MAX_RETRIES },
    },
    select: { userId: true, stepIndex: true, status: true },
    take: 100,
  });

  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const drip of dueDrips) {
    // Double-check user hasn't upgraded since enrollment
    const sub = await prisma.subscription.findUnique({
      where: { userId: drip.userId },
      select: { plan: true },
    });

    if (sub && sub.plan !== 'FREE') {
      await cancelDrip(drip.userId);
      continue;
    }

    // Check if user unsubscribed
    const unsubscribed = await prisma.dripUnsubscribe.findUnique({
      where: { userId: drip.userId },
    });
    if (unsubscribed) {
      await cancelDrip(drip.userId);
      continue;
    }

    const wasRetry = drip.status === 'FAILED';
    await processSingleDrip(drip.userId, drip.stepIndex);

    // Check result
    const updated = await prisma.dripEmail.findUnique({
      where: { userId_stepIndex: { userId: drip.userId, stepIndex: drip.stepIndex } },
      select: { status: true },
    });

    if (updated?.status === 'SENT') {
      sent++;
      if (wasRetry) retried++;
    } else {
      failed++;
    }
  }

  return { processed: dueDrips.length, sent, failed, retried };
}
