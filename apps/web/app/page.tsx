'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { ModelConfig } from '../components/ModelSelector';
import OverviewTab from '../components/tabs/OverviewTab';
import AIUnderstandingTab from '../components/tabs/AIUnderstandingTab';
import HallucinationTab from '../components/tabs/HallucinationTab';
import MessageAlignmentTab from '../components/tabs/MessageAlignmentTab';
import IssuesTab from '../components/tabs/IssuesTab';
import TechnicalTab from '../components/tabs/TechnicalTab';
import ShareButton from '../components/ShareButton';
import HeroSection from '../components/HeroSection';
import AuditForm from '../components/AuditForm';
import ScoreDisplay from '../components/ScoreDisplay';
import ScoringGuide from '../components/ScoringGuide';
import WarningModal from '../components/WarningModal';
import InterpretationBanner from '../components/InterpretationBanner';
import PrivacyNotice from '../components/PrivacyNotice';
import QuickWinsSection from '../components/QuickWinsSection';
import SamplePreview from '../components/SamplePreview';
import LoadingProgress from '../components/LoadingProgress';
import RecentScans, { saveRecentScan } from '../components/RecentScans';
import FAQ from '../components/FAQ';
import { trackEvent } from '../components/Analytics';
import 'react-tooltip/dist/react-tooltip.css';

