'use client';

import { useState, useEffect } from 'react';
import ModelSelector, { ModelConfig } from './ModelSelector';
import ScanEstimate from './ScanEstimate';
import ExampleSites from './ExampleSites';

interface AuditFormProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  enableLLM: boolean;
  setEnableLLM: (enable: boolean) => void;
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  hasResults?: boolean;
  onExampleSelect?: (url: string) => void;
}

export default function AuditForm({
  url,
  setUrl,
  loading,
  error,
  setError,
  enableLLM,
  setEnableLLM,
  modelConfig,
  setModelConfig,
  onSubmit,
  onCancel,
  hasResults = false,
  onExampleSelect
}: AuditFormProps) {
  const [isExpanded, setIsExpanded] = useState(!hasResults);
  const [scanStats, setScanStats] = useState<{ thisWeek: number; total: number } | null>(null);

  // Fetch scan stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/audit/stats`);
        const data = await res.json();
        console.log('Fetched scan stats:', data);
        if (data.success) {
          setScanStats(data.stats);
        }
      } catch (error) {
        // Silently fail - stats are not critical
      }
    };
    fetchStats();
  }, []);

  // Auto-collapse when results are first loaded
  useEffect(() => {
    if (hasResults) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasResults]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-2xl mx-auto mb-4 sm:mb-8">
      <div className={`transition-all duration-300 ease-in-out ${
        !isExpanded && hasResults ? 'mb-0' : 'mb-2 sm:mb-4'
      }`}>
        {/* Minimized state */}
        {hasResults && !isExpanded && (
          <button
            onClick={handleToggle}
            className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">🔍</span>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  Analyzing: <span className="text-blue-600 dark:text-blue-400">{url}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click to reanalyze</p>
              </div>
            </div>
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Expanded state */}
        <div className={`transition-all duration-300 ease-in-out origin-top ${
          !isExpanded && hasResults 
            ? 'opacity-0 scale-y-0 h-0 overflow-hidden' 
            : 'opacity-100 scale-y-100 h-auto'
        }`}>
          {hasResults && isExpanded && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleToggle}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
              >
                ✕ Minimize
              </button>
            </div>
          )}
          <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
            {/* Simplified URL Input with prominent CTA */}
            <div className="mb-3 sm:mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Enter your website URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="yoursite.com"
                  required
                  autoFocus
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 transition-all text-base sm:text-lg ${
                    error && error.toLowerCase().includes('url') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {loading ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCancel?.();
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all whitespace-nowrap shadow-md hover:shadow-lg text-base group"
                  >
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white group-hover:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg className="hidden group-hover:block -ml-1 mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="group-hover:hidden">Analyzing...</span>
                      <span className="hidden group-hover:inline">Cancel</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all whitespace-nowrap shadow-md hover:shadow-lg text-base"
                  >
                    {hasResults ? '🔄 Reanalyze' : '🚀 Get Free Report'}
                  </button>
                )}
              </div>
              {error && error.toLowerCase().includes('url') && (
                <p className="text-red-600 text-sm mt-1">⚠️ {error}</p>
              )}
              {!hasResults && !loading && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Free • No signup • Results in ~30 seconds
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block">
                    <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">⌘</kbd>
                    <span className="mx-0.5">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">Enter</kbd>
                    <span className="ml-1">to analyze</span>
                  </p>
                  {scanStats && scanStats.thisWeek > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span className="font-medium">{scanStats.thisWeek.toLocaleString()}</span> sites analyzed this week
                    </p>
                  )}
                </div>
              )}
              {!hasResults && onExampleSelect && (
                <ExampleSites onSelect={onExampleSelect} disabled={loading} />
              )}
            </div>

            {/* AI Analysis Toggle */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    🤖 AI-powered analysis
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">(deeper insights)</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableLLM}
                  onClick={() => setEnableLLM(!enableLLM)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    enableLLM ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      enableLLM ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              
              {enableLLM && (
                <div className="mt-3 space-y-3 animate-fade-in-up">
                  <ModelSelector value={modelConfig} onChange={setModelConfig} />
                  <ScanEstimate 
                    enableLLM={enableLLM} 
                    provider={modelConfig.provider}
                    model={modelConfig.model}
                  />
                </div>
              )}
            </div>
          </form>

          {error && !error.toLowerCase().includes('url') && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
