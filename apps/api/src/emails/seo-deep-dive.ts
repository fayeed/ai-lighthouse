import type { DripEmailProps } from './types.js';
import { styles, wrapEmail, footer } from './base.js';

export function seoDeepDiveEmail(props: DripEmailProps): string {
  const { userName, scanUrl, overallScore, scanId, unsubscribeUrl } = props;

  const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

  const content = `
    <p style="${styles.logo}">🏮 AI Lighthouse</p>

    <p style="${styles.heading}">
      ${userName ? `${userName}, let's` : "Let's"} talk about your SEO score
    </p>

    <p style="${styles.paragraph}">
      Two days ago, you scanned <strong>${scanUrl || 'your site'}</strong>
      ${overallScore != null ? ` and scored ${Math.round(overallScore)}/100` : ''}.
      Today, let's break down what the SEO dimension actually measures — and why it matters
      more than ever.
    </p>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">🔍 Why SEO Matters for AI</p>
      <p style="${styles.cardText}">
        AI systems like ChatGPT and Google SGE don't just index your pages — they
        <strong> understand</strong> them. Traditional SEO signals (title tags, meta descriptions,
        headings, canonical URLs) are the foundation AI uses to decide whether your content
        is worth surfacing.
      </p>
    </div>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">📋 Common Issues We Find</p>
      <p style="${styles.cardText}">
        <strong>Missing meta descriptions</strong> — AI needs clear summaries to represent your content.

        <strong>Poor heading hierarchy</strong> — H1 → H2 → H3 structure helps AI parse your content tree.

        <strong>Missing alt text</strong> — Multimodal AI models use alt text to understand images.

        <strong>No canonical URLs</strong> — Without these, AI may index duplicate content.
      </p>
    </div>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">⚡ Quick Wins</p>
      <p style="${styles.cardText}">
        Most sites can improve their SEO score by 15-20 points just by fixing meta descriptions
        and heading structure. These are the lowest-effort, highest-impact changes you can make.
      </p>
    </div>

    ${scanId ? `
    <div style="${styles.ctaSection}">
      <a href="${BASE_URL}/dashboard/scan?scanId=${scanId}" style="${styles.button}">
        View Your SEO Issues →
      </a>
    </div>
    ` : ''}

    <p style="${styles.paragraph}">
      In a few days, we'll explain how AI search engines go <em>beyond</em> traditional SEO
      with AEO and GEO — two new optimization categories that most sites completely overlook.
    </p>

    ${footer(scanUrl, unsubscribeUrl)}
  `;

  return wrapEmail(content, 'What your SEO score really means for AI visibility');
}
