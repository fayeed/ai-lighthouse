'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Cpu,
  Loader2,
  Clock,
  Sparkles,
  Globe,
  FileText,
  Settings2,
  ChevronDown,
  Layers,
  Gauge,
  Bot,
  Shield,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import ModelSelector, { ModelConfig } from '@/components/ModelSelector';
import LoadingProgress from '@/components/LoadingProgress';
import AuditReport from '../../check/tabs';
import CrawlReport from './CrawlReport';

type ScanMode = 'single' | 'crawl';

interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  maxConcurrency: number;
  crawlDelay: number;
  respectRobotsTxt: boolean;
  includeSitemap: boolean;
  excludePatterns: string[];
}

interface CrawlProgress {
  pagesScanned: number;
  totalPages: number;
  currentUrl: string;
  queueSize: number;
}

export default function DashboardScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExistingScan, setLoadingExistingScan] = useState(false);
  const [loadingStep, setLoadingStep] = useState('starting');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [interpretationMessage, setInterpretationMessage] = useState('');
  const [score, setScore] = useState(0);
  const [enableLLM, setEnableLLM] = useState(true);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  });

  // Crawl mode state
  const [scanMode, setScanMode] = useState<ScanMode>('single');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [crawlOptions, setCrawlOptions] = useState<CrawlOptions>({
    maxPages: 10,
    maxDepth: 3,
    maxConcurrency: 3,
    crawlDelay: 1000,
    respectRobotsTxt: true,
    includeSitemap: true,
    excludePatterns: [],
  });
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
  const [excludePatternInput, setExcludePatternInput] = useState('');

  // Fetch existing scan if scanId is provided
  useEffect(() => {
    const scanId = searchParams.get('scanId');
    if (!scanId || status !== 'authenticated') return;

    const fetchScan = async () => {
      setLoadingExistingScan(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/audit/scan/${scanId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to load scan');
        }

        const data = await response.json();
        if (data.result) {
          setReportData(data.result);
          // Handle score differently for crawl vs single page scans
          if (data.result.crawlResult) {
            const crawlScore = data.result.crawlResult.aggregatedScores?.overall ?? 0;
            setScore(Math.round(crawlScore));
            setInterpretationMessage(`AI Readiness: ${Math.round(crawlScore)}/100 – Site-wide analysis of ${data.result.crawlResult.pagesScanned} pages`);
          } else {
            setScore(Math.round(data.result.aiReadiness?.overall ?? 0));
            setInterpretationMessage(generateInterpretationMessage(data.result));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load scan');
      } finally {
        setLoadingExistingScan(false);
      }
    };

    fetchScan();
  }, [searchParams, status]);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/dashboard/scan');
    return null;
  }

  if (status === 'loading' || loadingExistingScan) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  const validateUrl = (urlString: string): string | null => {
    if (!urlString.trim()) {
      setError('Please enter a URL');
      return null;
    }

    let urlToValidate = urlString.trim();
    if (!urlToValidate.match(/^https?:\/\//i)) {
      urlToValidate = 'https://' + urlToValidate;
    }

    try {
      const parsedUrl = new URL(urlToValidate);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('URL must use http:// or https://');
        return null;
      }
      return urlToValidate;
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return null;
    }
  };

  const generateInterpretationMessage = (data: any): string => {
    if (!data.aiReadiness) return '';
    const scoreVal = Math.round(data.aiReadiness.overall);

    if (scoreVal >= 90) {
      return `AI Readiness: ${scoreVal}/100 – Excellent! Your site is well-optimized for AI systems.`;
    } else if (scoreVal >= 75) {
      return `AI Readiness: ${scoreVal}/100 – Good, but there's room for improvement.`;
    } else if (scoreVal >= 60) {
      return `AI Readiness: ${scoreVal}/100 – Moderate. Several areas need attention.`;
    } else {
      return `AI Readiness: ${scoreVal}/100 – Needs work. Critical issues detected.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) return;

    if (validatedUrl !== url) {
      setUrl(validatedUrl);
    }

    setLoading(true);
    setLoadingStep('starting');
    setLoadingProgress(0);
    setLoadingMessage(scanMode === 'crawl' ? 'Starting crawl...' : 'Starting analysis...');
    setReportData(null);
    setCrawlProgress(null);

    try {
      const requestBody: any = {
        url: validatedUrl,
        enableLLM,
        minImpactScore: 5,
      };

      // Add crawl-specific options
      if (scanMode === 'crawl') {
        requestBody.maxPages = crawlOptions.maxPages;
        requestBody.maxDepth = crawlOptions.maxDepth;
        requestBody.maxConcurrency = crawlOptions.maxConcurrency;
        requestBody.crawlDelay = crawlOptions.crawlDelay;
        requestBody.respectRobotsTxt = crawlOptions.respectRobotsTxt;
        requestBody.includeSitemap = crawlOptions.includeSitemap;
        if (crawlOptions.excludePatterns.length > 0) {
          requestBody.excludePatterns = crawlOptions.excludePatterns;
        }
      }

      if (enableLLM) {
        requestBody.llmProvider = modelConfig.provider;
        requestBody.llmModel = modelConfig.model;

        if (modelConfig.provider === 'ollama') {
          requestBody.llmBaseUrl = modelConfig.baseUrl || 'http://localhost:11434';
        } else if (modelConfig.apiKey) {
          requestBody.llmApiKey = modelConfig.apiKey;
        }
      }

      abortControllerRef.current = new AbortController();

      // Use different endpoint for crawl vs single page
      const endpoint = scanMode === 'crawl' ? '/api/audit/crawl' : '/api/audit/stream';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start audit');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'progress') {
                // Handle crawl-specific progress events
                if (scanMode === 'crawl') {
                  // Crawl endpoint sends different progress structure
                  if (event.pagesCompleted !== undefined || event.pageResult) {
                    setCrawlProgress({
                      pagesScanned: event.pagesCompleted || 0,
                      totalPages: event.totalPages || crawlOptions.maxPages,
                      currentUrl: event.pageResult?.url || event.currentUrl || '',
                      queueSize: event.pagesRemaining || 0,
                    });
                    const percent = event.percentComplete || 0;
                    setLoadingProgress(percent);
                    setLoadingMessage(
                      event.pageResult
                        ? `Analyzing: ${event.pageResult.url}`
                        : `Crawling... ${event.pagesCompleted || 0} pages scanned`
                    );
                    setLoadingStep('crawling');
                  }
                } else {
                  // Single page progress
                  setLoadingStep(event.step);
                  setLoadingProgress(event.progress);
                  setLoadingMessage(event.message || '');
                }
              } else if (event.type === 'complete') {
                const data = event.data;

                // Handle crawl results differently
                if (scanMode === 'crawl' && data.crawlResult) {
                  // Transform crawl result into AuditReport-compatible format
                  const crawlResult = data.crawlResult;
                  const pageResults = crawlResult.pageResults || [];
                  const successfulPages = pageResults.filter((p: any) => p.success && p.scanResult);

                  // Use the first successful page's scan result as the base for detailed data
                  const firstPageResult = successfulPages[0]?.scanResult;

                  // Aggregate SEO data across pages
                  const aggregatedSeo = firstPageResult?.seo ? {
                    ...firstPageResult.seo,
                    score: crawlResult.aggregatedScores?.seo || firstPageResult.seo.score,
                    // Aggregate links and images from siteAnalysis
                    links: crawlResult.siteAnalysis?.totalLinks || firstPageResult.seo.links,
                    images: crawlResult.siteAnalysis?.totalImages || firstPageResult.seo.images,
                  } : null;

                  const aggregatedPseo = firstPageResult?.pseo ? {
                    ...firstPageResult.pseo,
                    score: crawlResult.aggregatedScores?.pseo || firstPageResult.pseo.score,
                    schemaReadiness: {
                      ...firstPageResult.pseo.schemaReadiness,
                      schemaTypes: crawlResult.siteAnalysis?.schemaTypes || firstPageResult.pseo.schemaReadiness?.schemaTypes,
                    },
                  } : null;

                  const aggregatedAeo = firstPageResult?.aeo ? {
                    ...firstPageResult.aeo,
                    score: crawlResult.aggregatedScores?.aeo || firstPageResult.aeo.score,
                  } : null;

                  const aggregatedGeo = firstPageResult?.geo ? {
                    ...firstPageResult.geo,
                    score: crawlResult.aggregatedScores?.geo || firstPageResult.geo.score,
                    recommendations: crawlResult.siteAnalysis?.topRecommendations || firstPageResult.geo.recommendations,
                  } : null;

                  const transformedData = {
                    url: crawlResult.startUrl,
                    aiReadiness: {
                      overall: crawlResult.aggregatedScores?.overall || 0,
                      grade: crawlResult.aggregatedScores?.overall >= 90 ? 'A' :
                             crawlResult.aggregatedScores?.overall >= 80 ? 'B' :
                             crawlResult.aggregatedScores?.overall >= 70 ? 'C' :
                             crawlResult.aggregatedScores?.overall >= 60 ? 'D' : 'F',
                      dimensions: firstPageResult?.aiReadiness?.dimensions || {},
                      aiPerspective: firstPageResult?.aiReadiness?.aiPerspective || {},
                      quickWins: firstPageResult?.aiReadiness?.quickWins || [],
                    },
                    auditReport: {
                      issues: crawlResult.siteIssues || [],
                      input: { final_url: crawlResult.startUrl },
                    },
                    scanResult: {
                      seo: aggregatedSeo,
                      pseo: aggregatedPseo,
                      aeo: aggregatedAeo,
                      geo: aggregatedGeo,
                    },
                    // Crawl-specific data
                    siteAnalysis: crawlResult.siteAnalysis,
                    pageResults: crawlResult.pageResults,
                    pagesScanned: crawlResult.pagesScanned,
                    pagesFailed: crawlResult.pagesFailed,
                    isCrawlResult: true,
                  };

                  const interpretation = `AI Readiness: ${Math.round(transformedData.aiReadiness.overall)}/100 – Site-wide analysis of ${crawlResult.pagesScanned} pages`;
                  setInterpretationMessage(interpretation);
                  setReportData(transformedData);
                  setScore(Math.round(transformedData.aiReadiness.overall));
                } else {
                  // Single page result
                  const interpretation = generateInterpretationMessage(data.data || data);
                  setInterpretationMessage(interpretation);
                  setReportData(data.data || data);
                  setScore(Math.round((data.data?.aiReadiness?.overall || data.aiReadiness?.overall) ?? 0));
                }
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'An error occurred during the audit');
    } finally {
      setLoading(false);
      setCrawlProgress(null);
      abortControllerRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setLoadingProgress(0);
      setLoadingMessage('');
      setError('Analysis cancelled');
    }
  };

  console.log('Render DashboardScanPage', { reportData });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-sm">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {!reportData ? (
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-teal-400" />
                <h1 className="text-3xl font-display font-bold">AI-Powered Scan</h1>
              </div>
              <p className="text-white/40">
                Full analysis with GEO, AEO, and AI content intelligence
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Scan Mode Toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-white/[0.02] border border-white/5">
                  <button
                    type="button"
                    onClick={() => setScanMode('single')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      scanMode === 'single'
                        ? 'bg-teal-500 text-black'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Single Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('crawl')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      scanMode === 'crawl'
                        ? 'bg-teal-500 text-black'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Multi-Page Crawl
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    {scanMode === 'crawl' ? 'Starting URL' : 'Website URL'}
                  </label>
                  <Input
                    type="text"
                    placeholder="https://yoursite.com"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    className="h-14 bg-white/[0.02] border-white/10 rounded-xl px-6 text-lg"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Crawl Options */}
                <AnimatePresence>
                  {scanMode === 'crawl' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Quick Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-teal-400" />
                            <label className="text-sm font-medium text-white/80">Max Pages</label>
                          </div>
                          <select
                            value={crawlOptions.maxPages}
                            onChange={(e) =>
                              setCrawlOptions({ ...crawlOptions, maxPages: parseInt(e.target.value) })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                          >
                            <option value={5}>5 pages</option>
                            <option value={10}>10 pages</option>
                            <option value={25}>25 pages</option>
                            <option value={50}>50 pages</option>
                            <option value={100}>100 pages</option>
                          </select>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4 text-purple-400" />
                            <label className="text-sm font-medium text-white/80">Max Depth</label>
                          </div>
                          <select
                            value={crawlOptions.maxDepth}
                            onChange={(e) =>
                              setCrawlOptions({ ...crawlOptions, maxDepth: parseInt(e.target.value) })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                          >
                            <option value={1}>1 level</option>
                            <option value={2}>2 levels</option>
                            <option value={3}>3 levels</option>
                            <option value={4}>4 levels</option>
                            <option value={5}>5 levels</option>
                          </select>
                        </div>
                      </div>

                      {/* Toggle Options */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white/80">Respect robots.txt</span>
                          </div>
                          <Switch
                            checked={crawlOptions.respectRobotsTxt}
                            onCheckedChange={(checked) =>
                              setCrawlOptions({ ...crawlOptions, respectRobotsTxt: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Map className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white/80">Include sitemap URLs</span>
                          </div>
                          <Switch
                            checked={crawlOptions.includeSitemap}
                            onCheckedChange={(checked) =>
                              setCrawlOptions({ ...crawlOptions, includeSitemap: checked })
                            }
                          />
                        </div>
                      </div>

                      {/* Advanced Settings Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                      >
                        <Settings2 className="w-4 h-4" />
                        Advanced Settings
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Advanced Settings */}
                      <AnimatePresence>
                        {showAdvanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-white/40 mb-1">
                                  Concurrency (1-5)
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={5}
                                  value={crawlOptions.maxConcurrency}
                                  onChange={(e) =>
                                    setCrawlOptions({
                                      ...crawlOptions,
                                      maxConcurrency: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)),
                                    })
                                  }
                                  className="h-10 bg-white/5 border-white/10 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/40 mb-1">
                                  Crawl Delay (ms)
                                </label>
                                <Input
                                  type="number"
                                  min={500}
                                  max={10000}
                                  step={100}
                                  value={crawlOptions.crawlDelay}
                                  onChange={(e) =>
                                    setCrawlOptions({
                                      ...crawlOptions,
                                      crawlDelay: Math.min(10000, Math.max(500, parseInt(e.target.value) || 1000)),
                                    })
                                  }
                                  className="h-10 bg-white/5 border-white/10 rounded-lg"
                                />
                              </div>
                            </div>

                            {/* Exclude Patterns */}
                            <div>
                              <label className="block text-xs text-white/40 mb-1">
                                Exclude Patterns (regex, one per line)
                              </label>
                              <textarea
                                value={excludePatternInput}
                                onChange={(e) => {
                                  setExcludePatternInput(e.target.value);
                                  const patterns = e.target.value
                                    .split('\n')
                                    .map((p) => p.trim())
                                    .filter((p) => p.length > 0);
                                  setCrawlOptions({ ...crawlOptions, excludePatterns: patterns });
                                }}
                                placeholder="/admin/*&#10;/api/*&#10;*.pdf"
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 resize-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-sm font-medium text-white/80">AI-Powered Analysis</p>
                      <p className="text-xs text-white/40">GEO, AEO, content intelligence</p>
                    </div>
                  </div>
                  <Switch checked={enableLLM} onCheckedChange={setEnableLLM} />
                </div>

                {enableLLM && (
                  <ModelSelector
                    value={modelConfig}
                    onChange={setModelConfig}
                    enableLLM={enableLLM}
                    modelConfig={modelConfig}
                    provider={modelConfig.provider}
                  />
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-xl font-bold bg-teal-500 text-black hover:bg-teal-400"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 animate-spin" />
                      {scanMode === 'crawl' ? 'Crawling...' : 'Analyzing...'}
                    </div>
                  ) : (
                    scanMode === 'crawl' ? `Start Crawl (up to ${crawlOptions.maxPages} pages)` : 'Start Analysis'
                  )}
                </Button>
              </form>

              {loading && (
                <div className="mt-8">
                  {/* Crawl Progress */}
                  {scanMode === 'crawl' && crawlProgress && (
                    <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white/80">Crawl Progress</span>
                        <span className="text-sm text-teal-400">
                          {crawlProgress.pagesScanned} / {crawlProgress.totalPages || crawlOptions.maxPages} pages
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-purple-500 transition-all duration-300"
                          style={{
                            width: `${(crawlProgress.pagesScanned / (crawlProgress.totalPages || crawlOptions.maxPages)) * 100}%`,
                          }}
                        />
                      </div>
                      {crawlProgress.currentUrl && (
                        <div className="text-xs text-white/40 truncate">
                          <span className="text-white/60">Current:</span> {crawlProgress.currentUrl}
                        </div>
                      )}
                      {crawlProgress.queueSize > 0 && (
                        <div className="text-xs text-white/30 mt-1">
                          {crawlProgress.queueSize} URLs in queue
                        </div>
                      )}
                    </div>
                  )}

                  <LoadingProgress
                    currentStep={loadingStep}
                    progress={loadingProgress}
                    message={loadingMessage}
                    enableLLM={enableLLM}
                    isCrawlMode={scanMode === 'crawl'}
                  />
                  <button
                    onClick={cancelAnalysis}
                    className="mt-4 w-full text-center text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Cancel {scanMode === 'crawl' ? 'Crawl' : 'Analysis'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        ) : reportData.crawlResult ? (
          <CrawlReport data={reportData.crawlResult} enableLLM={enableLLM} />
        ) : (
          <AuditReport
            reportData={reportData}
            interpretationMessage={interpretationMessage}
            score={score}
            enableLLM={enableLLM}
          />
        )}
      </main>
    </div>
  );
}
