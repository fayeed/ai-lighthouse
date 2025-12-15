'use client';

import Tooltip from '../../Tooltip';
import ExampleSection from './ExampleSection';

interface Mismatch {
  field: string;
  severity: string;
  description: string;
  recommendation: string;
}

interface MirrorReportSummary {
  alignmentScore: number;
  clarityScore: number;
  critical: number;
  major: number;
}

interface MirrorReport {
  summary: MirrorReportSummary;
  mismatches?: Mismatch[];
  recommendations?: string[];
}

interface MirrorReportSectionProps {
  mirrorReport: MirrorReport;
}

export default function MirrorReportSection({ mirrorReport }: MirrorReportSectionProps) {
  const alignmentExamples = [
    {
      label: 'Your Page Content:',
      type: 'good' as const,
      content: '"We sell enterprise software for healthcare providers"',
      explanation: 'Your actual content'
    },
    {
      label: 'Good Alignment (90+):',
      type: 'good' as const,
      content: 'AI Summary: "Healthcare enterprise software vendor"',
      explanation: 'Accurately captures industry and business type'
    },
    {
      label: 'Poor Alignment (40-):',
      type: 'bad' as const,
      content: 'AI Summary: "General software company"',
      explanation: 'Misses critical details about industry focus'
    }
  ];

  const clarityExamples = [
    {
      label: 'Poor Clarity - Vague:',
      type: 'bad' as const,
      content: '"Our solution helps businesses succeed in the modern world"',
      explanation: 'Too generic - what solution? Which businesses? How does it help?'
    },
    {
      label: 'Good Clarity - Specific:',
      type: 'good' as const,
      content: '"Our CRM software helps sales teams track customer interactions, manage leads, and forecast revenue"',
      explanation: 'Clear: product type (CRM), audience (sales teams), specific benefits'
    }
  ];

  return (
    <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">🔍 AI Misunderstanding Check</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="flex items-center gap-1 mb-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">Alignment Score</div>
            <Tooltip content="How well AI's understanding aligns with your actual content. Higher scores mean AI accurately reflects your key messages.">
              <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ⓘ</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {mirrorReport.summary.alignmentScore}/100
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="flex items-center gap-1 mb-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">Clarity Score</div>
            <Tooltip content="How clearly your content communicates to AI systems. Higher scores indicate better structure and semantic clarity.">
              <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ⓘ</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {mirrorReport.summary.clarityScore}/100
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {mirrorReport.summary.critical}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Major Issues</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {mirrorReport.summary.major}
          </div>
        </div>
      </div>

      <ExampleSection title="See Alignment Example" examples={alignmentExamples} />
      <ExampleSection title="See Clarity Example" examples={clarityExamples} />

      {/* Recommendations Section */}
      {mirrorReport.recommendations && mirrorReport.recommendations.length > 0 && (
        <div className="mb-4">
          <strong className="text-gray-700 dark:text-gray-300">💡 Key Recommendations:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-900 dark:text-gray-100">
            {mirrorReport.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm">{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {mirrorReport.mismatches && mirrorReport.mismatches.length > 0 && (
        <div>
          <strong className="text-gray-700 dark:text-gray-300">Priority Mismatches:</strong>
          <div className="space-y-3 mt-3">
            {mirrorReport.mismatches
              .filter((m) => m.severity === 'critical' || m.severity === 'major' || m.severity === 'high')
              .slice(0, 5)
              .map((mismatch, idx) => (
                <div key={idx} className={`bg-white dark:bg-gray-800 p-4 rounded border-l-4 ${
                  mismatch.severity === 'critical' ? 'border-red-500 dark:border-red-600' : 
                  (mismatch.severity === 'high' || mismatch.severity === 'major') ? 'border-orange-500 dark:border-orange-600' : 'border-yellow-500 dark:border-yellow-600'
                }`}>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {mismatch.severity === 'critical' ? '🔴' : 
                     (mismatch.severity === 'high' || mismatch.severity === 'major') ? '🟠' : '🟡'} {mismatch.field}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm mt-1">{mismatch.description}</div>
                  <div className="bg-green-50 dark:bg-green-900/50 p-2 rounded mt-2 text-sm text-green-800 dark:text-green-200">
                    <strong>Fix:</strong> {mismatch.recommendation}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
