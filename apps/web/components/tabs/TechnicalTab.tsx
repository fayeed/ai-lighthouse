'use client';

import { useState } from 'react';
import Tooltip from '../Tooltip';

interface TechnicalTabProps {
  scanResult: any;
}

const categoryDescriptions: Record<string, { name: string; description: string }> = {
  AIREAD: {
    name: "AI Readability",
    description: "How well your content is structured for AI/LLM comprehension. Includes heading hierarchy, semantic HTML, and content organization. This is the most crucial category for AI understanding."
  },
  CHUNK: {
    name: "Content Chunking",
    description: "How well your content fits within AI token windows and embedding systems. Large chunks may be truncated; small chunks lose context. Optimal chunking improves AI processing."
  },
  EXTRACT: {
    name: "Data Extraction",
    description: "Quality of structured data (Schema.org, JSON-LD, microdata). Makes it easier for AI to extract facts, entities, and relationships from your content."
  },
  CRAWL: {
    name: "Crawlability",
    description: "How easily AI crawlers can discover and access your content. Includes robots.txt, sitemaps, canonical URLs, and crawl directives."
  },
  A11Y: {
    name: "Accessibility",
    description: "Accessibility features that also benefit AI: ARIA labels, alt text, semantic markup, keyboard navigation. Accessible content is AI-readable content."
  },
  KG: {
    name: "Knowledge Graph",
    description: "Structured data and knowledge graph implementation using Schema.org vocabularies. Helps AI understand entities and relationships on your page."
  },
  TECH: {
    name: "Technical SEO",
    description: "Technical infrastructure supporting AI crawling: HTML structure, meta tags, canonicals, redirects, and page performance."
  },
  LLMLOCAL: {
    name: "Local LLM",
    description: "Optimization for local/on-device AI models that may have smaller context windows and different processing requirements."
  },
  LLMAPI: {
    name: "API LLM",
    description: "Optimization for cloud-based AI APIs (GPT, Claude, etc.) including API-specific formatting and data structures."
  },
  LLMCONF: {
    name: "LLM Confidence",
    description: "Signals that help AI systems determine confidence in their understanding of your content. Clear, authoritative content scores higher."
  },
  HALL: {
    name: "Hallucination Prevention",
    description: "Measures to prevent AI from generating false information about your content. Includes fact verification, clear attribution, and explicit disclaimers."
  },
  GAPS: {
    name: "Content Gaps",
    description: "Missing information that AI systems might expect or need to fully understand your offering. Filling gaps improves completeness."
  },
  DRIFT: {
    name: "Content Drift",
    description: "Consistency between different representations of your content. Mismatches between title/meta/body can confuse AI systems."
  },
  CI: {
    name: "Citations",
    description: "Proper attribution and citation of sources. Helps AI understand authority and trustworthiness of information."
  },
  DX: {
    name: "Developer Experience",
    description: "Technical elements that affect developers working with AI integrations: APIs, documentation, code examples."
  },
  MISC: {
    name: "Miscellaneous",
    description: "Other optimization opportunities that don't fit into major categories but still affect AI readiness."
  }
};

