'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Crown,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Settings,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ScoreHistoryChart from '@/components/ScoreHistoryChart';

interface SubscriptionDetails {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    scansPerMonth: number;
    pagesPerScan: number;
    llmAnalysisEnabled: boolean;
    fullCrawlEnabled: boolean;
    apiAccessEnabled: boolean;
  };
  usage: {
    scansUsed: number;
    pagesScanned: number;
    llmCalls: number;
  };
}

interface ScoreHistoryData {
  points: Array<{
    id: string;
    domain: string;
    score: number;
    grade: string;
    scanType: string;
    date: string;
  }>;
  domains: string[];
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  daysLimit: number | null;
}

interface RecentScan {
  id: string;
  url: string;
  domain: string;
  overallScore: number | null;
  grade: string | null;
  status: string;
  createdAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showSuccess = searchParams.get('success') === 'true';
  const upgradeParam = searchParams.get('upgrade');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // Fetch subscription and scan data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Handle upgrade redirect
  useEffect(() => {
    if (upgradeParam && status === 'authenticated') {
      handleUpgrade(upgradeParam.toUpperCase() as 'PRO' | 'ENTERPRISE');
    }
  }, [upgradeParam, status]);

  async function fetchData() {
    try {
      const [subRes, scansRes, historyRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/scans/recent'),
        fetch('/api/scans/history'),
      ]);

      if (subRes.ok) {
        setSubscription(await subRes.json());
      }

      if (scansRes.ok) {
        setRecentScans(await scansRes.json());
      }

      if (historyRes.ok) {
        setScoreHistory(await historyRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpgrade(plan: 'PRO' | 'ENTERPRISE') {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval: 'MONTHLY' }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
    }
  }

  async function handleManageBilling() {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const scansRemaining = subscription
    ? subscription.limits.scansPerMonth - subscription.usage.scansUsed
    : 0;
  const isUnlimited = subscription?.limits?.scansPerMonth! >= 999999;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <span className="text-3xl">🏮</span>
              <span className="text-xl font-display font-bold tracking-tight">AI Lighthouse</span>
            </a>
            <div className="flex items-center gap-4">
              <span className="text-white/40 text-sm">{session.user?.email}</span>
              <Button
                onClick={() => router.push('/dashboard/scan')}
                className="bg-white text-black hover:bg-white/90 rounded-lg px-6 py-2 text-sm font-medium"
              >
                New Scan
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400"
          >
            Welcome to Pro! Your subscription is now active. Enjoy unlimited scans and advanced features.
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Dashboard</h1>
            <p className="text-white/40">Welcome back, {session.user?.name || 'there'}!</p>
          </div>
          <div className="flex items-center gap-3">
            {subscription?.plan === 'FREE' && (
              <Button
                onClick={() => handleUpgrade('PRO')}
                className="bg-teal-500 text-black hover:bg-teal-400 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            )}
            {subscription?.plan !== 'FREE' && (
              <Button
                onClick={handleManageBilling}
                className="bg-white/5 text-white hover:bg-white/10 rounded-lg px-6 py-2 text-sm font-medium border border-white/10 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage Billing
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <Crown className="w-4 h-4" />
              Current Plan
            </div>
            <div className="text-2xl font-display font-bold flex items-center gap-2">
              {subscription?.plan || 'FREE'}
              {subscription?.plan === 'PRO' && (
                <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">Active</span>
              )}
            </div>
          </motion.div>

          {/* Scans Used */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <BarChart3 className="w-4 h-4" />
              Scans This Month
            </div>
            <div className="text-2xl font-display font-bold">
              {subscription?.usage.scansUsed || 0}
              {!isUnlimited && (
                <span className="text-white/40 text-lg font-normal">
                  /{subscription?.limits.scansPerMonth || 5}
                </span>
              )}
            </div>
            {!isUnlimited && (
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 transition-all"
                  style={{
                    width: `${Math.min(100, ((subscription?.usage.scansUsed || 0) / (subscription?.limits.scansPerMonth || 5)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Pages Scanned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <Globe className="w-4 h-4" />
              Pages Analyzed
            </div>
            <div className="text-2xl font-display font-bold">
              {subscription?.usage.pagesScanned || 0}
            </div>
          </motion.div>

          {/* Remaining */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-6 rounded-xl"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <Zap className="w-4 h-4" />
              Scans Remaining
            </div>
            <div className="text-2xl font-display font-bold">
              {isUnlimited ? (
                <span className="text-teal-400">Unlimited</span>
              ) : (
                scansRemaining
              )}
            </div>
          </motion.div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {subscription?.plan === 'FREE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-xl mb-8 border border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold mb-1">
                  Unlock Full Power with Pro
                </h3>
                <p className="text-white/40 text-sm">
                  Get unlimited scans, full domain crawling, LLM analysis, and more.
                </p>
              </div>
              <Button
                onClick={() => handleUpgrade('PRO')}
                className="bg-teal-500 text-black hover:bg-teal-400 rounded-lg px-6 py-2 text-sm font-medium"
              >
                Upgrade Now - $29/mo
              </Button>
            </div>
          </motion.div>
        )}

        {/* Score Trends Chart */}
        {scoreHistory && scoreHistory.points.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <ScoreHistoryChart
              points={scoreHistory.points}
              domains={scoreHistory.domains}
              plan={scoreHistory.plan}
              daysLimit={scoreHistory.daysLimit}
            />
          </motion.div>
        )}

        {/* Recent Scans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Recent Scans</h2>
            <Button
              onClick={() => router.push('/dashboard/scan')}
              className="bg-white/5 text-white hover:bg-white/10 rounded-lg px-4 py-2 text-sm font-medium border border-white/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Scan
            </Button>
          </div>

          {recentScans.length === 0 ? (
            <div className="glass p-12 rounded-xl text-center">
              <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">No scans yet</h3>
              <p className="text-white/40 text-sm mb-6">
                Run your first AI readiness scan to see results here.
              </p>
              <Button
                onClick={() => router.push('/dashboard/scan')}
                className="bg-white text-black hover:bg-white/90 rounded-lg px-6 py-2 text-sm font-medium"
              >
                Start Your First Scan
              </Button>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-white/40 text-sm">Website</th>
                    <th className="text-center p-4 font-medium text-white/40 text-sm">Score</th>
                    <th className="text-center p-4 font-medium text-white/40 text-sm">Grade</th>
                    <th className="text-center p-4 font-medium text-white/40 text-sm">Status</th>
                    <th className="text-right p-4 font-medium text-white/40 text-sm">Date</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, index) => (
                    <tr
                      key={scan.id}
                      className={index < recentScans.length - 1 ? 'border-b border-white/5' : ''}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-white/40" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{scan.domain}</div>
                            <div className="text-white/30 text-xs truncate max-w-xs">{scan.url}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {scan.overallScore !== null ? (
                          <span className="font-mono font-bold">{scan.overallScore}</span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {scan.grade ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                              scan.grade.startsWith('A')
                                ? 'bg-green-500/20 text-green-400'
                                : scan.grade.startsWith('B')
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : scan.grade.startsWith('C')
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {scan.grade}
                          </span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            scan.status === 'COMPLETED'
                              ? 'bg-green-500/20 text-green-400'
                              : scan.status === 'PROCESSING'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : scan.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-white/40 text-sm">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {scan.status === 'COMPLETED' && (
                          <Button
                            onClick={() => router.push(`/dashboard/scan?scanId=${scan.id}`)}
                            className="bg-white/5 text-white hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs border border-white/10"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Features Grid for Free Users */}
        {subscription?.plan === 'FREE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <h2 className="text-xl font-display font-bold mb-6">Unlock Pro Features</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: Globe,
                  title: 'Full Domain Crawling',
                  description: 'Analyze your entire website with sitemap and recursive link crawling',
                },
                {
                  icon: TrendingUp,
                  title: 'GEO Analysis',
                  description: 'Advanced Generative Engine Optimization for AI search visibility',
                },
                {
                  icon: Zap,
                  title: 'LLM Recommendations',
                  description: 'AI-powered content suggestions and improvement roadmap',
                },
              ].map((feature, index) => (
                <div key={index} className="glass p-6 rounded-xl opacity-60">
                  <feature.icon className="w-8 h-8 text-white/20 mb-3" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-white/40 text-sm">{feature.description}</p>
                  <div className="mt-3 text-xs text-teal-400 font-medium">Pro Feature</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
