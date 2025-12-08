interface OverviewTabProps {
  aiReadiness: any;
}

export default function OverviewTab({ aiReadiness }: OverviewTabProps) {
  return (
    <div>
      {/* Dimensions */}
      {aiReadiness.dimensions && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Dimension Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(aiReadiness.dimensions).map(([key, dim]: [string, any]) => (
              <div key={key} className="bg-gray-50 border-l-4 border-blue-500 rounded-lg p-4">
                <div className="font-semibold text-lg text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-3xl font-bold text-blue-600 my-2">
                  {Math.round(dim.score)}/100
                </div>
                <div className="text-sm text-gray-600 capitalize">{dim.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {aiReadiness.quickWins && aiReadiness.quickWins.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">⚡ Quick Wins</h3>
          <div className="space-y-4">
            {aiReadiness.quickWins.slice(0, 5).map((win: any, idx: number) => (
              <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <div className="font-semibold text-gray-900">{win.issue}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Impact: {win.impact} · Effort: {win.effort}
                </div>
                <div className="text-sm text-green-700 mt-2">→ {win.fix}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
