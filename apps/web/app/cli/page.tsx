import { Metadata } from 'next';
import CLIPage from '@/components/CLIPage';

export const metadata: Metadata = {
  title: 'AI Lighthouse CLI - Command Line Tool for AI Readiness Testing',
  description: 'Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing. Free and open-source CLI tool.',
  keywords: ['CLI tool', 'AI readiness', 'CI/CD', 'command line', 'automated testing', 'website audit'],
  openGraph: {
    title: 'AI Lighthouse CLI - Automate AI Readiness Checks',
    description: 'Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing.',
    type: 'website',
  },
};

export default function CLI() {
  return <CLIPage />;
}
