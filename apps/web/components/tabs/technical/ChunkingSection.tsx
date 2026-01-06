'use client';

import { useState } from 'react';
import Tooltip from '../../Tooltip';
import TokenHeatmap from './TokenHeatmap';
import ChunkViewer from './ChunkViewer';

interface ChunkingData {
  chunkingStrategy: string;
  totalChunks: number;
  averageTokensPerChunk: number;
  averageNoiseRatio: number;
  chunks?: any[];
}

interface ChunkingSectionProps {
  chunking: ChunkingData;
}

export default function ChunkingSection({ chunking }: ChunkingSectionProps) {
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4">📄 Content Chunking</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800 p-3 rounded">
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
            <span>Strategy</span>
            <Tooltip content={
              chunking.chunkingStrategy === 'heading-based' 
                ? "✓ Heading-based: Your page has clear H1-H6 headings. Content is chunked by semantic sections, which is ideal for AI comprehension. Each heading creates a natural context boundary."
                : "⚠ Paragraph-based: No headings detected. Content is split by paragraphs with a token limit. Consider adding H2-H6 headings to create better semantic structure and improve AI understanding."
            }>
              <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
          <div className="font-semibold text-white">
            {chunking.chunkingStrategy}
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Total Chunks</div>
          <div className="text-2xl font-bold text-teal-400">
            {chunking.totalChunks}
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Avg Tokens/Chunk</div>
          <div className="text-2xl font-bold text-teal-400">
            {chunking.averageTokensPerChunk}
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded">
          <div className="text-sm text-gray-400">Avg Noise</div>
          <div className="text-2xl font-bold text-teal-400">
            {(chunking.averageNoiseRatio * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Token Distribution Heatmap */}
      {chunking.chunks && chunking.chunks.length > 0 && (
        <>
          <TokenHeatmap
            chunks={chunking.chunks}
            averageTokensPerChunk={chunking.averageTokensPerChunk}
            onChunkClick={toggleChunk}
          />
          <ChunkViewer
            chunks={chunking.chunks}
            chunkingStrategy={chunking.chunkingStrategy}
          />
        </>
      )}
    </div>
  );
}
