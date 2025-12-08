'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [enableLLM, setEnableLLM] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const response = await fetch('http://localhost:3002/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          enableLLM,
          maxIssues: 20,
          minImpactScore: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Audit failed');
      }

      setReportData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            🚨 AI Lighthouse
          </h1>
          <p className="text-xl text-gray-700">
            Analyze your website AI readiness
          </p>
        </header>

        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableLLM}
                  onChange={(e) => setEnableLLM(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable LLM Analysis (requires local Ollama)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze Website'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {reportData && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Audit Report</h2>
              
              {/* AI Readiness Banner */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-2">AI Readiness Score</h3>
                <div className="text-6xl font-bold mb-2">
                  {Math.round(reportData.aiReadiness.overall)}/100
                </div>
                <div className="text-xl">Grade: {reportData.aiReadiness.grade}</div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['overview', 'analysis', 'issues', 'technical'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  {/* Dimensions */}
                  {reportData.aiReadiness.dimensions && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Dimension Scores</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(reportData.aiReadiness.dimensions).map(([key, dim]: [string, any]) => (
                          <div key={key} className="bg-gray-50 border-l-4 border-blue-500 rounded-lg p-4">
                            <div className="font-semibold text-lg text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-3xl font-bold text-blue-600 my-2">
                              {Math.round(dim.score)}/100
                            </div>
                            <div className="text-sm text-gray-600 capitalize">{dim.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Wins */}
                  {reportData.aiReadiness.quickWins && reportData.aiReadiness.quickWins.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">⚡ Quick Wins</h3>
                      <div className="space-y-4">
                        {reportData.aiReadiness.quickWins.slice(0, 5).map((win: any, idx: number) => (
                          <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <div className="font-semibold text-gray-900">{win.issue}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Impact: {win.impact} · Effort: {win.effort}
                            </div>
                            <div className="text-sm text-green-700 mt-2">→ {win.fix}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-8">
                  {/* LLM Summary */}
                  {reportData.scanResult?.llm && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">📝 AI Understanding</h3>
                      <div className="space-y-4">
                        {reportData.scanResult.llm.summary && (
                          <div>
                            <strong className="text-gray-700">Summary:</strong>
                            <p className="text-gray-900 mt-1">{reportData.scanResult.llm.summary}</p>
                          </div>
                        )}
                        
                        {reportData.scanResult.llm.keyTopics && reportData.scanResult.llm.keyTopics.length > 0 && (
                          <div>
                            <strong className="text-gray-700">Key Topics:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {reportData.scanResult.llm.keyTopics.map((topic: string, idx: number) => (
                                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {reportData.scanResult.llm.readingLevel && (
                            <div className="bg-white p-3 rounded">
                              <strong className="text-gray-700">Reading Level:</strong>
                              <p className="text-gray-900">{reportData.scanResult.llm.readingLevel.description}</p>
                            </div>
                          )}
                          {reportData.scanResult.llm.sentiment && (
                            <div className="bg-white p-3 rounded">
                              <strong className="text-gray-700">Sentiment:</strong>
                              <p className="text-gray-900">{reportData.scanResult.llm.sentiment}</p>
                            </div>
                          )}
                          {reportData.scanResult.llm.technicalDepth && (
                            <div className="bg-white p-3 rounded">
                              <strong className="text-gray-700">Technical Depth:</strong>
                              <p className="text-gray-900">{reportData.scanResult.llm.technicalDepth}</p>
                            </div>
                          )}
                        </div>

                        {/* Top Entities */}
                        {reportData.scanResult.llm.topEntities && reportData.scanResult.llm.topEntities.length > 0 && (
                          <div>
                            <strong className="text-gray-700">Key Entities:</strong>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {reportData.scanResult.llm.topEntities.slice(0, 6).map((entity: any, idx: number) => (
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
                        {reportData.scanResult.llm.suggestedFAQ && reportData.scanResult.llm.suggestedFAQ.length > 0 && (
                          <div>
                            <strong className="text-gray-700">Suggested FAQs:</strong>
                            <div className="space-y-3 mt-2">
                              {reportData.scanResult.llm.suggestedFAQ.slice(0, 5).map((faq: any, idx: number) => (
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
                  {reportData.scanResult?.hallucinationReport && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Hallucination Risk Assessment</h3>
                      <div className="text-4xl font-bold text-red-600 mb-4">
                        Risk Score: {reportData.scanResult.hallucinationReport.hallucinationRiskScore}/100
                      </div>
                      
                      {reportData.scanResult.hallucinationReport.triggers && reportData.scanResult.hallucinationReport.triggers.length > 0 && (
                        <div>
                          <strong className="text-gray-700">Risk Triggers:</strong>
                          <div className="space-y-3 mt-3">
                            {reportData.scanResult.hallucinationReport.triggers
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

                      {reportData.scanResult.hallucinationReport.recommendations && reportData.scanResult.hallucinationReport.recommendations.length > 0 && (
                        <div className="mt-4">
                          <strong className="text-gray-700">Recommendations:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-900">
                            {reportData.scanResult.hallucinationReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mirror Report */}
                  {reportData.scanResult?.mirrorReport && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">🔍 AI Misunderstanding Check</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Alignment Score</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {reportData.scanResult.mirrorReport.summary.alignmentScore}/100
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Clarity Score</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {reportData.scanResult.mirrorReport.summary.clarityScore}/100
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Critical Issues</div>
                          <div className="text-2xl font-bold text-red-600">
                            {reportData.scanResult.mirrorReport.summary.critical}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Major Issues</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {reportData.scanResult.mirrorReport.summary.major}
                          </div>
                        </div>
                      </div>

                      {reportData.scanResult.mirrorReport.mismatches && reportData.scanResult.mirrorReport.mismatches.length > 0 && (
                        <div>
                          <strong className="text-gray-700">Priority Mismatches:</strong>
                          <div className="space-y-3 mt-3">
                            {reportData.scanResult.mirrorReport.mismatches
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
              )}

              {activeTab === 'issues' && (
                <div>
                  {reportData.auditReport.issues && reportData.auditReport.issues.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        ⚠️ Issues Found ({reportData.auditReport.issues.length})
                      </h3>
                      {reportData.auditReport.issues.map((issue: any, idx: number) => (
                        <div key={idx} className={`border-l-4 p-4 rounded ${
                          issue.severity === 'critical' ? 'bg-red-50 border-red-500' :
                          issue.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                          issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-blue-50 border-blue-500'
                        }`}>
                          <div className="font-semibold text-gray-900">{issue.message}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="uppercase font-semibold">{issue.severity}</span> · 
                            Impact: {issue.impact} · 
                            Category: {issue.category}
                          </div>
                          {issue.suggested_fix && (
                            <div className="text-sm text-green-700 mt-2 bg-white p-2 rounded">
                              <strong>Fix:</strong> {issue.suggested_fix}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">No issues found</div>
                  )}
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-8">
                  {/* Chunking */}
                  {reportData.scanResult?.chunking && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">📄 Content Chunking</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Strategy</div>
                          <div className="font-semibold text-gray-900">
                            {reportData.scanResult.chunking.chunkingStrategy}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Total Chunks</div>
                          <div className="text-2xl font-bold text-green-600">
                            {reportData.scanResult.chunking.totalChunks}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Avg Tokens/Chunk</div>
                          <div className="text-2xl font-bold text-green-600">
                            {reportData.scanResult.chunking.averageTokensPerChunk}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Avg Noise</div>
                          <div className="text-2xl font-bold text-green-600">
                            {(reportData.scanResult.chunking.averageNoiseRatio * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extractability */}
                  {reportData.scanResult?.extractability && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">🔄 Extractability</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Overall Score</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {reportData.scanResult.extractability.score.extractabilityScore}/100
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Server-Rendered</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {reportData.scanResult.extractability.score.serverRenderedPercent}%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Text Extractable</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {reportData.scanResult.extractability.contentTypes.text.percentage}%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Images Extractable</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {reportData.scanResult.extractability.contentTypes.images.percentage}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scoring Details */}
                  {reportData.scanResult?.scoring && (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Technical Scoring</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Overall Score</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {reportData.scanResult.scoring.overallScore}/100
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Grade</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {reportData.scanResult.scoring.grade}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-sm text-gray-600">Total Issues</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {reportData.scanResult.scoring.totalIssues}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
