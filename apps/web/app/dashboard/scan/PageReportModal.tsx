'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogContent } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import {
  Globe,
  Search,
  Code,
  Bot,
  Sparkles,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

// Import the tab components from the check page
import SEOTab from '@/app/check/SEOTab';
import PSEOTab from '@/app/check/PSEOTab';
import AEOTab from '@/app/check/AEOTab';
import GEOTab from '@/app/check/GEOTab';

interface PageReportModalProps {
  open: boolean;
  onClose: () => void;
  pageData: {
    url: string;
    scanResult: any;
  } | null;
  enableLLM: boolean;
}

type TabId = 'seo' | 'pseo' | 'aeo' | 'geo';

export default function PageReportModal({
  open,
  onClose,
  pageData,
  enableLLM,
}: PageReportModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('seo');

  if (!pageData?.scanResult) return null;

  const { url, scanResult } = pageData;
  const { seo, pseo, aeo, geo, scoring } = scanResult;

  const overallScore = scoring?.overallScore || 0;
  const grade =
    overallScore >= 90
      ? 'A'
      : overallScore >= 80
      ? 'B'
      : overallScore >= 70
      ? 'C'
      : overallScore >= 60
      ? 'D'
      : 'F';

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

  const tabs = [
    { id: 'seo' as TabId, label: 'SEO', icon: Search, score: seo?.score },
    { id: 'pseo' as TabId, label: 'PSEO', icon: Code, score: pseo?.score },
    ...(enableLLM
      ? [
          { id: 'aeo' as TabId, label: 'AEO', icon: Bot, score: aeo?.score },
          { id: 'geo' as TabId, label: 'GEO', icon: Sparkles, score: geo?.score },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} className="max-w-5xl mx-4">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getScoreBg(overallScore)}`}>
            <Globe className={`w-5 h-5 ${getScoreColor(overallScore)}`} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white truncate max-w-[400px]">
              Page Report
            </h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 truncate max-w-[400px]"
            >
              {url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </DialogHeader>

      <DialogContent>
        {/* Score Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-6">
            <div className={`p-3 rounded-xl border ${getScoreBg(overallScore)}`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore)}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">Score</div>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {grade}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">Grade</div>
            </div>
          </div>

          {/* Quick Score Cards */}
          <div className="flex flex-wrap gap-3">
            <div className="p-2 px-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <div className="text-[10px] text-teal-400/60">SEO</div>
              <div className={`text-sm font-bold ${getScoreColor(seo?.score || 0)}`}>
                {Math.round(seo?.score || 0)}
              </div>
            </div>
            <div className="p-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-[10px] text-purple-400/60">PSEO</div>
              <div className={`text-sm font-bold ${getScoreColor(pseo?.score || 0)}`}>
                {Math.round(pseo?.score || 0)}
              </div>
            </div>
            {enableLLM && (
              <>
                <div className="p-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-[10px] text-blue-400/60">AEO</div>
                  <div className={`text-sm font-bold ${getScoreColor(aeo?.score || 0)}`}>
                    {Math.round(aeo?.score || 0)}
                  </div>
                </div>
                <div className="p-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-amber-400/60">GEO</div>
                  <div className={`text-sm font-bold ${getScoreColor(geo?.score || 0)}`}>
                    {Math.round(geo?.score || 0)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/5 mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-teal-400 border-teal-400 bg-white/5'
                    : 'text-white/40 border-transparent hover:text-white/60'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.score !== null && tab.score !== undefined && (
                  <span
                    className={`text-xs ml-1 ${getScoreColor(tab.score)}`}
                  >
                    {Math.round(tab.score)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'seo' && <SEOTab seo={seo} />}
          {activeTab === 'pseo' && <PSEOTab pseo={pseo} />}
          {activeTab === 'aeo' && enableLLM && <AEOTab aeo={aeo} scanResult={scanResult} />}
          {activeTab === 'geo' && enableLLM && <GEOTab geo={geo} scanResult={scanResult} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
