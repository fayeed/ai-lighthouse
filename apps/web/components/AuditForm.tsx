'use client';

import { useState, useEffect } from 'react';
import ModelSelector, { ModelConfig } from './ModelSelector';
import ScanEstimate from './ScanEstimate';

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
  hasResults?: boolean;
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
  hasResults = false
}: AuditFormProps) {
  const [isExpanded, setIsExpanded] = useState(!hasResults);

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
    <div className="max-w-2xl mx-auto mb-8">
      <div className={`transition-all duration-300 ease-in-out ${
        !isExpanded && hasResults ? 'mb-0' : 'mb-4'
      }`}>
        {/* Minimized state */}
        {hasResults && !isExpanded && (
          <button
            onClick={handleToggle}
            className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
          <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
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
                placeholder="https://example.com or example.com"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 transition-all ${
                  error && error.toLowerCase().includes('url') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {error && error.toLowerCase().includes('url') && (
                <p className="text-red-600 text-sm mt-1">⚠️ {error}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableLLM}
                  onChange={(e) => setEnableLLM(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable AI-powered analysis (LLM)
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                Provides deeper insights using language models
              </p>
            </div>

            {enableLLM && (
              <div className="mb-6">
                <ModelSelector value={modelConfig} onChange={setModelConfig} />
                <ScanEstimate 
                  enableLLM={enableLLM} 
                  provider={modelConfig.provider}
                  model={modelConfig.model}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                hasResults ? 'Reanalyze Website' : 'Analyze Website'
              )}
            </button>
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
