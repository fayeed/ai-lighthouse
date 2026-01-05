'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import ThemeToggle from '../components/ThemeToggle';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-8 flex-1">
        {/* Header with View Toggle */}
        <div className="text-center mb-4 sm:mb-6 relative">
          {/* Theme toggle - absolute on mobile, in flow on desktop */}
          <div className="absolute right-0 top-0 sm:hidden">
            <ThemeToggle />
          </div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <div className="hidden sm:block flex-1"></div>
            <div className="flex-1 text-center pt-1 sm:pt-0">
              <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                🚨 AI Lighthouse
              </h1>
            </div>
            <div className="hidden sm:flex flex-1 justify-end gap-3">
              <ThemeToggle />
              {reportData && (
                <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
                  <button
                    onClick={() => setViewMode('simple')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'simple'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setViewMode('complex')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'complex'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile view toggle - only show on mobile when there are results */}
          {reportData && (
            <div className="sm:hidden flex justify-center mb-2">
              <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
                <button
                  onClick={() => setViewMode('simple')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'simple'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setViewMode('complex')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'complex'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          )}
          
          {/* Value proposition - only show before results */}
          {!reportData && (
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
              Analyze how AI systems like ChatGPT, Perplexity, and search engines understand your website.
            </p>
          )}
          
          {reportData && (
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
              Results for <strong className="text-blue-600 dark:text-blue-400 break-all">{url}</strong>
            </p>
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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 animate-fade-in-up">
              {/* 1. How bad is it? */}
              <div className="text-center mb-4 sm:mb-6">
                <ScoreDisplay
                  score={Math.round(reportData.aiReadiness.overall)}
                  grade={reportData.aiReadiness.grade}
                  showScoringGuide={showScoringGuide}
                  setShowScoringGuide={setShowScoringGuide}
                />
                {showScoringGuide && <ScoringGuide />}
              </div>

              {/* 2. What's broken? */}
              {(() => {
                const weakDimensions = getWeakDimensions(reportData);
                return weakDimensions.length > 0 && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 flex items-center gap-2">
                      <span className="text-lg sm:text-xl">⚠️</span> What's Broken
                    </h3>
                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200">
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
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => setViewMode('complex')}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
                >
                  <span>See Detailed Analysis</span>
                  <span className="text-xl sm:text-2xl">→</span>
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-8 animate-fade-in-up">
              {/* Header with Share Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Report</h2>
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
                showScoringGuide={showScoringGuide}
                setShowScoringGuide={setShowScoringGuide}
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
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 -mx-3 sm:-mx-4 px-3 sm:px-4 md:-mx-8 md:px-8 -mt-4 pt-4">
                <nav className="-mb-px flex space-x-1 sm:space-x-8 overflow-x-auto scrollbar-hide pb-px">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'ai-understanding', label: 'AI Understanding' },
                    { key: 'hallucination', label: 'Hallucination Risk' },
                    { key: 'alignment', label: 'Message Alignment' },
                    { key: 'issues', label: 'Issues' },
                    { key: 'technical', label: 'Technical' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      } whitespace-nowrap py-2.5 px-2 sm:px-1 sm:py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 rounded-t-lg sm:rounded-none`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && reportData.aiReadiness && (
                <OverviewTab aiReadiness={reportData.aiReadiness} />
              )}

              {activeTab === 'ai-understanding' && reportData.scanResult && (
                <AIUnderstandingTab scanResult={reportData.scanResult} />
              )}

              {activeTab === 'hallucination' && reportData.scanResult && (
                <HallucinationTab scanResult={reportData.scanResult} />
              )}

              {activeTab === 'alignment' && reportData.scanResult && (
                <MessageAlignmentTab scanResult={reportData.scanResult} />
              )}

              {activeTab === 'issues' && reportData.auditReport && (
                <IssuesTab 
                  issues={reportData.auditReport.issues || []} 
                  currentScore={reportData.aiReadiness?.overall}
                />
              )}

              {activeTab === 'technical' && reportData.scanResult && (
                <TechnicalTab 
                  scanResult={reportData.scanResult}
                  auditReport={reportData.auditReport}
                />
              )}
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
      <footer className="text-center py-6 sm:py-8 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4">
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-3">
          <a 
            href="https://github.com/fayeed/ai-lighthouse" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 py-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span className="hidden xs:inline">Star on GitHub</span>
            <span className="xs:hidden">GitHub</span>
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a 
            href="https://fayeed.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 py-1"
          >
            By Fayeed
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a 
            href="https://github.com/fayeed/ai-lighthouse/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 py-1"
          >
            Report issue
          </a>
        </div>
        <p>Made with ❤️ in India</p>
      </footer>
  </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-pulse">🚨</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI Lighthouse</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
