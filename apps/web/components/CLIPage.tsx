'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Terminal,
  Download,
  CheckCircle2,
  Code2,
  FileJson,
  FileBarChart,
  Settings,
  Zap,
  Github,
  Package,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

export default function CLIPage() {
  const router = useRouter();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const CodeBlock = ({ children, id }: { children: string; id: string }) => (
    <div className="relative group">
      <div className="glass p-4 rounded-xl border border-white/5 bg-black/20 font-mono text-sm">
        <pre className="text-white/70 overflow-x-auto">{children}</pre>
      </div>
      <button
        onClick={() => copyToClipboard(children, id)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copiedCommand === id ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/40" />
        )}
      </button>
    </div>
  );

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
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-3xl">🏮</span>
                <span className="text-xl font-display font-bold tracking-tight">AI Lighthouse</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
                Home
              </a>
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
        <section className="container mx-auto px-6 pt-24 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10"
            >
              <Terminal className="w-10 h-10 text-teal-400" />
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter leading-tight">
              AI Lighthouse CLI
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-white/40 font-light max-w-3xl mx-auto leading-relaxed">
              Integrate AI readiness checks directly into your development workflow. Perfect for CI/CD pipelines and automated testing.
            </p>
          </motion.div>
        </section>

        {/* Installation Section */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Installation
              </h2>
              <p className="text-lg text-white/40">
                Install the CLI globally using your preferred package manager
              </p>
            </div>

            <div className="glass p-8 rounded-2xl">
              <Tabs defaultValue="npm" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/[0.05] border border-white/10">
                  <TabsTrigger
                    value="npm"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
                  >
                    <Package className="w-4 h-4 mr-2 text-red-400" />
                    npm
                  </TabsTrigger>
                  <TabsTrigger
                    value="pnpm"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
                  >
                    <Package className="w-4 h-4 mr-2 text-yellow-400" />
                    pnpm
                  </TabsTrigger>
                  <TabsTrigger
                    value="yarn"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
                  >
                    <Package className="w-4 h-4 mr-2 text-blue-400" />
                    yarn
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="npm" className="mt-6">
                  <CodeBlock id="npm-install">npm install -g @ai-lighthouse/cli</CodeBlock>
                </TabsContent>
                <TabsContent value="pnpm" className="mt-6">
                  <CodeBlock id="pnpm-install">pnpm add -g @ai-lighthouse/cli</CodeBlock>
                </TabsContent>
                <TabsContent value="yarn" className="mt-6">
                  <CodeBlock id="yarn-install">yarn global add @ai-lighthouse/cli</CodeBlock>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </section>

        {/* Quick Start Section */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Quick Start
              </h2>
              <p className="text-lg text-white/40">
                Run your first audit in seconds
              </p>
            </div>

            <div className="glass p-8 rounded-2xl space-y-6">
              <div>
                <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Basic Audit
                </h3>
                <CodeBlock id="basic-audit">ai-lighthouse audit https://example.com</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                  <FileBarChart className="w-5 h-5 text-green-400" />
                  Generate HTML Report
                </h3>
                <CodeBlock id="html-report">ai-lighthouse audit https://example.com --output html</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Interactive Setup Wizard
                </h3>
                <CodeBlock id="wizard">ai-lighthouse wizard</CodeBlock>
                <p className="text-sm text-white/40 mt-2">
                  Recommended for first-time users - guides you through configuration options
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Commands Section */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Commands
              </h2>
              <p className="text-lg text-white/40">
                Complete command reference
              </p>
            </div>

            <div className="space-y-6">
              {/* Audit Command */}
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Code2 className="w-6 h-6 text-teal-400" />
                  audit
                </h3>
                <p className="text-white/60 mb-6">
                  Audit a single webpage for AI readiness
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Common Options
                    </h4>
                    <div className="space-y-2">
                      {[
                        { flag: '-o, --output <format>', desc: 'Output format: json, html, lhr, csv (default: json)' },
                        { flag: '--enable-llm', desc: 'Enable LLM comprehension analysis' },
                        { flag: '--enable-chunking', desc: 'Enable detailed content chunking analysis' },
                        { flag: '--enable-extractability', desc: 'Enable extractability mapping' },
                        { flag: '--threshold <score>', desc: 'Minimum score threshold (exit 1 if below)' }
                      ].map((option, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <code className="text-teal-400 font-mono whitespace-nowrap">{option.flag}</code>
                          <span className="text-white/40">{option.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Example
                    </h4>
                    <CodeBlock id="audit-example">{`ai-lighthouse audit https://example.com \\
  --output html \\
  --enable-llm \\
  --enable-chunking \\
  --llm-provider ollama \\
  --llm-model qwen2.5:0.5b`}</CodeBlock>
                  </div>
                </div>
              </div>

              {/* Crawl Command */}
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Code2 className="w-6 h-6 text-blue-400" />
                  crawl
                </h3>
                <p className="text-white/60 mb-6">
                  Crawl and audit multiple pages from a website
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Options
                    </h4>
                    <div className="space-y-2">
                      {[
                        { flag: '-d, --depth <number>', desc: 'Maximum crawl depth (default: 2)' },
                        { flag: '--sitemap', desc: 'Parse sitemap.xml for URLs' },
                        { flag: '--max-pages <number>', desc: 'Maximum number of pages to crawl (default: 50)' },
                        { flag: '-o, --output <format>', desc: 'Output format: json, html (default: json)' }
                      ].map((option, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <code className="text-blue-400 font-mono whitespace-nowrap">{option.flag}</code>
                          <span className="text-white/40">{option.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Example
                    </h4>
                    <CodeBlock id="crawl-example">{`ai-lighthouse crawl https://example.com \\
  --sitemap \\
  --max-pages 100 \\
  --depth 3`}</CodeBlock>
                  </div>
                </div>
              </div>

              {/* Report Command */}
              <div className="glass p-8 rounded-2xl">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <FileBarChart className="w-6 h-6 text-green-400" />
                  report
                </h3>
                <p className="text-white/60 mb-6">
                  Generate and view reports from saved audit results
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Options
                    </h4>
                    <div className="space-y-2">
                      {[
                        { flag: '--open', desc: 'Open the report in browser' },
                        { flag: '-f, --format <format>', desc: 'Output format: html, json, csv (default: html)' }
                      ].map((option, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <code className="text-green-400 font-mono whitespace-nowrap">{option.flag}</code>
                          <span className="text-white/40">{option.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
                      Example
                    </h4>
                    <CodeBlock id="report-example">{`ai-lighthouse report ./.ai-lighthouse/last_run.json --open`}</CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Features
              </h2>
              <p className="text-lg text-white/40">
                Everything you need for AI readiness testing
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Terminal,
                  title: 'Command Line Power',
                  description: 'Run comprehensive AI audits directly from your terminal',
                  color: 'text-teal-400'
                },
                {
                  icon: Github,
                  title: 'CI/CD Integration',
                  description: 'Integrate with GitHub Actions, GitLab CI, and other platforms',
                  color: 'text-purple-400'
                },
                {
                  icon: FileJson,
                  title: 'Multiple Output Formats',
                  description: 'Export results as JSON, HTML, CSV, or Lighthouse-compatible format',
                  color: 'text-blue-400'
                },
                {
                  icon: Settings,
                  title: 'Highly Configurable',
                  description: 'Control every aspect of the audit with detailed options',
                  color: 'text-yellow-400'
                },
                {
                  icon: Zap,
                  title: 'Interactive Wizard',
                  description: 'Guided setup for new users with sensible defaults',
                  color: 'text-green-400'
                },
                {
                  icon: CheckCircle2,
                  title: 'Score Thresholds',
                  description: 'Set minimum score requirements and fail builds automatically',
                  color: 'text-red-400'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass glass-hover p-6 rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CI/CD Integration Section */}
        <section className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                CI/CD Integration
              </h2>
              <p className="text-lg text-white/40">
                Automate AI readiness checks in your deployment pipeline
              </p>
            </div>

            <div className="glass p-8 rounded-2xl">
              <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <Github className="w-5 h-5 text-purple-400" />
                GitHub Actions Example
              </h3>
              <CodeBlock id="github-actions">{`name: AI Readiness Check
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install AI Lighthouse CLI
        run: npm install -g @ai-lighthouse/cli

      - name: Run AI Audit
        run: ai-lighthouse audit https://yoursite.com --threshold 80

      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: ai-lighthouse-report
          path: .ai-lighthouse/`}</CodeBlock>

              <p className="text-sm text-white/40 mt-4">
                Use the <code className="text-teal-400 font-mono">--threshold</code> flag to fail builds when scores drop below your minimum requirements.
              </p>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/40">
              Install the CLI and run your first audit today
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => copyToClipboard('npm install -g @ai-lighthouse/cli', 'cta-install')}
                className="h-14 px-10 rounded-xl text-lg font-bold bg-white text-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
              >
                {copiedCommand === 'cta-install' ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Copy Install Command
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/check')}
                className="h-14 px-10 rounded-xl text-lg font-bold bg-white/5 text-white hover:bg-white/10 transition-all inline-flex items-center gap-2 border border-white/10"
              >
                Try Web Version
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
            <a href="https://github.com/fayeed/ai-lighthouse" className="hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg> GitHub
            </a>
            <span>•</span>
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>•</span>
            <a href="/check" className="hover:text-white transition-colors">Web App</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/10">
            Made with ❤️ in India
          </p>
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
          Please enable JavaScript to use AI Lighthouse CLI features. JavaScript is required for interactive code examples and copy functionality.
        </div>
      </noscript>
    </div>
  );
}
