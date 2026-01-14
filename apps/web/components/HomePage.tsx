'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  Zap,
  Brain,
  Search,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Crown,
  BarChart3,
  Globe,
  Lock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/check?url=${encodeURIComponent(url)}&ai=true`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-teal-500/[0.02] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏮</span>
              <span className="text-xl font-display font-bold tracking-tight">AI Lighthouse</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/pricing"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
                Pricing
              </a>
              <a
                href="/login"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
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

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white/60"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>AI-Powered Website Optimization Platform</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter leading-tight">
              Dominate AI Search<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">
                Results & Rankings
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-white/40 font-light max-w-3xl mx-auto leading-relaxed">
              Comprehensive SEO, AEO, GEO & AI visibility analysis. Get actionable insights to rank higher in ChatGPT, Perplexity, Google AI, and traditional search.
            </p>

            {/* CTA Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto pt-8"
            >
              <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter your website URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    aria-label="Website URL to analyze"
                    className="h-14 bg-white/[0.02] border-white/10 rounded-xl px-6 text-base focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/20 text-white flex-1"
                  />
                  <Button
                    type="submit"
                    className="h-14 px-8 rounded-xl font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2"
                  >
                    Analyze Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
              <p className="text-xs text-white/20 mt-4 uppercase tracking-widest font-bold">
                5 Free Scans/Month • No Credit Card Required • Results in ~30 seconds
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Analysis Types Section */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Complete Optimization Suite
              </h2>
              <p className="text-lg text-white/40">
                Six powerful analysis engines in one platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Search,
                  title: 'SEO Analysis',
                  description: 'Traditional search engine optimization with meta tags, content quality, technical SEO, and link analysis',
                  color: 'text-blue-400',
                  tag: 'Core'
                },
                {
                  icon: BarChart3,
                  title: 'PSEO Analysis',
                  description: 'Programmatic SEO checks for scalable content, URL structures, and automated page optimization',
                  color: 'text-purple-400',
                  tag: 'Scale'
                },
                {
                  icon: MessageSquare,
                  title: 'AEO Analysis',
                  description: 'Answer Engine Optimization for featured snippets, FAQ structure, and direct answer formatting',
                  color: 'text-green-400',
                  tag: 'Answers'
                },
                {
                  icon: Brain,
                  title: 'GEO Analysis',
                  description: 'Generative Engine Optimization for AI systems like ChatGPT, Claude, and Perplexity',
                  color: 'text-teal-400',
                  tag: 'AI-First'
                },
                {
                  icon: TrendingUp,
                  title: 'AI Visibility Score',
                  description: 'Comprehensive scoring across content quality, extractability, comprehensibility, and trustworthiness',
                  color: 'text-yellow-400',
                  tag: 'Score'
                },
                {
                  icon: Sparkles,
                  title: 'AI Recommendations',
                  description: 'LLM-powered content suggestions, quick wins, and prioritized improvement roadmap',
                  color: 'text-pink-400',
                  tag: 'Pro'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass glass-hover p-8 rounded-2xl group relative"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 bg-white/5 px-2 py-1 rounded">
                      {feature.tag}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:bg-white/[0.08] transition-colors">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Everything You Need to Be AI-Ready
              </h2>
              <p className="text-lg text-white/40">
                Comprehensive analysis to ensure AI systems understand your content perfectly
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: 'AI Understanding',
                  description: 'See exactly how AI models interpret and understand your content structure and meaning',
                  color: 'text-purple-400'
                },
                {
                  icon: Search,
                  title: 'Content Extractability',
                  description: 'Measure how easily AI systems can extract key information from your pages',
                  color: 'text-blue-400'
                },
                {
                  icon: Shield,
                  title: 'Hallucination Detection',
                  description: 'Identify areas where AI might generate incorrect information about your business',
                  color: 'text-red-400'
                },
                {
                  icon: MessageSquare,
                  title: 'Message Alignment',
                  description: 'Verify that AI responses match your intended messaging and brand voice',
                  color: 'text-green-400'
                },
                {
                  icon: Zap,
                  title: 'Quick Wins',
                  description: 'Get prioritized, actionable recommendations to improve your score fast',
                  color: 'text-yellow-400'
                },
                {
                  icon: Sparkles,
                  title: 'Technical Deep Dive',
                  description: 'Access detailed chunking, token analysis, and extractability metrics',
                  color: 'text-teal-400'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass glass-hover p-8 rounded-2xl group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:bg-white/[0.08] transition-colors">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-white/40">
                Three simple steps to optimize your AI presence
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Enter Your URL',
                  description: 'Simply paste your website URL and let our AI analyzer do the rest'
                },
                {
                  step: '02',
                  title: 'Get Your Score',
                  description: 'Receive a comprehensive AI readiness score across multiple dimensions'
                },
                {
                  step: '03',
                  title: 'Take Action',
                  description: 'Follow our prioritized recommendations to improve your AI discoverability'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="glass glass-hover p-8 rounded-2xl flex items-start gap-6"
                >
                  <div className="text-5xl font-display font-bold text-white/10 leading-none">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold mb-2">{item.title}</h3>
                    <p className="text-white/50">{item.description}</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/20 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Pricing Preview Section */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-white/40">
                Start free, upgrade when you need more power
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass p-8 rounded-2xl"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
                  <p className="text-white/40 text-sm">Perfect for trying out AI Lighthouse</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">$0</span>
                  <span className="text-white/40 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    '5 scans per month',
                    'Single page analysis',
                    'Basic SEO & AEO checks',
                    'AI readiness score',
                    'Quick wins report'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => router.push('/check')}
                  className="w-full h-12 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10"
                >
                  Get Started Free
                </Button>
              </motion.div>

              {/* Pro Tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass p-8 rounded-2xl border-2 border-teal-500/30 relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-display font-bold">Pro</h3>
                    <Crown className="w-5 h-5 text-teal-400" />
                  </div>
                  <p className="text-white/40 text-sm">For serious optimization</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">$29</span>
                  <span className="text-white/40 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited scans',
                    'Full domain crawling',
                    'Advanced AI analysis (GEO)',
                    'LLM-powered recommendations',
                    'Hallucination detection',
                    'Priority support',
                    'API access'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => router.push('/pricing')}
                  className="w-full h-12 rounded-xl font-medium bg-teal-500 text-black hover:bg-teal-400"
                >
                  Upgrade to Pro
                </Button>
              </motion.div>
            </div>

            <p className="text-center text-white/30 text-sm mt-8">
              All plans include basic support. Enterprise plans available for large teams.
            </p>
          </motion.div>
        </section>

        {/* Social Proof / Trust Section */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="grid grid-cols-3 gap-8 mb-16">
              {[
                { value: '10K+', label: 'Pages Analyzed' },
                { value: '500+', label: 'Sites Optimized' },
                { value: '50+', label: 'Audit Rules' }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl font-display font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="glass p-8 rounded-2xl inline-flex items-center gap-4">
              <Lock className="w-6 h-6 text-teal-400" />
              <span className="text-white/60">
                Your data is secure. We never store your content permanently.
              </span>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Ready to Optimize for AI?
            </h2>
            <p className="text-xl text-white/40">
              Join thousands of websites improving their AI discoverability
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => router.push('/check')}
                className="h-14 px-10 rounded-xl text-lg font-bold bg-white text-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => router.push('/pricing')}
                className="h-14 px-10 rounded-xl text-lg font-bold bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10"
              >
                View Pricing
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏮</span>
              <span className="text-lg font-display font-bold">AI Lighthouse</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} AI Lighthouse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Noscript fallback */}
      <noscript>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
          zIndex: 9999
        }}>
          Please enable JavaScript to use AI Lighthouse. JavaScript is required for interactive features and analysis.
        </div>
      </noscript>
    </div>
  );
}
