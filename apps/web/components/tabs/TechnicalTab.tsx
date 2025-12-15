'use client';

import { useState } from 'react';
import Tooltip from '../Tooltip';

interface TechnicalTabProps {
  scanResult: any;
}

export default function TechnicalTab({ scanResult }: TechnicalTabProps) {
  const [showExtractabilityExample, setShowExtractabilityExample] = useState(false);
  const [showTechnicalScoringExample, setShowTechnicalScoringExample] = useState(false);

  return (
    <div className="space-y-8">
      {/* Chunking */}
      {scanResult?.chunking && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📄 Content Chunking</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Strategy</div>
              <div className="font-semibold text-gray-900">
                {scanResult.chunking.chunkingStrategy}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Total Chunks</div>
              <div className="text-2xl font-bold text-green-600">
                {scanResult.chunking.totalChunks}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Avg Tokens/Chunk</div>
              <div className="text-2xl font-bold text-green-600">
                {scanResult.chunking.averageTokensPerChunk}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Avg Noise</div>
              <div className="text-2xl font-bold text-green-600">
                {(scanResult.chunking.averageNoiseRatio * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Chunk Details */}
          {scanResult.chunking.chunks && scanResult.chunking.chunks.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Chunk Distribution</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scanResult.chunking.chunks.slice(0, 10).map((chunk: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">Chunk {idx + 1}</span>
                      <span className="text-xs text-gray-600">{chunk.tokenCount} tokens</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Noise: {(chunk.noiseRatio * 100).toFixed(1)}% · 
                      Extractable: {chunk.extractableContentRatio ? (chunk.extractableContentRatio * 100).toFixed(1) : 'N/A'}%
                    </div>
                  </div>
                ))}
                {scanResult.chunking.chunks.length > 10 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    + {scanResult.chunking.chunks.length - 10} more chunks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extractability */}
      {scanResult?.extractability && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">🔄 Extractability</h3>
            <Tooltip content="How easily AI systems can extract and process your content. Considers HTML structure, rendering method, and content accessibility.">
              <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          {/* Example Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowExtractabilityExample(!showExtractabilityExample)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showExtractabilityExample ? '▼' : '▶'} See Example
            </button>
            {showExtractabilityExample && (
              <div className="mt-3 bg-white border border-yellow-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-1">✓ High Extractability (90+):</div>
                    <div className="bg-green-50 p-3 rounded text-sm font-mono">
                      <div className="text-gray-700">
                        <span className="text-blue-600">&lt;article&gt;</span><br />
                        <span className="ml-4"><span className="text-blue-600">&lt;h1&gt;</span>Product Features<span className="text-blue-600">&lt;/h1&gt;</span></span><br />
                        <span className="ml-4"><span className="text-blue-600">&lt;p&gt;</span>Our CRM increases sales by 25%<span className="text-blue-600">&lt;/p&gt;</span></span><br />
                        <span className="text-blue-600">&lt;/article&gt;</span>
                      </div>
                      <p className="text-green-600 mt-2 text-xs">✓ AI can immediately read and understand the content</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-1">❌ Low Extractability (30-):</div>
                    <div className="bg-red-50 p-3 rounded text-sm space-y-2">
                      <div className="font-mono text-gray-700">
                        <span className="text-blue-600">&lt;div id="app"&gt;</span><span className="text-blue-600">&lt;/div&gt;</span><br />
                        <span className="text-gray-500">// Content loaded via JavaScript</span>
                      </div>
                      <div className="text-xs text-red-600">❌ AI sees empty page, misses all content</div>
                      <div className="border-t border-red-200 pt-2 mt-2">
                        <div className="font-mono text-gray-700">
                          <span className="text-blue-600">&lt;img src="features.png"&gt;</span>
                        </div>
                        <div className="text-xs text-red-600">❌ Text in image without alt text - AI can't read it</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-2xl font-bold text-yellow-600">
                {scanResult.extractability.score.extractabilityScore}/100
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Server-Rendered</div>
              <div className="text-2xl font-bold text-yellow-600">
                {scanResult.extractability.score.serverRenderedPercent}%
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Text Extractable</div>
              <div className="text-2xl font-bold text-yellow-600">
                {scanResult.extractability.contentTypes.text.percentage}%
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Images Extractable</div>
              <div className="text-2xl font-bold text-yellow-600">
                {scanResult.extractability.contentTypes.images.percentage}%
              </div>
            </div>
          </div>

          {/* Content Type Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Object.entries(scanResult.extractability.contentTypes).map(([type, data]: [string, any]) => (
              <div key={type} className="bg-white p-4 rounded border border-gray-200">
                <h4 className="font-semibold text-gray-900 capitalize mb-2">{type}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extractable:</span>
                    <span className="font-medium text-green-600">{data.extractable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Percentage:</span>
                    <span className="font-medium">{data.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Details */}
      {scanResult?.scoring && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">📊 Technical Scoring</h3>
            <Tooltip content="Comprehensive technical score based on all AI readiness checks including accessibility, structure, and metadata quality.">
              <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          {/* Example Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowTechnicalScoringExample(!showTechnicalScoringExample)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {showTechnicalScoringExample ? '▼' : '▶'} See What Improves Your Score
            </button>
            {showTechnicalScoringExample && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-green-700 mb-2">✓ High Score Elements:</div>
                    <div className="bg-green-50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <div className="font-semibold text-gray-700">Semantic HTML:</div>
                        <div className="font-mono text-xs text-gray-600 mt-1">
                          &lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;article&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Heading Hierarchy:</div>
                        <div className="text-gray-600 text-xs">H1 → H2 → H3 (logical order)</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Alt Text:</div>
                        <div className="font-mono text-xs text-gray-600">
                          &lt;img alt="Dashboard metrics"&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Schema.org Data:</div>
                        <div className="font-mono text-xs text-gray-600">
                          JSON-LD structured data
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-700 mb-2">❌ Low Score Elements:</div>
                    <div className="bg-red-50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <div className="font-semibold text-gray-700">Generic Tags:</div>
                        <div className="font-mono text-xs text-gray-600 mt-1">
                          &lt;div&gt;, &lt;span&gt; for everything
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Poor Headings:</div>
                        <div className="text-gray-600 text-xs">Multiple H1s, skipping levels</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Missing Alt Text:</div>
                        <div className="font-mono text-xs text-gray-600">
                          &lt;img src="chart.png"&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">No Metadata:</div>
                        <div className="text-gray-600 text-xs">Missing titles, descriptions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-2xl font-bold text-gray-900">
                {scanResult.scoring.overallScore}/100
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Grade</div>
              <div className="text-2xl font-bold text-gray-900">
                {scanResult.scoring.grade}
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm text-gray-600">Total Issues</div>
              <div className="text-2xl font-bold text-gray-900">
                {scanResult.scoring.totalIssues}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          {scanResult.scoring.categoryScores && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-gray-700">Category Breakdown</h4>
                <Tooltip content="Individual scores for each AI readiness category:\n\n• Content Quality: Text clarity, structure, readability\n• Technical: HTML structure, semantic markup\n• Crawlability: robots.txt, sitemaps, canonical URLs\n• Knowledge Graph: Schema.org data, JSON-LD\n• Accessibility: ARIA labels, alt text, keyboard navigation">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(scanResult.scoring.categoryScores).map(([category, data]: [string, any]) => {
                  // Handle both formats: direct score or object with score property
                  const scoreValue = typeof data === 'number' ? data : (data?.score || 0);
                  return (
                    <div key={category} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {data.category.replace(/-/g, ' ')}
                        </span>
                        <span className={`text-lg font-bold ${
                          scoreValue >= 90 ? 'text-blue-600' :    // Excellent (low risk)
                          scoreValue >= 75 ? 'text-yellow-600' :  // Good (medium risk)
                          scoreValue >= 60 ? 'text-orange-600' :  // Fair (high risk)
                          'text-red-600'                          // Poor (critical risk)
                        }`}>
                          {Math.round(scoreValue)}/100
                        </span>
                      </div>
                      {typeof data === 'object' && data?.issueCount !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {data.issueCount} issues
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
