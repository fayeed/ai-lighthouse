/**
 * Dodo Payments Webhook Handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent, verifyWebhookSignature } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-dodo-signature');

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);

    // Process the webhook event
    await handleWebhookEvent(
      event.id,
      event.type,
      event.data
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
