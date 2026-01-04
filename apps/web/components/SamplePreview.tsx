'use client';

import { useState } from 'react';

export default function SamplePreview() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mx-auto"
      >
        {isExpanded ? '▼ Hide example' : '▶ What does the report show?'}
      </button>

      {isExpanded && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 animate-fade-in-up border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The report analyzes your site across several dimensions:
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">●</span>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">AI Readiness Score</span>
                <span className="text-gray-600 dark:text-gray-400"> — Overall rating of how well AI can understand your content</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">●</span>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Content Extractability</span>
                <span className="text-gray-600 dark:text-gray-400"> — Can AI systems extract your key information?</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">●</span>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Structured Data</span>
                <span className="text-gray-600 dark:text-gray-400"> — Schema.org markup, JSON-LD, and metadata</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">●</span>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Issues & Fixes</span>
                <span className="text-gray-600 dark:text-gray-400"> — Specific problems with prioritized recommendations</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
