'use client';

import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  currentStep: string;
  progress: number;
  message: string;
  enableLLM: boolean;
}

const STEPS = {
  basic: ['fetch', 'parse', 'rules', 'extract', 'processing', 'scoring', 'finalizing'],
  llm: ['fetch', 'parse', 'rules', 'extract', 'llm', 'processing', 'scoring', 'finalizing'],
};

const STEP_LABELS: Record<string, string> = {
  starting: 'Starting analysis',
  fetch: 'Fetching website',
  parse: 'Parsing HTML structure',
  rules: 'Running audit rules',
  extract: 'Analyzing extractability',
  llm: 'AI analyzing content',
  processing: 'Processing results',
  scoring: 'Calculating score',
  finalizing: 'Generating report',
};

const FUN_FACTS = [
  "🤖 AI systems process millions of websites daily",
  "📊 Well-structured content is 40% more likely to be cited",
  "🔍 Schema markup helps AI understand context",
  "⚡ Fast-loading sites get better AI comprehension",
  "🎯 Clear headings improve content extraction by 60%",
  "📝 Meta descriptions are often used by AI for summaries",
  "🏷️ Structured data can increase click-through rates by 30%",
  "🌐 Over 40% of searches now have AI-generated answers",
  "💡 JSON-LD is the preferred schema format for most AI systems",
  "🔗 Internal linking helps AI understand content relationships",
  "📱 Mobile-friendly sites rank higher in AI search results",
  "🎨 Alt text on images helps AI understand visual content",
  "⏱️ The average AI citation comes from top 3 search results",
  "📖 Long-form content (2000+ words) gets 3x more AI citations",
  "🔒 HTTPS sites are trusted more by AI systems",
  "🗂️ Breadcrumbs help AI understand site hierarchy",
  "💬 FAQ sections are goldmines for AI answer extraction",
  "📈 Sites with reviews schema get 35% more visibility",
  "🌍 Multilingual sites need hreflang for proper AI indexing",
  "✨ Fresh content is weighted higher by AI systems",
];

export default function LoadingProgress({ currentStep, progress, message, enableLLM }: LoadingProgressProps) {
  const steps = enableLLM ? STEPS.llm : STEPS.basic;
  const currentIndex = steps.indexOf(currentStep);
  const [factIndex, setFactIndex] = useState(0);

  // Rotate fun facts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="animate-pulse">🔍</span>
            Analyzing...
          </h3>
          <span className="text-sm text-teal-400 font-medium tabular-nums">
            {progress}%
          </span>
        </div>

        {/* Progress bar with shimmer effect */}
        <div className="w-full bg-zinc-800 rounded-full h-2 mb-6 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 h-2 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%`, backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}
          />
        </div>

        {/* Current step message */}
        <p className="text-sm text-gray-400 mb-4">
          {message || STEP_LABELS[currentStep] || 'Processing...'}
        </p>

        {/* Fun fact */}
        <div className="text-xs text-gray-500 mb-6 p-3 bg-zinc-800/50 rounded-xl italic transition-all duration-500">
          {FUN_FACTS[factIndex]}
        </div>

        {/* Steps list */}
        <div className="space-y-2.5">
          {steps.map((step, index) => {
            const isActive = step === currentStep;
            const isComplete = currentIndex > index || (currentIndex === index && progress > 90);
            const isPending = currentIndex < index;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isPending ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 w-5 h-5">
                  {isComplete && (
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && !isComplete && (
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-5 h-5 border-2 border-zinc-700 rounded-full" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`text-sm ${
                    isActive
                      ? 'text-teal-400 font-medium'
                      : isComplete
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cancel hint */}
        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-gray-500">
            Press{' '}
            <kbd className="px-2 py-1 text-[10px] bg-zinc-800 rounded border border-zinc-700 text-gray-400 font-mono">Esc</kbd>
            {' '}to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
