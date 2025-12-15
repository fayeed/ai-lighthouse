'use client';

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
}

export default function AIUnderstandingSection({ llm }: AIUnderstandingSectionProps) {
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
    </div>
  );
}
