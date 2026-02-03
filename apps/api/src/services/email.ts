/**
 * Resend email service for the API server.
 * Handles sending HTML emails and managing Audience contacts.
 */

import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';
const FROM = process.env.RESEND_FROM_EMAIL || 'AI Lighthouse <hello@ailighthouse.com>';

/**
 * Send an HTML email via Resend.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ id: string } | null> {
  const client = getResend();
  if (!client) {
    console.warn('Resend API key not configured, skipping email send');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend send error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Email send failed:', err);
    return null;
  }
}

/**
 * Add a contact to the Resend Audience for drip tracking.
 */
export async function addToAudience(email: string, firstName?: string) {
  const client = getResend();
  if (!client || !AUDIENCE_ID) return;

  try {
    await client.contacts.create({
      audienceId: AUDIENCE_ID,
      email,
      firstName: firstName || undefined,
    });
  } catch (err) {
    console.error('Failed to add contact to audience:', err);
  }
}

/**
 * Remove a contact from the Resend Audience (e.g. on upgrade).
 */
export async function removeFromAudience(email: string) {
  const client = getResend();
  if (!client || !AUDIENCE_ID) return;

  try {
    await client.contacts.remove({
      audienceId: AUDIENCE_ID,
      email,
    });
  } catch (err) {
    console.error('Failed to remove contact from audience:', err);
  }
}
