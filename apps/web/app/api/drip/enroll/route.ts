/**
 * Drip Enrollment Endpoint
 * Called by the API server after a scan completes to enroll the user in the drip sequence.
 * Protected by shared CRON_SECRET bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enrollUser } from '@/lib/drip';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, scanId } = await request.json();

    if (!userId || !scanId) {
      return NextResponse.json(
        { error: 'Missing userId or scanId' },
        { status: 400 }
      );
    }

    await enrollUser(userId, scanId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Drip enrollment error:', error);
    return NextResponse.json(
      { error: 'Enrollment failed' },
      { status: 500 }
    );
  }
}
