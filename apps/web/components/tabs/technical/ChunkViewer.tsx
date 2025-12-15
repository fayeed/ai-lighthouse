'use client';

import { useState } from 'react';
import Tooltip from '../../Tooltip';
import { getChunkQuality } from './chunkUtils';

interface ChunkViewerProps {
  chunks: any[];
  chunkingStrategy: string;
}

export default function ChunkViewer({ chunks, chunkingStrategy }: ChunkViewerProps) {
  const [combinedView, setCombinedView] = useState(false);
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

  return (
    <div className="mt-4">
      {/* Overall Recommendations */}
      {chunkingStrategy === 'paragraph-based' && (
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
          onClick={() => setCombinedView(!combinedView)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            combinedView
              ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {combinedView ? '📋 Combined View' : '📑 Individual View'}
        </button>
      </div>

      {combinedView ? (
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {chunks.map((chunk, idx) => (
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
          {chunks.map((chunk, idx) => {
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
  );
}
