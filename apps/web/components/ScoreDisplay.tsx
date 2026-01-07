'use client';

import { useEffect, useState } from 'react';
import Tooltip from './Tooltip';

interface ScoreDisplayProps {
  score: number;
  grade: string;
  url?: string;
}

function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className="tabular-nums">{displayValue}</span>;
}

export default function ScoreDisplay({
  score,
  grade,
  url,
}: ScoreDisplayProps) {
  return (
    <div className="glass p-8 sm:p-10 rounded-[3rem] border-white/[0.08] relative overflow-hidden mb-6 sm:mb-10">
      <div className="relative z-10 grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">AI Readiness Score</h3>
            <Tooltip content="Overall score indicating how well your website is optimized for AI systems like chatbots, search engines, and voice assistants. Higher scores mean better AI comprehension and visibility.

Example impact:
• 90+ score: ChatGPT accurately answers questions about your products
• 60-90 score: Some details may be missed or misunderstood
• Below 60: AI may struggle to extract key information or hallucinate facts">
              <span className="text-white/20 text-sm cursor-help transition-colors hover:text-white/40">ⓘ</span>
            </Tooltip>
          </div>
          <div className="space-y-2">
            <div className="text-6xl sm:text-8xl font-bold text-white tracking-tighter leading-none">
              <AnimatedScore value={score} /><span className="text-white/20">/100</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                score >= 90 ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                score >= 75 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                score >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                Grade: {grade}
              </span>
              {url && <span className="text-xs text-white/40 font-light">Target: {url}</span>}
            </div>
          </div>
        </div>

        <div className={`glass p-6 sm:p-8 rounded-3xl space-y-4 ${
          score >= 90 ? 'bg-green-500/[0.02] border-green-500/10' :
          score >= 75 ? 'bg-blue-500/[0.02] border-blue-500/10' :
          score >= 60 ? 'bg-yellow-500/[0.02] border-yellow-500/10' :
          'bg-red-500/[0.02] border-red-500/10'
        }`}>
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
            score >= 90 ? 'text-green-400' :
            score >= 75 ? 'text-blue-400' :
            score >= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            What this means for you
          </div>
          <p className="text-sm text-white/60 leading-relaxed font-light">
            {score >= 90 && "Excellent! Your site is well-optimized for AI systems. Minor improvements available."}
            {score >= 75 && score < 90 && "Good foundation - a few improvements will optimize AI comprehension and reduce misunderstandings."}
            {score < 75 && "Your content clarity and trust need work. AI systems will struggle to extract accurate information and may hallucinate facts."}
          </p>
        </div>
      </div>
    </div>
  );
}
