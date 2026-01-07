'use client';

import { useEffect, useState } from 'react';
import { Search, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 text-left space-y-8 shadow-2xl"
      >
        {/* Progress header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-medium text-white">Analyzing...</h3>
          </div>
          <span className="text-sm font-mono text-primary">{progress}%</span>
        </div>

        <div className="space-y-6">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary transition-all duration-300"
            />
          </div>

          {/* Current step message & fun fact */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-white/20">
              {message || STEP_LABELS[currentStep] || 'AI analyzing content...'}
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-white/20" />
              <p className="text-xs text-white/40 italic">
                {FUN_FACTS[factIndex]}
              </p>
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = step === currentStep;
              const isComplete = currentIndex > index || (currentIndex === index && progress > 90);

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-xs transition-colors ${
                    isComplete ? 'text-green-400' : isActive ? 'text-primary' : 'text-white/20'
                  }`}
                >
                  {/* Status indicator */}
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/10" />
                  )}

                  {/* Step label */}
                  <span className={isActive ? "font-bold" : ""}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancel hint */}
        <div className="pt-4 border-t border-white/5 text-center">
          <button className="text-[10px] text-white/20 uppercase font-bold hover:text-white/40 transition-colors">
            Press <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">ESC</span> to cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