export default function TechnicalTab({ scanResult }: TechnicalTabProps) {
  const [showExtractabilityExample, setShowExtractabilityExample] = useState(false);
  const [showTechnicalScoringExample, setShowTechnicalScoringExample] = useState(false);
  const [combinedChunkView, setCombinedChunkView] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  const toggleChunk = (idx: number) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const getTokenHeatColor = (tokenCount: number, avgTokens: number) => {
    const ratio = tokenCount / avgTokens;
    if (ratio > 1.5) return 'bg-red-500';
    if (ratio > 1.2) return 'bg-orange-500';
    if (ratio > 0.8) return 'bg-green-500';
    if (ratio > 0.5) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getChunkQuality = (chunk: any) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check token count
    if (chunk.tokenCount > 1000) {
      issues.push('Very large chunk (>1000 tokens)');
      recommendations.push('Consider splitting into smaller sections with subheadings');
    } else if (chunk.tokenCount < 50) {
      issues.push('Very small chunk (<50 tokens)');
      recommendations.push('Could be merged with adjacent chunks for better context');
    }
    
    // Check noise ratio
    if (chunk.noiseRatio > 0.5) {
      issues.push('High noise ratio (>50%)');
      recommendations.push('Remove excessive whitespace or non-content elements');
    }
    
    // Check heading
    if (!chunk.heading) {
      issues.push('No clear heading');
      recommendations.push('Add a descriptive heading to improve context');
    }
    
    // Determine quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    let color: string;
    let emoji: string;
    
    if (issues.length === 0) {
      quality = 'excellent';
      color = 'text-green-600';
      emoji = '✓';
    } else if (issues.length === 1) {
      quality = 'good';
      color = 'text-blue-600';
      emoji = '✓';
    } else if (issues.length === 2) {
      quality = 'fair';
      color = 'text-yellow-600';
      emoji = '⚠';
    } else {
      quality = 'poor';
      color = 'text-red-600';
      emoji = '✗';
    }
    
    return { quality, issues, recommendations, color, emoji };
  };

  return (
    <div className="space-y-8">
      {/* Chunking */}
      {scanResult?.chunking && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">📄 Content Chunking</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Strategy</span>
                <Tooltip content={
                  scanResult.chunking.chunkingStrategy === 'heading-based' 
                    ? "✓ Heading-based: Your page has clear H1-H6 headings. Content is chunked by semantic sections, which is ideal for AI comprehension. Each heading creates a natural context boundary."
                    : "⚠ Paragraph-based: No headings detected. Content is split by paragraphs with a token limit. Consider adding H2-H6 headings to create better semantic structure and improve AI understanding."
                }>
                  <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help">ⓘ</span>
                </Tooltip>
              </div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {scanResult.chunking.chunkingStrategy}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Chunks</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {scanResult.chunking.totalChunks}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Tokens/Chunk</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {scanResult.chunking.averageTokensPerChunk}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Noise</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(scanResult.chunking.averageNoiseRatio * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Token Distribution Heatmap */}
          {scanResult.chunking.chunks && scanResult.chunking.chunks.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Token Distribution Heatmap</h4>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex gap-0.5 h-6">
                  {scanResult.chunking.chunks.map((chunk: any, idx: number) => {
                    const width = `${100 / scanResult.chunking.chunks.length}%`;
                    const color = getTokenHeatColor(chunk.tokenCount, scanResult.chunking.averageTokensPerChunk);
                    return (
                      <div
                        key={idx}
                        className={`${color} transition-all hover:opacity-75 cursor-pointer`}
                        style={{ width }}
                        title={`Chunk ${idx + 1}: ${chunk.tokenCount} tokens`}
                        onClick={() => toggleChunk(idx)}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Chunk 1</span>
                  <span>Token distribution (hover for details)</span>
                  <span>Chunk {scanResult.chunking.chunks.length}</span>
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500"></div>
                    <span className='text-black'>&lt;50% avg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500"></div>
                    <span className='text-black'>50-80% avg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500"></div>
                    <span className='text-black'>80-120% avg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500"></div>
                    <span className='text-black'>120-150% avg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <span className='text-black'>&gt;150% avg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chunk Details */}
          {scanResult.chunking.chunks && scanResult.chunking.chunks.length > 0 && (
            <div className="mt-4">
              {/* Overall Recommendations */}
              {scanResult.chunking.chunkingStrategy === 'paragraph-based' && (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">💡</span>
                    <div>
                      <div className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Chunking Recommendation</div>
                      <div className="text-sm text-yellow-800 dark:text-yellow-300">
                        Your page is using paragraph-based chunking because no heading structure was detected. 
                        Consider adding <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">H2</code>, <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">H3</code>, etc. 
                        headings to create semantic sections. This will improve AI comprehension and chunk quality.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Chunk Viewer</h4>
                <button
                  onClick={() => setCombinedChunkView(!combinedChunkView)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    combinedChunkView
                      ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {combinedChunkView ? '📋 Combined View' : '📑 Individual View'}
                </button>
              </div>

              {combinedChunkView ? (
                <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {scanResult.chunking.chunks.map((chunk: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-green-300 dark:border-green-600 pl-3 mb-4">
                        <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          Chunk #{idx + 1} ({chunk.tokenCount} tokens)
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {chunk.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {scanResult.chunking.chunks.map((chunk: any, idx: number) => {
                    const chunkQuality = getChunkQuality(chunk);
                    return (
                      <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {chunk.heading || 'Content Chunk'}
                            </span>
                            <Tooltip content={
                              <div className="text-xs">
                                <div className={`font-semibold mb-1 ${chunkQuality.color}`}>
                                  {chunkQuality.emoji} Quality: {chunkQuality.quality.toUpperCase()}
                                </div>
                                {chunkQuality.issues.length > 0 && (
                                  <div className="mb-2">
                                    <div className="font-semibold">Issues:</div>
                                    <ul className="list-disc ml-4">
                                      {chunkQuality.issues.map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {chunkQuality.recommendations.length > 0 && (
                                  <div>
                                    <div className="font-semibold">Recommendations:</div>
                                    <ul className="list-disc ml-4">
                                      {chunkQuality.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            }>
                              <span className={`text-xs font-semibold cursor-help ${chunkQuality.color}`}>
                                {chunkQuality.emoji}
                              </span>
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">{chunk.tokenCount} tokens</span>
                            <button
                              onClick={() => toggleChunk(idx)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {expandedChunks.has(idx) ? '▼' : '▶'}
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Noise: {(chunk.noiseRatio * 100).toFixed(1)}% · 
                          Words: {chunk.wordCount || 'N/A'}
                          {chunk.extractableContentRatio && ` · Extractable: ${(chunk.extractableContentRatio * 100).toFixed(1)}%`}
                        </div>
                        {expandedChunks.has(idx) && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              {chunk.text}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extractability */}
      {scanResult?.extractability && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🔄 Extractability</h3>
            <Tooltip content="How easily AI systems can extract and process your content. Considers HTML structure, rendering method, and content accessibility.">
              <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          {/* Example Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowExtractabilityExample(!showExtractabilityExample)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {showExtractabilityExample ? '▼' : '▶'} See Example
            </button>
            {showExtractabilityExample && (
              <div className="mt-3 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">✓ Good Extractability - Static HTML:</div>
                    <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded text-sm font-mono">
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400">&lt;article&gt;</span><br />
                        <span className="ml-4"><span className="text-blue-600 dark:text-blue-400">&lt;h1&gt;</span>Product Features<span className="text-blue-600 dark:text-blue-400">&lt;/h1&gt;</span></span><br />
                        <span className="ml-4"><span className="text-blue-600 dark:text-blue-400">&lt;p&gt;</span>Our CRM increases sales by 25%<span className="text-blue-600 dark:text-blue-400">&lt;/p&gt;</span></span><br />
                        <span className="text-blue-600 dark:text-blue-400">&lt;/article&gt;</span>
                      </div>
                      <p className="text-green-600 dark:text-green-300 mt-2 text-xs">✓ AI can immediately read and understand the content</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">❌ Low Extractability (30-):</div>
                    <div className="bg-red-50 dark:bg-red-900/50 p-3 rounded text-sm space-y-2">
                      <div className="font-mono text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400">&lt;div id="app"&gt;</span><span className="text-blue-600 dark:text-blue-400">&lt;/div&gt;</span><br />
                        <span className="text-gray-500 dark:text-gray-400">// Content loaded via JavaScript</span>
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-300">❌ AI sees empty page, misses all content</div>
                      <div className="border-t border-red-200 dark:border-red-700 pt-2 mt-2">
                        <div className="font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-blue-600 dark:text-blue-400">&lt;img src="features.png"&gt;</span>
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-300">❌ Text in image without alt text - AI can't read it</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {scanResult.extractability.score.extractabilityScore}/100
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Server-Rendered</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {scanResult.extractability.score.serverRenderedPercent}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Text Extractable</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {scanResult.extractability.contentTypes.text.percentage}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Images Extractable</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {scanResult.extractability.contentTypes.images.percentage}%
              </div>
            </div>
          </div>

          {/* Content Type Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {Object.entries(scanResult.extractability.contentTypes).map(([type, data]: [string, any]) => (
              <div key={type} className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize mb-2">{type}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Extractable:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{data.extractable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Details */}
      {scanResult?.scoring && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📊 Technical Scoring</h3>
            <Tooltip content="Comprehensive technical score based on all AI readiness checks including accessibility, structure, and metadata quality.">
              <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
            </Tooltip>
          </div>

          {/* Example Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowTechnicalScoringExample(!showTechnicalScoringExample)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {showTechnicalScoringExample ? '▼' : '▶'} See What Improves Your Score
            </button>
            {showTechnicalScoringExample && (
              <div className="mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">✓ High Score Elements:</div>
                    <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Semantic HTML:</div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mt-1">
                          &lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;article&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Heading Hierarchy:</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">H1 → H2 → H3 (logical order)</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Alt Text:</div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          &lt;img alt="Dashboard metrics"&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Schema.org Data:</div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          JSON-LD structured data
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">❌ Low Score Elements:</div>
                    <div className="bg-red-50 dark:bg-red-900/50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Generic Tags:</div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mt-1">
                          &lt;div&gt;, &lt;span&gt; for everything
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Poor Headings:</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Multiple H1s, skipping levels</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">Missing Alt Text:</div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          &lt;img src="chart.png"&gt;
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">No Metadata:</div>
                        <div className="text-gray-600 dark:text-gray-400 text-xs">Missing titles, descriptions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {scanResult.scoring.overallScore}/100
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Metadata Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {scanResult.scoring.grade}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Content Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {scanResult.scoring.totalIssues}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          {scanResult.scoring.categoryScores && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Category Breakdown</h4>
                <Tooltip content="Individual scores for each AI readiness category:\n\n• Content Quality: Text clarity, structure, readability\n• Technical: HTML structure, semantic markup\n• Crawlability: robots.txt, sitemaps, canonical URLs\n• Knowledge Graph: Schema.org data, JSON-LD\n• Accessibility: ARIA labels, alt text, keyboard navigation">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(scanResult.scoring.categoryScores).map(([category, data]: [string, any]) => {
                  // Handle both formats: direct score or object with score property
                  const scoreValue = typeof data === 'number' ? data : (data?.score || 0);
                  const categoryCode = typeof data === 'object' && data?.category ? data.category : category;
                  const categoryInfo = categoryDescriptions[categoryCode] || { 
                    name: categoryCode, 
                    description: `Score for ${categoryCode} category` 
                  };
                  
                  return (
                    <div key={category} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {categoryCode}
                          </span>
                          <Tooltip content={
                            <div className="text-xs">
                              <div className="font-semibold mb-1">{categoryInfo.name}</div>
                              <div>{categoryInfo.description}</div>
                            </div>
                          }>
                            <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ⓘ</span>
                          </Tooltip>
                        </div>
                        <span className={`text-lg font-bold ${
                          scoreValue >= 90 ? 'text-blue-600 dark:text-blue-400' :    // Excellent (low risk)
                          scoreValue >= 75 ? 'text-yellow-600 dark:text-yellow-400' :  // Good (medium risk)
                          scoreValue >= 60 ? 'text-orange-600 dark:text-orange-400' :  // Fair (high risk)
                          'text-red-600 dark:text-red-400'                          // Poor (critical risk)
                        }`}>
                          {Math.round(scoreValue)}/100
                        </span>
                      </div>
                      {typeof data === 'object' && data?.issueCount !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {data.issueCount} {data.issueCount === 1 ? 'issue' : 'issues'}
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
