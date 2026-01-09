import React from 'react';
import { Metadata } from 'next';
import ScoringGuide from '../../../components/ScoringGuide';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.getlighthouse.dev/";

export const metadata: Metadata = {
  title: 'AI Readiness Scoring Guide - AI Lighthouse',
  description: 'Understand how AI Lighthouse scores website AI readiness. Learn about the metrics, categories, and what each score means.',
  alternates: {
    canonical: `${baseUrl}/check/scoring-guide`,
  },
  openGraph: {
    title: 'AI Readiness Scoring Guide - AI Lighthouse',
    description: 'Understand how AI Lighthouse scores website AI readiness. Learn about the metrics, categories, and what each score means.',
    url: `${baseUrl}/check/scoring-guide`,
    siteName: 'AI Lighthouse',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'AI Lighthouse Scoring Guide',
      },
    ],
  },
};

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <ScoringGuide />
        <div className="mt-8 text-center">
          <a href="/" className="text-teal-400 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
