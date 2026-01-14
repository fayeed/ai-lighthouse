'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Zap, Globe, Brain, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UpgradeBannerProps {
  variant?: 'inline' | 'modal' | 'sticky';
  trigger?: 'scan_limit' | 'llm_locked' | 'crawl_locked' | 'general';
  scansRemaining?: number;
  scansLimit?: number;
  onDismiss?: () => void;
}

export default function UpgradeBanner({
  variant = 'inline',
  trigger = 'general',
  scansRemaining,
  scansLimit,
  onDismiss,
}: UpgradeBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (isDismissed) return null;

  const content = {
    scan_limit: {
      icon: Zap,
      title: scansRemaining === 0 ? 'Scan Limit Reached' : `${scansRemaining} Scans Remaining`,
      description:
        scansRemaining === 0
          ? 'Upgrade to Pro for unlimited scans and advanced analysis features.'
          : `You have ${scansRemaining} of ${scansLimit} free scans left this month.`,
      cta: 'Upgrade to Pro',
    },
    llm_locked: {
      icon: Brain,
      title: 'AI Analysis Locked',
      description: 'LLM-powered recommendations and GEO analysis are Pro features. Upgrade to unlock AI insights.',
      cta: 'Unlock AI Features',
    },
    crawl_locked: {
      icon: Globe,
      title: 'Full Crawl Locked',
      description: 'Full domain crawling with sitemap support is a Pro feature. Currently limited to single page.',
      cta: 'Unlock Full Crawl',
    },
    general: {
      icon: Crown,
      title: 'Upgrade to Pro',
      description: 'Get unlimited scans, full domain crawling, LLM analysis, and priority support.',
      cta: 'View Pro Features',
    },
  };

  const { icon: Icon, title, description, cta } = content[trigger];

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 rounded-xl border border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-transparent"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-white/40 text-xs">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpgrade}
              className="bg-teal-500 text-black hover:bg-teal-400 rounded-lg px-4 py-2 text-xs font-medium"
            >
              {cta}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'sticky') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass p-4 rounded-xl border border-teal-500/20 shadow-xl max-w-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-white/40 text-sm truncate">{description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleUpgrade}
              className="bg-teal-500 text-black hover:bg-teal-400 rounded-lg px-5 py-2 text-sm font-medium"
            >
              {cta}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Modal variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass p-8 rounded-2xl border border-teal-500/20 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">{title}</h3>
            <p className="text-white/40 mb-6">{description}</p>

            <div className="space-y-3 mb-6 text-left">
              {[
                { icon: Zap, text: 'Unlimited scans per month' },
                { icon: Globe, text: 'Full domain crawling' },
                { icon: Brain, text: 'LLM-powered recommendations' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <feature.icon className="w-4 h-4 text-teal-400" />
                  <span className="text-white/60">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-white/5 text-white hover:bg-white/10 rounded-xl py-3 text-sm font-medium border border-white/10"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleUpgrade}
                className="flex-1 bg-teal-500 text-black hover:bg-teal-400 rounded-xl py-3 text-sm font-medium"
              >
                Upgrade - $29/mo
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Usage remaining indicator for the header
 */
export function UsageIndicator({
  scansRemaining,
  scansLimit,
  plan,
}: {
  scansRemaining: number;
  scansLimit: number;
  plan: string;
}) {
  const router = useRouter();
  const isUnlimited = scansLimit >= 999999;
  const isLow = !isUnlimited && scansRemaining <= 2;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
        isUnlimited
          ? 'bg-teal-500/10 text-teal-400'
          : isLow
          ? 'bg-orange-500/10 text-orange-400'
          : 'bg-white/5 text-white/60'
      }`}
    >
      {isUnlimited ? (
        <>
          <Crown className="w-3.5 h-3.5" />
          <span>Pro</span>
        </>
      ) : (
        <>
          <Zap className="w-3.5 h-3.5" />
          <span>
            {scansRemaining}/{scansLimit} scans
          </span>
          {isLow && (
            <button
              onClick={() => router.push('/pricing')}
              className="ml-1 underline hover:no-underline"
            >
              Upgrade
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Locked feature indicator
 */
export function LockedFeature({
  feature,
  description,
}: {
  feature: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-white/5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-center p-4">
          <Lock className="w-5 h-5 text-white/40 mx-auto mb-2" />
          <p className="text-xs text-white/60 mb-2">{description}</p>
          <Button
            onClick={() => router.push('/pricing')}
            className="bg-teal-500 text-black text-xs px-3 py-1 rounded"
          >
            Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}
