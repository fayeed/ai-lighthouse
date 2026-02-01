/**
 * Score History API Route
 * Returns time-series score data with tier-based date range limits.
 * FREE: 7 days, PRO: 90 days, ENTERPRISE: unlimited.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DAYS_LIMIT: Record<string, number | null> = {
  FREE: 7,
  PRO: 90,
  ENTERPRISE: null,
};

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true },
    });

    const plan = subscription?.plan || 'FREE';
    const daysLimit = DAYS_LIMIT[plan] ?? 7;

    // Build date filter
    const dateFilter = daysLimit
      ? { gte: new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000) }
      : undefined;

    const scans = await prisma.scan.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        overallScore: { not: null },
        ...(dateFilter && { createdAt: dateFilter }),
      },
      select: {
        id: true,
        domain: true,
        overallScore: true,
        grade: true,
        scanType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Extract unique domains
    const domains = [...new Set(scans.map((s) => s.domain))];

    const points = scans.map((s) => ({
      id: s.id,
      domain: s.domain,
      score: s.overallScore,
      grade: s.grade,
      scanType: s.scanType,
      date: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      points,
      domains,
      plan,
      daysLimit,
    });
  } catch (error) {
    console.error('Score history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score history' },
      { status: 500 }
    );
  }
}
