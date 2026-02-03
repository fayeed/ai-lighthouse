/**
 * Billing Portal API Route
 * Creates Dodo customer portal session for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createPortalSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getlighthouse.dev';

    const portalUrl = await createPortalSession(
      session.user.id,
      `${baseUrl}/dashboard`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Portal error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create portal session';

    // Provide more specific error messages
    if (message.includes('No subscription found')) {
      return NextResponse.json(
        { error: 'No billing account found. Please contact support if you believe this is an error.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
