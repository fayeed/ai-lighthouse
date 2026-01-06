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
      return 'text-green-400';
    }
    if (impact >= 5) {
      return 'text-teal-400';
    }
    return 'text-gray-400';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-start gap-3 mb-4 sm:mb-5">
        <div className="text-xl sm:text-2xl flex-shrink-0">⚡</div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Quick Wins
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            {quickWins.length} high-impact fixes • {' '}
            <span className="font-semibold text-white">{Math.round(currentScore)}</span>
            {' → '}
            <span className="font-semibold text-teal-400">
              ~{projectedScore}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quickWins.map((win, index) => (
          <div
            key={index}
            className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-medium text-white text-sm flex-1">
                {win.issue}
              </h4>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                <span className={`${getImpactColor(win.scoreImpact)} font-bold`}>
                  +{win.scoreImpact}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">
                  {win.effortDescription}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 border-l-2 border-l-teal-500">
              <div className="text-xs font-medium text-teal-400 mb-1">
                💡 How to fix
              </div>
              <div className="text-xs text-gray-300">
                {win.fix}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <span><strong className="text-white">High-impact, low-effort</strong> improvements identified by AI</span>
        </p>
      </div>
    </div>
  );
}
