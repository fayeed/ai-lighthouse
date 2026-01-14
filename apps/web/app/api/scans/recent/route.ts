/**
 * Recent Scans API Route
 * Returns user's recent scan history
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

    const scans = await prisma.scan.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        url: true,
        domain: true,
        overallScore: true,
        grade: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(scans);
  } catch (error) {
    console.error('Recent scans fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent scans' },
      { status: 500 }
    );
  }
}
