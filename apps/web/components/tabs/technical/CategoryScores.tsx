'use client';

import Tooltip from '../../Tooltip';
import { categoryDescriptions } from './categoryDescriptions';

interface CategoryScoresProps {
  categoryScores: Record<string, any>;
}

export default function CategoryScores({ categoryScores }: CategoryScoresProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Category Breakdown</h4>
        <Tooltip content="Individual scores for each AI readiness category:\n\n• Content Quality: Text clarity, structure, readability\n• Technical: HTML structure, semantic markup\n• Crawlability: robots.txt, sitemaps, canonical URLs\n• Knowledge Graph: Schema.org data, JSON-LD\n• Accessibility: ARIA labels, alt text, keyboard navigation">
          <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ⓘ</span>
        </Tooltip>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(categoryScores).map(([category, data]) => {
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
  );
}
