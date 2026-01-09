'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { Switch } from './ui/Switch';
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
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [hasResults]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-3xl mx-auto mb-4 sm:mb-8">
      <div className={`transition-all duration-300 ease-in-out ${!isExpanded && hasResults ? 'mb-0' : 'mb-2 sm:mb-4'
        }`}>
        {/* Minimized state */}
        {hasResults && !isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleToggle}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg p-5 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                <span className="text-xl">🔍</span>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-1">
                  ANALYZING TARGET
                </p>
                <p className="text-sm font-medium text-white truncate">
                  {url}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
                className="text-xs font-medium text-teal-400 hover:text-teal-300 uppercase tracking-wider px-3 py-1 rounded-md hover:bg-white/5 transition-all"
              >
                RE-ANALYZE
              </button>
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors duration-200 transform group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </motion.button>
        )}

        {/* Expanded state */}
        <div className={`transition-all duration-300 ease-in-out origin-top ${!isExpanded && hasResults
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
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
            {/* Simplified URL Input with prominent CTA */}
            <div className="mb-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col sm:flex-row gap-3">
                  <label htmlFor="url" className="sr-only">Website URL to analyze</label>
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
                    placeholder="https://yoursite.com"
                    required
                    autoFocus
                    className={`flex-1 px-6 h-16 border rounded-xl focus:ring-1 focus:ring-white/20 text-white bg-white/[0.02] border-white/10 transition-all text-lg placeholder:text-white/10 ${error && error.toLowerCase().includes('url') ? 'border-red-500' : ''
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
                      className="bg-white hover:bg-gray-100 text-black font-semibold py-3.5 px-8 rounded-xl transition-all whitespace-nowrap text-base shadow-sm"
                    >
                      {hasResults ? 'Reanalyze' : 'Analyze'}
                    </button>
                  )}
                </div>
              </div>
              {error && error.toLowerCase().includes('url') && (
                <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>
              )}
              {!hasResults && !loading && (
                <div className="mt-4 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                    FREE • NO SIGNUP • RESULTS IN ~30 SECONDS
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 pt-6 border-t border-white/5 mt-6"
            >
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white/80">AI-powered analysis</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">(deeper insights)</p>
                  </div>
                </div>
                <Switch checked={enableLLM} onCheckedChange={setEnableLLM} />
              </div>

              <ModelSelector
                value={modelConfig}
                onChange={setModelConfig}
                enableLLM={enableLLM}
                modelConfig={modelConfig}
                provider={modelConfig.provider}
              />
            </motion.div>
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
