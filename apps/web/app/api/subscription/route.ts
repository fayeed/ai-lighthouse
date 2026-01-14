/**
 * Subscription API Route
 * Returns current user's subscription details
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getSubscriptionDetails } from '@/lib/dodo';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await getSubscriptionDetails(session.user.id);

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

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
