'use client';

import { useEffect, useState } from 'react';
import Tooltip from './Tooltip';

interface ScoreDisplayProps {
  score: number;
  grade: string;
}

function getScoreThreshold(score: number): {
  category: string;
  description: string;
} {
  if (score >= 90) {
    return {
      category: 'AI-optimized',
      description: 'Top 10% of sites'
    };
  }
  if (score >= 75) {
    return {
      category: 'Safe but improvable',
      description: 'Above average'
    };
  }
  if (score < 75) {
    return {
      category: 'Likely misunderstood by AI',
      description: 'Needs improvement'
    };
  }
  return {
    category: 'At risk',
    description: 'Critical issues'
  };
}

function getStatisticalContext(score: number): string {
  if (score >= 92) return 'Top 5% - best-in-class';
  if (score >= 85) return 'Top 15% - excellent';
  if (score >= 75) return 'Above average';
  if (score >= 60) return 'Most AI-visible sites score 60-80';
  return 'Below average';
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
}: ScoreDisplayProps) {
  const threshold = getScoreThreshold(score);
  const context = getStatisticalContext(score);

  return (
    <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 sm:p-8 mb-6 sm:mb-10">
      <div className="flex items-start gap-2 mb-3 sm:mb-4">
        <h3 className="text-xl sm:text-2xl font-bold">AI Readiness Score</h3>
        <Tooltip content="Overall score indicating how well your website is optimized for AI systems like chatbots, search engines, and voice assistants. Higher scores mean better AI comprehension and visibility.

Example impact:
• 90+ score: ChatGPT accurately answers questions about your products
• 60-90 score: Some details may be missed or misunderstood
• Below 60: AI may struggle to extract key information or hallucinate facts">
          <span className="text-gray-400 hover:text-white text-lg mt-1 cursor-help">ⓘ</span>
        </Tooltip>
      </div>
      <div className="text-5xl sm:text-7xl font-bold mb-3 sm:mb-4">
        <AnimatedScore value={score} />/100
      </div>
      <div className="text-base sm:text-lg mb-4 sm:mb-5 flex items-center gap-3">
        <span className="text-gray-400">Grade:</span>
        <span className={`px-3 py-1 rounded-lg text-sm sm:text-base font-bold border ${
          score >= 90 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          score >= 75 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          score >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
          'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {grade}
        </span>
      </div>

      {/* Score visualization bar */}
      <div className="w-full bg-zinc-800 rounded-full h-2 mb-4 sm:mb-5 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${
            score >= 90 ? 'bg-green-500' :
            score >= 75 ? 'bg-blue-500' :
            score >= 60 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Threshold Guidance */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="text-sm sm:text-base font-semibold mb-1 text-white">{threshold.category}</div>
        <div className="text-xs sm:text-sm text-gray-400">{threshold.description} • {context}</div>
      </div>

      {/* Quick Interpretation */}
      <div className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 flex items-start gap-2">
        <span className="text-base flex-shrink-0">
          {score >= 90 && "✓"}
          {score >= 75 && score < 90 && "⚡"}
          {score < 75 && "⚠️"}
        </span>
        <span>
          {score >= 90 && "AI systems will accurately understand and cite your content"}
          {score >= 75 && score < 90 && "Good foundation - a few improvements will optimize AI comprehension"}
          {score < 75 && "AI may struggle to extract accurate information - review issues below"}
        </span>
      </div>

      {/* Scoring Guide Link */}
      <div className="mt-3 sm:mt-4 text-center">
        <a
          href="/scoring-guide"
          className="text-teal-400 hover:text-teal-300 text-xs sm:text-sm font-medium transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          What do these scores mean? →
        </a>
      </div>
    </div>
  );
}
