import type { DripEmailProps } from './types.js';
import { styles, wrapEmail, footer } from './base.js';

export function caseStudyEmail(props: DripEmailProps): string {
  const { userName, scanUrl, scanId, unsubscribeUrl } = props;

  const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

  const statRow = `
    margin-bottom: 12px;
  `;
  const statNumber = `
    font-size: 20px;
    font-weight: 700;
    color: #14b8a6;
    margin: 0;
  `;
  const statLabel = `
    font-size: 13px;
    color: #a1a1aa;
    margin: 2px 0 0 0;
  `;

  const content = `
    <p style="${styles.logo}">🏮 AI Lighthouse</p>

    <p style="${styles.heading}">
      How sites like yours improved their scores
    </p>

    <p style="${styles.paragraph}">
      ${userName ? `${userName}, a` : 'A'} week ago you scanned
      <strong>${scanUrl || 'your site'}</strong>. Since then, we've seen hundreds of
      sites use their AI Lighthouse reports to make meaningful improvements. Here are the
      patterns that work:
    </p>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">📊 The Numbers</p>
      <div style="${statRow}">
        <p style="${statNumber}">+23 pts</p>
        <p style="${statLabel}">Average score improvement after fixing critical issues</p>
      </div>
      <div style="${statRow}">
        <p style="${statNumber}">72%</p>
        <p style="${statLabel}">Of improvements come from just 3-5 changes</p>
      </div>
      <div style="${statRow}">
        <p style="${statNumber}">2.4x</p>
        <p style="${statLabel}">More AI citations for sites scoring above 70</p>
      </div>
    </div>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">🏆 What Top Improvers Did</p>
      <p style="${styles.cardText}">
        <strong>1. Added structured data (JSON-LD)</strong>
        The single highest-impact change. Organization, Article, and FAQ schemas tell AI
        exactly what your content is.

        <strong>2. Fixed heading hierarchy</strong>
        Proper H1 → H2 → H3 structure makes your content parseable by AI extractors.

        <strong>3. Added author attribution</strong>
        AI systems increasingly weight content with clear authorship and credentials.

        <strong>4. Wrote FAQ sections</strong>
        Direct question-answer pairs are exactly what AI answer engines look for.

        <strong>5. Added source citations</strong>
        Linking to authoritative sources (.gov, .edu, research) boosts trust signals.
      </p>
    </div>

    <div style="${styles.highlightBox}">
      <p style="${styles.highlightText}">
        💡 <strong>Pro tip:</strong> The Step-by-Step Fix Guides (available on Pro) give you
        CMS-specific instructions for each issue — whether you use WordPress, Shopify,
        Next.js, or plain HTML.
      </p>
    </div>

    ${scanId ? `
    <div style="${styles.ctaSection}">
      <a href="${BASE_URL}/dashboard/scan?scanId=${scanId}" style="${styles.button}">
        Review Your Issues →
      </a>
    </div>
    ` : ''}

    <p style="${styles.paragraph}">
      Tomorrow, we'll share what Pro unlocks — and how it can accelerate your
      improvement from weeks to hours.
    </p>

    ${footer(scanUrl, unsubscribeUrl)}
  `;

  return wrapEmail(content, "Real sites went from D to A — here's how they did it");
}
