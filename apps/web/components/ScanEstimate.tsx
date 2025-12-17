'use client';

interface ScanEstimateProps {
  enableLLM: boolean;
  provider?: string;
  model?: string;
}

export default function ScanEstimate({ enableLLM, provider, model }: ScanEstimateProps) {
  const getEstimate = () => {
    let baseTime = 5;
    let maxTime = 15;
    let speed = '⚡ Very Fast';

    if (enableLLM) {
      // Provider-specific estimates
      if (provider === 'gemini') {
        baseTime = 8;
        maxTime = 18;
        speed = '⚡⚡⚡ Ultra Fast';
      } else if (provider === 'openai') {
        if (model?.includes('mini')) {
          baseTime = 10;
          maxTime = 20;
          speed = '⚡⚡ Very Fast';
        } else {
          baseTime = 15;
          maxTime = 30;
          speed = '⚡ Fast';
        }
      } else if (provider === 'anthropic') {
        if (model?.includes('haiku')) {
          baseTime = 12;
          maxTime = 25;
          speed = '⚡⚡ Very Fast';
        } else {
          baseTime = 20;
          maxTime = 40;
          speed = '⏱️ Moderate';
        }
      } else if (provider === 'ollama') {
        if (model?.includes('0.5b')) {
          baseTime = 5;
          maxTime = 15;
          speed = '⚡⚡ Very Fast';
        } else if (model?.includes('3b') || model?.includes('3.2')) {
          baseTime = 15;
          maxTime = 45;
          speed = '⏱️ Moderate';
        } else if (model?.includes('7b')) {
          baseTime = 30;
          maxTime = 90;
          speed = '🐌 Slow';
        } else {
          baseTime = 60;
          maxTime = 180;
          speed = '🐌🐌 Very Slow';
        }
      } else {
        // OpenRouter (free tier - shared infrastructure, can be slow)
        baseTime = 30;
        maxTime = 90;
        speed = '🐌 Slow (free tier)';
      }
    }

    const estimate = Math.round((baseTime + maxTime) / 2);
    
    return {
      min: baseTime,
      max: maxTime,
      estimate,
      speed,
    };
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  };

  const { min, max, estimate, speed } = getEstimate();

  if (!enableLLM && estimate < 10) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        ⚡ Estimated time: ~{formatTime(estimate)}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 m-4 mt-1">
      <div className="flex items-start gap-2">
        <div className="text-2xl">⏱️</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Estimated Scan Time
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {min === max ? (
              <span>~{formatTime(estimate)}</span>
            ) : (
              <span>{formatTime(min)} - {formatTime(max)} (avg: {formatTime(estimate)})</span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {speed}
            {enableLLM && (
              <>
                {' • '}
                {provider === 'ollama' 
                  ? 'Local processing (depends on your hardware)'
                  : 'Cloud AI analysis'}
              </>
            )}
          </div>
        </div>
      </div>

      {estimate > 30 && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠️ This may take a while. Consider using a faster model for quicker results.
        </div>
      )}

      {enableLLM && provider === 'ollama' && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          💡 Tip: Smaller models (0.5B-3B) are much faster for basic analysis
        </div>
      )}

      {enableLLM && provider === 'openrouter' && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Note: Free tier uses shared infrastructure - can be slow during peak times. For faster results, use OpenAI or Gemini.
        </div>
      )}
    </div>
  );
}
