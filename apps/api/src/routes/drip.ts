/**
 * Drip Campaign Routes
 * Handles unsubscribe and Resend webhook for bounces/complaints.
 */

import { Router, Request, Response } from 'express';
import { unsubscribeByToken, handleBounceOrComplaint } from '../services/drip.js';

const router = Router();

const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

/**
 * GET /drip/unsubscribe?token=xxx
 * One-click unsubscribe via token in the URL.
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    return res.redirect(`${BASE_URL}?unsubscribed=invalid`);
  }

  const success = await unsubscribeByToken(token);

  if (!success) {
    return res.redirect(`${BASE_URL}?unsubscribed=invalid`);
  }

  return res.redirect(`${BASE_URL}?unsubscribed=true`);
});

/**
 * POST /drip/webhook/resend
 * Resend webhook handler for bounces and complaints.
 */
router.post('/webhook/resend', async (req: Request, res: Response) => {
  // Optionally verify webhook signature
  const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
  if (RESEND_WEBHOOK_SECRET) {
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(401).json({ error: 'Missing webhook headers' });
    }
    // Note: For production, implement full Svix signature verification
  }

  const event = req.body;
  const { type, data } = event;

  // Handle bounce and complaint events
  if (type === 'email.bounced' || type === 'email.complained') {
    const recipients = data?.to || [];
    for (const email of recipients) {
      try {
        await handleBounceOrComplaint(email);
        console.log(`Drip canceled for ${email} due to ${type}`);
      } catch (err) {
        console.error(`Failed to handle ${type} for ${email}:`, err);
      }
    }
  }

  return res.json({ received: true });
});

export default router;
