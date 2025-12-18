'use client';

import HallucinationRiskSection from './analysis/HallucinationRiskSection';

interface HallucinationTabProps {
  scanResult: any;
}

export default function HallucinationTab({ scanResult }: HallucinationTabProps) {
  return (
    <div className="space-y-8">
      {scanResult?.hallucinationReport && (
        <HallucinationRiskSection hallucinationReport={scanResult.hallucinationReport} />
      )}
    </div>
  );
}
