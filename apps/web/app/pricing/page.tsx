'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  X,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

type BillingInterval = 'monthly' | 'yearly';

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  tooltip?: string;
}

const features: PlanFeature[] = [
  {
    name: 'Scans per month',
    free: '5',
    pro: 'Unlimited',
    enterprise: 'Unlimited',
    tooltip: 'Number of website analyses you can run each month'
  },
  {
    name: 'Pages per scan',
    free: '1',
    pro: 'Unlimited',
    enterprise: 'Unlimited',
    tooltip: 'Single page vs full domain crawl capability'
  },
  {
    name: 'SEO Analysis',
    free: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'PSEO Analysis',
    free: 'Basic',
    pro: true,
    enterprise: true,
    tooltip: 'Programmatic SEO for scalable content optimization'
  },
  {
    name: 'AEO Analysis',
    free: 'Basic',
    pro: true,
    enterprise: true,
    tooltip: 'Answer Engine Optimization for featured snippets'
  },
  {
    name: 'GEO Analysis',
    free: false,
    pro: true,
    enterprise: true,
    tooltip: 'Generative Engine Optimization for AI systems'
  },
  {
    name: 'AI Visibility Score',
    free: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'LLM-Powered Recommendations',
    free: false,
    pro: true,
    enterprise: true,
    tooltip: 'AI-generated content suggestions and improvements'
  },
  {
    name: 'Hallucination Detection',
    free: false,
    pro: true,
    enterprise: true,
    tooltip: 'Identify where AI might misrepresent your content'
  },
  {
    name: 'Full Domain Crawling',
    free: false,
    pro: true,
    enterprise: true,
    tooltip: 'Analyze entire websites via sitemap or recursive links'
  },
  {
    name: 'API Access',
    free: false,
    pro: true,
    enterprise: true
  },
  {
    name: 'Scan History',
    free: '7 days',
    pro: '90 days',
    enterprise: 'Unlimited'
  },
  {
    name: 'Export Reports',
    free: 'JSON',
    pro: 'JSON, HTML, PDF',
    enterprise: 'All formats'
  },
  {
    name: 'Team Members',
    free: '1',
    pro: '5',
    enterprise: 'Unlimited'
  },
  {
    name: 'Support',
    free: 'Community',
    pro: 'Priority Email',
    enterprise: 'Dedicated'
  },
  {
    name: 'Custom Integrations',
    free: false,
    pro: false,
    enterprise: true
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const prices = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 29, yearly: 290 }, // ~17% discount for yearly
    enterprise: { monthly: 99, yearly: 990 }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
    }
    if (value === false) {
      return <X className="w-5 h-5 text-white/20" />;
    }
    return <span className="text-sm text-white/60">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
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
              <a href="/login" className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                Sign In
              </a>
              <Button
                onClick={() => router.push('/check')}
                className="bg-white text-black hover:bg-white/90 rounded-lg px-6 py-2 text-sm font-medium"
              >
                Try Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold mb-4"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/40 max-w-2xl mx-auto"
          >
            Start free, upgrade as you grow. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm ${billingInterval === 'monthly' ? 'text-white' : 'text-white/40'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 rounded-full bg-white/10 transition-colors"
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-teal-400 transition-all ${
                billingInterval === 'yearly' ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm ${billingInterval === 'yearly' ? 'text-white' : 'text-white/40'}`}>
            Yearly
            <span className="ml-2 text-teal-400 text-xs font-bold">Save 17%</span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-8 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-white/60" />
              <h3 className="text-xl font-display font-bold">Free</h3>
            </div>
            <p className="text-white/40 text-sm mb-6">Perfect for trying out AI Lighthouse</p>

            <div className="mb-6">
              <span className="text-5xl font-display font-bold">$0</span>
              <span className="text-white/40 ml-2">/month</span>
            </div>

            <Button
              onClick={() => router.push('/check')}
              className="w-full h-12 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 mb-6"
            >
              Get Started Free
            </Button>

            <ul className="space-y-3">
              {['5 scans per month', 'Single page analysis', 'Basic SEO & AEO', 'AI readiness score', 'Quick wins report'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-8 rounded-2xl border-2 border-teal-500/30 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-teal-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-teal-400" />
              <h3 className="text-xl font-display font-bold">Pro</h3>
            </div>
            <p className="text-white/40 text-sm mb-6">For serious optimization</p>

            <div className="mb-6">
              <span className="text-5xl font-display font-bold">
                ${prices.pro[billingInterval]}
              </span>
              <span className="text-white/40 ml-2">
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <Button
              onClick={() => router.push('/login?plan=pro')}
              className="w-full h-12 rounded-xl font-medium bg-teal-500 text-black hover:bg-teal-400 mb-6"
            >
              Start Pro Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <ul className="space-y-3">
              {[
                'Unlimited scans',
                'Full domain crawling',
                'Advanced GEO analysis',
                'LLM recommendations',
                'Hallucination detection',
                'API access',
                '5 team members'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass p-8 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-display font-bold">Enterprise</h3>
            </div>
            <p className="text-white/40 text-sm mb-6">For large teams and agencies</p>

            <div className="mb-6">
              <span className="text-5xl font-display font-bold">
                ${prices.enterprise[billingInterval]}
              </span>
              <span className="text-white/40 ml-2">
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>

            <Button
              onClick={() => router.push('/contact')}
              className="w-full h-12 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 mb-6"
            >
              Contact Sales
            </Button>

            <ul className="space-y-3">
              {[
                'Everything in Pro',
                'Unlimited team members',
                'Custom integrations',
                'Dedicated support',
                'SLA guarantee',
                'White-label reports',
                'Custom AI models'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-2xl font-display font-bold text-center mb-8">
            Compare All Features
          </h2>

          <div className="glass rounded-2xl overflow-hidden">
            <TooltipProvider>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium text-white/40">Feature</th>
                    <th className="text-center p-4 font-medium">Free</th>
                    <th className="text-center p-4 font-medium text-teal-400">Pro</th>
                    <th className="text-center p-4 font-medium text-purple-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className={index < features.length - 1 ? 'border-b border-white/5' : ''}
                    >
                      <td className="p-4 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          {feature.name}
                          {feature.tooltip && (
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-3.5 h-3.5 text-white/30" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{feature.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">{renderFeatureValue(feature.free)}</td>
                      <td className="p-4 text-center bg-teal-500/5">{renderFeatureValue(feature.pro)}</td>
                      <td className="p-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto mt-20"
        >
          <h2 className="text-2xl font-display font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans at any time?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, and at the end of your billing period for downgrades.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards through our secure payment provider, Dodo Payments. Enterprise customers can also pay via invoice.'
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes, Pro comes with a 14-day free trial. No credit card required to start. You can explore all Pro features risk-free.'
              },
              {
                q: 'What happens when I hit my scan limit?',
                a: 'On the Free plan, you\'ll need to wait until the next month or upgrade to Pro for unlimited scans. We\'ll notify you when you\'re approaching your limit.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. There are no long-term contracts. Cancel anytime from your dashboard. You\'ll retain access until the end of your billing period.'
              }
            ].map((faq, index) => (
              <div key={index} className="glass p-6 rounded-xl">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to optimize for AI?
          </h2>
          <p className="text-white/40 mb-8">
            Start with our free plan. No credit card required.
          </p>
          <Button
            onClick={() => router.push('/check')}
            className="h-14 px-10 rounded-xl text-lg font-bold bg-white text-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
          >
            Start Free Analysis
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} AI Lighthouse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
