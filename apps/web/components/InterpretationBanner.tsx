interface InterpretationBannerProps {
  score: number;
  message: string;
}

export default function InterpretationBanner({ score, message }: InterpretationBannerProps) {
  return (
    <div className={`border-l-4 rounded-lg p-4 mb-6 animate-slide-in-right ${
      score >= 90 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' :
      score >= 75 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500' :
      score >= 60 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500' :
      'bg-red-50 dark:bg-red-900/30 border-red-500'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {score >= 90 ? '🎉' : score >= 75 ? '⚠️' : score >= 60 ? '⚠️' : '🚨'}
        </span>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">What This Means For You</h3>
          <p className="text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
