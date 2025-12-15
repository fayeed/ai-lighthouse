'use client';

import Tooltip from '../../Tooltip';
import ExampleSection from '../analysis/ExampleSection';

interface ContentType {
  total: number;
  extractable: number;
  percentage: number;
}

interface ExtractabilityScore {
  extractabilityScore: number;
  serverRenderedPercent: number;
}

interface ExtractabilityData {
  score: ExtractabilityScore;
  contentTypes: {
    text: ContentType;
    images: ContentType;
    [key: string]: ContentType;
  };
}

interface ExtractabilitySectionProps {
  extractability: ExtractabilityData;
}

export default function ExtractabilitySection({ extractability }: ExtractabilitySectionProps) {
  const extractabilityExamples = [
    {
      label: 'Good Extractability - Static HTML:',
      type: 'good' as const,
      content: '<article>\n  <h1>Product Features</h1>\n  <p>Our CRM increases sales by 25%</p>\n</article>',
      explanation: 'AI can immediately read and understand the content'
    },
    {
      label: 'Low Extractability (30-):',
      type: 'bad' as const,
      content: '<div id="app"></div>\n// Content loaded via JavaScript',
      explanation: 'AI sees empty page, misses all content'
    }
  ];

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🔄 Extractability</h3>
        <Tooltip content="How easily AI systems can extract and process your content. Considers HTML structure, rendering method, and content accessibility.">
          <span className="text-gray-500 hover:text-gray-700 cursor-help">ⓘ</span>
        </Tooltip>
      </div>

      <ExampleSection title="See Example" examples={extractabilityExamples} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {extractability.score.extractabilityScore}/100
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Server-Rendered</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {extractability.score.serverRenderedPercent}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Text Extractable</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {extractability.contentTypes.text.percentage}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Images Extractable</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {extractability.contentTypes.images.percentage}%
          </div>
        </div>
      </div>

      {/* Content Type Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Object.entries(extractability.contentTypes).map(([type, data]) => (
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
  );
}
