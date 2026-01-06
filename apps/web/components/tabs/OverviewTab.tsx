import Tooltip from '../Tooltip';
import QuickWinsSection from '../QuickWinsSection';

interface OverviewTabProps {
  aiReadiness: any;
}

const dimensionDescriptions: Record<string, string> = {
  technical: "How well your site's technical infrastructure supports AI crawling and content extraction (HTML structure, schema markup, etc.)",
  contentQuality: "Quality and structure of your content for AI comprehension (clarity, organization, semantic markup)",
  crawlability: "How easily AI systems can discover and access your content (robots.txt, sitemaps, canonical URLs)",
  discoverability: "How easily AI systems can find and index your content across the web",
  knowledge: "Structured data and knowledge graph implementation for better AI understanding (JSON-LD, schema.org)",
  extractability: "How easily AI can extract and parse meaningful information from your pages",
  comprehensibility: "How well AI systems can understand and interpret your content's meaning and context",
  trustworthiness: "Signals that indicate your content is reliable and authoritative to AI systems",
  accessibility: "How well your site supports assistive technologies and provides alternative content formats",
};

export default function OverviewTab({ aiReadiness }: OverviewTabProps) {
  // Helper function to get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBorderColor = (score: number) => {
    if (score >= 90) return 'border-teal-500';
    if (score >= 75) return 'border-blue-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div>
      {/* AI Perspective Section */}
      {aiReadiness.aiPerspective && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">🤖 AI Agent Perspective</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-4">
              From an AI system's viewpoint, here's what it can do with your content:
            </p>
            
            {/* Capability Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">
                  {aiReadiness.aiPerspective.canUnderstand ? '✅' : '❌'}
                </div>
                <div className="text-sm font-semibold text-white">
                  Can Understand
                </div>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">
                  {aiReadiness.aiPerspective.canExtract ? '✅' : '❌'}
                </div>
                <div className="text-sm font-semibold text-white">
                  Can Extract
                </div>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">
                  {aiReadiness.aiPerspective.canIndex ? '✅' : '❌'}
                </div>
                <div className="text-sm font-semibold text-white">
                  Can Index
                </div>
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">
                  {aiReadiness.aiPerspective.canAnswer ? '✅' : '❌'}
                </div>
                <div className="text-sm font-semibold text-white">
                  Can Answer
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Confidence Level:</span>
                <span className={`text-2xl font-bold ${getConfidenceColor(aiReadiness.aiPerspective.confidence)}`}>
                  {Math.round(aiReadiness.aiPerspective.confidence * 100)}%
                </span>
              </div>
              <div className="mt-2 bg-zinc-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    aiReadiness.aiPerspective.confidence >= 0.8
                      ? 'bg-green-500'
                      : aiReadiness.aiPerspective.confidence >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${aiReadiness.aiPerspective.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Main Blockers */}
            {aiReadiness.aiPerspective.mainBlockers && aiReadiness.aiPerspective.mainBlockers.length > 0 && (
              <div className="bg-red-500/5 border-l-4 border-red-500 rounded p-4">
                <div className="font-semibold text-white mb-2">⚠️ Main Blockers:</div>
                <ul className="list-disc list-inside space-y-1">
                  {aiReadiness.aiPerspective.mainBlockers.map((blocker: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-300">{blocker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dimensions */}
      {aiReadiness.dimensions && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Dimension Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(aiReadiness.dimensions).map(([key, dim]: [string, any]) => (
              <div key={key} className={`bg-zinc-900 border-l-4 ${getBorderColor(dim.score)} rounded-lg p-4`}>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    {dimensionDescriptions[key] && (
                      <Tooltip content={dimensionDescriptions[key]}>
                        <span className="text-gray-400 hover:text-gray-300 cursor-help text-sm">ⓘ</span>
                      </Tooltip>
                    )}
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(dim.score)} my-2`}>
                  {Math.round(dim.score)}/100
                </div>
                <div className="text-sm text-gray-400 capitalize">{dim.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {aiReadiness.quickWins && aiReadiness.quickWins.length > 0 && (
        <QuickWinsSection
          currentScore={aiReadiness.overall}
          quickWins={aiReadiness.quickWins}
        />
      )}
    </div>
  );
}
