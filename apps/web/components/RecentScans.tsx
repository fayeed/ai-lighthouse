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

  useEffect(() => {
    setScans(getRecentScans());
  }, []);

  if (scans.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your recent scans</span>
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
