'use client';

import { useState } from 'react';
import Tooltip from '../../Tooltip';
import ExampleSection from './ExampleSection';
import FactVerificationList from './FactVerificationList';

interface Trigger {
  type: string;
  severity: string;
  description: string;
  confidence?: number;
}

interface FactCheckSummary {
  totalFacts: number;
  verifiedFacts: number;
  unverifiedFacts: number;
  contradictions: number;
}

interface HallucinationReport {
  hallucinationRiskScore: number;
  factCheckSummary?: FactCheckSummary;
  triggers?: Trigger[];
  verifications?: any[];
  recommendations?: string[];
}

interface HallucinationRiskSectionProps {
  hallucinationReport: HallucinationReport;
}

export default function HallucinationRiskSection({ hallucinationReport }: HallucinationRiskSectionProps) {
  const [showRiskTriggers, setShowRiskTriggers] = useState(true);

  const hallucinationExamples = [
    {
      label: 'High Risk - Missing Specifics:',
      type: 'bad' as const,
      content: '"Our AI improves productivity"',
      explanation: 'AI may invent: "30% productivity increase" when no number was provided'
    },
    {
      label: 'Low Risk - Specific Facts:',
      type: 'good' as const,
      content: '"Our AI improves productivity by 25% based on internal studies"',
      explanation: 'AI can accurately cite the specific 25% figure'
    }
  ];

  return (
    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⚠️ Hallucination Risk Assessment</h3>
        <Tooltip content="Measures the risk of AI systems making incorrect assumptions or generating false information about your content. Lower scores indicate better content reliability.">
          <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
        </Tooltip>
      </div>

      <ExampleSection title="See Example" examples={hallucinationExamples} />

      <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
        Risk Score: {hallucinationReport.hallucinationRiskScore}/100
      </div>

      {/* Fact Check Summary */}
      {hallucinationReport.factCheckSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Facts</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hallucinationReport.factCheckSummary.totalFacts}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {hallucinationReport.factCheckSummary.verifiedFacts}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400">Unverified</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {hallucinationReport.factCheckSummary.unverifiedFacts}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Context Risk</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hallucinationReport.factCheckSummary.contradictions}
            </div>
          </div>
        </div>
      )}

      {/* All Extracted Facts */}
      {hallucinationReport.verifications && hallucinationReport.verifications.length > 0 && (
        <FactVerificationList verifications={hallucinationReport.verifications} />
      )}

      {hallucinationReport.triggers && hallucinationReport.triggers.length > 0 && (
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-gray-700 dark:text-gray-300">Risk Triggers:</strong>
            <button
              onClick={() => setShowRiskTriggers(!showRiskTriggers)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              {showRiskTriggers ? '▼ Collapse' : '▶ Expand'}
            </button>
          </div>
          {showRiskTriggers && (
            <div className="space-y-3 mt-3">
              {hallucinationReport.triggers
                .filter((t) => t.severity === 'high' || t.severity === 'critical')
                .slice(0, 5)
                .map((trigger, idx) => (
                  <div key={idx} className={`bg-white dark:bg-gray-800 p-4 rounded border-l-4 ${
                    trigger.severity === 'critical' ? 'border-red-500 dark:border-red-600' : 'border-orange-500 dark:border-orange-600'
                  }`}>
                    <div className="font-semibold text-red-900 dark:text-red-300 uppercase text-sm">
                      {trigger.type} - {trigger.severity}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 mt-1">{trigger.description}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Confidence: {Math.round((trigger.confidence || 0) * 100)}%
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {hallucinationReport.recommendations && hallucinationReport.recommendations.length > 0 && (
        <div className="mt-4">
          <strong className="text-gray-700 dark:text-gray-300">Recommendations:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-900 dark:text-gray-100">
            {hallucinationReport.recommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
