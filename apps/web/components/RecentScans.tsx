'use client';

import { useState, useEffect } from 'react';

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
    <div className="max-w-2xl mx-auto mb-10 px-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Your recent scans</h3>
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 z-20 overflow-hidden">
                <button
                  onClick={() => { exportHistory(); setShowExport(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export as JSON
                </button>
                <button
                  onClick={() => { clearHistory(); setShowExport(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear history
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {scans.map((scan) => (
          <button
            key={scan.domain}
            onClick={() => onSelect(scan.url)}
            disabled={currentUrl === scan.url}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
              currentUrl === scan.url
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 cursor-default'
                : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800 text-gray-400'
            }`}
          >
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 ${getGradeColor(scan.grade)}`}>
              <span className="text-[10px] font-bold">{scan.grade}</span>
            </div>
            <span className="truncate max-w-[120px] text-xs font-medium">{scan.domain}</span>
            <span className="text-[10px] text-gray-600 hidden sm:inline">
              {formatTimeAgo(scan.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
