'use client';

import MirrorReportSection from './analysis/MirrorReportSection';

interface MessageAlignmentTabProps {
  scanResult: any;
}

export default function MessageAlignmentTab({ scanResult }: MessageAlignmentTabProps) {
  return (
    <div className="space-y-8">
      {scanResult?.mirrorReport && <MirrorReportSection mirrorReport={scanResult.mirrorReport} />}
    </div>
  );
}
