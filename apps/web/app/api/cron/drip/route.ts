/**
 * Drip Campaign Cron Endpoint
 * Called hourly by Vercel Cron to process due drip emails.
 * Protected by CRON_SECRET bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDueDrips } from '@/lib/drip';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processDueDrips();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Drip cron error:', error);
    return NextResponse.json(
      { error: 'Cron processing failed' },
      { status: 500 }
    );
  }
}
