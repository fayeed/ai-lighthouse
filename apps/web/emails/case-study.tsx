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

export default function CaseStudyEmail({
  userName,
  scanUrl,
  scanId,
  unsubscribeUrl,
}: DripEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Real sites went from D to A — here&apos;s how they did it</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>🏮 AI Lighthouse</Text>

          <Text style={heading}>
            How sites like yours improved their scores
          </Text>

          <Text style={paragraph}>
            {userName ? `${userName}, a` : 'A'} week ago you scanned{' '}
            <strong>{scanUrl || 'your site'}</strong>. Since then, we&apos;ve seen hundreds of
            sites use their AI Lighthouse reports to make meaningful improvements. Here are the
            patterns that work:
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>📊 The Numbers</Text>
            <Text style={statRow}>
              <Text style={statNumber}>+23 pts</Text>
              <Text style={statLabel}>Average score improvement after fixing critical issues</Text>
            </Text>
            <Text style={statRow}>
              <Text style={statNumber}>72%</Text>
              <Text style={statLabel}>Of improvements come from just 3-5 changes</Text>
            </Text>
            <Text style={statRow}>
              <Text style={statNumber}>2.4x</Text>
              <Text style={statLabel}>More AI citations for sites scoring above 70</Text>
            </Text>
          </Section>

          <Section style={card}>
            <Text style={cardTitle}>🏆 What Top Improvers Did</Text>
            <Text style={cardText}>
              <strong>1. Added structured data (JSON-LD)</strong>{'\n'}
              The single highest-impact change. Organization, Article, and FAQ schemas tell AI
              exactly what your content is.{'\n\n'}
              <strong>2. Fixed heading hierarchy</strong>{'\n'}
              Proper H1 → H2 → H3 structure makes your content parseable by AI extractors.{'\n\n'}
              <strong>3. Added author attribution</strong>{'\n'}
              AI systems increasingly weight content with clear authorship and credentials.{'\n\n'}
              <strong>4. Wrote FAQ sections</strong>{'\n'}
              Direct question-answer pairs are exactly what AI answer engines look for.{'\n\n'}
              <strong>5. Added source citations</strong>{'\n'}
              Linking to authoritative sources (.gov, .edu, research) boosts trust signals.
            </Text>
          </Section>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              💡 <strong>Pro tip:</strong> The Step-by-Step Fix Guides (available on Pro) give you
              CMS-specific instructions for each issue — whether you use WordPress, Shopify,
              Next.js, or plain HTML.
            </Text>
          </Section>

          {scanId && (
            <Section style={ctaSection}>
              <Button style={button} href={`${BASE_URL}/dashboard/scan?scanId=${scanId}`}>
                Review Your Issues →
              </Button>
            </Section>
          )}

          <Text style={paragraph}>
            Tomorrow, we&apos;ll share what Pro unlocks — and how it can accelerate your
            improvement from weeks to hours.
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
  margin: '0 0 12px 0',
};

const cardText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#a1a1aa',
  margin: '0',
  whiteSpace: 'pre-line' as const,
};

const statRow = {
  marginBottom: '12px',
};

const statNumber = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#14b8a6',
  margin: '0',
};

const statLabel = {
  fontSize: '13px',
  color: '#a1a1aa',
  margin: '2px 0 0 0',
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
