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
  Terminal,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Code2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/check?url=${encodeURIComponent(url)}`);
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
                href="https://github.com/fayeed/ai-lighthouse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <Button
                onClick={() => router.push('/check')}
                className="bg-white text-black hover:bg-white/90 rounded-lg px-6 py-2 text-sm font-medium"
              >
                Try It Free
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
              <span>Free AI readiness analysis for your website</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter leading-tight">
              Optimize Your Website<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">
                For the AI Era
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-white/40 font-light max-w-3xl mx-auto leading-relaxed">
              Discover how AI systems like ChatGPT, Perplexity, and search engines understand your content. Get actionable insights to improve discoverability and accuracy.
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
                No signup required • Results in ~30 seconds
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24">
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
        <section className="container mx-auto px-6 py-24">
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

        {/* CLI Section */}
        <section className="container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass p-12 rounded-3xl border-white/10 relative overflow-hidden">
              {/* Coming Soon Badge */}
              <div className="absolute top-6 right-6">
                <span className="px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Terminal className="w-6 h-6 text-teal-400" />
                    </div>
                    <h2 className="text-3xl font-display font-bold">CLI Tool</h2>
                  </div>

                  <p className="text-lg text-white/60 leading-relaxed">
                    Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing.
                  </p>

                  <div className="space-y-3">
                    {[
                      'Run analysis from the command line',
                      'Integrate with CI/CD pipelines',
                      'Export results in multiple formats',
                      'Automated monitoring and alerts'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        <span className="text-sm text-white/50">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-white/30 cursor-not-allowed"
                    >
                      <Code2 className="w-4 h-4" />
                      View Documentation
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="glass p-6 rounded-xl border border-white/5 bg-black/20">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                      </div>
                      <span className="text-xs text-white/30 ml-2">terminal</span>
                    </div>
                    <div className="font-mono text-sm space-y-2">
                      <div className="text-white/30">
                        <span className="text-teal-400">$</span> npm install -g ai-lighthouse
                      </div>
                      <div className="text-white/30">
                        <span className="text-teal-400">$</span> lighthouse analyze https://yoursite.com
                      </div>
                      <div className="text-white/50 ml-4 mt-3">
                        ✓ Analyzing website...<br />
                        ✓ Running AI checks...<br />
                        ✓ Generating report...
                      </div>
                      <div className="text-teal-400 ml-4 mt-3">
                        Score: 87/100 ✨
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-24">
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
            <Button
              onClick={() => router.push('/check')}
              className="h-14 px-10 rounded-xl text-lg font-bold bg-white text-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
            <a href="https://github.com" className="hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg> GitHub
            </a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">By Fayed</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Report Issue</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/10">
            Made with ❤️ in India
          </p>
        </div>
      </footer>
    </div>
  );
}
