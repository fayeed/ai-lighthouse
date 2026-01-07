'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, ExternalLink, Download, Trash2 } from 'lucide-react';

interface RecentScan {
  url: string;
  domain: string;
  score: number;
  grade: string;
  timestamp: number;
}

interface RecentScansProps {
  onSelect: (url: string) => void;
  currentUrl?: string;
}

const MAX_RECENT_SCANS = 5;
const STORAGE_KEY = 'ai-lighthouse-recent-scans';

export function saveRecentScan(url: string, score: number, grade: string) {
  if (typeof window === 'undefined') return;

  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    const existing = getRecentScans();

    // Remove duplicate if exists
    const filtered = existing.filter(scan => scan.domain !== domain);

    // Add new scan at beginning
    const newScan: RecentScan = {
      url,
      domain,
      score,
      grade,
      timestamp: Date.now()
    };

    const updated = [newScan, ...filtered].slice(0, MAX_RECENT_SCANS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent scan:', e);
  }
}

export function getRecentScans(): RecentScan[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'B+':
    case 'B':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'C+':
    case 'C':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'D+':
    case 'D':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default:
      return 'bg-red-500/10 text-red-400 border-red-500/20';
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function RecentScans({ onSelect, currentUrl }: RecentScansProps) {
  const [scans, setScans] = useState<RecentScan[]>([]);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setScans(getRecentScans());
  }, []);

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setScans([]);
    }
  };

  const exportHistory = () => {
    const exportData = scans.map(scan => ({
      url: scan.url,
      domain: scan.domain,
      score: scan.score,
      grade: scan.grade,
      scannedAt: new Date(scan.timestamp).toISOString()
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-lighthouse-scans-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (scans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-4 text-left max-w-2xl mx-auto mb-10 px-4"
    >
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/20">Your recent scans</h4>
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-white/20 hover:text-white transition-colors"
            aria-label="More options"
          >
            <Layers className="w-4 h-4" />
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-[#0A0A0A] rounded-xl shadow-xl border border-white/5 z-20 overflow-hidden">
                <button
                  onClick={() => { exportHistory(); setShowExport(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white/60 hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </button>
                <button
                  onClick={() => { clearHistory(); setShowExport(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear history
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {scans.map((scan) => (
          <div
            key={scan.domain}
            onClick={() => !currentUrl || currentUrl !== scan.url ? onSelect(scan.url) : undefined}
            className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 transition-all cursor-pointer group ${
              currentUrl === scan.url
                ? 'opacity-50 cursor-default'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border ${getGradeColor(scan.grade)}`}>
                {scan.grade}
              </div>
              <span className="text-sm text-white/60 font-medium group-hover:text-white transition-colors">
                {scan.domain}
              </span>
              <span className="text-[10px] text-white/20">
                {formatTimeAgo(scan.timestamp)}
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/10 group-hover:text-white transition-colors" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
