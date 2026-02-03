/**
 * Base email styles and layout components
 */

export const styles = {
  main: `
    background-color: #050505;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `,
  container: `
    margin: 0 auto;
    padding: 40px 24px;
    max-width: 560px;
  `,
  logo: `
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 32px;
  `,
  heading: `
    font-size: 22px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 16px;
  `,
  paragraph: `
    font-size: 15px;
    line-height: 24px;
    color: #a1a1aa;
    margin-bottom: 16px;
  `,
  card: `
    background-color: #111111;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 20px;
    margin-bottom: 16px;
  `,
  cardTitle: `
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 8px 0;
  `,
  cardText: `
    font-size: 14px;
    line-height: 22px;
    color: #a1a1aa;
    margin: 0;
    white-space: pre-line;
  `,
  button: `
    display: inline-block;
    background-color: #14b8a6;
    color: #000000;
    font-weight: 700;
    font-size: 14px;
    border-radius: 12px;
    padding: 14px 28px;
    text-decoration: none;
  `,
  ctaSection: `
    text-align: center;
    margin-bottom: 24px;
  `,
  hr: `
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin-top: 32px;
    margin-bottom: 16px;
  `,
  footer: `
    font-size: 13px;
    color: #52525b;
    margin: 0 0 4px 0;
  `,
  footerMuted: `
    font-size: 11px;
    color: #3f3f46;
    margin: 0;
  `,
  unsubscribeLink: `
    color: #52525b;
    text-decoration: underline;
  `,
  highlightBox: `
    background-color: rgba(20,184,166,0.1);
    border-radius: 12px;
    border: 1px solid rgba(20,184,166,0.2);
    padding: 16px 20px;
    margin-bottom: 24px;
  `,
  highlightText: `
    font-size: 14px;
    line-height: 22px;
    color: #5eead4;
    margin: 0;
  `,
  scoreSection: `
    background-color: #111111;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 32px;
    text-align: center;
    margin-bottom: 24px;
  `,
  gradeStyle: `
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 4px 0;
  `,
  scoreText: `
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 4px 0;
  `,
  scoreLabel: `
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #52525b;
    font-weight: 700;
    margin: 0;
  `,
};

export function wrapEmail(content: string, preview: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${preview}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { padding: 0; }
  </style>
  <![endif]-->
</head>
<body style="${styles.main}">
  <div style="${styles.container}">
    ${content}
  </div>
</body>
</html>
`;
}

export function footer(scanUrl?: string, unsubscribeUrl?: string): string {
  return `
    <hr style="${styles.hr}">
    <p style="${styles.footer}">AI Lighthouse — Make your site AI-ready.</p>
    <p style="${styles.footerMuted}">
      You're receiving this because you ran a scan on ${scanUrl || 'AI Lighthouse'}.
      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="${styles.unsubscribeLink}">Unsubscribe</a>` : ''}
    </p>
  `;
}