function HomeContent() {
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
  const [enableLLM, setEnableLLM] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState<{ message: string; details?: string } | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'complex'>('simple');
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  });

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
      const params = new URLSearchParams({ url: domain });
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
    <div className="min-h-screen flex flex-col bg-[#050505] text-white transition-colors duration-300 selection:bg-white selection:text-black overflow-x-hidden">
      {/* Background Gradients */}
      {!reportData && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-8 flex-1 relative z-10">
        {/* Header with View Toggle */}
        <div className="text-center mb-12 sm:mb-20 relative">
          {/* Main Hero */}
          {!reportData && (
            <div className="max-w-4xl mx-auto pt-24 sm:pt-32 pb-6 text-center space-y-12">
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center gap-6 mb-8">
                  <div className="relative">
                    <span className="text-4xl">🏮</span>
                    {loading && (
                      <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                    )}
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">AI Lighthouse</h1>
                </div>
                <p className="text-xl text-white/40 font-light max-w-2xl mx-auto leading-relaxed">
                  Analyze how AI systems like ChatGPT, Perplexity, and search engines understand your website
                </p>
              </div>
            </div>
          )}

          {/* Compact header when results shown */}
          {reportData && (
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏮</span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    AI Lighthouse
                  </h1>
                </div>
              </div>

              {/* View mode toggle */}
              <Tabs.Root value={viewMode} onValueChange={(value) => setViewMode(value as 'simple' | 'complex')}>
                <Tabs.List className="inline-flex items-center bg-zinc-900/50 border border-zinc-800 rounded-lg p-1">
                  <Tabs.Trigger
                    value="simple"
                    className="px-4 py-2 text-xs font-medium rounded-md transition-all text-gray-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Simple
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="complex"
                    className="px-4 py-2 text-xs font-medium rounded-md transition-all text-gray-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    Detailed
                  </Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>
            </div>
          )}
        </div>

        <AuditForm
          url={url}
          setUrl={setUrl}
          loading={loading}
          error={error}
          setError={setError}
          enableLLM={enableLLM}
          setEnableLLM={setEnableLLM}
          modelConfig={modelConfig}
          setModelConfig={setModelConfig}
          onSubmit={handleSubmit}
          onCancel={cancelAnalysis}
          hasResults={!!reportData}
          onExampleSelect={(exampleUrl) => {
            setUrl(exampleUrl);
            setViewMode('complex'); 
            setEnableLLM(true);
            setTimeout(() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }, 50);
          }}
        />

        {/* Recent scans from localStorage */}
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

        {/* Show loading progress */}
        {loading && (
          <LoadingProgress 
            currentStep={loadingStep} 
            progress={loadingProgress} 
            message={loadingMessage}
            enableLLM={enableLLM} 
          />
        )}


        {reportData && viewMode === 'simple' && (
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 animate-fade-in-up">
              {/* 1. How bad is it? */}
              <div className="text-center mb-6 sm:mb-8">
                <ScoreDisplay
                  score={Math.round(reportData.aiReadiness.overall)}
                  grade={reportData.aiReadiness.grade}
                  url={url}
                />
              </div>

              {/* 2. What's broken? */}
              {(() => {
                const weakDimensions = getWeakDimensions(reportData);
                return weakDimensions.length > 0 && (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                      <span className="text-lg sm:text-xl">⚠️</span> What's Broken
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300">
                      {weakDimensions.length === 1
                        ? `Your ${weakDimensions[0]} needs work.`
                        : `Your ${weakDimensions.join(' and ')} need work.`
                      } {interpretationMessage}
                    </p>
                  </div>
                );
              })()}

              {/* 3. What do I do first? */}
              {reportData.aiReadiness?.quickWins && reportData.aiReadiness.quickWins.length > 0 && (
                <QuickWinsSection 
                  currentScore={reportData.aiReadiness.overall}
                  quickWins={reportData.aiReadiness.quickWins}
                />
              )}

              {/* 4. Where next? */}
              <div className="mb-6">
                <button
                  onClick={() => setViewMode('complex')}
                  className="w-full py-4 px-6 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-base"
                >
                  <span>View Detailed Analysis</span>
                  <span className="text-lg">→</span>
                </button>
                <p className="text-sm text-center text-gray-600 mt-3">
                  View comprehensive reports, technical details, and advanced insights
                </p>
              </div>

              {/* Share Button */}
              <div className="flex justify-center pt-2">
                <ShareButton 
                  score={Math.round(reportData.aiReadiness.overall)} 
                  grade={reportData.aiReadiness.grade}
                  url={url}
                  enableLLM={enableLLM}
                />
              </div>
            </div>
          </div>
        )}

        {reportData && viewMode === 'complex' && (
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 animate-fade-in-up">
              {/* Header with Share Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-bold text-white">Audit Report</h2>
                <ShareButton
                  score={Math.round(reportData.aiReadiness.overall)}
                  grade={reportData.aiReadiness.grade}
                  url={url}
                  enableLLM={enableLLM}
                />
              </div>

              {/* AI Readiness Banner */}
              <ScoreDisplay
                score={Math.round(reportData.aiReadiness.overall)}
                grade={reportData.aiReadiness.grade}
                url={url}
              />

              {/* Scoring Guide Section */}
              {showScoringGuide && <ScoringGuide />}

              {/* What This Means For You - Quick Interpretation */}
              {reportData.aiReadiness && interpretationMessage && (
                <InterpretationBanner
                  score={score}
                  message={interpretationMessage}
                />
              )}

              {/* Tabs Navigation */}
              <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-8">
                  <Tabs.List className="w-full justify-start bg-transparent border-b border-white/5 h-auto p-0 mb-12 overflow-x-auto gap-6 sm:gap-8 flex scrollbar-hide">
                    <Tabs.Trigger
                      value="overview"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all"
                    >
                      Overview
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="ai-understanding"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all whitespace-nowrap"
                    >
                      AI Understanding
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="hallucination"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all whitespace-nowrap"
                    >
                      Hallucination Risk
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="alignment"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all whitespace-nowrap"
                    >
                      Message Alignment
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="issues"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all"
                    >
                      Issues
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="technical"
                      className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all"
                    >
                      Technical
                    </Tabs.Trigger>
                  </Tabs.List>
                </div>

                {/* Tab Content */}
                <Tabs.Content value="overview">
                  {reportData.aiReadiness && <OverviewTab aiReadiness={reportData.aiReadiness} />}
                </Tabs.Content>

                <Tabs.Content value="ai-understanding">
                  {reportData.scanResult && <AIUnderstandingTab scanResult={reportData.scanResult} />}
                </Tabs.Content>

                <Tabs.Content value="hallucination">
                  {reportData.scanResult && <HallucinationTab scanResult={reportData.scanResult} />}
                </Tabs.Content>

                <Tabs.Content value="alignment">
                  {reportData.scanResult && <MessageAlignmentTab scanResult={reportData.scanResult} />}
                </Tabs.Content>

                <Tabs.Content value="issues">
                  {reportData.auditReport && (
                    <IssuesTab
                      issues={reportData.auditReport.issues || []}
                      currentScore={reportData.aiReadiness?.overall}
                    />
                  )}
                </Tabs.Content>

                <Tabs.Content value="technical">
                  {reportData.scanResult && (
                    <TechnicalTab
                      scanResult={reportData.scanResult}
                      auditReport={reportData.auditReport}
                    />
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section - show when no results */}
      {!reportData && (
        <FAQ />
      )}

      {/* Warning Modal */}
      {warningMessage && (
        <WarningModal
          show={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          message={warningMessage}
        />
      )}

      {/* Privacy Notice */}
      <PrivacyNotice />

      {/* Footer */}
      <footer className="text-center py-8 sm:py-10 text-xs text-gray-700 border-t border-zinc-900 mt-auto bg-black px-4">
        <div className="flex flex-wrap justify-center items-center gap-4">
          <a
            href="#"
            className="hover:text-gray-400 uppercase tracking-widest font-semibold transition-colors text-[10px] sm:text-xs"
          >
            Settings
          </a>
          <span className="text-zinc-800">•</span>
          <a
            href="https://fayeed.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 uppercase tracking-widest font-semibold transition-colors text-[10px] sm:text-xs"
          >
            By Fayeed
          </a>
          <span className="text-zinc-800">•</span>
          <a
            href="https://github.com/fayeed/ai-lighthouse/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 uppercase tracking-widest font-semibold transition-colors text-[10px] sm:text-xs"
          >
            Report issue
          </a>
        </div>
      </footer>
  </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-pulse">🏮</div>
          <h1 className="text-2xl font-bold text-white mb-3">AI Lighthouse</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
