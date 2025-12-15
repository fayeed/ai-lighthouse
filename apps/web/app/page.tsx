'use client';

import { useState } from 'react';
import ModelSelector, { ModelConfig } from '../components/ModelSelector';
import OverviewTab from '../components/tabs/OverviewTab';
import AnalysisTab from '../components/tabs/AnalysisTab';
import IssuesTab from '../components/tabs/IssuesTab';
import TechnicalTab from '../components/tabs/TechnicalTab';
import Tooltip from '../components/Tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [enableLLM, setEnableLLM] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScoringGuide, setShowScoringGuide] = useState(false);
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
        throw new Error(data.error || 'Audit failed');
      }

      setReportData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            🚨 AI Lighthouse
          </h1>
          <p className="text-xl text-gray-700">
            Analyze your website AI readiness
          </p>
        </header>

        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable AI-powered analysis (LLM)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
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
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {reportData && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Audit Report</h2>
              
              {/* AI Readiness Banner */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 mb-8">
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
                <div className="text-6xl font-bold mb-2">
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
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Understanding Your Score & Grade</h3>
                  
                  <div className="space-y-6">
                    {/* How Score is Calculated */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">How the Score is Calculated:</h4>
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                        <p className="text-gray-700">Your AI Readiness Score (0-100) is calculated by analyzing multiple dimensions of your website:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                          <li><strong>Content Quality (20%):</strong> Text clarity, structure, readability</li>
                          <li><strong>Discoverability (20%):</strong> How easily AI can find your content</li>
                          <li><strong>Extractability (20%):</strong> How easily AI can extract information</li>
                          <li><strong>Comprehensibility (15%):</strong> How well AI understands your content</li>
                          <li><strong>Trustworthiness (15%):</strong> Authority and reliability signals</li>
                          <li><strong>Technical (10%):</strong> HTML structure, semantic markup, accessibility</li>
                        </ul>
                        <p className="text-gray-700 mt-3">
                          Each dimension is scored based on specific checks and rules. The weighted average gives you the overall score.
                        </p>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Grade Breakdown:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                          <div className="font-bold text-green-800">A (90-100)</div>
                          <p className="text-sm text-gray-700 mt-1">Excellent AI readiness. Your content is highly optimized for AI systems.</p>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <div className="font-bold text-blue-800">B (80-89)</div>
                          <p className="text-sm text-gray-700 mt-1">Good AI readiness. Minor improvements will maximize AI comprehension.</p>
                        </div>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                          <div className="font-bold text-yellow-800">C (70-79)</div>
                          <p className="text-sm text-gray-700 mt-1">Fair AI readiness. Several improvements needed for better AI understanding.</p>
                        </div>
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                          <div className="font-bold text-orange-800">D (60-69)</div>
                          <p className="text-sm text-gray-700 mt-1">Poor AI readiness. Significant issues affecting AI comprehension.</p>
                        </div>
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded md:col-span-2">
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

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['overview', 'analysis', 'issues', 'technical'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
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
                <TechnicalTab scanResult={reportData.scanResult} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
