'use client';

import { getTokenHeatColor } from './chunkUtils';

interface TokenHeatmapProps {
  chunks: any[];
  averageTokensPerChunk: number;
  onChunkClick: (index: number) => void;
}

export default function TokenHeatmap({ chunks, averageTokensPerChunk, onChunkClick }: TokenHeatmapProps) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Token Distribution Heatmap</h4>
      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
        <div className="flex gap-0.5 h-6">
          {chunks.map((chunk, idx) => {
            const width = `${100 / chunks.length}%`;
            const color = getTokenHeatColor(chunk.tokenCount, averageTokensPerChunk);
            return (
              <div
                key={idx}
                className={`${color} transition-all hover:opacity-75 cursor-pointer`}
                style={{ width }}
                title={`Chunk ${idx + 1}: ${chunk.tokenCount} tokens`}
                onClick={() => onChunkClick(idx)}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>Chunk 1</span>
          <span>Token distribution (hover for details)</span>
          <span>Chunk {chunks.length}</span>
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500"></div>
            <span className='text-black dark:text-white'>&lt;50% avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500"></div>
            <span className='text-black dark:text-white'>50-80% avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500"></div>
            <span className='text-black dark:text-white'>80-120% avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500"></div>
            <span className='text-black dark:text-white'>120-150% avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span className='text-black dark:text-white'>&gt;150% avg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
