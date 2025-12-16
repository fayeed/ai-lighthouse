'use client';

import { useState } from 'react';
import ModelSelector, { ModelConfig } from '../components/ModelSelector';
import OverviewTab from '../components/tabs/OverviewTab';
import AnalysisTab from '../components/tabs/AnalysisTab';
import IssuesTab from '../components/tabs/IssuesTab';
import TechnicalTab from '../components/tabs/TechnicalTab';
import Tooltip from '../components/Tooltip';
import ThemeToggle from '../components/ThemeToggle';
import ShareButton from '../components/ShareButton';
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
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 900; // Default to 15 minutes
          const minutes = Math.ceil(retryAfter / 60);
          
          if (data.error === 'LLM rate limit exceeded') {
            throw new Error(`LLM rate limit exceeded. You can make ${minutes > 60 ? Math.ceil(retryAfter / 3600) + ' hour' : minutes + ' minute'}${minutes !== 1 && minutes <= 60 ? 's' : ''} or disable LLM features to continue.`);
          }
          
          throw new Error(`Rate limit exceeded. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
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
        <header className="text-center mb-12 relative">
          {/* Theme Toggle in top right */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          
          <h1 className="text-5xl font-bold text-blue-900 dark:text-blue-400 mb-4 animate-fade-in-up flex items-center justify-center gap-3">
            <img src="/icon.png" alt="AI Lighthouse" className="w-12 h-12" />
            AI Lighthouse
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Analyze your website AI readiness
          </p>
        </header>

        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-scale-in">
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
                'Analyze Website'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg animate-slide-in-right">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {reportData && (
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
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 text-white rounded-lg p-6 mb-8 animate-scale-in shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="text-2xl font-bold">AI Readiness Score</h3>
                  <Tooltip content="Overall score indicating how well your website is optimized for AI systems like chatbots, search engines, and voice assistants. Higher scores mean better AI comprehension and visibility.

Example impact:
• 90+ score: ChatGPT accurately answers questions about your products
• 60-90 score: Some details may be missed or misunderstood
• Below 60: AI may struggle to extract key information or hallucinate facts">
                    <span className="text-white/80 hover:text-white text-lg mt-0.5">ⓘ</span>
                  </Tooltip>
                </div>
                <div className="text-6xl font-bold mb-2 animate-pulse-subtle">
                  {Math.round(reportData.aiReadiness.overall)}/100
                </div>
                <div className="text-xl mb-3">Grade: {reportData.aiReadiness.grade}</div>
                
                {/* Scoring Guide Button */}
                <button
                  onClick={() => setShowScoringGuide(!showScoringGuide)}
                  className="text-sm text-white/90 hover:text-white underline flex items-center gap-1"
                >
                  {showScoringGuide ? '▼' : '▶'} How is this calculated?
                </button>
              </div>

              {/* Scoring Guide Section */}
              {showScoringGuide && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8 animate-fade-in-up">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Understanding Your Score & Grade</h3>
                  
                  <div className="space-y-6">
                    {/* How Score is Calculated */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">How the Score is Calculated:</h4>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">Your AI Readiness Score (0-100) is calculated by analyzing multiple dimensions of your website:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                          <li><strong>Content Quality (20%):</strong> Text clarity, structure, readability</li>
                          <li><strong>Discoverability (20%):</strong> How easily AI can find your content</li>
                          <li><strong>Extractability (20%):</strong> How easily AI can extract information</li>
                          <li><strong>Comprehensibility (15%):</strong> How well AI understands your content</li>
                          <li><strong>Trustworthiness (15%):</strong> Authority and reliability signals</li>
                          <li><strong>Technical (10%):</strong> HTML structure, semantic markup, accessibility</li>
                        </ul>
                        <p className="text-gray-700 dark:text-gray-300 mt-3">
                          Each dimension is scored based on specific checks and rules. The weighted average gives you the overall score.
                        </p>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Grade Breakdown:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                          <div className="font-bold text-blue-800 dark:text-blue-300">A (90-100)</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Excellent AI readiness. Your content is highly optimized for AI systems.</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                          <div className="font-bold text-blue-800 dark:text-blue-300">B (80-89)</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Good AI readiness. Minor improvements will maximize AI comprehension.</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded">
                          <div className="font-bold text-yellow-800 dark:text-yellow-300">C (70-79)</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Fair AI readiness. Several improvements needed for better AI understanding.</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-3 rounded">
                          <div className="font-bold text-orange-800 dark:text-orange-300">D (60-69)</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Poor AI readiness. Significant issues affecting AI comprehension.</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded md:col-span-2">
                          <div className="font-bold text-red-800">F (Below 60)</div>
                          <p className="text-sm text-gray-700 mt-1">Critical AI readiness issues. Major improvements required for AI systems to properly understand your content.</p>
                        </div>
                      </div>
                    </div>

                    {/* What This Means */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">What This Means For You:</h4>
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm text-gray-700">
                        <p>• <strong>High scores (A-B):</strong> AI chatbots like ChatGPT, Claude, and search engines can accurately answer questions about your products/services</p>
                        <p>• <strong>Medium scores (C-D):</strong> AI may miss important details or misunderstand key information</p>
                        <p>• <strong>Low scores (F):</strong> AI systems struggle to extract information and may hallucinate facts when asked about your business</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* What This Means For You - Quick Interpretation */}
              {reportData.aiReadiness && interpretationMessage && (
                  <div className={`border-l-4 rounded-lg p-4 mb-6 animate-slide-in-right ${
                    score >= 90 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' :
                    score >= 75 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500' :
                    score >= 60 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500' :
                    'bg-red-50 dark:bg-red-900/30 border-red-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {score >= 90 ? '🎉' : score >= 75 ? '⚠️' : score >= 60 ? '⚠️' : '🚨'}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">What This Means For You</h3>
                        <p className="text-gray-800 dark:text-gray-300 text-sm leading-relaxed">
                          {interpretationMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['overview', 'analysis', 'issues', 'technical'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && reportData.aiReadiness && (
                <OverviewTab aiReadiness={reportData.aiReadiness} />
              )}

              {activeTab === 'analysis' && reportData.scanResult && (
                <AnalysisTab scanResult={reportData.scanResult} />
              )}

              {activeTab === 'issues' && reportData.auditReport && (
                <IssuesTab issues={reportData.auditReport.issues || []} />
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
      {showWarningModal && warningMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowWarningModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  LLM Rate Limit Reached
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {warningMessage.message}
                </p>
                {warningMessage.details && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Details:</strong> {warningMessage.details}
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your scan completed successfully with basic features. To use AI-enhanced features, you can:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                  <li>Wait and try again later</li>
                  <li>Add credits to your LLM provider account</li>
                  <li>Use a different API key</li>
                  <li>Disable LLM features and run basic scans</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
