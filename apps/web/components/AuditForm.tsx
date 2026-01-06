'use client';

import { useState, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';
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
    <div className="max-w-3xl mx-auto mb-4 sm:mb-8">
      <div className={`transition-all duration-300 ease-in-out ${
        !isExpanded && hasResults ? 'mb-0' : 'mb-2 sm:mb-4'
      }`}>
        {/* Minimized state */}
        {hasResults && !isExpanded && (
          <button
            onClick={handleToggle}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">🔍</span>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Analyzing: <span className="text-teal-400">{url}</span>
                </p>
                <p className="text-xs text-gray-400">Click to reanalyze</p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" 
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
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                ✕ Minimize
              </button>
            </div>
          )}
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
            {/* Simplified URL Input with prominent CTA */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className={`flex-1 px-6 py-4 border rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white bg-black/50 border-zinc-800 transition-all text-base placeholder:text-gray-600 ${
                    error && error.toLowerCase().includes('url') ? 'border-red-500' : 'border-zinc-800'
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
                    className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-medium py-4 px-8 rounded-xl transition-all whitespace-nowrap text-base group"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 group-hover:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg className="hidden group-hover:block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="group-hover:hidden">Analyzing...</span>
                      <span className="hidden group-hover:inline">Cancel</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-white hover:bg-gray-100 text-black font-medium py-4 px-8 rounded-xl transition-all whitespace-nowrap text-base"
                  >
                    {hasResults ? 'Reanalyze' : 'Analyze'}
                  </button>
                )}
              </div>
              {error && error.toLowerCase().includes('url') && (
                <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>
              )}
              {!hasResults && !loading && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Free • No signup • Results in ~30 seconds
                  </p>
                  {scanStats && scanStats.thisWeek > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-medium text-gray-500">{scanStats.thisWeek.toLocaleString()}</span> sites analyzed this week
                    </p>
                  )}
                </div>
              )}
              {!hasResults && onExampleSelect && (
                <ExampleSites onSelect={onExampleSelect} disabled={loading} />
              )}
            </div>

            {/* AI Analysis Toggle */}
            <div className="pt-8 border-t border-zinc-900/50">
              <label className="flex items-center justify-between cursor-pointer group p-4 rounded-xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <span className="text-sm font-medium text-white block">
                      AI-powered analysis
                    </span>
                    <span className="text-xs text-gray-500">(deeper insights)</span>
                  </div>
                </div>
                <Switch.Root
                  checked={enableLLM}
                  onCheckedChange={setEnableLLM}
                  className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-black data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-zinc-800"
                >
                  <Switch.Thumb className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1" />
                </Switch.Root>
              </label>

              {enableLLM && (
                <div className="mt-4 space-y-4 animate-fade-in-up p-4 bg-white/5 rounded-xl border border-zinc-900">
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
            <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
