/**
 * Recent Scans API Route
 * Returns user's recent scan history with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Fetch scans and total count in parallel
    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
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
        skip,
        take: limit,
      }),
      prisma.scan.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Recent scans fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent scans' },
      { status: 500 }
    );
  }
}
