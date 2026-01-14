/**
 * Authentication Routes
 * Handles Google OAuth flow and session management
 */

import express from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../utils/logger.js';

export const authRouter = express.Router();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SESSION_COOKIE_NAME = 'lighthouse_session';
const SESSION_EXPIRY_DAYS = 30;

/**
 * Generate a secure random token
 */
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * GET /api/auth/session
 * Get current session info
 */
authRouter.get('/session', async (req, res) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return res.json({ user: null });
    }

    const hashedToken = hashToken(sessionToken);

    const session = await prisma.session.findFirst({
      where: {
        sessionToken: hashedToken,
        expires: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME);
      return res.json({ user: null });
    }

    // Get current month's usage
    const now = new Date();
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });

    return res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      subscription: session.user.subscription ? {
        plan: session.user.subscription.plan,
        status: session.user.subscription.status,
        billingInterval: session.user.subscription.billingInterval,
        currentPeriodEnd: session.user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: session.user.subscription.cancelAtPeriodEnd,
        limits: {
          scansPerMonth: session.user.subscription.scansPerMonth,
          pagesPerScan: session.user.subscription.pagesPerScan,
          llmAnalysisEnabled: session.user.subscription.llmAnalysisEnabled,
          fullCrawlEnabled: session.user.subscription.fullCrawlEnabled,
          apiAccessEnabled: session.user.subscription.apiAccessEnabled,
        },
      } : null,
      usage: usage ? {
        scansUsed: usage.scansUsed,
        pagesScanned: usage.pagesScanned,
        llmCalls: usage.llmCalls,
      } : {
        scansUsed: 0,
        pagesScanned: 0,
        llmCalls: 0,
      },
    });
  } catch (error) {
    logger.error('Error getting session', { error });
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * GET /api/auth/login/google
 * Initiate Google OAuth flow
 */
authRouter.get('/login/google', (req, res) => {
  const state = generateToken(16);
  const redirectUrl = (req.query.redirect as string) || '/dashboard';

  // Store state and redirect URL in cookie
  res.cookie('oauth_state', JSON.stringify({ state, redirectUrl }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

/**
 * GET /api/auth/callback/google
 * Handle Google OAuth callback
 */
authRouter.get('/callback/google', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedData = req.cookies?.oauth_state;

    if (!storedData) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
    }

    const { state: storedState, redirectUrl } = JSON.parse(storedData);

    if (state !== storedState) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      logger.error('Token exchange failed', { status: tokenResponse.status });
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: new Date(),
        },
      });

      // Create default free subscription
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

      // Initialize usage record
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

      logger.info('New user created', { userId: user.id, email: user.email });
    } else {
      // Update existing user info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          image: googleUser.picture,
        },
      });
    }

    // Create or update Google account link
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.id,
        },
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleUser.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
    });

    // Create session
    const sessionToken = generateToken();
    const hashedToken = hashToken(sessionToken);
    const expires = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        sessionToken: hashedToken,
        userId: user.id,
        expires,
      },
    });

    // Set session cookie
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    // Clear OAuth state cookie
    res.clearCookie('oauth_state');

    logger.info('User logged in', { userId: user.id });

    res.redirect(`${FRONTEND_URL}${redirectUrl || '/dashboard'}`);
  } catch (error) {
    logger.error('OAuth callback error', { error });
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

/**
 * POST /api/auth/logout
 * Log out current user
 */
authRouter.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      const hashedToken = hashToken(sessionToken);

      await prisma.session.deleteMany({
        where: { sessionToken: hashedToken },
      });
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * Middleware to get current user from session
 */
export async function getCurrentUser(req: express.Request) {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return null;
  }

  const hashedToken = hashToken(sessionToken);

  const session = await prisma.session.findFirst({
    where: {
      sessionToken: hashedToken,
      expires: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  return session?.user || null;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  getCurrentUser(req).then(user => {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).user = user;
    next();
  }).catch(error => {
    logger.error('Auth middleware error', { error });
    res.status(500).json({ error: 'Authentication error' });
  });
}
