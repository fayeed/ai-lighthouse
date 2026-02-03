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

export default function AeoGeoEmail({
  userName,
  scanUrl,
  scanId,
  unsubscribeUrl,
}: DripEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>AEO & GEO: the two metrics most sites ignore (but AI doesn&apos;t)</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>🏮 AI Lighthouse</Text>

          <Text style={heading}>
            {userName ? `${userName}, is` : 'Is'} your site ready for AI search engines?
          </Text>

          <Text style={paragraph}>
            Traditional SEO optimizes for Google&apos;s link-based index. But AI-powered search
            engines — ChatGPT, Perplexity, Google SGE — work fundamentally differently. They don&apos;t
            just find pages. They <strong>extract answers</strong> and <strong>generate responses</strong>.
          </Text>

          <Text style={paragraph}>
            That&apos;s why we measure two additional dimensions beyond SEO:
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>🎯 AEO — Answer Engine Optimization</Text>
            <Text style={cardText}>
              AEO measures how well your content provides direct answers to questions.
              AI search engines look for:{'\n\n'}
              • <strong>FAQ sections</strong> with clear question-answer pairs{'\n'}
              • <strong>Direct answer paragraphs</strong> that concisely address a query{'\n'}
              • <strong>Structured data</strong> (FAQ schema, HowTo schema){'\n'}
              • <strong>Voice search readiness</strong> — conversational, natural phrasing{'\n\n'}
              Sites with strong AEO are 3x more likely to be cited in AI-generated answers.
            </Text>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>🌐 GEO — Generative Engine Optimization</Text>
            <Text style={cardText}>
              GEO measures signals that help generative AI models trust and reference your content:{'\n\n'}
              • <strong>Author attribution</strong> — who wrote this and what are their credentials?{'\n'}
              • <strong>Citation signals</strong> — do you link to authoritative sources?{'\n'}
              • <strong>Knowledge graph signals</strong> — structured data that connects entities{'\n'}
              • <strong>Content freshness</strong> — when was this last updated?{'\n'}
              • <strong>Brand protection</strong> — consistent, unambiguous brand mentions{'\n\n'}
              Without these signals, AI may hallucinate about your brand or skip you entirely.
            </Text>
          </Section>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              💡 <strong>Pro users</strong> get full AEO & GEO analysis with AI-powered insights,
              entity extraction, hallucination risk detection, and CMS-specific fix guides.
            </Text>
          </Section>

          {scanId && (
            <Section style={ctaSection}>
              <Button style={button} href={`${BASE_URL}/dashboard/scan?scanId=${scanId}`}>
                See Your AEO & GEO Scores →
              </Button>
            </Section>
          )}

          <Text style={paragraph}>
            Next up: we&apos;ll show you real examples of sites that improved their AI readiness
            scores — and exactly what they changed.
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

const highlightBox = {
  backgroundColor: 'rgba(20,184,166,0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(20,184,166,0.2)',
  padding: '16px 20px',
  marginBottom: '24px',
};

const highlightText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#5eead4',
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
