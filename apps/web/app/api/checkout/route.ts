/**
 * Checkout API Route
 * Creates Dodo checkout session for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, interval } = body;

    // Validate plan
    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['MONTHLY', 'YEARLY'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getlighthouse.dev';

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email!,
      session.user.name || undefined,
      plan,
      interval,
      `${baseUrl}/dashboard?success=true`,
      `${baseUrl}/pricing?canceled=true`
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
