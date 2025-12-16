'use client';

import ChunkingSection from './technical/ChunkingSection';
import ExtractabilitySection from './technical/ExtractabilitySection';
import TechnicalScoringSection from './technical/TechnicalScoringSection';

interface TechnicalTabProps {
  scanResult: any;
  auditReport?: any;
}

export default function TechnicalTab({ scanResult, auditReport }: TechnicalTabProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-blue-600 dark:text-blue-400';
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Category Scores Section */}
      {auditReport?.scores && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Category Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Crawlability</div>
              <div className={`text-3xl font-bold ${getScoreColor(auditReport.scores.crawlability)}`}>
                {auditReport.scores.crawlability}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Discovery & Access</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Structure</div>
              <div className={`text-3xl font-bold ${getScoreColor(auditReport.scores.structure)}`}>
                {auditReport.scores.structure}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">HTML & Technical</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Schema Coverage</div>
              <div className={`text-3xl font-bold ${getScoreColor(auditReport.scores.schema_coverage)}`}>
                {auditReport.scores.schema_coverage}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Structured Data</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Content Clarity</div>
              <div className={`text-3xl font-bold ${getScoreColor(auditReport.scores.content_clarity)}`}>
                {auditReport.scores.content_clarity}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Readability & UX</div>
            </div>
          </div>
        </div>
      )}

      {/* Chunking */}
      {scanResult?.chunking && <ChunkingSection chunking={scanResult.chunking} />}

      {/* Extractability */}
      {scanResult?.extractability && <ExtractabilitySection extractability={scanResult.extractability} />}

      {/* Scoring Details */}
      {scanResult?.scoring && <TechnicalScoringSection scoring={scanResult.scoring} />}
    </div>
  );
}
