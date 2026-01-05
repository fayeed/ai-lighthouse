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
      return 'text-green-600 dark:text-green-400';
    case 'B+':
    case 'B':
      return 'text-blue-600 dark:text-blue-400';
    case 'C+':
    case 'C':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'D+':
    case 'D':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-red-600 dark:text-red-400';
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
    <div className="max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your recent scans</span>
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            •••
          </button>
          {showExport && (
            <div className="absolute right-0 mt-1 py-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => { exportHistory(); setShowExport(false); }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export as JSON
              </button>
              <button
                onClick={() => { clearHistory(); setShowExport(false); }}
                className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear history
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {scans.map((scan) => (
          <button
            key={scan.domain}
            onClick={() => onSelect(scan.url)}
            disabled={currentUrl === scan.url}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              currentUrl === scan.url
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className={`font-semibold ${getGradeColor(scan.grade)}`}>
              {scan.grade}
            </span>
            <span className="truncate max-w-[150px]">{scan.domain}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              {formatTimeAgo(scan.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
