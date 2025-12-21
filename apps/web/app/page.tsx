'use client';

import { useState } from 'react';
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
import { trackEvent } from '../components/Analytics';
import 'react-tooltip/dist/react-tooltip.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle actionable errors from API
        if (data.action) {
          throw new Error(`${data.message}\n\n💡 ${data.action}`);
        }
        throw new Error(data.message || data.error || 'Audit failed');
      }

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
      
      // Track successful completion
      trackEvent.analyzeComplete(validatedUrl, finalScore, enableLLM);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during the audit';
      setError(errorMessage);
      
      // Track error
      trackEvent.analyzeError(validatedUrl, errorMessage, enableLLM);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header with View Toggle */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                🚨 AI Lighthouse
              </h1>
            </div>
            <div className="flex-1 flex justify-end gap-3">
              <ThemeToggle />
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
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            See how AI understands your site — and fix what it gets wrong.
          </p>
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
          hasResults={!!reportData}
        />

        {reportData && viewMode === 'simple' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 animate-fade-in-up">
              {/* Score - Primary Focus */}
              <div className="text-center mb-6">
                <ScoreDisplay
                  score={Math.round(reportData.aiReadiness.overall)}
                  grade={reportData.aiReadiness.grade}
                  showScoringGuide={showScoringGuide}
                  setShowScoringGuide={setShowScoringGuide}
                />
                {showScoringGuide && <ScoringGuide />}
              </div>

              {/* Quick Wins - AI-identified high-impact improvements */}
              {reportData.aiReadiness?.quickWins && reportData.aiReadiness.quickWins.length > 0 && (
                <QuickWinsSection
                  currentScore={reportData.aiReadiness.overall}
                  quickWins={reportData.aiReadiness.quickWins}
                />
              )}

              {/* What This Means */}
              {interpretationMessage && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">What This Means</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{interpretationMessage}</p>
                </div>
              )}

              {/* Key Metrics */}
              {reportData.aiReadiness && reportData.aiReadiness.dimensions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Extractability</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(reportData.aiReadiness.dimensions.extractability?.score || 0)}/100
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Content Quality</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(reportData.aiReadiness.dimensions.contentQuality?.score || 0)}/100
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Discoverability</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(reportData.aiReadiness.dimensions.discoverability?.score || 0)}/100
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Comprehensibility</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(reportData.aiReadiness.dimensions.comprehensibility?.score || 0)}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Wins */}
              {reportData.aiReadiness?.quickWins && reportData.aiReadiness.quickWins.length > 0 && (
                <QuickWinsSection 
                  currentScore={reportData.aiReadiness.overall}
                  quickWins={reportData.aiReadiness.quickWins}
                />
              )}

              {/* Share Button */}
              <div className="flex justify-center pt-4">
                <ShareButton 
                  score={Math.round(reportData.aiReadiness.overall)} 
                  grade={reportData.aiReadiness.grade}
                  url={url}
                />
              </div>
            </div>
          </div>
        )}

        {reportData && viewMode === 'complex' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-fade-in-up">
              {/* Header with Share Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Report</h2>
                <ShareButton 
                  score={Math.round(reportData.aiReadiness.overall)} 
                  grade={reportData.aiReadiness.grade}
                  url={url}
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
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
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
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
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
    </div>
  );
}
