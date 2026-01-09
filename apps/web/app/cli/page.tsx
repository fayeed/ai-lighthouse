import { Metadata } from 'next';
import CLIPage from '@/components/CLIPage';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.getlighthouse.dev/";

export const metadata: Metadata = {
  title: 'AI Lighthouse CLI - Command Line Tool for AI Readiness Testing',
  description: 'Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing. Free and open-source CLI tool.',
  keywords: ['CLI tool', 'AI readiness', 'CI/CD', 'command line', 'automated testing', 'website audit'],
  alternates: {
    canonical: `${baseUrl}/cli`,
  },
  openGraph: {
    title: 'AI Lighthouse CLI - Automate AI Readiness Checks',
    description: 'Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing.',
    url: `${baseUrl}/cli`,
    siteName: 'AI Lighthouse',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'AI Lighthouse CLI - Command Line Tool',
      },
    ],
  },
};

export default function CLI() {
  return <CLIPage />;
}
