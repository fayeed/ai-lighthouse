import type { DripEmailProps } from './types.js';
import { styles, wrapEmail, footer } from './base.js';

export function upgradeCtaEmail(props: DripEmailProps): string {
  const { userName, scanUrl, overallScore, unsubscribeUrl } = props;

  const scoreDisplay = overallScore != null ? Math.round(overallScore) : null;
  const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

  const freeCard = `
    background-color: #111111;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 20px;
    margin-bottom: 12px;
  `;
  const proCard = `
    background-color: rgba(20,184,166,0.08);
    border-radius: 12px;
    border: 1px solid rgba(20,184,166,0.25);
    padding: 20px;
    margin-bottom: 24px;
  `;
  const cardTitle = `
    font-size: 16px;
    font-weight: 600;
    color: #a1a1aa;
    margin: 0 0 12px 0;
  `;
  const proTitle = `
    font-size: 16px;
    font-weight: 700;
    color: #14b8a6;
    margin: 0 0 12px 0;
  `;
  const featureText = `
    font-size: 14px;
    color: #a1a1aa;
    margin: 0 0 6px 0;
  `;
  const featureMuted = `
    font-size: 14px;
    color: #3f3f46;
    margin: 0 0 6px 0;
  `;
  const proFeature = `
    font-size: 14px;
    color: #5eead4;
    margin: 0 0 6px 0;
  `;
  const bigButton = `
    display: inline-block;
    background-color: #14b8a6;
    color: #000000;
    font-weight: 700;
    font-size: 15px;
    border-radius: 12px;
    padding: 16px 32px;
    text-decoration: none;
  `;

  const content = `
    <p style="${styles.logo}">🏮 AI Lighthouse</p>

    <p style="${styles.heading}">
      ${userName ? `${userName}, ready` : 'Ready'} to unlock the full toolkit?
    </p>

    <p style="${styles.paragraph}">
      Over the past 10 days, you've learned what AI readiness means for
      <strong>${scanUrl || 'your site'}</strong>
      ${scoreDisplay ? ` (score: ${scoreDisplay}/100)` : ''}.
      You know the issues. You understand what AEO and GEO measure. Now it's time
      to fix everything — fast.
    </p>

    <div style="${freeCard}">
      <p style="${cardTitle}">Free Plan</p>
      <p style="${featureText}">✓ 5 scans per month</p>
      <p style="${featureText}">✓ Single page analysis</p>
      <p style="${featureText}">✓ Basic SEO checks</p>
      <p style="${featureMuted}">✗ LLM-powered analysis</p>
      <p style="${featureMuted}">✗ Full domain crawling</p>
      <p style="${featureMuted}">✗ AEO & GEO deep analysis</p>
      <p style="${featureMuted}">✗ Entity extraction & hallucination detection</p>
      <p style="${featureMuted}">✗ CMS-specific fix guides</p>
      <p style="${featureMuted}">✗ Historical score tracking</p>
    </div>

    <div style="${proCard}">
      <p style="${proTitle}">Pro Plan — $29/mo</p>
      <p style="${proFeature}">✓ Unlimited scans</p>
      <p style="${proFeature}">✓ Full domain crawling (up to 50 pages)</p>
      <p style="${proFeature}">✓ AI-powered LLM analysis</p>
      <p style="${proFeature}">✓ Deep AEO & GEO scoring</p>
      <p style="${proFeature}">✓ Entity extraction & knowledge graph</p>
      <p style="${proFeature}">✓ Hallucination risk detection</p>
      <p style="${proFeature}">✓ CMS-specific step-by-step fix guides</p>
      <p style="${proFeature}">✓ 90-day score history & trends</p>
      <p style="${proFeature}">✓ API access</p>
    </div>

    <div style="${styles.ctaSection}">
      <a href="${BASE_URL}/login?plan=pro" style="${bigButton}">
        Upgrade to Pro →
      </a>
    </div>

    <div style="${styles.highlightBox}">
      <p style="${styles.highlightText}">
        Sites that track their AI readiness over time see 2x faster improvement.
        Pro's trend charts and unlimited re-scans let you measure every change you make.
      </p>
    </div>

    <p style="${styles.paragraph}">
      Questions? Reply to this email — we read every message.
    </p>

    <hr style="${styles.hr}">
    <p style="${styles.footer}">AI Lighthouse — Make your site AI-ready.</p>
    <p style="${styles.footerMuted}">
      You're receiving this because you ran a scan on ${scanUrl || 'AI Lighthouse'}.
      This is the last email in our onboarding series.
      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="${styles.unsubscribeLink}">Unsubscribe</a>` : ''}
    </p>
  `;

  return wrapEmail(content, 'Unlock unlimited scans, AI analysis, and CMS-specific fix guides');
}
