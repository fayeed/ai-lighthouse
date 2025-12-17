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

  // Don't show for basic scans
  if (!enableLLM && estimate < 10) {
    return null;
  }

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
      <span>⏱️</span>
      <span>
        {formatTime(estimate)} • {speed}
        {provider === 'openrouter' && ' (shared infrastructure)'}
      </span>
    </div>
  );
}
