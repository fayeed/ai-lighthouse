'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Search,
  Code,
  Bot,
  Sparkles,
  BarChart3,
  Link2,
  Image,
  Layers,
  Brain,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Target,
  Tag,
  GraduationCap,
  MessageCircle,
  Mic,
  List,
  Eye,
  Quote,
  User,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import PageReportModal from './PageReportModal';

interface CrawlReportProps {
  data: {
    // Direct crawl result structure from API
    startUrl: string;
    domain: string;
    aggregatedScores: {
      overall: number;
      seo: number;
      pseo: number;
      aeo: number;
      geo: number;
      aiReadiness: number;
    };
    siteAnalysis: {
      totalLinks: { internal: number; external: number; broken: number };
      totalImages: { total: number; withAlt: number; withoutAlt: number };
      schemaTypes: string[];
      commonIssues: { issue: string; count: number; severity: string }[];
      topRecommendations: string[];
    };
    siteIssues: any[];
    pages: any[];
    pagesScanned: number;
    pagesFailed: number;
  };
  enableLLM: boolean;
}

type TabId = 'overview' | 'seo' | 'pseo' | 'aeo' | 'geo' | 'pages' | 'issues';

export default function CrawlReport({ data, enableLLM }: CrawlReportProps) {
  console.log('CrawlReport data:', data);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [selectedPage, setSelectedPage] = useState<{ url: string; scanResult: any } | null>(null);

  const { aggregatedScores, siteAnalysis, siteIssues, pages, pagesScanned, pagesFailed, startUrl } = data;
  const successfulPages = pages?.filter((p: any) => p.success) || [];
  const failedPages = pages?.filter((p: any) => !p.success) || [];

  // Compute grade from overall score
  const overallScore = aggregatedScores?.overall || 0;
  const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const togglePage = (url: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, score: null },
    { id: 'seo', label: 'SEO', icon: Search, score: aggregatedScores?.seo },
    { id: 'pseo', label: 'PSEO', icon: Code, score: aggregatedScores?.pseo },
    ...(enableLLM ? [
      { id: 'aeo', label: 'AEO', icon: Bot, score: aggregatedScores?.aeo },
      { id: 'geo', label: 'GEO', icon: Sparkles, score: aggregatedScores?.geo },
    ] : []),
    { id: 'pages', label: `Pages (${pagesScanned})`, icon: FileText, score: null },
    { id: 'issues', label: `Issues (${siteIssues?.length || 0})`, icon: AlertTriangle, score: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 sm:p-8 rounded-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Globe className="w-4 h-4" />
              <span>Site-wide Analysis</span>
              <span className="text-white/20">•</span>
              <span>{pagesScanned} pages scanned</span>
              {pagesFailed > 0 && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-red-400">{pagesFailed} failed</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold truncate max-w-md">
              {startUrl}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Overall Score */}
            <div className={`p-4 rounded-xl border ${getScoreBg(overallScore)}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore)}
                </div>
                <div className="text-xs text-white/40 mt-1">AI Readiness</div>
              </div>
            </div>

            {/* Grade */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {grade}
              </div>
              <div className="text-xs text-white/40 mt-1">Grade</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <ScoreCard
          label="SEO"
          score={aggregatedScores?.seo || 0}
          icon={Search}
          color="teal"
        />
        <ScoreCard
          label="PSEO"
          score={aggregatedScores?.pseo || 0}
          icon={Code}
          color="purple"
        />
        {enableLLM && (
          <>
            <ScoreCard
              label="AEO"
              score={aggregatedScores?.aeo || 0}
              icon={Bot}
              color="blue"
            />
            <ScoreCard
              label="GEO"
              score={aggregatedScores?.geo || 0}
              icon={Sparkles}
              color="amber"
            />
          </>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="flex border-b border-white/5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-400 border-b-2 border-teal-400 bg-white/5'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.score !== null && tab.score !== undefined && (
                <span className={`text-xs ml-1 ${getScoreColor(tab.score)}`}>
                  {Math.round(tab.score)}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab siteAnalysis={siteAnalysis} aggregatedScores={aggregatedScores} />
          )}
          {activeTab === 'seo' && (
            <AggregatedSEOTab pages={successfulPages} aggregatedScore={aggregatedScores?.seo || 0} />
          )}
          {activeTab === 'pseo' && (
            <AggregatedPSEOTab pages={successfulPages} aggregatedScore={aggregatedScores?.pseo || 0} />
          )}
          {activeTab === 'aeo' && (
            <AggregatedAEOTab pages={successfulPages} aggregatedScore={aggregatedScores?.aeo || 0} />
          )}
          {activeTab === 'geo' && (
            <AggregatedGEOTab pages={successfulPages} aggregatedScore={aggregatedScores?.geo || 0} />
          )}
          {activeTab === 'pages' && (
            <PagesTab
              successfulPages={successfulPages}
              failedPages={failedPages}
              expandedPages={expandedPages}
              togglePage={togglePage}
              getScoreColor={getScoreColor}
              onViewFullReport={(page) => setSelectedPage({ url: page.url, scanResult: page.scanResult })}
              enableLLM={enableLLM}
            />
          )}
          {activeTab === 'issues' && (
            <IssuesTab
              issues={siteIssues || []}
              getSeverityColor={getSeverityColor}
            />
          )}
        </div>
      </motion.div>

      {/* Page Report Modal */}
      <PageReportModal
        open={selectedPage !== null}
        onClose={() => setSelectedPage(null)}
        pageData={selectedPage}
        enableLLM={enableLLM}
      />
    </div>
  );
}

function ScoreCard({
  label,
  score,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium text-white/80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{Math.round(score)}</div>
    </div>
  );
}

function OverviewTab({
  siteAnalysis,
  aggregatedScores,
}: {
  siteAnalysis: any;
  aggregatedScores: any;
}) {
  return (
    <div className="space-y-6">
      {/* Site Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Link2}
          label="Internal Links"
          value={siteAnalysis?.totalLinks?.internal || 0}
        />
        <StatCard
          icon={ExternalLink}
          label="External Links"
          value={siteAnalysis?.totalLinks?.external || 0}
        />
        <StatCard
          icon={Image}
          label="Images"
          value={siteAnalysis?.totalImages?.total || 0}
          subtitle={`${siteAnalysis?.totalImages?.withAlt || 0} with alt`}
        />
        <StatCard
          icon={Layers}
          label="Schema Types"
          value={siteAnalysis?.schemaTypes?.length || 0}
        />
      </div>

      {/* Schema Types */}
      {siteAnalysis?.schemaTypes?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">Schema Types Found</h3>
          <div className="flex flex-wrap gap-2">
            {siteAnalysis.schemaTypes.map((type: string) => (
              <Badge key={type} variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations */}
      {siteAnalysis?.topRecommendations?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">Top Recommendations</h3>
          <div className="space-y-2">
            {siteAnalysis.topRecommendations.slice(0, 5).map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <TrendingUp className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/80">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Issues */}
      {siteAnalysis?.commonIssues?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">Most Common Issues</h3>
          <div className="space-y-2">
            {siteAnalysis.commonIssues.slice(0, 5).map((issue: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-sm text-white/80">{issue.issue}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {issue.count} pages
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${
                      issue.severity === 'critical' ? 'text-red-400 border-red-500/30' :
                      issue.severity === 'high' ? 'text-orange-400 border-orange-500/30' :
                      issue.severity === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                      'text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {issue.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-white/40 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-white/30 mt-1">{subtitle}</div>}
    </div>
  );
}

function PagesTab({
  successfulPages,
  failedPages,
  expandedPages,
  togglePage,
  getScoreColor,
  onViewFullReport,
  enableLLM,
}: {
  successfulPages: any[];
  failedPages: any[];
  expandedPages: Set<string>;
  togglePage: (url: string) => void;
  getScoreColor: (score: number) => string;
  onViewFullReport: (page: any) => void;
  enableLLM: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Successful Pages */}
      {successfulPages.map((page: any) => (
        <div key={page.url} className="rounded-lg border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
            <button
              onClick={() => togglePage(page.url)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              {expandedPages.has(page.url) ? (
                <ChevronDown className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/40" />
              )}
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/80 truncate max-w-md">{page.url}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className={`text-sm font-medium ${getScoreColor(page.scanResult?.scoring?.overallScore || 0)}`}>
                {Math.round(page.scanResult?.scoring?.overallScore || 0)}
              </div>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFullReport(page);
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Full Report
              </button>
            </div>
          </div>

          {expandedPages.has(page.url) && page.scanResult && (
            <PageDetails scanResult={page.scanResult} onViewFullReport={() => onViewFullReport(page)} enableLLM={enableLLM} />
          )}
        </div>
      ))}

      {/* Failed Pages */}
      {failedPages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-red-400 mb-3">Failed Pages</h3>
          {failedPages.map((page: any) => (
            <div key={page.url} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-white/60 truncate">{page.url}</span>
              {page.error && (
                <span className="text-xs text-red-400 ml-auto">{page.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageDetails({ scanResult, onViewFullReport, enableLLM }: { scanResult: any; onViewFullReport: () => void; enableLLM: boolean }) {
  const { seo, pseo, aeo, geo, issues = [] } = scanResult;
  const meta = seo?.meta;
  const links = seo?.links;
  const images = seo?.images;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="p-4 border-t border-white/5 bg-white/[0.01] space-y-4">
      {/* View Full Report Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-xs text-white/60">
          View the complete analysis with AI-generated insights, FAQs, and detailed recommendations
        </p>
        <button
          onClick={onViewFullReport}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors whitespace-nowrap"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Full Report
        </button>
      </div>

      {/* Score Cards */}
      <div className={`grid grid-cols-2 ${enableLLM ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3`}>
        <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <div className="text-xs text-teal-400/60 mb-1">SEO</div>
          <div className={`text-lg font-bold ${getScoreColor(seo?.score || 0)}`}>
            {Math.round(seo?.score || 0)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/60 mb-1">PSEO</div>
          <div className={`text-lg font-bold ${getScoreColor(pseo?.score || 0)}`}>
            {Math.round(pseo?.score || 0)}
          </div>
        </div>
        {enableLLM && (
          <>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-blue-400/60 mb-1">AEO</div>
              <div className={`text-lg font-bold ${getScoreColor(aeo?.score || 0)}`}>
                {Math.round(aeo?.score || 0)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400/60 mb-1">GEO</div>
              <div className={`text-lg font-bold ${getScoreColor(geo?.score || 0)}`}>
                {Math.round(geo?.score || 0)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Meta & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Meta Information */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-xs text-white/40 font-medium mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Meta
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Title</span>
              <span className={meta?.title ? 'text-green-400' : 'text-red-400'}>
                {meta?.title ? `${meta.title.length} chars` : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Description</span>
              <span className={meta?.description ? 'text-green-400' : 'text-red-400'}>
                {meta?.description ? `${meta.description.length} chars` : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Canonical</span>
              <span className={meta?.hasCanonical ? 'text-green-400' : 'text-yellow-400'}>
                {meta?.hasCanonical ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-xs text-white/40 font-medium mb-2 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Links
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Internal</span>
              <span className="text-white">{links?.internal || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">External</span>
              <span className="text-white">{links?.external || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Broken</span>
              <span className={links?.broken > 0 ? 'text-red-400' : 'text-green-400'}>
                {links?.broken || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-xs text-white/40 font-medium mb-2 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" />
            Images
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Total</span>
              <span className="text-white">{images?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">With Alt</span>
              <span className="text-green-400">{images?.withAlt || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Missing Alt</span>
              <span className={images?.withoutAlt > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {images?.withoutAlt || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/40 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Issues ({issues.length})
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {issues.slice(0, 10).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 truncate">{issue.title}</div>
                  {issue.description && (
                    <div className="text-[10px] text-white/40 truncate">{issue.description}</div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] flex-shrink-0 ${
                    issue.severity === 'critical' || issue.severity === 'high'
                      ? 'text-red-400 border-red-500/30'
                      : issue.severity === 'medium'
                      ? 'text-yellow-400 border-yellow-500/30'
                      : 'text-blue-400 border-blue-500/30'
                  }`}
                >
                  {issue.severity}
                </Badge>
              </div>
            ))}
            {issues.length > 10 && (
              <div className="text-xs text-white/30 text-center py-1">
                +{issues.length - 10} more issues
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schema Types */}
      {pseo?.schemaReadiness?.schemaTypes?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/40 font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Schema Types
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pseo.schemaReadiness.schemaTypes.map((type: string) => (
              <Badge
                key={type}
                variant="outline"
                className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-400"
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IssuesTab({
  issues,
  getSeverityColor,
}: {
  issues: any[];
  getSeverityColor: (severity: string) => string;
}) {
  if (!issues || issues.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Issues Found</h3>
        <p className="text-white/40 text-sm">Your site looks great!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue: any, idx: number) => (
        <div key={idx} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${getSeverityColor(issue.severity)}`}
                >
                  {issue.severity}
                </Badge>
                {issue.affectedPages?.length > 1 && (
                  <Badge variant="outline" className="text-xs text-white/40">
                    {issue.affectedPages.length} pages
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium text-white mb-1">{issue.title}</h4>
              {issue.description && (
                <p className="text-xs text-white/40">{issue.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">Impact</div>
              <div className="text-sm font-medium text-white">{issue.impactScore || 0}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// AGGREGATED SEO TAB
// ============================================================================

function AggregatedSEOTab({ pages, aggregatedScore }: { pages: any[]; aggregatedScore: number }) {
  // Aggregate SEO data across all pages
  const aggregatedMeta = {
    withTitle: 0,
    withDescription: 0,
    withCanonical: 0,
    withOpenGraph: 0,
  };
  const aggregatedLinks = { internal: 0, external: 0, broken: 0, nofollow: 0 };
  const aggregatedImages = { total: 0, withAlt: 0, withoutAlt: 0 };
  const aggregatedHeadings: Record<string, number> = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  const pageScores: { url: string; score: number }[] = [];

  // Score breakdowns
  let totalMetaScore = 0;
  let totalHeadingsScore = 0;
  let totalLinksScore = 0;
  let totalImagesScore = 0;
  let pagesWithScores = 0;

  pages.forEach((page) => {
    const seo = page.scanResult?.seo;
    if (!seo) return;

    pageScores.push({ url: page.url, score: seo.score || 0 });
    pagesWithScores++;

    // Meta
    if (seo.meta?.title) aggregatedMeta.withTitle++;
    if (seo.meta?.description) aggregatedMeta.withDescription++;
    if (seo.meta?.hasCanonical) aggregatedMeta.withCanonical++;
    if (seo.meta?.hasOpenGraph) aggregatedMeta.withOpenGraph++;

    // Links
    aggregatedLinks.internal += seo.links?.internal || 0;
    aggregatedLinks.external += seo.links?.external || 0;
    aggregatedLinks.broken += seo.links?.broken || 0;
    aggregatedLinks.nofollow += seo.links?.nofollow || 0;

    // Images
    aggregatedImages.total += seo.images?.total || 0;
    aggregatedImages.withAlt += seo.images?.withAlt || 0;
    aggregatedImages.withoutAlt += seo.images?.withoutAlt || 0;

    // Headings
    if (seo.headings?.counts) {
      Object.keys(aggregatedHeadings).forEach((h) => {
        aggregatedHeadings[h] += seo.headings.counts[h] || 0;
      });
    }

    // Score breakdowns
    totalMetaScore += seo.meta?.score || 0;
    totalHeadingsScore += seo.headings?.score || 0;
    totalLinksScore += seo.links?.score || 0;
    totalImagesScore += seo.images?.score || 0;
  });

  const totalPages = pages.length;
  const avgMetaScore = pagesWithScores > 0 ? Math.round(totalMetaScore / pagesWithScores) : 0;
  const avgHeadingsScore = pagesWithScores > 0 ? Math.round(totalHeadingsScore / pagesWithScores) : 0;
  const avgLinksScore = pagesWithScores > 0 ? Math.round(totalLinksScore / pagesWithScores) : 0;
  const avgImagesScore = pagesWithScores > 0 ? Math.round(totalImagesScore / pagesWithScores) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-medium text-white">SEO Analysis</h3>
          <p className="text-xs text-white/40 mt-1">
            Aggregated search engine optimization metrics across {totalPages} pages
          </p>
        </div>
        <div className="glass px-4 py-3 rounded-xl text-center">
          <div className="text-xs text-white/40 mb-1">Avg Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(aggregatedScore)}`}>
            {Math.round(aggregatedScore)}
          </div>
        </div>
      </div>

      {/* Score Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-400/60 mb-2">Meta Tags</div>
          <div className={`text-2xl font-bold ${getScoreColor(avgMetaScore)}`}>{avgMetaScore}</div>
          <div className="text-xs text-white/40 mt-1">Avg score</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/60 mb-2">Headings</div>
          <div className={`text-2xl font-bold ${getScoreColor(avgHeadingsScore)}`}>{avgHeadingsScore}</div>
          <div className="text-xs text-white/40 mt-1">Avg score</div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="text-xs text-green-400/60 mb-2">Links</div>
          <div className={`text-2xl font-bold ${getScoreColor(avgLinksScore)}`}>{avgLinksScore}</div>
          <div className="text-xs text-white/40 mt-1">Avg score</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="text-xs text-orange-400/60 mb-2">Images</div>
          <div className={`text-2xl font-bold ${getScoreColor(avgImagesScore)}`}>{avgImagesScore}</div>
          <div className="text-xs text-white/40 mt-1">Avg score</div>
        </div>
      </div>

      {/* Meta Coverage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Has Title"
          value={`${aggregatedMeta.withTitle}/${totalPages}`}
          percent={totalPages > 0 ? Math.round((aggregatedMeta.withTitle / totalPages) * 100) : 0}
          getColor={getPercentColor}
        />
        <MetricCard
          label="Has Description"
          value={`${aggregatedMeta.withDescription}/${totalPages}`}
          percent={totalPages > 0 ? Math.round((aggregatedMeta.withDescription / totalPages) * 100) : 0}
          getColor={getPercentColor}
        />
        <MetricCard
          label="Has Canonical"
          value={`${aggregatedMeta.withCanonical}/${totalPages}`}
          percent={totalPages > 0 ? Math.round((aggregatedMeta.withCanonical / totalPages) * 100) : 0}
          getColor={getPercentColor}
        />
        <MetricCard
          label="Has Open Graph"
          value={`${aggregatedMeta.withOpenGraph}/${totalPages}`}
          percent={totalPages > 0 ? Math.round((aggregatedMeta.withOpenGraph / totalPages) * 100) : 0}
          getColor={getPercentColor}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Links Stats */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Link Statistics
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Internal Links</span>
              <span className="text-xs text-white font-medium">{aggregatedLinks.internal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">External Links</span>
              <span className="text-xs text-white font-medium">{aggregatedLinks.external}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Broken Links</span>
              <span className={`text-xs font-medium ${aggregatedLinks.broken > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {aggregatedLinks.broken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Nofollow Links</span>
              <span className="text-xs text-white font-medium">{aggregatedLinks.nofollow}</span>
            </div>
          </div>
        </div>

        {/* Images Stats */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image Statistics
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Images</span>
              <span className="text-xs text-white font-medium">{aggregatedImages.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">With Alt Text</span>
              <span className="text-xs text-green-400 font-medium">{aggregatedImages.withAlt}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Without Alt Text</span>
              <span className={`text-xs font-medium ${aggregatedImages.withoutAlt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {aggregatedImages.withoutAlt}
              </span>
            </div>
            {aggregatedImages.total > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Alt Coverage</span>
                <span className={`text-xs font-medium ${getPercentColor((aggregatedImages.withAlt / aggregatedImages.total) * 100)}`}>
                  {Math.round((aggregatedImages.withAlt / aggregatedImages.total) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Heading Structure */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Heading Structure
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(aggregatedHeadings).map(([h, count]) => (
              <div key={h} className="text-center p-2 rounded-lg bg-white/[0.02]">
                <div className="text-xs text-white/40 uppercase mb-1">{h}</div>
                <div className="text-lg font-bold text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quick Summary
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Pages with H1</span>
              <span className={`text-xs font-medium ${aggregatedHeadings.h1 >= totalPages ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.min(aggregatedHeadings.h1, totalPages)}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Avg Links per Page</span>
              <span className="text-xs text-white font-medium">
                {totalPages > 0 ? Math.round((aggregatedLinks.internal + aggregatedLinks.external) / totalPages) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Avg Images per Page</span>
              <span className="text-xs text-white font-medium">
                {totalPages > 0 ? Math.round(aggregatedImages.total / totalPages) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-page scores */}
      <PageScoresList title="SEO Scores by Page" scores={pageScores} getScoreColor={getScoreColor} />
    </div>
  );
}

// ============================================================================
// AGGREGATED PSEO TAB
// ============================================================================

function AggregatedPSEOTab({ pages, aggregatedScore }: { pages: any[]; aggregatedScore: number }) {
  const schemaTypesMap = new Map<string, number>();
  const suggestedSchemasMap = new Map<string, number>();
  const pageScores: { url: string; score: number }[] = [];

  // Schema aggregates
  let pagesWithSchema = 0;
  let pagesWithJsonLd = 0;

  // Template signals aggregates
  let pagesWithConsistentStructure = 0;
  let pagesWithDynamicContent = 0;
  let pagesWithPlaceholderPatterns = 0;
  let totalTemplateConfidence = 0;
  let pagesWithTemplateData = 0;

  // Content uniqueness aggregates
  let totalUniquenessRatio = 0;
  let totalBoilerplateRatio = 0;
  let pagesWithUniquenessData = 0;
  const allDuplicatePhrases: string[] = [];

  // Keyword optimization aggregates
  let pagesWithKeywordInTitle = 0;
  let pagesWithKeywordInH1 = 0;
  let totalKeywordDensity = 0;
  let pagesWithKeywordData = 0;

  // Internal linking aggregates
  let totalLinksToOtherPages = 0;
  let pagesWithPatternLinks = 0;
  let pagesWithHubPotential = 0;

  pages.forEach((page) => {
    const pseo = page.scanResult?.pseo;
    if (!pseo) return;

    pageScores.push({ url: page.url, score: pseo.score || 0 });

    // Schema
    if (pseo.schemaReadiness?.hasSchema) pagesWithSchema++;
    if (pseo.schemaReadiness?.hasJsonLd) pagesWithJsonLd++;
    pseo.schemaReadiness?.schemaTypes?.forEach((type: string) => {
      schemaTypesMap.set(type, (schemaTypesMap.get(type) || 0) + 1);
    });
    pseo.schemaReadiness?.suggestedSchemas?.forEach((type: string) => {
      suggestedSchemasMap.set(type, (suggestedSchemasMap.get(type) || 0) + 1);
    });

    // Template signals
    if (pseo.templateSignals?.hasConsistentStructure) pagesWithConsistentStructure++;
    if (pseo.templateSignals?.hasDynamicContent) pagesWithDynamicContent++;
    if (pseo.templateSignals?.hasPlaceholderPatterns) pagesWithPlaceholderPatterns++;
    if (pseo.templateSignals?.templateConfidence !== undefined) {
      totalTemplateConfidence += pseo.templateSignals.templateConfidence;
      pagesWithTemplateData++;
    }

    // Content uniqueness
    if (pseo.contentUniqueness?.uniqueContentRatio !== undefined) {
      totalUniquenessRatio += pseo.contentUniqueness.uniqueContentRatio;
      totalBoilerplateRatio += pseo.contentUniqueness.boilerplateRatio || 0;
      pagesWithUniquenessData++;
    }
    if (pseo.contentUniqueness?.duplicatePhrases) {
      allDuplicatePhrases.push(...pseo.contentUniqueness.duplicatePhrases.slice(0, 3));
    }

    // Keyword optimization
    if (pseo.keywordOptimization?.keywordInTitle) pagesWithKeywordInTitle++;
    if (pseo.keywordOptimization?.keywordInH1) pagesWithKeywordInH1++;
    if (pseo.keywordOptimization?.keywordDensity !== undefined) {
      totalKeywordDensity += pseo.keywordOptimization.keywordDensity;
      pagesWithKeywordData++;
    }

    // Internal linking
    totalLinksToOtherPages += pseo.internalLinking?.linksToOtherPages || 0;
    if (pseo.internalLinking?.linksFromPattern) pagesWithPatternLinks++;
    if (pseo.internalLinking?.hubPagePotential) pagesWithHubPotential++;
  });

  const schemaTypes = Array.from(schemaTypesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const suggestedSchemas = Array.from(suggestedSchemasMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalPages = pages.length;
  const avgTemplateConfidence = pagesWithTemplateData > 0
    ? Math.round((totalTemplateConfidence / pagesWithTemplateData) * 100)
    : 0;
  const avgUniqueness = pagesWithUniquenessData > 0
    ? Math.round((totalUniquenessRatio / pagesWithUniquenessData) * 100)
    : 0;
  const avgBoilerplate = pagesWithUniquenessData > 0
    ? Math.round((totalBoilerplateRatio / pagesWithUniquenessData) * 100)
    : 0;
  const avgKeywordDensity = pagesWithKeywordData > 0
    ? (totalKeywordDensity / pagesWithKeywordData).toFixed(1)
    : '0.0';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Deduplicate phrases
  const uniqueDuplicatePhrases = [...new Set(allDuplicatePhrases)].slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-medium text-white">Programmatic SEO Analysis</h3>
          <p className="text-xs text-white/40 mt-1">
            Structured data and template patterns across {totalPages} pages
          </p>
        </div>
        <div className="glass px-4 py-3 rounded-xl text-center">
          <div className="text-xs text-white/40 mb-1">Avg Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(aggregatedScore)}`}>
            {Math.round(aggregatedScore)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="text-xs text-green-400/60 mb-2">Content Uniqueness</div>
          <div className={`text-2xl font-bold ${avgUniqueness >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
            {avgUniqueness}%
          </div>
          <div className="text-xs text-white/40 mt-1">{avgUniqueness >= 70 ? 'Good' : 'Needs work'}</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="text-xs text-red-400/60 mb-2">Boilerplate</div>
          <div className={`text-2xl font-bold ${avgBoilerplate <= 40 ? 'text-green-400' : 'text-red-400'}`}>
            {avgBoilerplate}%
          </div>
          <div className="text-xs text-white/40 mt-1">{avgBoilerplate <= 40 ? 'Acceptable' : 'Too high'}</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-400/60 mb-2">Template Confidence</div>
          <div className="text-2xl font-bold text-blue-400">{avgTemplateConfidence}%</div>
          <div className="text-xs text-white/40 mt-1">Average score</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/60 mb-2">Internal Links</div>
          <div className="text-2xl font-bold text-purple-400">{totalLinksToOtherPages}</div>
          <div className="text-xs text-white/40 mt-1">Total across site</div>
        </div>
      </div>

      {/* Schema Coverage */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/60 mb-2">Pages with Schema</div>
          <div className="text-3xl font-bold text-white">
            {pagesWithSchema} <span className="text-lg text-white/40">/ {totalPages}</span>
          </div>
          <div className="text-xs text-white/40 mt-1">
            {totalPages > 0 ? Math.round((pagesWithSchema / totalPages) * 100) : 0}% coverage
          </div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/60 mb-2">Pages with JSON-LD</div>
          <div className="text-3xl font-bold text-white">
            {pagesWithJsonLd} <span className="text-lg text-white/40">/ {totalPages}</span>
          </div>
          <div className="text-xs text-white/40 mt-1">
            {totalPages > 0 ? Math.round((pagesWithJsonLd / totalPages) * 100) : 0}% coverage
          </div>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template Signals */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Template Signals
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Consistent Structure</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithConsistentStructure / totalPages) * 100 : 0)}`}>
                {pagesWithConsistentStructure}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Dynamic Content</span>
              <span className="text-xs text-white">{pagesWithDynamicContent}/{totalPages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Placeholder Patterns</span>
              <span className={`text-xs ${pagesWithPlaceholderPatterns > 0 ? 'text-yellow-400' : 'text-white/60'}`}>
                {pagesWithPlaceholderPatterns}/{totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Keyword Optimization */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Keyword Optimization
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Keyword in Title</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithKeywordInTitle / totalPages) * 100 : 0)}`}>
                {pagesWithKeywordInTitle}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Keyword in H1</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithKeywordInH1 / totalPages) * 100 : 0)}`}>
                {pagesWithKeywordInH1}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Avg Keyword Density</span>
              <span className={`text-xs ${parseFloat(avgKeywordDensity) > 3 ? 'text-red-400' : 'text-white'}`}>
                {avgKeywordDensity}%
              </span>
            </div>
          </div>
        </div>

        {/* Internal Linking */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Internal Linking
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Links to Other Pages</span>
              <span className="text-xs text-white font-medium">{totalLinksToOtherPages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Pattern-based Links</span>
              <span className="text-xs text-white">{pagesWithPatternLinks}/{totalPages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Hub Page Potential</span>
              <span className={`text-xs ${pagesWithHubPotential > 0 ? 'text-purple-400' : 'text-white/60'}`}>
                {pagesWithHubPotential}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Avg Links per Page</span>
              <span className="text-xs text-white font-medium">
                {totalPages > 0 ? Math.round(totalLinksToOtherPages / totalPages) : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Schema Readiness */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Schema Readiness
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Has Schema</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithSchema / totalPages) * 100 : 0)}`}>
                {pagesWithSchema}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Has JSON-LD</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithJsonLd / totalPages) * 100 : 0)}`}>
                {pagesWithJsonLd}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Unique Schema Types</span>
              <span className="text-xs text-white font-medium">{schemaTypes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schema Types */}
      {schemaTypes.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Schema Types Found
          </h4>
          <div className="flex flex-wrap gap-2">
            {schemaTypes.map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className="bg-purple-500/10 border-purple-500/30 text-purple-400"
              >
                {type} <span className="text-purple-400/60 ml-1">({count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Schemas */}
      {suggestedSchemas.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-yellow-400 font-medium mb-3">Suggested Schemas</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedSchemas.map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              >
                {type} <span className="text-yellow-400/60 ml-1">({count} pages)</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Phrases */}
      {uniqueDuplicatePhrases.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
          <h4 className="text-xs text-yellow-400 font-medium mb-3">Common Duplicate Phrases</h4>
          <div className="flex flex-wrap gap-2">
            {uniqueDuplicatePhrases.map((phrase, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400/80 font-mono"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-page scores */}
      <PageScoresList title="PSEO Scores by Page" scores={pageScores} getScoreColor={getScoreColor} />
    </div>
  );
}

// ============================================================================
// AGGREGATED AEO TAB
// ============================================================================

function AggregatedAEOTab({ pages, aggregatedScore }: { pages: any[]; aggregatedScore: number }) {
  const pageScores: { url: string; score: number }[] = [];

  // Question Targeting aggregates
  let totalQuestionsAnswered = 0;
  let pagesWithFAQMarkup = 0;
  let pagesWithHowToMarkup = 0;
  const allQuestionFormats: any[] = [];

  // Answer Formatting aggregates
  let pagesWithConciseAnswers = 0;
  let pagesWithDefinitions = 0;
  let pagesWithListAnswers = 0;
  let pagesWithStepByStep = 0;

  // Featured Snippet aggregates
  let pagesWithParagraphSnippetReady = 0;
  let pagesWithListSnippetReady = 0;
  let pagesWithTableSnippetReady = 0;
  let totalSnippetCandidates = 0;
  const allSnippetCandidates: any[] = [];

  // Voice Search aggregates
  let pagesWithConversationalTone = 0;
  let pagesWithSpeakableContent = 0;
  let pagesWithLocalRelevance = 0;
  const allNaturalLanguageQueries: string[] = [];

  // Answer Box Potential
  let totalAnswerBoxPotential = 0;
  let pagesWithAnswerBoxData = 0;

  // LLM Analysis aggregates
  const allSuggestedFAQs: any[] = [];
  const allLLMQuestions: any[] = [];
  let pagesWithLLMData = 0;

  pages.forEach((page) => {
    const aeo = page.scanResult?.aeo;
    const llm = page.scanResult?.llm;
    if (!aeo) return;

    pageScores.push({ url: page.url, score: aeo.score || 0 });

    // Question Targeting
    totalQuestionsAnswered += aeo.questionTargeting?.questionsAnswered || 0;
    if (aeo.questionTargeting?.faqMarkupPresent) pagesWithFAQMarkup++;
    if (aeo.questionTargeting?.howToMarkupPresent) pagesWithHowToMarkup++;
    if (aeo.questionTargeting?.questionFormats) {
      allQuestionFormats.push(...aeo.questionTargeting.questionFormats.slice(0, 3));
    }

    // Answer Formatting
    if (aeo.answerFormatting?.hasConciseAnswers) pagesWithConciseAnswers++;
    if (aeo.answerFormatting?.hasDefinitions) pagesWithDefinitions++;
    if (aeo.answerFormatting?.hasListAnswers) pagesWithListAnswers++;
    if (aeo.answerFormatting?.hasStepByStep) pagesWithStepByStep++;

    // Featured Snippet
    if (aeo.featuredSnippetOptimization?.paragraphSnippetReady) pagesWithParagraphSnippetReady++;
    if (aeo.featuredSnippetOptimization?.listSnippetReady) pagesWithListSnippetReady++;
    if (aeo.featuredSnippetOptimization?.tableSnippetReady) pagesWithTableSnippetReady++;
    if (aeo.featuredSnippetOptimization?.snippetCandidates) {
      totalSnippetCandidates += aeo.featuredSnippetOptimization.snippetCandidates.length;
      allSnippetCandidates.push(...aeo.featuredSnippetOptimization.snippetCandidates.slice(0, 2));
    }

    // Voice Search
    if (aeo.voiceSearchOptimization?.conversationalTone) pagesWithConversationalTone++;
    if (aeo.voiceSearchOptimization?.speakableContent) pagesWithSpeakableContent++;
    if (aeo.voiceSearchOptimization?.localRelevance) pagesWithLocalRelevance++;
    if (aeo.voiceSearchOptimization?.naturalLanguageQueries) {
      allNaturalLanguageQueries.push(...aeo.voiceSearchOptimization.naturalLanguageQueries.slice(0, 3));
    }

    // Answer Box
    if (aeo.answerFormatting?.answerBoxPotential !== undefined) {
      totalAnswerBoxPotential += aeo.answerFormatting.answerBoxPotential;
      pagesWithAnswerBoxData++;
    }

    // LLM Analysis
    if (llm?.suggestedFAQ?.length > 0) {
      allSuggestedFAQs.push(...llm.suggestedFAQ.slice(0, 2).map((faq: any) => ({
        ...faq,
        pageUrl: page.url
      })));
      pagesWithLLMData++;
    }
    if (llm?.questions?.length > 0) {
      allLLMQuestions.push(...llm.questions.slice(0, 2).map((q: any) => ({
        ...q,
        pageUrl: page.url
      })));
    }
  });

  const totalPages = pages.length;
  const avgAnswerBoxPotential = pagesWithAnswerBoxData > 0
    ? Math.round(totalAnswerBoxPotential / pagesWithAnswerBoxData)
    : 0;

  // Deduplicate natural language queries
  const uniqueNLQueries = [...new Set(allNaturalLanguageQueries)].slice(0, 12);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-white">Answer Engine Optimization</h3>
            {pagesWithLLMData > 0 ? (
              <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30 bg-green-500/10">
                <Brain className="w-3 h-3 mr-1" />
                AI Analysis
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/30 bg-yellow-500/10">
                Heuristic Mode
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/40 mt-1">
            AI assistant and featured snippet optimization across {totalPages} pages
          </p>
        </div>
        <div className="glass px-4 py-3 rounded-xl text-center">
          <div className="text-xs text-white/40 mb-1">Avg Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(aggregatedScore)}`}>
            {Math.round(aggregatedScore)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <div className="text-xs text-purple-400/60">Questions Answered</div>
          </div>
          <div className="text-2xl font-bold text-white">{totalQuestionsAnswered}</div>
          <div className="text-xs text-white/40 mt-1">Across all pages</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-blue-400/60">Answer Box Potential</div>
          </div>
          <div className="text-2xl font-bold text-white">{avgAnswerBoxPotential}%</div>
          <div className="text-xs text-white/40 mt-1">Average score</div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <List className="w-4 h-4 text-green-400" />
            <div className="text-xs text-green-400/60">Snippet Candidates</div>
          </div>
          <div className="text-2xl font-bold text-white">{totalSnippetCandidates}</div>
          <div className="text-xs text-white/40 mt-1">Total found</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-orange-400" />
            <div className="text-xs text-orange-400/60">Voice Ready</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {pagesWithConversationalTone} <span className="text-lg text-white/40">/ {totalPages}</span>
          </div>
          <div className="text-xs text-white/40 mt-1">
            {totalPages > 0 ? Math.round((pagesWithConversationalTone / totalPages) * 100) : 0}% pages
          </div>
        </div>
      </div>

      {/* AI-Suggested FAQs */}
      {allSuggestedFAQs.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-Suggested FAQ Content
          </h4>
          <p className="text-xs text-white/50">Questions users are likely asking that your content should answer</p>
          <div className="space-y-4">
            {allSuggestedFAQs.slice(0, 6).map((faq: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    faq.importance === 'high' ? 'bg-red-500/20 text-red-400' :
                    faq.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <HelpCircle className="w-3 h-3" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-white font-medium">{faq.question}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{faq.suggestedAnswer}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[9px] ${
                        faq.importance === 'high' ? 'text-red-400 border-red-400/30' :
                        faq.importance === 'medium' ? 'text-yellow-400 border-yellow-400/30' : 'text-blue-400 border-blue-400/30'
                      }`}>
                        {faq.importance} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Questions AI Identified */}
      {allLLMQuestions.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Questions Users Would Ask
          </h4>
          <p className="text-xs text-white/50">Key questions AI systems identify as important across your site</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allLLMQuestions.slice(0, 8).map((q: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3">
                <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${
                  q.category === 'how' ? 'text-purple-400 border-purple-400/30' :
                  q.category === 'what' ? 'text-blue-400 border-blue-400/30' :
                  q.category === 'why' ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'
                }`}>
                  {q.category}
                </Badge>
                <div className="flex-1">
                  <p className="text-xs text-white/70">{q.question}</p>
                  <span className={`text-[9px] ${
                    q.difficulty === 'basic' ? 'text-green-400/60' :
                    q.difficulty === 'intermediate' ? 'text-yellow-400/60' : 'text-red-400/60'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Question Targeting */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Question Targeting
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Pages with FAQ Markup</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white">{pagesWithFAQMarkup}/{totalPages}</span>
                <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithFAQMarkup / totalPages) * 100 : 0)}`}>
                  ({totalPages > 0 ? Math.round((pagesWithFAQMarkup / totalPages) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Pages with HowTo Markup</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white">{pagesWithHowToMarkup}/{totalPages}</span>
                <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithHowToMarkup / totalPages) * 100 : 0)}`}>
                  ({totalPages > 0 ? Math.round((pagesWithHowToMarkup / totalPages) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Questions Answered</span>
              <span className="text-xs text-white font-medium">{totalQuestionsAnswered}</span>
            </div>
          </div>
        </div>

        {/* Answer Formatting */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Answer Formatting
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Concise Answers (40-60 words)</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithConciseAnswers / totalPages) * 100 : 0)}`}>
                {pagesWithConciseAnswers}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Definitions Present</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithDefinitions / totalPages) * 100 : 0)}`}>
                {pagesWithDefinitions}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">List Answers</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithListAnswers / totalPages) * 100 : 0)}`}>
                {pagesWithListAnswers}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Step-by-Step Content</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithStepByStep / totalPages) * 100 : 0)}`}>
                {pagesWithStepByStep}/{totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Featured Snippet Readiness */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <List className="w-4 h-4" />
            Featured Snippet Readiness
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Paragraph Snippets Ready</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithParagraphSnippetReady / totalPages) * 100 : 0)}`}>
                {pagesWithParagraphSnippetReady}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">List Snippets Ready</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithListSnippetReady / totalPages) * 100 : 0)}`}>
                {pagesWithListSnippetReady}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Table Snippets Ready</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithTableSnippetReady / totalPages) * 100 : 0)}`}>
                {pagesWithTableSnippetReady}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Candidates</span>
              <span className="text-xs text-green-400 font-medium">{totalSnippetCandidates}</span>
            </div>
          </div>
        </div>

        {/* Voice Search Optimization */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Search Optimization
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Conversational Tone</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithConversationalTone / totalPages) * 100 : 0)}`}>
                {pagesWithConversationalTone}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Speakable Content</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithSpeakableContent / totalPages) * 100 : 0)}`}>
                {pagesWithSpeakableContent}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Local Relevance</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithLocalRelevance / totalPages) * 100 : 0)}`}>
                {pagesWithLocalRelevance}/{totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language Queries Found */}
      {uniqueNLQueries.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <h4 className="text-xs text-white/40 font-medium flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Natural Language Queries Found
          </h4>
          <div className="flex flex-wrap gap-2">
            {uniqueNLQueries.map((query: string, idx: number) => (
              <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400/80">
                {query}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sample Snippet Candidates */}
      {allSnippetCandidates.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-green-400 font-medium mb-3">Sample Snippet Candidates</h4>
          <div className="space-y-2">
            {allSnippetCandidates.slice(0, 4).map((candidate: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">
                    {candidate.type}
                  </Badge>
                  <span className="text-[10px] text-white/40">Score: {candidate.score}</span>
                </div>
                <p className="text-xs text-white/60 line-clamp-2">{candidate.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-page scores */}
      <PageScoresList title="AEO Scores by Page" scores={pageScores} getScoreColor={getScoreColor} />
    </div>
  );
}

// ============================================================================
// AGGREGATED GEO TAB
// ============================================================================

function AggregatedGEOTab({ pages, aggregatedScore }: { pages: any[]; aggregatedScore: number }) {
  const pageScores: { url: string; score: number }[] = [];

  // AI Visibility aggregates
  let pagesWithCrawlable = 0;
  let pagesWithExtractable = 0;
  let pagesWithSemanticallyRich = 0;
  let pagesWithStructuredData = 0;
  let totalAiVisibilityScore = 0;
  let pagesWithAiVisibility = 0;

  // Citation Potential aggregates
  let pagesWithAuthoritySignals = 0;
  let pagesWithUniqueInsights = 0;
  let pagesWithDataPoints = 0;
  let pagesWithExpertQuotes = 0;
  let totalCitationScore = 0;
  let pagesWithCitationData = 0;

  // Content Attribution aggregates
  let pagesWithAuthor = 0;
  let pagesWithPublishDate = 0;
  let pagesWithSourceLinks = 0;
  let totalAuthorityScore = 0;
  let pagesWithAuthorityData = 0;

  // Brand Protection aggregates
  let totalBrandMentions = 0;
  let pagesWithConsistentMessaging = 0;
  let totalCompetitorMentions = 0;

  // AI Comprehension aggregates
  let totalClarityScore = 0;
  let pagesWithClarityData = 0;

  // Hallucination Risk aggregates
  let totalHallucinationRisk = 0;
  let pagesWithHallucinationData = 0;
  const allHallucinationTriggers: any[] = [];
  const allHallucinationRecommendations: string[] = [];

  // Key Topics & Entities
  const topicsMap = new Map<string, number>();
  const entitiesMap = new Map<string, { type: string; count: number; totalRelevance: number }>();

  // LLM Analysis aggregates
  const allSummaries: { summary: string; pageUrl: string }[] = [];
  const pageTypesMap = new Map<string, number>();
  const sentimentsMap = new Map<string, number>();
  const technicalDepthsMap = new Map<string, number>();
  const allPageTypeInsights: string[] = [];
  const allKeywords: string[] = [];
  const suggestedTitles: { title: string; pageUrl: string }[] = [];
  const suggestedMetas: { meta: string; pageUrl: string }[] = [];
  let pagesWithLLMData = 0;

  // Reading Level aggregates
  let totalReadingGrade = 0;
  let pagesWithReadingLevel = 0;

  pages.forEach((page) => {
    const geo = page.scanResult?.geo;
    const llm = page.scanResult?.llm;
    const hallucinationReport = page.scanResult?.hallucinationReport;
    if (!geo) return;

    pageScores.push({ url: page.url, score: geo.score || 0 });

    // AI Visibility
    if (geo.aiVisibility?.crawlable) pagesWithCrawlable++;
    if (geo.aiVisibility?.extractable) pagesWithExtractable++;
    if (geo.aiVisibility?.semanticallyRich) pagesWithSemanticallyRich++;
    if (geo.aiVisibility?.structuredDataPresent) pagesWithStructuredData++;
    if (geo.aiVisibility?.score !== undefined) {
      totalAiVisibilityScore += geo.aiVisibility.score;
      pagesWithAiVisibility++;
    }

    // Citation Potential
    if (geo.citationPotential?.hasAuthoritySignals) pagesWithAuthoritySignals++;
    if (geo.citationPotential?.hasUniqueInsights) pagesWithUniqueInsights++;
    if (geo.citationPotential?.hasDataPoints) pagesWithDataPoints++;
    if (geo.citationPotential?.hasExpertQuotes) pagesWithExpertQuotes++;
    if (geo.citationPotential?.score !== undefined) {
      totalCitationScore += geo.citationPotential.score;
      pagesWithCitationData++;
    }

    // Content Attribution
    if (geo.contentAttribution?.hasAuthor) pagesWithAuthor++;
    if (geo.contentAttribution?.hasPublishDate) pagesWithPublishDate++;
    if (geo.contentAttribution?.hasSourceLinks) pagesWithSourceLinks++;
    if (geo.contentAttribution?.authorityScore !== undefined) {
      totalAuthorityScore += geo.contentAttribution.authorityScore;
      pagesWithAuthorityData++;
    }

    // Brand Protection
    totalBrandMentions += geo.brandProtection?.brandMentions || 0;
    if (geo.brandProtection?.consistentMessaging) pagesWithConsistentMessaging++;
    totalCompetitorMentions += geo.brandProtection?.competitorMentions || 0;

    // AI Comprehension
    if (geo.aiComprehension?.clarityScore !== undefined) {
      totalClarityScore += geo.aiComprehension.clarityScore;
      pagesWithClarityData++;
    }

    // Hallucination Risk
    if (hallucinationReport?.hallucinationRiskScore !== undefined) {
      totalHallucinationRisk += hallucinationReport.hallucinationRiskScore;
      pagesWithHallucinationData++;
    }
    if (hallucinationReport?.triggers) {
      allHallucinationTriggers.push(...hallucinationReport.triggers.slice(0, 2));
    }
    if (hallucinationReport?.recommendations) {
      allHallucinationRecommendations.push(...hallucinationReport.recommendations.slice(0, 2));
    }

    // Key Topics
    if (llm?.keyTopics) {
      llm.keyTopics.forEach((topic: string) => {
        topicsMap.set(topic, (topicsMap.get(topic) || 0) + 1);
      });
    }

    // Entities
    if (llm?.topEntities) {
      llm.topEntities.forEach((entity: any) => {
        const existing = entitiesMap.get(entity.name);
        if (existing) {
          existing.count++;
          existing.totalRelevance += entity.relevance || 0;
        } else {
          entitiesMap.set(entity.name, { type: entity.type, count: 1, totalRelevance: entity.relevance || 0 });
        }
      });
    }

    // LLM Analysis
    if (llm?.summary) {
      allSummaries.push({ summary: llm.summary, pageUrl: page.url });
      pagesWithLLMData++;
    }
    if (llm?.pageType) {
      pageTypesMap.set(llm.pageType, (pageTypesMap.get(llm.pageType) || 0) + 1);
    }
    if (llm?.sentiment) {
      sentimentsMap.set(llm.sentiment, (sentimentsMap.get(llm.sentiment) || 0) + 1);
    }
    if (llm?.technicalDepth) {
      technicalDepthsMap.set(llm.technicalDepth, (technicalDepthsMap.get(llm.technicalDepth) || 0) + 1);
    }
    if (llm?.pageTypeInsights) {
      allPageTypeInsights.push(...llm.pageTypeInsights.slice(0, 2));
    }
    if (llm?.keywords) {
      allKeywords.push(...llm.keywords);
    }
    if (llm?.suggestedTitle) {
      suggestedTitles.push({ title: llm.suggestedTitle, pageUrl: page.url });
    }
    if (llm?.suggestedMeta) {
      suggestedMetas.push({ meta: llm.suggestedMeta, pageUrl: page.url });
    }

    // Reading Level
    if (llm?.readingLevel?.grade !== undefined) {
      totalReadingGrade += llm.readingLevel.grade;
      pagesWithReadingLevel++;
    }
  });

  const totalPages = pages.length;

  // Calculate averages
  const avgAiVisibilityScore = pagesWithAiVisibility > 0
    ? Math.round(totalAiVisibilityScore / pagesWithAiVisibility)
    : 0;
  const avgCitationScore = pagesWithCitationData > 0
    ? Math.round(totalCitationScore / pagesWithCitationData)
    : 0;
  const avgClarityScore = pagesWithClarityData > 0
    ? Math.round(totalClarityScore / pagesWithClarityData)
    : 0;
  const avgHallucinationRisk = pagesWithHallucinationData > 0
    ? Math.round(totalHallucinationRisk / pagesWithHallucinationData)
    : 0;
  const avgAuthorityScore = pagesWithAuthorityData > 0
    ? Math.round(totalAuthorityScore / pagesWithAuthorityData)
    : 0;
  const avgReadingGrade = pagesWithReadingLevel > 0
    ? Math.round(totalReadingGrade / pagesWithReadingLevel)
    : 0;

  // Sort topics and entities by frequency
  const topTopics = Array.from(topicsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const topEntities = Array.from(entitiesMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  // Sort page types, sentiments, etc.
  const topPageTypes = Array.from(pageTypesMap.entries())
    .sort((a, b) => b[1] - a[1]);
  const topSentiments = Array.from(sentimentsMap.entries())
    .sort((a, b) => b[1] - a[1]);
  const topTechnicalDepths = Array.from(technicalDepthsMap.entries())
    .sort((a, b) => b[1] - a[1]);

  // Deduplicate insights and keywords
  const uniqueInsights = [...new Set(allPageTypeInsights)].slice(0, 6);
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 12);
  const uniqueHallucinationRecs = [...new Set(allHallucinationRecommendations)].slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHallucinationColor = (risk: number) => {
    if (risk > 50) return 'text-red-400';
    if (risk > 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-white">Generative Engine Optimization</h3>
            {pagesWithLLMData > 0 ? (
              <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30 bg-green-500/10">
                <Brain className="w-3 h-3 mr-1" />
                AI Analysis
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/30 bg-yellow-500/10">
                Heuristic Mode
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/40 mt-1">
            Optimization for AI systems like ChatGPT, Claude, and Perplexity across {totalPages} pages
          </p>
        </div>
        <div className="glass px-4 py-3 rounded-xl text-center">
          <div className="text-xs text-white/40 mb-1">Avg Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(aggregatedScore)}`}>
            {Math.round(aggregatedScore)}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-blue-400/60">AI Visibility</div>
          </div>
          <div className="text-2xl font-bold text-white">{avgAiVisibilityScore}%</div>
          <div className="text-xs text-white/40 mt-1">Average score</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-4 h-4 text-purple-400" />
            <div className="text-xs text-purple-400/60">Citation Potential</div>
          </div>
          <div className="text-2xl font-bold text-white">{avgCitationScore}%</div>
          <div className="text-xs text-white/40 mt-1">Average score</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div className="text-xs text-amber-400/60">Hallucination Safety</div>
          </div>
          <div className={`text-2xl font-bold ${getHallucinationColor(avgHallucinationRisk)}`}>
            {100 - avgHallucinationRisk}%
          </div>
          <div className="text-xs text-white/40 mt-1">
            {avgHallucinationRisk > 50 ? 'High risk' : avgHallucinationRisk > 25 ? 'Medium risk' : 'Low risk'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-orange-400" />
            <div className="text-xs text-orange-400/60">Clarity Score</div>
          </div>
          <div className="text-2xl font-bold text-white">{avgClarityScore}%</div>
          <div className="text-xs text-white/40 mt-1">Average score</div>
        </div>
      </div>

      {/* AI Content Understanding Section */}
      {allSummaries.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            How AI Understands Your Site
          </h4>
          <p className="text-xs text-white/50">AI-generated summaries of your content across pages</p>

          <div className="space-y-3">
            {allSummaries.slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">{item.summary}</p>
                <p className="text-[10px] text-white/30 mt-2 truncate">{item.pageUrl}</p>
              </div>
            ))}
          </div>

          {/* Page Type Distribution */}
          {topPageTypes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
              {topPageTypes.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Page Types</p>
                  <div className="flex flex-wrap gap-1">
                    {topPageTypes.slice(0, 3).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="text-[9px] text-purple-400 border-purple-400/30">
                        {type} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {topSentiments.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Sentiments</p>
                  <div className="flex flex-wrap gap-1">
                    {topSentiments.map(([sentiment, count]) => (
                      <Badge key={sentiment} variant="outline" className={`text-[9px] ${
                        sentiment === 'positive' ? 'text-green-400 border-green-400/30' :
                        sentiment === 'negative' ? 'text-red-400 border-red-400/30' : 'text-white/60 border-white/20'
                      }`}>
                        {sentiment} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {topTechnicalDepths.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Technical Depth</p>
                  <div className="flex flex-wrap gap-1">
                    {topTechnicalDepths.slice(0, 2).map(([depth, count]) => (
                      <Badge key={depth} variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">
                        {depth} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {pagesWithReadingLevel > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Avg Reading Level</p>
                  <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-400/30">
                    Grade {avgReadingGrade}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Key Topics & Entities */}
      {(topTopics.length > 0 || topEntities.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topTopics.length > 0 && (
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Key Topics Detected
              </h4>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([topic, count]) => (
                  <span key={topic} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
                    {topic} <span className="text-white/40">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {topEntities.length > 0 && (
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Entities Recognized
              </h4>
              <div className="space-y-2">
                {topEntities.slice(0, 6).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] text-white/40 border-white/20">{data.type}</Badge>
                      <span className="text-[10px] text-white/30">{data.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hallucination Risk Triggers */}
      {allHallucinationTriggers.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Hallucination Risk Triggers ({allHallucinationTriggers.length})
          </h4>
          <p className="text-xs text-white/50">Content that AI systems may misinterpret or fabricate information about</p>
          <div className="space-y-3">
            {allHallucinationTriggers.slice(0, 5).map((trigger: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] flex-shrink-0 ${
                      trigger.severity === 'critical' || trigger.severity === 'high'
                        ? 'text-red-400 border-red-400/30'
                        : trigger.severity === 'medium'
                        ? 'text-yellow-400 border-yellow-400/30'
                        : 'text-blue-400 border-blue-400/30'
                    }`}
                  >
                    {trigger.severity}
                  </Badge>
                  <p className="text-xs text-white/60">{trigger.description}</p>
                </div>
              </div>
            ))}
          </div>
          {uniqueHallucinationRecs.length > 0 && (
            <div className="pt-4 border-t border-red-500/10">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Recommendations</p>
              <ul className="space-y-1">
                {uniqueHallucinationRecs.map((rec: string, idx: number) => (
                  <li key={idx} className="text-xs text-white/50 flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      {uniqueInsights.length > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            AI Recommendations for Your Site
          </h4>
          <ul className="space-y-2">
            {uniqueInsights.map((insight: string, idx: number) => (
              <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI-Suggested SEO Improvements */}
      {(uniqueKeywords.length > 0 || suggestedTitles.length > 0 || suggestedMetas.length > 0) && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-green-400 flex items-center gap-2">
            <Target className="w-4 h-4" />
            AI-Suggested SEO Improvements
          </h4>
          <div className="space-y-4">
            {suggestedTitles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Sample Suggested Titles</span>
                </div>
                {suggestedTitles.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-sm text-white/80">{item.title}</p>
                    <p className="text-[10px] text-white/30 mt-1 truncate">{item.pageUrl}</p>
                  </div>
                ))}
              </div>
            )}
            {suggestedMetas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Sample Suggested Meta Descriptions</span>
                </div>
                {suggestedMetas.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-sm text-white/80 leading-relaxed">{item.meta}</p>
                    <p className="text-[10px] text-white/30 mt-1 truncate">{item.pageUrl}</p>
                  </div>
                ))}
              </div>
            )}
            {uniqueKeywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">AI-Detected Keywords Across Site</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueKeywords.map((keyword: string, idx: number) => (
                    <span key={idx} className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Level Analysis */}
      {pagesWithReadingLevel > 0 && (
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Reading Level Analysis
          </h4>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl font-display font-medium text-white">{avgReadingGrade}</span>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Avg Grade</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-sm text-white/70">
                {avgReadingGrade <= 8
                  ? 'Content is accessible to a wide audience, which is optimal for AI comprehension.'
                  : avgReadingGrade <= 12
                    ? 'Content is moderately complex. Consider simplifying for broader AI understanding.'
                    : 'Content is advanced. May limit AI comprehension for general queries.'}
              </p>
              <p className="text-xs text-white/40 mt-2">Based on {pagesWithReadingLevel} pages with reading level data</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Visibility */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            AI Visibility
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Crawlable</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithCrawlable / totalPages) * 100 : 0)}`}>
                {pagesWithCrawlable}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Extractable</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithExtractable / totalPages) * 100 : 0)}`}>
                {pagesWithExtractable}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Semantically Rich</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithSemanticallyRich / totalPages) * 100 : 0)}`}>
                {pagesWithSemanticallyRich}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Has Structured Data</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithStructuredData / totalPages) * 100 : 0)}`}>
                {pagesWithStructuredData}/{totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Citation Potential */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Quote className="w-4 h-4" />
            Citation Potential
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Authority Signals</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithAuthoritySignals / totalPages) * 100 : 0)}`}>
                {pagesWithAuthoritySignals}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Unique Insights</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithUniqueInsights / totalPages) * 100 : 0)}`}>
                {pagesWithUniqueInsights}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Data Points</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithDataPoints / totalPages) * 100 : 0)}`}>
                {pagesWithDataPoints}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Expert Quotes</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithExpertQuotes / totalPages) * 100 : 0)}`}>
                {pagesWithExpertQuotes}/{totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Content Attribution */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Content Attribution
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Author Present</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithAuthor / totalPages) * 100 : 0)}`}>
                {pagesWithAuthor}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Publish Date</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithPublishDate / totalPages) * 100 : 0)}`}>
                {pagesWithPublishDate}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Source Links</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithSourceLinks / totalPages) * 100 : 0)}`}>
                {pagesWithSourceLinks}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Avg Authority Score</span>
              <span className={`text-xs ${getScoreColor(avgAuthorityScore)}`}>{avgAuthorityScore}%</span>
            </div>
          </div>
        </div>

        {/* Brand Protection */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h4 className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Brand Protection
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Brand Mentions</span>
              <span className="text-xs text-white font-medium">{totalBrandMentions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Consistent Messaging</span>
              <span className={`text-xs ${getPercentColor(totalPages > 0 ? (pagesWithConsistentMessaging / totalPages) * 100 : 0)}`}>
                {pagesWithConsistentMessaging}/{totalPages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Competitor Mentions</span>
              <span className={`text-xs ${totalCompetitorMentions > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {totalCompetitorMentions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-page scores */}
      <PageScoresList title="GEO Scores by Page" scores={pageScores} getScoreColor={getScoreColor} />
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function MetricCard({
  label,
  value,
  percent,
  getColor,
}: {
  label: string;
  value: string;
  percent: number;
  getColor: (p: number) => string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className={`text-xs ${getColor(percent)}`}>{percent}%</div>
    </div>
  );
}

function PageScoresList({
  title,
  scores,
  getScoreColor,
}: {
  title: string;
  scores: { url: string; score: number }[];
  getScoreColor: (s: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sortedScores = [...scores].sort((a, b) => a.score - b.score);
  const displayScores = expanded ? sortedScores : sortedScores.slice(0, 5);

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <h4 className="text-xs text-white/40 font-medium mb-3">{title}</h4>
      <div className="space-y-2">
        {displayScores.map(({ url, score }) => (
          <div key={url} className="flex items-center justify-between gap-4 group">
            <span className="text-xs text-white/60 truncate flex-1">{url}</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                {Math.round(score)}
              </span>
              <a
                href={`/check?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded transition-all"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                View
              </a>
            </div>
          </div>
        ))}
      </div>
      {scores.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-teal-400 mt-3 hover:underline"
        >
          {expanded ? 'Show less' : `Show all ${scores.length} pages`}
        </button>
      )}
    </div>
  );
}
