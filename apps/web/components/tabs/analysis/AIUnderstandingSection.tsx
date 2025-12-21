'use client';

import { useState } from 'react';

interface Entity {
  name: string;
  type: string;
  relevance?: number;
}

interface FAQ {
  question: string;
  suggestedAnswer: string;
  importance?: string;
}

interface ReadingLevel {
  description: string;
}

interface ContentChunk {
  id: string;
  heading?: string;
  text: string;
  tokenCount: number;
}

interface LLMData {
  pageType?: string;
  pageTypeInsights?: string[];
  summary?: string;
  keyTopics?: string[];
  readingLevel?: ReadingLevel;
  sentiment?: string;
  technicalDepth?: string;
  topEntities?: Entity[];
  suggestedFAQ?: FAQ[];
}

interface AIUnderstandingSectionProps {
  llm: LLMData;
  chunks?: ContentChunk[];
}

export default function AIUnderstandingSection({ llm, chunks }: AIUnderstandingSectionProps) {
  const [showChunks, setShowChunks] = useState(false);
  const [showSignals, setShowSignals] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  // Extract key signals from data
  const keySignals = [];
  if (llm.pageType) keySignals.push(`Page Type: ${llm.pageType}`);
  if (llm.keyTopics?.length) keySignals.push(`Topics: ${llm.keyTopics.slice(0, 3).join(', ')}`);
  if (llm.topEntities?.length) keySignals.push(`Key Entities: ${llm.topEntities.slice(0, 3).map(e => e.name).join(', ')}`);
  
  // Detect conflicting signals (simplified for now)
  const conflicts = [];
  if (llm.sentiment === 'negative' && llm.pageType?.toLowerCase().includes('product')) {
    conflicts.push('Negative sentiment detected on a product page');
  }
  if (llm.technicalDepth === 'expert' && llm.readingLevel && parseInt(llm.readingLevel.description) < 10) {
    conflicts.push('Expert technical depth but low reading level');
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">📝 AI Understanding</h3>
      <div className="space-y-4">
        {llm.pageType && (
          <div className="mb-4">
            <strong className="text-gray-700 dark:text-gray-300">Inferred Page Type:</strong>
            <div className="mt-2">
              <span className="inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-lg font-semibold text-lg">
                {llm.pageType}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">AI's best guess based on content analysis</p>
            
            {/* LLM-Generated Page Type Insights */}
            {llm.pageTypeInsights && llm.pageTypeInsights.length > 0 && (
              <div className="mt-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <strong className="text-purple-900 dark:text-purple-200 text-sm">AI-Generated Insights for {llm.pageType}</strong>
                </div>
                <ul className="space-y-1">
                  {llm.pageTypeInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {llm.summary && (
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Summary:</strong>
            <p className="text-gray-900 dark:text-gray-100 mt-1">{llm.summary}</p>
          </div>
        )}
        
        {llm.keyTopics && llm.keyTopics.length > 0 && (
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Key Topics:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {llm.keyTopics.map((topic, idx) => (
                <span key={idx} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {llm.readingLevel && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <strong className="text-gray-700 dark:text-gray-300">Reading Level:</strong>
              <p className="text-gray-900 dark:text-gray-100">{llm.readingLevel.description}</p>
            </div>
          )}
          {llm.sentiment && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <strong className="text-gray-700 dark:text-gray-300">Sentiment:</strong>
              <p className="text-gray-900 dark:text-gray-100">{llm.sentiment}</p>
            </div>
          )}
          {llm.technicalDepth && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <strong className="text-gray-700 dark:text-gray-300">Technical Depth:</strong>
              <p className="text-gray-900 dark:text-gray-100">{llm.technicalDepth}</p>
            </div>
          )}
        </div>

        {/* Top Entities */}
        {llm.topEntities && llm.topEntities.length > 0 && (
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Key Entities:</strong>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {llm.topEntities.slice(0, 6).map((entity, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border-l-3 border-blue-400 dark:border-blue-600">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{entity.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entity.type} · {Math.round((entity.relevance || 0) * 100)}% relevance
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {llm.suggestedFAQ && llm.suggestedFAQ.length > 0 && (
          <div>
            <strong className="text-gray-700 dark:text-gray-300">Suggested FAQs:</strong>
            <div className="space-y-3 mt-2">
              {llm.suggestedFAQ.slice(0, 5).map((faq, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded border-l-4 border-yellow-400 dark:border-yellow-600">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Q: {faq.question}</div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm">A: {faq.suggestedAnswer}</div>
                  {faq.importance && (
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      faq.importance === 'high' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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

      {/* Explainability Sections */}
      <div className="mt-6 space-y-3 border-t border-blue-200 dark:border-blue-700 pt-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Why AI Thinks This:</p>
        
        {/* Chunks Section */}
        {chunks && chunks.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                <span>🧩</span>
                <span>Chunks used by AI to infer this</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({chunks.length} chunks)</span>
              </span>
              <span className="text-gray-500">{showChunks ? '▼' : '▶'}</span>
            </button>
            {showChunks && (
              <div className="p-4 bg-white dark:bg-gray-900 space-y-3 max-h-96 overflow-y-auto">
                {chunks.slice(0, 5).map((chunk, idx) => (
                  <div key={idx} className="border-l-2 border-blue-400 dark:border-blue-600 pl-3 py-2">
                    {chunk.heading && (
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {chunk.heading}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {chunk.text.substring(0, 200)}...
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {chunk.tokenCount} tokens
                    </span>
                  </div>
                ))}
                {chunks.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center pt-2">
                    + {chunks.length - 5} more chunks
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Key Signals Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSignals(!showSignals)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
              <span>🔑</span>
              <span>Key signals (headings, meta, repeated phrases)</span>
            </span>
            <span className="text-gray-500">{showSignals ? '▼' : '▶'}</span>
          </button>
          {showSignals && (
            <div className="p-4 bg-white dark:bg-gray-900">
              <ul className="space-y-2">
                {keySignals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{signal}</span>
                  </li>
                ))}
                {llm.readingLevel && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Reading Level: {llm.readingLevel.description}
                    </span>
                  </li>
                )}
                {llm.sentiment && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Sentiment: {llm.sentiment}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Conflicting Signals Section */}
        {conflicts.length > 0 && (
          <div className="border border-yellow-200 dark:border-yellow-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 flex items-center justify-between text-left transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                <span>⚠️</span>
                <span>Conflicting signals</span>
                <span className="text-xs text-yellow-700 dark:text-yellow-400">({conflicts.length})</span>
              </span>
              <span className="text-gray-500">{showConflicts ? '▼' : '▶'}</span>
            </button>
            {showConflicts && (
              <div className="p-4 bg-white dark:bg-gray-900">
                <ul className="space-y-2">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠</span>
                      <span className="text-gray-700 dark:text-gray-300">{conflict}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
