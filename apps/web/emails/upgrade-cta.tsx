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

export default function UpgradeCtaEmail({
  userName,
  scanUrl,
  overallScore,
  unsubscribeUrl,
}: DripEmailProps) {
  const scoreDisplay = overallScore != null ? Math.round(overallScore) : null;

  return (
    <Html>
      <Head />
      <Preview>Unlock unlimited scans, AI analysis, and CMS-specific fix guides</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>🏮 AI Lighthouse</Text>

          <Text style={heading}>
            {userName ? `${userName}, ready` : 'Ready'} to unlock the full toolkit?
          </Text>

          <Text style={paragraph}>
            Over the past 10 days, you&apos;ve learned what AI readiness means for{' '}
            <strong>{scanUrl || 'your site'}</strong>
            {scoreDisplay ? ` (score: ${scoreDisplay}/100)` : ''}.
            You know the issues. You understand what AEO and GEO measure. Now it&apos;s time
            to fix everything — fast.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>Free Plan</Text>
            <Text style={featureText}>✓ 5 scans per month</Text>
            <Text style={featureText}>✓ Single page analysis</Text>
            <Text style={featureText}>✓ Basic SEO checks</Text>
            <Text style={featureMuted}>✗ LLM-powered analysis</Text>
            <Text style={featureMuted}>✗ Full domain crawling</Text>
            <Text style={featureMuted}>✗ AEO & GEO deep analysis</Text>
            <Text style={featureMuted}>✗ Entity extraction & hallucination detection</Text>
            <Text style={featureMuted}>✗ CMS-specific fix guides</Text>
            <Text style={featureMuted}>✗ Historical score tracking</Text>
          </Section>

          <Section style={proCard}>
            <Text style={proTitle}>Pro Plan — $29/mo</Text>
            <Text style={proFeature}>✓ Unlimited scans</Text>
            <Text style={proFeature}>✓ Full domain crawling (up to 50 pages)</Text>
            <Text style={proFeature}>✓ AI-powered LLM analysis</Text>
            <Text style={proFeature}>✓ Deep AEO & GEO scoring</Text>
            <Text style={proFeature}>✓ Entity extraction & knowledge graph</Text>
            <Text style={proFeature}>✓ Hallucination risk detection</Text>
            <Text style={proFeature}>✓ CMS-specific step-by-step fix guides</Text>
            <Text style={proFeature}>✓ 90-day score history & trends</Text>
            <Text style={proFeature}>✓ API access</Text>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={`${BASE_URL}/login?plan=pro`}>
              Upgrade to Pro →
            </Button>
          </Section>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              Sites that track their AI readiness over time see 2x faster improvement.
              Pro&apos;s trend charts and unlimited re-scans let you measure every change you make.
            </Text>
          </Section>

          <Text style={paragraph}>
            Questions? Reply to this email — we read every message.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>AI Lighthouse — Make your site AI-ready.</Text>
          <Text style={footerMuted}>
            You&apos;re receiving this because you ran a scan on {scanUrl || 'AI Lighthouse'}.
            This is the last email in our onboarding series.
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
  marginBottom: '12px',
};

const cardTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#a1a1aa',
  margin: '0 0 12px 0',
};

const featureText = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: '0 0 6px 0',
};

const featureMuted = {
  fontSize: '14px',
  color: '#3f3f46',
  margin: '0 0 6px 0',
};

const proCard = {
  backgroundColor: 'rgba(20,184,166,0.08)',
  borderRadius: '12px',
  border: '1px solid rgba(20,184,166,0.25)',
  padding: '20px',
  marginBottom: '24px',
};

const proTitle = {
  fontSize: '16px',
  fontWeight: '700' as const,
  color: '#14b8a6',
  margin: '0 0 12px 0',
};

const proFeature = {
  fontSize: '14px',
  color: '#5eead4',
  margin: '0 0 6px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#14b8a6',
  color: '#000000',
  fontWeight: '700' as const,
  fontSize: '15px',
  borderRadius: '12px',
  padding: '16px 32px',
  textDecoration: 'none',
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
