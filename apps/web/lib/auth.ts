/**
 * Authentication configuration and utilities
 * Using NextAuth.js with Google OAuth and Prisma adapter
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

/**
 * Extend default session types to include user ID and subscription info
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      plan: 'FREE' | 'PRO' | 'ENTERPRISE';
      subscriptionStatus: string | null;
    } & DefaultSession['user'];
  }
}

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch subscription info
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
          select: { plan: true, status: true },
        });

        session.user.plan = subscription?.plan ?? 'FREE';
        session.user.subscriptionStatus = subscription?.status ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create default free subscription for new users
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          scansPerMonth: 5,
          pagesPerScan: 1,
          llmAnalysisEnabled: false,
          fullCrawlEnabled: false,
          apiAccessEnabled: false,
        },
      });

      // Initialize usage record for current month
      const now = new Date();
      await prisma.usageRecord.create({
        data: {
          userId: user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          scansUsed: 0,
          pagesScanned: 0,
          llmCalls: 0,
        },
      });
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'database',
  },
};

/**
 * Get session on the server side
 */
export async function getServerSession() {
  const { getServerSession: getSession } = await import('next-auth');
  return getSession(authOptions);
}

/**
 * Check if user has an active paid subscription
 */
export async function isPaidUser(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  return (
    subscription?.status === 'ACTIVE' &&
    (subscription?.plan === 'PRO' || subscription?.plan === 'ENTERPRISE')
  );
}

/**
 * Get user's current usage for the month
 */
export async function getUserUsage(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let usage = await prisma.usageRecord.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  // Create if doesn't exist (new month)
  if (!usage) {
    usage = await prisma.usageRecord.create({
      data: {
        userId,
        month,
        year,
        scansUsed: 0,
        pagesScanned: 0,
        llmCalls: 0,
      },
    });
  }

  return usage;
}

/**
 * Get user's subscription limits
 */
export async function getSubscriptionLimits(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Default free limits
    return {
      scansPerMonth: 5,
      pagesPerScan: 1,
      llmAnalysisEnabled: false,
      fullCrawlEnabled: false,
      apiAccessEnabled: false,
    };
  }

  return {
    scansPerMonth: subscription.scansPerMonth,
    pagesPerScan: subscription.pagesPerScan,
    llmAnalysisEnabled: subscription.llmAnalysisEnabled,
    fullCrawlEnabled: subscription.fullCrawlEnabled,
    apiAccessEnabled: subscription.apiAccessEnabled,
  };
}

/**
 * Check if user can perform a scan
 */
export async function canUserScan(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  scansRemaining?: number;
}> {
  const [usage, limits] = await Promise.all([
    getUserUsage(userId),
    getSubscriptionLimits(userId),
  ]);

  // Pro/Enterprise users have unlimited scans
  if (limits.scansPerMonth === -1 || limits.scansPerMonth >= 999999) {
    return { allowed: true, scansRemaining: -1 };
  }

  const scansRemaining = limits.scansPerMonth - usage.scansUsed;

  if (scansRemaining <= 0) {
    return {
      allowed: false,
      reason: 'Monthly scan limit reached. Upgrade to Pro for unlimited scans.',
      scansRemaining: 0,
    };
  }

  return {
    allowed: true,
    scansRemaining,
  };
}

/**
 * Increment user's scan usage
 */
export async function incrementScanUsage(
  userId: string,
  pagesScanned: number = 1,
  usedLLM: boolean = false
) {
  const now = new Date();

  await prisma.usageRecord.upsert({
    where: {
      userId_month_year: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
    update: {
      scansUsed: { increment: 1 },
      pagesScanned: { increment: pagesScanned },
      llmCalls: usedLLM ? { increment: 1 } : undefined,
    },
    create: {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      scansUsed: 1,
      pagesScanned,
      llmCalls: usedLLM ? 1 : 0,
    },
  });
}
