'use client';

type EffortLevel = 'low' | 'medium' | 'high';

interface QuickWin {
  issue: string;
  impact: number;
  effort: EffortLevel;
  fix: string;
  scoreImpact: number;
  effortDescription: string;
}

interface QuickWinsSectionProps {
  currentScore: number;
  quickWins: QuickWin[];
}

export default function QuickWinsSection({ currentScore, quickWins }: QuickWinsSectionProps) {
  if (!quickWins || quickWins.length === 0) {
    return null;
  }

  // Calculate projected score from quick wins
  const totalScoreGain = quickWins.reduce((sum, qw) => sum + qw.scoreImpact, 0);
  const effectiveGain = totalScoreGain * 0.8; // 80% efficiency
  const projectedScore = Math.min(100, Math.round(currentScore + effectiveGain));

  const getEffortBadgeColor = (effort: EffortLevel): string => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getImpactColor = (impact: number): string => {
    if (impact >= 10) {
      return 'text-green-600 dark:text-green-400 font-bold';
    }
    if (impact >= 5) {
      return 'text-blue-600 dark:text-blue-400 font-semibold';
    }
    return 'text-gray-600 dark:text-gray-400 font-medium';
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">⚡</div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Quick Wins
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Do these {quickWins.length} things to go from{' '}
            <span className="font-bold text-xl">{Math.round(currentScore)}</span>
            {' '}→{' '}
            <span className="font-bold text-xl text-green-600 dark:text-green-400">
              ~{projectedScore}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quickWins.map((win, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-green-700 dark:text-green-300">
                {index + 1}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {win.issue}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-lg ${getImpactColor(win.scoreImpact)}`}>
                      +{win.scoreImpact}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEffortBadgeColor(win.effort)}`}>
                      {win.effortDescription}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border-l-4 border-blue-400 dark:border-blue-500">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    💡 How to fix:
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {win.fix}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>High-impact, low-effort improvements.</strong> These AI-identified quick wins give you the biggest score boost with minimal time investment.
          </p>
        </div>
      </div>
    </div>
  );
}
