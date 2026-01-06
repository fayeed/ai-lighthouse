'use client';

import Tooltip from '../../Tooltip';
import ExampleSection from '../analysis/ExampleSection';
import CategoryScores from './CategoryScores';

interface ScoringData {
  overallScore: number;
  grade: string;
  totalIssues: number;
  categoryScores?: Record<string, any>;
}

interface TechnicalScoringSectionProps {
  scoring: ScoringData;
}

export default function TechnicalScoringSection({ scoring }: TechnicalScoringSectionProps) {
  const technicalScoringExamples = [
    {
      label: 'High Score Elements:',
      type: 'good' as const,
      content: '<header>, <nav>, <main>, <article>\nH1 → H2 → H3 (logical order)\n<img alt="Dashboard metrics">\nJSON-LD structured data',
      explanation: 'Semantic HTML, proper heading hierarchy, alt text, and Schema.org data'
    },
    {
      label: 'Low Score Elements:',
      type: 'bad' as const,
      content: '<div>, <span> for everything\nMultiple H1s, skipping levels\n<img src="chart.png">\nNo metadata',
      explanation: 'Generic tags, poor headings, missing alt text, and no metadata'
    }
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold text-white">📊 Technical Scoring</h3>
        <Tooltip content="Comprehensive technical score based on all AI readiness checks including accessibility, structure, and metadata quality.">
          <span className="text-gray-400 hover:text-gray-300 cursor-help">ⓘ</span>
        </Tooltip>
      </div>

      <ExampleSection title="See What Improves Your Score" examples={technicalScoringExamples} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Overall Score</div>
          <div className="text-2xl font-bold text-white">
            {scoring.overallScore}/100
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Metadata Score</div>
          <div className="text-2xl font-bold text-white">
            {scoring.grade}
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Content Score</div>
          <div className="text-2xl font-bold text-white">
            {scoring.totalIssues}
          </div>
        </div>
      </div>

      {/* Category Scores */}
      {scoring.categoryScores && <CategoryScores categoryScores={scoring.categoryScores} />}
    </div>
  );
}
