'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { track } from '@vercel/analytics';

export function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      <VercelAnalytics />
      
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </>
  );
}

// Event tracking utilities
export const trackEvent = {
  analyzeWebsite: (url: string, enableLLM: boolean, provider?: string, model?: string) => {
    const eventData = {
      url,
      ai_enabled: enableLLM,
      provider: provider || 'none',
      model: model || 'none',
    };

    // Track with Vercel Analytics
    track('analyze_website', eventData);

    // Track with Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'analyze_website', {
        event_category: 'Website Analysis',
        event_label: url,
        ai_enabled: enableLLM,
        llm_provider: provider || 'none',
        llm_model: model || 'none',
      });
    }
  },

  analyzeComplete: (url: string, score: number, enableLLM: boolean) => {
    const eventData = {
      url,
      score,
      ai_enabled: enableLLM,
    };

    // Track with Vercel Analytics
    track('analyze_complete', eventData);

    // Track with Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'analyze_complete', {
        event_category: 'Website Analysis',
        event_label: url,
        value: score,
        ai_enabled: enableLLM,
      });
    }
  },

  analyzeError: (url: string, errorMessage: string, enableLLM: boolean) => {
    const eventData = {
      url,
      error: errorMessage,
      ai_enabled: enableLLM,
    };

    // Track with Vercel Analytics
    track('analyze_error', eventData);

    // Track with Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'analyze_error', {
        event_category: 'Website Analysis',
        event_label: url,
        error_message: errorMessage,
        ai_enabled: enableLLM,
      });
    }
  },
};
