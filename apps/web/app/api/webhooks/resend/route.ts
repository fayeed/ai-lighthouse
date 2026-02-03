/**
 * Resend Webhook Handler
 * Handles email bounce and complaint events from Resend.
 * Cancels drip campaigns for bounced/complained addresses.
 *
 * Configure this URL in your Resend dashboard under Webhooks:
 * https://yourdomain.com/api/webhooks/resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleBounceOrComplaint } from '@/lib/drip';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    [key: string]: unknown;
  };
}

export async function POST(request: NextRequest) {
  // Verify the webhook signature if secret is configured
  if (RESEND_WEBHOOK_SECRET) {
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 });
    }
  }

  let event: ResendWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, data } = event;

  // Handle bounce and complaint events
  if (type === 'email.bounced' || type === 'email.complained') {
    const recipients = data.to || [];
    for (const email of recipients) {
      try {
        await handleBounceOrComplaint(email);
        console.log(`Drip canceled for ${email} due to ${type}`);
      } catch (err) {
        console.error(`Failed to handle ${type} for ${email}:`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
