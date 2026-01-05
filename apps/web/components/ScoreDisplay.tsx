'use client';

import { useEffect, useState } from 'react';
import Tooltip from './Tooltip';

interface ScoreDisplayProps {
  score: number;
  grade: string;
  showScoringGuide: boolean;
  setShowScoringGuide: (show: boolean) => void;
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
  showScoringGuide,
  setShowScoringGuide
}: ScoreDisplayProps) {
  const threshold = getScoreThreshold(score);
  const context = getStatisticalContext(score);

  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 text-white rounded-lg p-3 sm:p-6 mb-4 sm:mb-8 animate-scale-in shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="flex items-start gap-2 mb-1 sm:mb-2">
        <h3 className="text-lg sm:text-2xl font-bold">AI Readiness Score</h3>
        <Tooltip content="Overall score indicating how well your website is optimized for AI systems like chatbots, search engines, and voice assistants. Higher scores mean better AI comprehension and visibility.

Example impact:
• 90+ score: ChatGPT accurately answers questions about your products
• 60-90 score: Some details may be missed or misunderstood
• Below 60: AI may struggle to extract key information or hallucinate facts">
          <span className="text-white/80 hover:text-white text-lg mt-0.5">ⓘ</span>
        </Tooltip>
      </div>
      <div className="text-4xl sm:text-6xl font-bold mb-1 sm:mb-2">
        <AnimatedScore value={score} />/100
      </div>
      <div className="text-base sm:text-xl mb-1 sm:mb-2 flex items-center gap-2">
        <span>Grade:</span>
        <span className={`px-2 py-0.5 rounded text-sm font-bold ${
          score >= 90 ? 'bg-green-500/30' :
          score >= 75 ? 'bg-blue-500/30' :
          score >= 60 ? 'bg-yellow-500/30' :
          'bg-red-500/30'
        }`}>
          {grade}
        </span>
      </div>
      
      {/* Score visualization bar */}
      <div className="w-full bg-white/20 rounded-full h-2 mb-3 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${
            score >= 90 ? 'bg-green-400' :
            score >= 75 ? 'bg-blue-400' :
            score >= 60 ? 'bg-yellow-400' :
            'bg-red-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {/* Threshold Guidance */}
      <div className="bg-white/10 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 backdrop-blur-sm">
        <div className="text-sm font-semibold mb-0.5 sm:mb-1">{threshold.category}</div>
        <div className="text-xs text-white/80">{threshold.description} • {context}</div>
      </div>

      {/* Quick Interpretation */}
      <div className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3">
        {score >= 90 && "✓ AI systems will accurately understand and cite your content"}
        {score >= 75 && score < 90 && "⚡ Good foundation - a few improvements will optimize AI comprehension"}
        {score < 75 && "⚠ AI may struggle to extract accurate information - review issues below"}
      </div>
      
      {/* Scoring Guide Button */}
      <button
        onClick={() => setShowScoringGuide(!showScoringGuide)}
        className="text-sm text-white/90 hover:text-white underline flex items-center gap-1"
      >
        {showScoringGuide ? '▼' : '▶'} How is this calculated?
      </button>
    </div>
  );
}
