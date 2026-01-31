'use client';

import { Crown, Lock } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  /** Short label shown above the CTA, e.g. "3 entities detected" */
  teaser?: string;
  /** Override the default CTA text */
  ctaText?: string;
  /** Render the blurred preview even when locked */
  enabled?: boolean;
}

/**
 * Wraps content in a blurred overlay with an "Upgrade to unlock" CTA.
 * When `enabled` is false (or omitted), passes children through untouched.
 */
export default function ProGate({ children, teaser, ctaText, enabled = true }: ProGateProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content preview */}
      <div className="select-none pointer-events-none" aria-hidden="true">
        <div className="blur-[6px] opacity-60">
          {children}
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-transparent via-[#050505]/70 to-[#050505]/90">
        <div className="flex flex-col items-center gap-3 p-6 max-w-xs text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center mb-1">
            <Lock className="w-5 h-5 text-teal-400" />
          </div>
          {teaser && (
            <p className="text-sm text-white/70 font-medium">{teaser}</p>
          )}
          <a
            href="/login?plan=pro"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-colors"
          >
            <Crown className="w-4 h-4" />
            {ctaText || 'Upgrade to Pro'}
          </a>
          <p className="text-[10px] text-white/30 mt-1">Unlock full AI-powered analysis</p>
        </div>
      </div>
    </div>
  );
}
