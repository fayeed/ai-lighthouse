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

export default function SeoDeepDiveEmail({
  userName,
  scanUrl,
  overallScore,
  scanId,
  unsubscribeUrl,
}: DripEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>What your SEO score really means for AI visibility</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>🏮 AI Lighthouse</Text>

          <Text style={heading}>
            {userName ? `${userName}, let's` : "Let's"} talk about your SEO score
          </Text>

          <Text style={paragraph}>
            Two days ago, you scanned <strong>{scanUrl || 'your site'}</strong>
            {overallScore != null ? ` and scored ${Math.round(overallScore)}/100` : ''}.
            Today, let&apos;s break down what the SEO dimension actually measures — and why it matters
            more than ever.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>🔍 Why SEO Matters for AI</Text>
            <Text style={cardText}>
              AI systems like ChatGPT and Google SGE don&apos;t just index your pages — they
              <strong> understand</strong> them. Traditional SEO signals (title tags, meta descriptions,
              headings, canonical URLs) are the foundation AI uses to decide whether your content
              is worth surfacing.
            </Text>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>📋 Common Issues We Find</Text>
            <Text style={cardText}>
              <strong>Missing meta descriptions</strong> — AI needs clear summaries to represent your content.{'\n\n'}
              <strong>Poor heading hierarchy</strong> — H1 → H2 → H3 structure helps AI parse your content tree.{'\n\n'}
              <strong>Missing alt text</strong> — Multimodal AI models use alt text to understand images.{'\n\n'}
              <strong>No canonical URLs</strong> — Without these, AI may index duplicate content.
            </Text>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>⚡ Quick Wins</Text>
            <Text style={cardText}>
              Most sites can improve their SEO score by 15-20 points just by fixing meta descriptions
              and heading structure. These are the lowest-effort, highest-impact changes you can make.
            </Text>
          </Section>

          {scanId && (
            <Section style={ctaSection}>
              <Button style={button} href={`${BASE_URL}/dashboard/scan?scanId=${scanId}`}>
                View Your SEO Issues →
              </Button>
            </Section>
          )}

          <Text style={paragraph}>
            In a few days, we&apos;ll explain how AI search engines go <em>beyond</em> traditional SEO
            with AEO and GEO — two new optimization categories that most sites completely overlook.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>AI Lighthouse — Make your site AI-ready.</Text>
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

const card = {
  backgroundColor: '#111111',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '20px',
  marginBottom: '16px',
};

const cardTitle = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#ffffff',
  margin: '0 0 8px 0',
};

const cardText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#a1a1aa',
  margin: '0',
  whiteSpace: 'pre-line' as const,
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
