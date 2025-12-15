'use client';

import { useState } from 'react';
import Tooltip from '../Tooltip';

interface AnalysisTabProps {
  scanResult: any;
}

export default function AnalysisTab({ scanResult }: AnalysisTabProps) {
  const [showHallucinationExample, setShowHallucinationExample] = useState(false);
  const [showAlignmentExample, setShowAlignmentExample] = useState(false);
  const [showClarityExample, setShowClarityExample] = useState(false);

  return (
    <div className="space-y-8">
      {/* LLM Summary */}
      {scanResult?.llm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📝 AI Understanding</h3>
          <div className="space-y-4">
            {scanResult.llm.pageType && (
              <div className="mb-4">
                <strong className="text-gray-700">Inferred Page Type:</strong>
                <div className="mt-2">
                  <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold text-lg">
                    {scanResult.llm.pageType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">AI's best guess based on content analysis</p>
              </div>
            )}
            
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
                          faq.importance === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
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
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">⚠️ Hallucination Risk Assessment</h3>
            <Tooltip content="Measures the risk of AI systems making incorrect assumptions or generating false information about your content. Lower scores indicate better content reliability.">
              <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          {/* Example Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowHallucinationExample(!showHallucinationExample)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showHallucinationExample ? '▼' : '▶'} See Example
            </button>
            {showHallucinationExample && (
              <div className="mt-3 bg-white border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-1">❌ High Risk - Missing Specifics:</div>
                    <div className="bg-red-50 p-3 rounded text-sm">
                      <p className="text-gray-700 italic">"Our AI improves productivity"</p>
                      <p className="text-red-600 mt-2 text-xs">⚠️ AI may invent: "30% productivity increase" when no number was provided</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-1">✓ Low Risk - Specific Facts:</div>
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <p className="text-gray-700 italic">"Our AI improves productivity by 25% based on internal studies"</p>
                      <p className="text-green-600 mt-2 text-xs">✓ AI can accurately cite the specific 25% figure</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-4xl font-bold text-red-600 mb-4">
            Risk Score: {scanResult.hallucinationReport.hallucinationRiskScore}/100
          </div>

          {/* Fact Check Summary */}
          {scanResult.hallucinationReport.factCheckSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Facts</div>
                <div className="text-2xl font-bold text-gray-900">
                  {scanResult.hallucinationReport.factCheckSummary.totalFacts}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Verified</div>
                <div className="text-2xl font-bold text-blue-600">
                  {scanResult.hallucinationReport.factCheckSummary.verifiedFacts}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Unverified</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {scanResult.hallucinationReport.factCheckSummary.unverifiedFacts}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Contradictions</div>
                <div className="text-2xl font-bold text-red-600">
                  {scanResult.hallucinationReport.factCheckSummary.contradictions}
                </div>
              </div>
            </div>
          )}

          {/* All Extracted Facts */}
          {scanResult.hallucinationReport.triggers && (() => {
            // Find the consolidated fact trigger (contains all verifications)
            const factTrigger = scanResult.hallucinationReport.verifications

            console.log('Fact Trigger:', factTrigger);
            
            // Separate facts by verification status
            // First, get contradicted facts (have contradictions array with items)
            const contradictedFacts = factTrigger.filter(
              (v: any) => v.contradictions && v.contradictions.length > 0
            );
            
            // Then, get verified facts (verified=true AND no contradictions)
            const verifiedFacts = factTrigger.filter(
              (v: any) => v.verified && (!v.contradictions || v.contradictions.length === 0)
            );
            
            // Finally, unverified facts (not verified AND no contradictions)
            const unverifiedFacts = factTrigger.filter(
              (v: any) => !v.verified && (!v.contradictions || v.contradictions.length === 0)
            );
            
            console.log('📊 Fact counts - Verified:', verifiedFacts.length, 'Unverified:', unverifiedFacts.length, 'Contradicted:', contradictedFacts.length);
            
            const allFactsCount = factTrigger.length;
            
            return allFactsCount > 0 ? (
              <div className="mb-4">
                <div className="space-y-4">
                  {/* Verified Facts */}
                  {verifiedFacts.length > 0 && (
                    <div>
                      <strong className="text-blue-700">✓ Verified Facts ({verifiedFacts.length}):</strong>
                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                        {verifiedFacts.map((verification: any, idx: number) => (
                          <div key={verification.fact.id || idx} className="bg-white p-3 rounded border-l-4 border-blue-500">
                            <div className="text-gray-900 text-sm font-medium">{verification.fact.statement}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                Verified
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {verification.fact.category || 'general'}
                              </span>
                              {verification.fact.confidence !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(verification.fact.confidence * 100)}% confidence
                                </span>
                              )}
                              {verification.evidence?.similarity !== undefined && (
                                <span className="text-xs text-blue-600">
                                  {Math.round(verification.evidence.similarity * 100)}% match
                                </span>
                              )}
                            </div>
                            {verification.evidence?.textSnippet && (
                              <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Found in:</strong> {verification.evidence.textSnippet.substring(0, 150)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unverified Facts */}
                  {unverifiedFacts.length > 0 && (
                    <div>
                      <strong className="text-yellow-700">⚠ Unverified Facts ({unverifiedFacts.length}):</strong>
                      <p className="text-sm text-gray-600 mt-1">These facts need manual verification as they couldn't be confirmed in the page content</p>
                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                        {unverifiedFacts.map((verification: any, idx: number) => (
                          <div key={verification.fact.id || idx} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <div className="text-gray-900 text-sm font-medium">{verification.fact.statement}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                Needs Verification
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {verification.fact.category || 'general'}
                              </span>
                              {verification.fact.confidence !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(verification.fact.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                            {verification.fact.sourceContext && (
                              <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Source context:</strong> {verification.fact.sourceContext}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contradicted Facts */}
                  {contradictedFacts.length > 0 && (
                    <div>
                      <strong className="text-red-700">🔴 Contradicted Facts ({contradictedFacts.length}):</strong>
                      <p className="text-sm text-gray-600 mt-1">These facts have contradictions found in the content</p>
                      <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                        {contradictedFacts.map((verification: any, idx: number) => (
                          <div key={verification.fact.id || idx} className="bg-white p-3 rounded border-l-4 border-red-500">
                            <div className="text-gray-900 text-sm font-medium">{verification.fact.statement}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                                Contradicted
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {verification.fact.category || 'general'}
                              </span>
                              {verification.fact.confidence !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(verification.fact.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                            {verification.contradictions && verification.contradictions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {verification.contradictions.map((contradiction: any, cIdx: number) => (
                                  <div key={cIdx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                    <strong>⚠ Contradiction {cIdx + 1}:</strong> {contradiction.textSnippet.substring(0, 150)}...
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary if no facts */}
                  {allFactsCount === 0 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      No facts extracted for verification. Enable LLM analysis to extract and verify facts.
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}

          {scanResult.hallucinationReport.triggers && scanResult.hallucinationReport.triggers.length > 0 && (
            <div>
              <strong className="text-gray-700">Risk Triggers:</strong>
              <div className="space-y-3 mt-3">
                {scanResult.hallucinationReport.triggers
                  .filter((t: any) => t.severity === 'high' || t.severity === 'critical')
                  .slice(0, 5)
                  .map((trigger: any, idx: number) => (
                    <div key={idx} className={`bg-white p-4 rounded border-l-4 ${
                      trigger.severity === 'critical' ? 'border-red-500' : 'border-orange-500'
                    }`}>
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
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-600">Alignment Score</div>
                <Tooltip content="How well AI's understanding aligns with your actual content. Higher scores mean AI accurately reflects your key messages.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ⓘ</span>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {scanResult.mirrorReport.summary.alignmentScore}/100
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-600">Clarity Score</div>
                <Tooltip content="How clearly your content communicates to AI systems. Higher scores indicate better structure and semantic clarity.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ⓘ</span>
                </Tooltip>
              </div>
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

          {/* Alignment Example */}
          <div className="mb-4">
            <button
              onClick={() => setShowAlignmentExample(!showAlignmentExample)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showAlignmentExample ? '▼' : '▶'} See Alignment Example
            </button>
            {showAlignmentExample && (
              <div className="mt-3 bg-white border border-purple-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Your Page Content:</div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="text-gray-700">"We sell enterprise software for healthcare providers"</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-semibold text-green-700 mb-1">✓ Good Alignment (90+):</div>
                      <div className="bg-green-50 p-3 rounded text-sm">
                        <p className="text-gray-700 italic">AI Summary: "Healthcare enterprise software vendor"</p>
                        <p className="text-green-600 mt-2 text-xs">✓ Accurately captures industry and business type</p>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-red-700 mb-1">❌ Poor Alignment (40-):</div>
                      <div className="bg-red-50 p-3 rounded text-sm">
                        <p className="text-gray-700 italic">AI Summary: "General software company"</p>
                        <p className="text-red-600 mt-2 text-xs">❌ Misses critical details about industry focus</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clarity Example */}
          <div className="mb-4">
            <button
              onClick={() => setShowClarityExample(!showClarityExample)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showClarityExample ? '▼' : '▶'} See Clarity Example
            </button>
            {showClarityExample && (
              <div className="mt-3 bg-white border border-purple-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-1">❌ Poor Clarity - Vague:</div>
                    <div className="bg-red-50 p-3 rounded text-sm">
                      <p className="text-gray-700 italic">"Our solution helps businesses succeed in the modern world"</p>
                      <p className="text-red-600 mt-2 text-xs">⚠️ Too generic - what solution? Which businesses? How does it help?</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-1">✓ Good Clarity - Specific:</div>
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <p className="text-gray-700 italic">"Our CRM software helps sales teams track customer interactions, manage leads, and forecast revenue"</p>
                      <p className="text-green-600 mt-2 text-xs">✓ Clear: product type (CRM), audience (sales teams), specific benefits</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {scanResult.mirrorReport.mismatches && scanResult.mirrorReport.mismatches.length > 0 && (
            <div>
              <strong className="text-gray-700">Priority Mismatches:</strong>
              <div className="space-y-3 mt-3">
                {scanResult.mirrorReport.mismatches
                  .filter((m: any) => m.severity === 'critical' || m.severity === 'major' || m.severity === 'high')
                  .slice(0, 5)
                  .map((mismatch: any, idx: number) => (
                    <div key={idx} className={`bg-white p-4 rounded border-l-4 ${
                      mismatch.severity === 'critical' ? 'border-red-500' : 
                      (mismatch.severity === 'high' || mismatch.severity === 'major') ? 'border-orange-500' : 'border-yellow-500'
                    }`}>
                      <div className="font-semibold text-gray-900">
                        {mismatch.severity === 'critical' ? '🔴' : 
                         (mismatch.severity === 'high' || mismatch.severity === 'major') ? '🟠' : '🟡'} {mismatch.field}
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
