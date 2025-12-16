'use client';

import Tooltip from './Tooltip';

interface ScoreDisplayProps {
  score: number;
  grade: string;
  showScoringGuide: boolean;
  setShowScoringGuide: (show: boolean) => void;
}

export default function ScoreDisplay({
  score,
  grade,
  showScoringGuide,
  setShowScoringGuide
}: ScoreDisplayProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 text-white rounded-lg p-6 mb-8 animate-scale-in shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-2xl font-bold">AI Readiness Score</h3>
        <Tooltip content="Overall score indicating how well your website is optimized for AI systems like chatbots, search engines, and voice assistants. Higher scores mean better AI comprehension and visibility.

Example impact:
• 90+ score: ChatGPT accurately answers questions about your products
• 60-90 score: Some details may be missed or misunderstood
• Below 60: AI may struggle to extract key information or hallucinate facts">
          <span className="text-white/80 hover:text-white text-lg mt-0.5">ⓘ</span>
        </Tooltip>
      </div>
      <div className="text-6xl font-bold mb-2 animate-pulse-subtle">
        {score}/100
      </div>
      <div className="text-xl mb-3">Grade: {grade}</div>
      
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
