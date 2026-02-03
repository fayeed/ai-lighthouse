import type { DripEmailProps } from './types.js';
import { styles, wrapEmail, footer } from './base.js';

export function aeoGeoEmail(props: DripEmailProps): string {
  const { userName, scanUrl, scanId, unsubscribeUrl } = props;

  const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

  const content = `
    <p style="${styles.logo}">🏮 AI Lighthouse</p>

    <p style="${styles.heading}">
      ${userName ? `${userName}, is` : 'Is'} your site ready for AI search engines?
    </p>

    <p style="${styles.paragraph}">
      Traditional SEO optimizes for Google's link-based index. But AI-powered search
      engines — ChatGPT, Perplexity, Google SGE — work fundamentally differently. They don't
      just find pages. They <strong>extract answers</strong> and <strong>generate responses</strong>.
    </p>

    <p style="${styles.paragraph}">
      That's why we measure two additional dimensions beyond SEO:
    </p>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">🎯 AEO — Answer Engine Optimization</p>
      <p style="${styles.cardText}">
        AEO measures how well your content provides direct answers to questions.
        AI search engines look for:

        • <strong>FAQ sections</strong> with clear question-answer pairs
        • <strong>Direct answer paragraphs</strong> that concisely address a query
        • <strong>Structured data</strong> (FAQ schema, HowTo schema)
        • <strong>Voice search readiness</strong> — conversational, natural phrasing

        Sites with strong AEO are 3x more likely to be cited in AI-generated answers.
      </p>
    </div>

    <div style="${styles.card}">
      <p style="${styles.cardTitle}">🌐 GEO — Generative Engine Optimization</p>
      <p style="${styles.cardText}">
        GEO measures signals that help generative AI models trust and reference your content:

        • <strong>Author attribution</strong> — who wrote this and what are their credentials?
        • <strong>Citation signals</strong> — do you link to authoritative sources?
        • <strong>Knowledge graph signals</strong> — structured data that connects entities
        • <strong>Content freshness</strong> — when was this last updated?
        • <strong>Brand protection</strong> — consistent, unambiguous brand mentions

        Without these signals, AI may hallucinate about your brand or skip you entirely.
      </p>
    </div>

    <div style="${styles.highlightBox}">
      <p style="${styles.highlightText}">
        💡 <strong>Pro users</strong> get full AEO & GEO analysis with AI-powered insights,
        entity extraction, hallucination risk detection, and CMS-specific fix guides.
      </p>
    </div>

    ${scanId ? `
    <div style="${styles.ctaSection}">
      <a href="${BASE_URL}/dashboard/scan?scanId=${scanId}" style="${styles.button}">
        See Your AEO & GEO Scores →
      </a>
    </div>
    ` : ''}

    <p style="${styles.paragraph}">
      Next up: we'll show you real examples of sites that improved their AI readiness
      scores — and exactly what they changed.
    </p>

    ${footer(scanUrl, unsubscribeUrl)}
  `;

  return wrapEmail(content, "AEO & GEO: the two metrics most sites ignore (but AI doesn't)");
}
