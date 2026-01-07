// Temporary debug component to check data structure
export function DebugData({ reportData }: { reportData: any }) {
  if (!reportData) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md max-h-96 overflow-auto bg-black/90 text-white p-4 rounded-lg text-xs z-50 border border-white/20">
      <h3 className="font-bold mb-2">Debug: Report Data Structure</h3>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify({
          hasLLM: !!reportData.scanResult?.llm,
          llmKeys: reportData.scanResult?.llm ? Object.keys(reportData.scanResult.llm) : [],
          hasHallucination: !!reportData.scanResult?.hallucinationReport,
          hallucinationKeys: reportData.scanResult?.hallucinationReport ? Object.keys(reportData.scanResult.hallucinationReport) : [],
          hasMirror: !!reportData.scanResult?.mirrorReport,
          mirrorKeys: reportData.scanResult?.mirrorReport ? Object.keys(reportData.scanResult.mirrorReport) : [],
          sampleLLM: reportData.scanResult?.llm,
          sampleHallucination: reportData.scanResult?.hallucinationReport,
          sampleMirror: reportData.scanResult?.mirrorReport
        }, null, 2)}
      </pre>
    </div>
  );
}
