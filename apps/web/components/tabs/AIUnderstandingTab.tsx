'use client';

import AIUnderstandingSection from './analysis/AIUnderstandingSection';

interface AIUnderstandingTabProps {
  scanResult: any;
}

export default function AIUnderstandingTab({ scanResult }: AIUnderstandingTabProps) {
  return (
    <div className="space-y-8">
      {scanResult?.llm && <AIUnderstandingSection llm={scanResult.llm} chunks={scanResult.chunking?.chunks} />}
    </div>
  );
}
