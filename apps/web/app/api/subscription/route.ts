/**
 * Subscription API Route
 * Returns current user's subscription details
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      // Return default free subscription if none exists
      return NextResponse.json({
        plan: 'FREE',
        status: 'ACTIVE',
        billingInterval: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        limits: {
          scansPerMonth: 5,
          pagesPerScan: 1,
          llmAnalysisEnabled: false,
          fullCrawlEnabled: false,
          apiAccessEnabled: false,
        },
        usage: {
          scansUsed: 0,
          pagesScanned: 0,
          llmCalls: 0,
        },
      });
    }

    // Get current usage
    const now = new Date();
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
