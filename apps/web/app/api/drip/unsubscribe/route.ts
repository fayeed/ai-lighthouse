/**
 * Drip Unsubscribe Endpoint
 * Handles one-click unsubscribe via token in the URL.
 * No auth required — the token itself is the credential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/drip';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailighthouse.com';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const success = await unsubscribeByToken(token);

  if (!success) {
    return NextResponse.redirect(`${BASE_URL}?unsubscribed=invalid`);
  }

  return NextResponse.redirect(`${BASE_URL}?unsubscribed=true`);
}
