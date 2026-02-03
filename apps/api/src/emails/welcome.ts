import type { DripEmailProps } from './types.js';
import { styles, wrapEmail, footer } from './base.js';

export function welcomeEmail(props: DripEmailProps): string {
  const { userName, scanUrl, overallScore, grade, scanId, unsubscribeUrl } = props;

  const scoreDisplay = overallScore != null ? String(Math.round(overallScore)) : '--';
  const gradeDisplay = grade || 'N/A';
  const gradeColor =
    grade?.startsWith('A') ? '#22c55e' :
    grade?.startsWith('B') ? '#eab308' :
    grade?.startsWith('C') ? '#f97316' :
    '#ef4444';

  const BASE_URL = process.env.BASE_URL || 'https://ailighthouse.com';

  const content = `
    <p style="${styles.logo}">🏮 AI Lighthouse</p>

    <p style="${styles.heading}">
      ${userName ? `Hey ${userName},` : 'Hey there,'}
    </p>

    <p style="${styles.paragraph}">
      Your AI Readiness scan for <strong>${scanUrl || 'your site'}</strong> is complete.
      Here's how your site stacks up:
    </p>

    <div style="${styles.scoreSection}">
      <p style="${styles.gradeStyle} color: ${gradeColor};">${gradeDisplay}</p>
      <p style="${styles.scoreText}">${scoreDisplay}/100</p>
      <p style="${styles.scoreLabel}">AI Readiness Score</p>
    </div>

    <p style="${styles.paragraph}">
      This score measures how well AI systems — like ChatGPT, Google SGE, and Perplexity —
      can discover, understand, and accurately represent your content.
    </p>

    <p style="${styles.paragraph}">
      Your full report breaks down scores across five dimensions: content quality,
      discoverability, extractability, comprehensibility, and trustworthiness.
    </p>

    ${scanId ? `
    <div style="${styles.ctaSection}">
      <a href="${BASE_URL}/dashboard/scan?scanId=${scanId}" style="${styles.button}">
        View Full Report →
      </a>
    </div>
    ` : ''}

    <p style="${styles.paragraph}">
      Over the next few days, we'll send you actionable insights on how to improve
      each area of your score. Stay tuned!
    </p>

    ${footer(scanUrl, unsubscribeUrl)}
  `;

  return wrapEmail(content, `Your AI Readiness Score: ${gradeDisplay} (${scoreDisplay}/100)`);
}
