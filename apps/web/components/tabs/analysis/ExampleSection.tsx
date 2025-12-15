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
        <div className="mt-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="space-y-3">
            {examples.map((example, idx) => (
              <div key={idx}>
                <div className={`text-sm font-semibold mb-1 ${
                  example.type === 'good' 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {example.type === 'good' ? '✓' : '❌'} {example.label}
                </div>
                <div className={`p-3 rounded text-sm ${
                  example.type === 'good' 
                    ? 'bg-green-50 dark:bg-green-900/50' 
                    : 'bg-red-50 dark:bg-red-900/50'
                }`}>
                  <p className="text-gray-700 dark:text-gray-300 italic">{example.content}</p>
                  <p className={`mt-2 text-xs ${
                    example.type === 'good' 
                      ? 'text-green-600 dark:text-green-300' 
                      : 'text-red-600 dark:text-red-300'
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
