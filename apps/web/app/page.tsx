import { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'AI Lighthouse - Website AI Readiness Analyzer',
  description: 'Analyze your website\'s AI readiness and optimize it for AI systems like ChatGPT, search engines, and voice assistants. Free, instant analysis with actionable insights.',
  keywords: ['AI readiness', 'website analyzer', 'SEO', 'ChatGPT optimization', 'AI comprehension', 'content analysis'],
  openGraph: {
    title: 'AI Lighthouse - Optimize Your Website for the AI Era',
    description: 'Discover how AI systems understand your content. Get actionable insights to improve discoverability and accuracy.',
    type: 'website',
  },
};

export default function Home() {
  return <HomePage />;
}
