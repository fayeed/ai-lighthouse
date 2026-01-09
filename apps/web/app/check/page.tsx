import { Metadata } from 'next';
import { Suspense } from "react";
import { Clock } from "lucide-react";
import CheckPageContent from './CheckPageContent';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.getlighthouse.dev/";

export async function generateMetadata(
  { searchParams }: { searchParams: { url?: string } }
): Promise<Metadata> {
  const url = (await searchParams).url;

  if (url) {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return {
        title: `AI Readiness Analysis for ${domain} - AI Lighthouse`,
        description: `Comprehensive AI readiness analysis for ${domain}. See how AI systems understand your content and get actionable insights.`,
        alternates: {
          canonical: `${baseUrl}/check`,
        },
        openGraph: {
          title: `AI Readiness Analysis for ${domain}`,
          description: `Comprehensive AI readiness analysis for ${domain}. See how AI systems understand your content.`,
          url: `${baseUrl}/check`,
          siteName: 'AI Lighthouse',
          type: 'website',
          images: [
            {
              url: `${baseUrl}/android-chrome-512x512.png`,
              width: 512,
              height: 512,
              alt: 'AI Lighthouse - Website AI Readiness Analyzer',
            },
          ],
        },
      };
    } catch {
      // Invalid URL, return default metadata
    }
  }

  return {
    title: 'Check Website AI Readiness - AI Lighthouse',
    description: 'Analyze your website\'s AI readiness. Get instant insights on how AI systems like ChatGPT, Perplexity, and search engines understand your content.',
    keywords: ['AI readiness check', 'website analysis', 'AI comprehension', 'content audit', 'SEO analysis'],
    alternates: {
      canonical: `${baseUrl}/check`,
    },
    openGraph: {
      title: 'Check Website AI Readiness - AI Lighthouse',
      description: 'Analyze your website\'s AI readiness. Get instant insights and actionable recommendations.',
      url: `${baseUrl}/check`,
      siteName: 'AI Lighthouse',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
          alt: 'AI Lighthouse - Website AI Readiness Analyzer',
        },
      ],
    },
  };
}

// Fallback component for loading state (server-side safe)
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 mx-auto">
          <Clock className="w-full h-full text-white/40" />
        </div>
        <p className="text-white/40">Loading...</p>
      </div>
    </div>
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckPageContent />
    </Suspense>
  );
}
