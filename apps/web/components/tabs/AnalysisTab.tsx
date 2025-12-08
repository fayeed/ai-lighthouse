interface AnalysisTabProps {
  scanResult: any;
}

export default function AnalysisTab({ scanResult }: AnalysisTabProps) {
  return (
    <div className="space-y-8">
      {/* LLM Summary */}
      {scanResult?.llm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📝 AI Understanding</h3>
          <div className="space-y-4">
            {scanResult.llm.summary && (
              <div>
                <strong className="text-gray-700">Summary:</strong>
                <p className="text-gray-900 mt-1">{scanResult.llm.summary}</p>
              </div>
            )}
            
            {scanResult.llm.keyTopics && scanResult.llm.keyTopics.length > 0 && (
              <div>
                <strong className="text-gray-700">Key Topics:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scanResult.llm.keyTopics.map((topic: string, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scanResult.llm.readingLevel && (
                <div className="bg-white p-3 rounded">
                  <strong className="text-gray-700">Reading Level:</strong>
                  <p className="text-gray-900">{scanResult.llm.readingLevel.description}</p>
                </div>
              )}
              {scanResult.llm.sentiment && (
                <div className="bg-white p-3 rounded">
                  <strong className="text-gray-700">Sentiment:</strong>
                  <p className="text-gray-900">{scanResult.llm.sentiment}</p>
                </div>
              )}
              {scanResult.llm.technicalDepth && (
                <div className="bg-white p-3 rounded">
                  <strong className="text-gray-700">Technical Depth:</strong>
                  <p className="text-gray-900">{scanResult.llm.technicalDepth}</p>
                </div>
              )}
            </div>

            {/* Top Entities */}
            {scanResult.llm.topEntities && scanResult.llm.topEntities.length > 0 && (
              <div>
                <strong className="text-gray-700">Key Entities:</strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {scanResult.llm.topEntities.slice(0, 6).map((entity: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border-l-3 border-blue-400">
                      <div className="font-semibold text-gray-900">{entity.name}</div>
                      <div className="text-sm text-gray-600">
                        {entity.type} · {Math.round((entity.relevance || 0) * 100)}% relevance
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {scanResult.llm.suggestedFAQ && scanResult.llm.suggestedFAQ.length > 0 && (
              <div>
                <strong className="text-gray-700">Suggested FAQs:</strong>
                <div className="space-y-3 mt-2">
                  {scanResult.llm.suggestedFAQ.slice(0, 5).map((faq: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded border-l-4 border-yellow-400">
                      <div className="font-semibold text-gray-900 mb-1">Q: {faq.question}</div>
                      <div className="text-gray-700 text-sm">A: {faq.suggestedAnswer}</div>
                      {faq.importance && (
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                          faq.importance === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {faq.importance} priority
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hallucination Report */}
      {scanResult?.hallucinationReport && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Hallucination Risk Assessment</h3>
          <div className="text-4xl font-bold text-red-600 mb-4">
            Risk Score: {scanResult.hallucinationReport.hallucinationRiskScore}/100
          </div>
          
          {scanResult.hallucinationReport.facts && scanResult.hallucinationReport.facts.length > 0 && (
            <div className="mb-4">
              <strong className="text-gray-700">Verified Facts ({scanResult.hallucinationReport.facts.length}):</strong>
              <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                {scanResult.hallucinationReport.facts.map((fact: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border-l-4 border-green-500">
                    <div className="text-gray-900 text-sm">{fact.statement || fact}</div>
                    {fact.confidence !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {Math.round(fact.confidence * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {scanResult.hallucinationReport.triggers && scanResult.hallucinationReport.triggers.length > 0 && (
            <div>
              <strong className="text-gray-700">Risk Triggers:</strong>
              <div className="space-y-3 mt-3">
                {scanResult.hallucinationReport.triggers
                  .filter((t: any) => t.severity === 'high' || t.severity === 'critical')
                  .slice(0, 5)
                  .map((trigger: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded border-l-4 border-red-500">
                      <div className="font-semibold text-red-900 uppercase text-sm">
                        {trigger.type} - {trigger.severity}
                      </div>
                      <div className="text-gray-900 mt-1">{trigger.description}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Confidence: {Math.round((trigger.confidence || 0) * 100)}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {scanResult.hallucinationReport.recommendations && scanResult.hallucinationReport.recommendations.length > 0 && (
            <div className="mt-4">
              <strong className="text-gray-700">Recommendations:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-900">
                {scanResult.hallucinationReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mirror Report */}
      {scanResult?.mirrorReport && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">🔍 AI Misunderstanding Check</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Alignment Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {scanResult.mirrorReport.summary.alignmentScore}/100
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Clarity Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {scanResult.mirrorReport.summary.clarityScore}/100
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Critical Issues</div>
              <div className="text-2xl font-bold text-red-600">
                {scanResult.mirrorReport.summary.critical}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Major Issues</div>
              <div className="text-2xl font-bold text-orange-600">
                {scanResult.mirrorReport.summary.major}
              </div>
            </div>
          </div>

          {scanResult.mirrorReport.mismatches && scanResult.mirrorReport.mismatches.length > 0 && (
            <div>
              <strong className="text-gray-700">Priority Mismatches:</strong>
              <div className="space-y-3 mt-3">
                {scanResult.mirrorReport.mismatches
                  .filter((m: any) => m.severity === 'critical' || m.severity === 'major')
                  .slice(0, 5)
                  .map((mismatch: any, idx: number) => (
                    <div key={idx} className={`bg-white p-4 rounded border-l-4 ${
                      mismatch.severity === 'critical' ? 'border-red-500' : 'border-orange-500'
                    }`}>
                      <div className="font-semibold text-gray-900">
                        {mismatch.severity === 'critical' ? '🔴' : '🟡'} {mismatch.field}
                      </div>
                      <div className="text-gray-700 text-sm mt-1">{mismatch.description}</div>
                      <div className="bg-green-50 p-2 rounded mt-2 text-sm text-green-800">
                        <strong>Fix:</strong> {mismatch.recommendation}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
