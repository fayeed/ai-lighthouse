/**
 * Resend email service wrapper.
 * Handles sending transactional emails and managing Audience contacts.
 */

import { Resend } from 'resend';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';
const FROM = process.env.RESEND_FROM_EMAIL || 'AI Lighthouse <hello@ailighthouse.com>';

/**
 * Send a transactional email using a React Email template.
 */
export async function sendEmail(
  to: string,
  subject: string,
  react: React.ReactElement
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      react,
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
  if (!AUDIENCE_ID) return;

  try {
    await resend.contacts.create({
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
  if (!AUDIENCE_ID) return;

  try {
    await resend.contacts.remove({
      audienceId: AUDIENCE_ID,
      email,
    });
  } catch (err) {
    console.error('Failed to remove contact from audience:', err);
  }
}
