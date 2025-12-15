'use client';

import ChunkingSection from './technical/ChunkingSection';
import ExtractabilitySection from './technical/ExtractabilitySection';
import TechnicalScoringSection from './technical/TechnicalScoringSection';

interface TechnicalTabProps {
  scanResult: any;
}

export default function TechnicalTab({ scanResult }: TechnicalTabProps) {
  return (
    <div className="space-y-8">
      {/* Chunking */}
      {scanResult?.chunking && <ChunkingSection chunking={scanResult.chunking} />}

      {/* Extractability */}
      {scanResult?.extractability && <ExtractabilitySection extractability={scanResult.extractability} />}

      {/* Scoring Details */}
      {scanResult?.scoring && <TechnicalScoringSection scoring={scanResult.scoring} />}
    </div>
  );
}
