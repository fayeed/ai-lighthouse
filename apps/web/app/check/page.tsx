"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Cpu, Github, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import ModelSelector, { ModelConfig } from "@/components/ModelSelector";
import { trackEvent } from "@/components/Analytics";
import RecentScans, { saveRecentScan } from "@/components/RecentScans";
import FAQ from "@/components/FAQ";
import LoadingProgress from "@/components/LoadingProgress";
import Tabs from './tabs'

const CheckPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasTriggeredFromUrl = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('starting');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [interpretationMessage, setInterpretationMessage] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [enableLLM, setEnableLLM] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState<{ message: string; details?: string } | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'complex'>('simple');
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  });
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Auto-trigger analysis from URL parameter
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const aiParam = searchParams.get('ai');
    if (urlParam && !hasTriggeredFromUrl.current && !loading && !reportData) {
      hasTriggeredFromUrl.current = true;
      setUrl(urlParam);
      if (aiParam === 'true') {
        setEnableLLM(true);
      }
      // Trigger form submission after URL is set
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 100);
    }
  }, [searchParams, loading, reportData]);

  // Cancel analysis function
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

  // Auto-collapse form when results are loaded
  useEffect(() => {
    if (reportData) {
      setIsFormExpanded(false);
    } else {
      setIsFormExpanded(true);
    }
  }, [reportData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }
      // Escape to cancel analysis or reset/clear results
      if (e.key === 'Escape') {
        if (loading) {
          cancelAnalysis();
        } else if (reportData) {
          setReportData(null);
          setUrl('');
          router.replace('/', { scroll: false });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, reportData, router]);

  // Update URL when analysis completes
  const updateUrlWithResult = (analyzedUrl: string, usedLLM: boolean) => {
    // Extract domain from URL for cleaner sharing
    try {
      const domain = new URL(analyzedUrl).hostname;
      const params = new URLSearchParams({ url: `${domain}/new-page` });
      if (usedLLM) params.set('ai', 'true');
      router.replace(`?${params.toString()}`, { scroll: false });
    } catch {
      const params = new URLSearchParams({ url: analyzedUrl });
      if (usedLLM) params.set('ai', 'true');
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

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
    } catch (err) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return null;
    }
  };

  const getWeakDimensions = (data: any): string[] => {
    if (!data.aiReadiness?.dimensions) return [];
    
    const dimensionNames: Record<string, string> = {
      contentQuality: 'content clarity',
      extractability: 'extractability',
      comprehensibility: 'structure',
      discoverability: 'discoverability',
      trustworthiness: 'trust'
    };
    
    return Object.entries(data.aiReadiness.dimensions)
      .filter(([_, dim]: [string, any]) => dim.score < 70)
      .map(([name, _]) => dimensionNames[name] || name)
      .slice(0, 2);
  };

  const generateInterpretationMessage = (data: any): string => {
    if (!data.aiReadiness) return '';

    const score = Math.round(data.aiReadiness.overall);
    const issues = data.auditReport?.issues || [];
    const criticalIssues = issues.filter((i: any) => i.severity === 'critical').length;
    const highIssues = issues.filter((i: any) => i.severity === 'high').length;
    
    const dimensions = data.aiReadiness.dimensions || {};
    const weakDimensions = Object.entries(dimensions)
      .filter(([_, dim]: [string, any]) => dim.score < 70)
      .map(([name, _]) => name.replace(/([A-Z])/g, ' $1').trim().toLowerCase())
      .slice(0, 2);
    
    const quickWins = data.aiReadiness.quickWins || [];
    const easyFixes = quickWins.filter((w: any) => w.effort === 'low').slice(0, 2);
    
    let statusMessage = '';
    let detailMessage = '';
    let actionMessage = '';
    
    if (score >= 90) {
      statusMessage = `Your site is excellent – AI systems can accurately understand and extract information from your content.`;
      detailMessage = quickWins.length > 0 
        ? `You have ${quickWins.length} minor optimization${quickWins.length > 1 ? 's' : ''} available to reach perfection.`
        : `Your content is well-optimized for AI comprehension.`;
      actionMessage = `Continue maintaining high-quality, well-structured content.`;
    } else if (score >= 75) {
      statusMessage = `Your site is good, but has ${criticalIssues + highIssues > 0 ? 'some critical' : 'minor'} ${
        weakDimensions.length > 0 ? weakDimensions.join(' and ') : 'trustworthiness'
      } ${weakDimensions.length > 1 || !weakDimensions.length ? 'risks' : 'issues'}.`;
      detailMessage = easyFixes.length > 0
        ? `${easyFixes.map((f: any) => f.issue.toLowerCase()).join(' and ')} will significantly raise your score.`
        : `Addressing ${criticalIssues + highIssues} priority issue${criticalIssues + highIssues !== 1 ? 's' : ''} will improve AI understanding.`;
      actionMessage = `Focus on ${weakDimensions.length > 0 ? 'improving ' + weakDimensions[0] : 'the high-priority issues below'}.`;
    } else if (score >= 60) {
      statusMessage = `Your site has moderate AI readiness with significant ${
        weakDimensions.length > 0 ? weakDimensions.join(' and ') : 'structural'
      } issues.`;
      detailMessage = `AI systems may miss important details or misunderstand key information${
        criticalIssues > 0 ? `, especially with ${criticalIssues} critical issue${criticalIssues !== 1 ? 's' : ''}` : ''
      }.`;
      actionMessage = easyFixes.length > 0
        ? `Start with ${easyFixes[0].issue.toLowerCase()} for quick improvement.`
        : `Prioritize fixing critical and high-severity issues.`;
    } else {
      statusMessage = `Your site has critical AI readiness issues affecting ${
        weakDimensions.length > 0 ? weakDimensions.join(', ') : 'multiple dimensions'
      }.`;
      detailMessage = `AI systems will struggle to extract accurate information and may hallucinate facts about your business.`;
      actionMessage = `Immediate action required: ${
        data.aiReadiness.roadmap?.immediate?.[0]?.replace(/^[🔴🟠🟡🔵]\s*/, '') || 
        'Address the critical issues listed below'
      }.`;
    }
    
    return `AI Readiness: ${score}/100 – ${statusMessage} ${detailMessage} ${actionMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      return;
    }

    if (validatedUrl !== url) {
      setUrl(validatedUrl);
    }

    setLoading(true);
    setLoadingStep('starting');
    setLoadingProgress(0);
    setLoadingMessage('Starting analysis...');
    setReportData(null);

    // Track the analyze event
    trackEvent.analyzeWebsite(
      validatedUrl,
      enableLLM,
      enableLLM ? modelConfig.provider : undefined,
      enableLLM ? modelConfig.model : undefined
    );

    try {
      const requestBody: any = {
        url: validatedUrl,
        enableLLM,
        minImpactScore: 5,
      };

      if (enableLLM) {
        requestBody.llmProvider = modelConfig.provider;
        requestBody.llmModel = modelConfig.model;
        
        if (modelConfig.provider === 'ollama') {
          requestBody.llmBaseUrl = modelConfig.baseUrl || 'http://localhost:11434';
        } else if (modelConfig.apiKey) {
          requestBody.llmApiKey = modelConfig.apiKey;
        }
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Use SSE streaming endpoint for real-time progress
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/audit/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start audit');
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
                setLoadingStep(event.step);
                setLoadingProgress(event.progress);
                setLoadingMessage(event.message || '');
              } else if (event.type === 'complete') {
                const data = event.data;
                
                if (data.warning) {
                  setWarningMessage({
                    message: data.warning.message,
                    details: data.warning.details
                  });
                  setShowWarningModal(true);
                }

                const interpretation = generateInterpretationMessage(data.data);
                setInterpretationMessage(interpretation);
                setReportData(data.data);
                const finalScore = Math.round(data.data.aiReadiness.overall);
                setScore(finalScore);
                
                // Save to recent scans
                saveRecentScan(validatedUrl, finalScore, data.data.aiReadiness.grade);
                
                // Update URL for deep linking
                updateUrlWithResult(validatedUrl, enableLLM);
                
                trackEvent.analyzeComplete(validatedUrl, finalScore, enableLLM);
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
      // Don't show error for user-initiated cancellation
      if (err.name === 'AbortError') {
        return;
      }
      const errorMessage = err.message || 'An error occurred during the audit';
      setError(errorMessage);
      
      // Track error
      trackEvent.analyzeError(validatedUrl, errorMessage, enableLLM);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <main className="container mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Logo & Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-8">
              <div className="relative">
                <span className="text-4xl">🏮</span>
                {loading && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"
                  />
                )}
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">AI Lighthouse</h1>
            </div>
            <p className="text-xl text-white/40 font-light max-w-2xl mx-auto leading-relaxed">
              Analyze how AI systems like ChatGPT, Perplexity, and search engines understand your website
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Minimized state when results are present */}
            {reportData && !isFormExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsFormExpanded(true)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg p-5 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 flex items-center justify-between group cursor-pointer"
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
                      setIsFormExpanded(true);
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
              </motion.div>
            )}

            {/* Expanded form */}
            {(!reportData || isFormExpanded) && (
              <div className="space-y-6">
                {reportData && isFormExpanded && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsFormExpanded(false)}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      ✕ Minimize
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          placeholder="https://yoursite.com"
                          value={url}
                          onChange={(e) => {
                            setUrl(e.target.value);
                            setError('');
                          }}
                          className="h-16 bg-white/[0.02] border-white/10 rounded-xl px-6 text-lg focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/10 text-white"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className={`h-16 px-10 rounded-xl font-bold transition-all ${loading ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:bg-white/90'}`}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            >
                              <Clock className="w-4 h-4" />
                            </motion.div>
                            Analyzing...
                          </div>
                        ) : reportData ? "Reanalyze" : "Analyze"}
                      </Button>
                    </div>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm px-2"
                      >
                        {error}
                      </motion.div>
                    )}
                  </div>
                </form>

                {!loading && !reportData && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">
                      Free • No signup • Results in ~30 seconds
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Or try an example:</span>
                      <div className="flex gap-2">
                        {["Stripe", "Linear", "Notion"].map((site) => (
                          <button
                            key={site}
                            type="button"
                            onClick={() => setUrl("https://" + site.toLowerCase() + ".com")}
                            className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all"
                          >
                            {site}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI-powered Configuration - Show when form is expanded */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4 pt-6 border-t border-white/5"
                >
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-white/40" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-white/80">AI-powered analysis</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">(enabled by default - deeper insights)</p>
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
              </div>
            )}
          </motion.div>

          {/* Loading & Results Sections */}
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Loading State Container */}
            {loading && (
              <LoadingProgress 
                currentStep={loadingStep} 
                progress={loadingProgress} 
                message={loadingMessage}
                enableLLM={enableLLM} 
              />
            )}

            {/* Recent Scans (only if not analyzing) */}
            {!reportData && !loading && (
              <RecentScans 
                onSelect={(recentUrl) => {
                  setUrl(recentUrl);
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }, 50);
                }}
                currentUrl={url}
              />
            )}
          </div>

            <Tabs
              reportData={reportData}
              interpretationMessage={interpretationMessage}
              score={score}
              enableLLM={enableLLM}
            />
          {/* FAQ Section */}
          <FAQ />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2"><Github className="w-3 h-3" /> GitHub</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">By Fayed</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Report Issue</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/10">Made with ❤️ in India</p>
        </div>
      </footer>
    </div>
  );
};

export default function CheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Clock className="w-8 h-8 text-white/40 mx-auto" />
          </motion.div>
          <p className="text-white/40">Loading...</p>
        </div>
      </div>
    }>
      <CheckPageContent />
    </Suspense>
  );
}
