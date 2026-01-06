'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ShareButtonProps {
  score: number;
  grade: string;
  url: string;
  enableLLM?: boolean;
}

export default function ShareButton({ score, grade, url, enableLLM }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

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
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="font-semibold">Share Result</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md z-50 animate-scale-in">
          <Dialog.Title className="text-2xl font-bold text-white mb-2">
            Share Your Results
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-400 mb-6">
            Share your AI Readiness Score with others
          </Dialog.Description>

          {/* Score Display */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Your Score</div>
                <div className="text-3xl font-bold text-teal-400">{score}/100</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Grade</div>
                <div className="text-3xl font-bold text-white">{grade}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              {domain}
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2 mb-6">
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-3 group"
            >
              {copied ? (
                <>
                  <svg
                    className="w-5 h-5 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-teal-400 font-medium">Copied to clipboard!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-white font-medium">Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareTwitter}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-3 group"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-white font-medium">Share on X / Twitter</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-3 group"
            >
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-white font-medium">Share on LinkedIn</span>
            </button>
          </div>

          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
