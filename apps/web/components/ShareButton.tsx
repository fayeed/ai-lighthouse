'use client';

import { useState } from 'react';

interface ShareButtonProps {
  score: number;
  grade: string;
  url: string;
  enableLLM?: boolean;
}

export default function ShareButton({ score, grade, url, enableLLM }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Extract domain for cleaner sharing
  const getDomain = (urlString: string): string => {
    try {
      return new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`).hostname;
    } catch {
      return urlString;
    }
  };

  const domain = getDomain(url);
  const shareText = `I just analyzed ${domain} with AI Lighthouse and got a ${score}/100 (Grade ${grade}) AI Readiness Score! 🚀`;
  
  // Generate shareable URL with deep link (include ai param if LLM was used)
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : '';
  const params = new URLSearchParams({ url: domain });
  if (enableLLM) params.set('ai', 'true');
  const shareUrl = `${baseUrl}?${params.toString()}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nAnalyze any website: ${shareUrl}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <span className="text-lg">📤</span>
        <span className="font-semibold">Share Result</span>
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-50 animate-scale-in">
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
          >
            <span className="text-xl">{copied ? '✅' : '📋'}</span>
            <span className="text-gray-700 dark:text-gray-200">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
          
          <button
            onClick={handleShareTwitter}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
          >
            <span className="text-xl">𝕏</span>
            <span className="text-gray-700 dark:text-gray-200">Share to X / Twitter</span>
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
