import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components';
import type { DripEmailProps } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailighthouse.com';

export default function WelcomeEmail({
  userName,
  scanUrl,
  overallScore,
  grade,
  scanId,
  unsubscribeUrl,
}: DripEmailProps) {
  const scoreDisplay = overallScore != null ? String(Math.round(overallScore)) : '--';
  const gradeDisplay = grade || 'N/A';

  const gradeColor =
    grade?.startsWith('A') ? '#22c55e' :
    grade?.startsWith('B') ? '#eab308' :
    grade?.startsWith('C') ? '#f97316' :
    '#ef4444';

  return (
    <Html>
      <Head />
      <Preview>Your AI Readiness Score: {gradeDisplay} ({scoreDisplay}/100)</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>🏮 AI Lighthouse</Text>

          <Text style={heading}>
            {userName ? `Hey ${userName},` : 'Hey there,'}
          </Text>

          <Text style={paragraph}>
            Your AI Readiness scan for <strong>{scanUrl || 'your site'}</strong> is complete.
            Here&apos;s how your site stacks up:
          </Text>

          <Section style={scoreSection}>
            <Text style={{ ...gradeStyle, color: gradeColor }}>{gradeDisplay}</Text>
            <Text style={scoreText}>{scoreDisplay}/100</Text>
            <Text style={scoreLabel}>AI Readiness Score</Text>
          </Section>

          <Text style={paragraph}>
            This score measures how well AI systems — like ChatGPT, Google SGE, and Perplexity —
            can discover, understand, and accurately represent your content.
          </Text>

          <Text style={paragraph}>
            Your full report breaks down scores across five dimensions: content quality,
            discoverability, extractability, comprehensibility, and trustworthiness.
          </Text>

          {scanId && (
            <Section style={ctaSection}>
              <Button style={button} href={`${BASE_URL}/dashboard/scan?scanId=${scanId}`}>
                View Full Report →
              </Button>
            </Section>
          )}

          <Text style={paragraph}>
            Over the next few days, we&apos;ll send you actionable insights on how to improve
            each area of your score. Stay tuned!
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            AI Lighthouse — Make your site AI-ready.
          </Text>
          <Text style={footerMuted}>
            You&apos;re receiving this because you ran a scan on {scanUrl || 'AI Lighthouse'}.
            {unsubscribeUrl && (
              <>
                {' '}
                <a href={unsubscribeUrl} style={unsubscribeLink}>Unsubscribe</a>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#050505',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 24px',
  maxWidth: '560px',
};

const logo = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#ffffff',
  marginBottom: '32px',
};

const heading = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: '#ffffff',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#a1a1aa',
  marginBottom: '16px',
};

const scoreSection = {
  backgroundColor: '#111111',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '32px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const gradeStyle = {
  fontSize: '48px',
  fontWeight: '700' as const,
  margin: '0 0 4px 0',
};

const scoreText = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#ffffff',
  margin: '0 0 4px 0',
};

const scoreLabel = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: '#52525b',
  fontWeight: '700' as const,
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#14b8a6',
  color: '#000000',
  fontWeight: '700' as const,
  fontSize: '14px',
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
};

const hr = {
  borderColor: 'rgba(255,255,255,0.1)',
  marginTop: '32px',
  marginBottom: '16px',
};

const footer = {
  fontSize: '13px',
  color: '#52525b',
  margin: '0 0 4px 0',
};

const footerMuted = {
  fontSize: '11px',
  color: '#3f3f46',
  margin: '0',
};

const unsubscribeLink = {
  color: '#52525b',
  textDecoration: 'underline',
};
