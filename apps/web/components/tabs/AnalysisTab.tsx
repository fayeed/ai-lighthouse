'use client';

import AIUnderstandingSection from './analysis/AIUnderstandingSection';
import HallucinationRiskSection from './analysis/HallucinationRiskSection';
import MirrorReportSection from './analysis/MirrorReportSection';

interface AnalysisTabProps {
  scanResult: any;
}

export default function AnalysisTab({ scanResult }: AnalysisTabProps) {
  console.log('AnalysisTab scanResult:', scanResult);

  return (
    <div className="space-y-8">
      {/* LLM Summary */}
      {scanResult?.llm && <AIUnderstandingSection llm={scanResult.llm} />}

      {/* Hallucination Report */}
      {scanResult?.hallucinationReport && (
        <HallucinationRiskSection hallucinationReport={scanResult.hallucinationReport} />
      )}

      {/* Mirror Report */}
      {scanResult?.mirrorReport && <MirrorReportSection mirrorReport={scanResult.mirrorReport} />}
    </div>
  );
}
