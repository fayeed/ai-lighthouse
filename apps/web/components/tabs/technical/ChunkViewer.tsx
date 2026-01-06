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
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-lg">💡</span>
            <div>
              <div className="font-semibold text-yellow-400 mb-1">Chunking Recommendation</div>
              <div className="text-sm text-gray-300">
                Your page is using paragraph-based chunking because no heading structure was detected.
                Consider adding <code className="bg-yellow-500/20 px-1 rounded text-yellow-300">H2</code>, <code className="bg-yellow-500/20 px-1 rounded text-yellow-300">H3</code>, etc.
                headings to create semantic sections. This will improve AI comprehension and chunk quality.
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-300">Chunk Viewer</h4>
        <button
          onClick={() => setCombinedView(!combinedView)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            combinedView
              ? 'bg-teal-500 text-white hover:bg-teal-600'
              : 'bg-zinc-800 text-gray-300 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          {combinedView ? '📋 Combined View' : '📑 Individual View'}
        </button>
      </div>

      {combinedView ? (
        <div className="bg-zinc-900/50 p-4 rounded border border-zinc-700 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
          <div className="prose prose-sm max-w-none">
            {chunks.map((chunk, idx) => (
              <div key={idx} className="bg-zinc-800/50 border-l-4 border-teal-500 pl-3 pr-3 py-2 mb-4 rounded">
                <div className="text-xs font-semibold text-teal-400 mb-2">
                  Chunk #{idx + 1} ({chunk.tokenCount} tokens)
                </div>
                <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {chunk.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
          {chunks.map((chunk, idx) => {
            const chunkQuality = getChunkQuality(chunk);
            return (
              <div key={idx} className="bg-zinc-800 p-3 rounded border border-zinc-700">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-white">
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
                    <span className="text-xs text-gray-400">{chunk.tokenCount} tokens</span>
                    <button
                      onClick={() => toggleChunk(idx)}
                      className="text-xs text-teal-400 hover:text-teal-300"
                    >
                      {expandedChunks.has(idx) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Noise: {(chunk.noiseRatio * 100).toFixed(1)}% ·
                  Words: {chunk.wordCount || 'N/A'}
                  {chunk.extractableContentRatio && ` · Extractable: ${(chunk.extractableContentRatio * 100).toFixed(1)}%`}
                </div>
                {expandedChunks.has(idx) && (
                  <div className="mt-2 pt-2 border-t border-zinc-700">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900 bg-zinc-900 p-2 rounded">
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
