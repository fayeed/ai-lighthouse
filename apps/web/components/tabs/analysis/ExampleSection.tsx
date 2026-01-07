'use client';

import { useState } from 'react';

interface ExampleSectionProps {
  title: string;
  examples: Array<{
    label: string;
    type: 'good' | 'bad';
    content: string;
    explanation: string;
  }>;
}

export default function ExampleSection({ title, examples }: ExampleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
      >
        {isExpanded ? '▼' : '▶'} {title}
      </button>
      {isExpanded && (
        <div className="mt-3 bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <div className="space-y-3">
            {examples.map((example, idx) => (
              <div key={idx}>
                <div className={`text-sm font-semibold mb-2 ${
                  example.type === 'good'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {example.type === 'good' ? '✓' : '❌'} {example.label}
                </div>
                <div className={`p-3 rounded-lg border text-sm ${
                  example.type === 'good'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <p className="text-gray-200 italic mb-2">{example.content}</p>
                  <p className={`text-xs ${
                    example.type === 'good'
                      ? 'text-green-300'
                      : 'text-red-300'
                  }`}>
                    {example.type === 'good' ? '✓' : '⚠️'} {example.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
