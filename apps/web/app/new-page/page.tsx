"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Cpu,
  Github,
  Layers,
  Globe,
  Lock,
  Clock,
  ExternalLink,
  BarChart3,
  Zap,
  ChevronDown,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Input } from "@/components/ui/Input";
import { ModelConfig } from "@/components/ModelSelector";
import { trackEvent } from "@/components/Analytics";
import { saveRecentScan } from "@/components/RecentScans";
import FAQ from "@/components/FAQ";

const LandingPage = () => {
  const [url, setUrl] = useState("");
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiPowered, setIsAiPowered] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState("starting");
  const [loadingMessage, setLoadingMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel analysis
      if (e.key === 'Escape' && isAnalyzing) {
        cancelAnalysis();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnalyzing]);

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      setProgress(0);
      setLoadingMessage('');
      setError('Analysis cancelled');
    }
  };

  const validateUrl = (urlString: string): string | null => {
    if (!urlString.trim()) {
      setError('Please enter a URL');
      return null;
    }

    let urlToValidate = urlString.trim();
    if (!urlToValidate.match(/^https?:\/\//i)) {
      urlToValidate = 'https://' + urlToValidate;
    }

    try {
      const parsedUrl = new URL(urlToValidate);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('URL must use http:// or https://');
        return null;
      }
      return urlToValidate;
    } catch (err) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return null;
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      return;
    }

    if (validatedUrl !== url) {
      setUrl(validatedUrl);
    }

    setIsAnalyzing(true);
    setLoadingStep('starting');
    setProgress(0);
    setLoadingMessage('Starting analysis...');

    // Track the analyze event
    trackEvent.analyzeWebsite(
      validatedUrl,
      isAiPowered,
      isAiPowered ? modelConfig.provider : undefined,
      isAiPowered ? modelConfig.model : undefined
    );

    try {
      const requestBody: any = {
        url: validatedUrl,
        enableLLM: isAiPowered,
        minImpactScore: 5,
      };

      if (isAiPowered) {
        requestBody.llmProvider = modelConfig.provider;
        requestBody.llmModel = modelConfig.model;

        if (modelConfig.provider === 'ollama') {
          requestBody.llmBaseUrl = modelConfig.baseUrl || 'http://localhost:11434';
        } else if (modelConfig.apiKey) {
          requestBody.llmApiKey = modelConfig.apiKey;
        }
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Use SSE streaming endpoint for real-time progress
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/audit/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start audit');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'progress') {
                setLoadingStep(event.step);
                setProgress(event.progress);
                setLoadingMessage(event.message || '');
              } else if (event.type === 'complete') {
                const data = event.data;

                const finalScore = Math.round(data.data.aiReadiness.overall);

                // Save to recent scans
                saveRecentScan(validatedUrl, finalScore, data.data.aiReadiness.grade);

                // Navigate to results with URL params
                const domain = new URL(validatedUrl).hostname;
                const params = new URLSearchParams({ url: domain });
                if (isAiPowered) params.set('ai', 'true');

                trackEvent.analyzeComplete(validatedUrl, finalScore, isAiPowered);

                // Navigate to main page with results
                setTimeout(() => {
                  router.push(`/?${params.toString()}`);
                }, 500);
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      // Don't show error for user-initiated cancellation
      if (err.name === 'AbortError') {
        return;
      }
      const errorMessage = err.message || 'An error occurred during the audit';
      setError(errorMessage);
      setIsAnalyzing(false);

      // Track error
      trackEvent.analyzeError(validatedUrl, errorMessage, isAiPowered);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const steps = [
    { label: "Fetching website", done: progress > 20 },
    { label: "Parsing HTML structure", done: progress > 40 },
    { label: "Running audit rules", done: progress > 60 },
    { label: "Analyzing extractability", done: progress > 80 },
    { label: "AI analyzing content", active: progress > 80 && progress < 100, done: progress === 100 }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Logo & Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-8">
              <div className="relative">
                <span className="text-4xl">🏮</span>
                {isAnalyzing && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"
                  />
                )}
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">AI Lighthouse</h1>
            </div>
            <p className="text-xl text-white/40 font-light max-w-2xl mx-auto leading-relaxed">
              Analyze how AI systems like ChatGPT, Perplexity, and search engines understand your website
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <form onSubmit={handleAnalyze} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="https://yoursite.com"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError('');
                      }}
                      className="h-16 bg-white/[0.02] border-white/10 rounded-xl px-6 text-lg focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/10 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isAnalyzing}
                    className={`h-16 px-10 rounded-xl font-bold transition-all ${isAnalyzing ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:bg-white/90'}`}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <Clock className="w-4 h-4" />
                        </motion.div>
                        Analyzing...
                      </div>
                    ) : "Analyze"}
                  </Button>
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm px-2"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </form>
            
            {!isAnalyzing && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">
                  Free • No signup • Results in ~30 seconds
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Or try an example:</span>
                  <div className="flex gap-2">
                    {["Stripe", "Linear", "Notion"].map((site) => (
                      <button 
                        key={site}
                        type="button"
                        onClick={() => setUrl("https://" + site.toLowerCase() + ".com")}
                        className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {site}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Configuration & Loading Sections */}
          <div className="max-w-2xl mx-auto space-y-6">
            {/* AI-powered Configuration */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white/80">AI-powered analysis</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">(deeper insights)</p>
                  </div>
                </div>
                <Switch checked={isAiPowered} onCheckedChange={setIsAiPowered} />
              </div>

              <AnimatePresence>
                {isAiPowered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-left space-y-6 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">AI Model Configuration</h4>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Provider</p>
                        <div className="flex flex-wrap gap-2">
                          {["Openrouter", "Openai", "Anthropic", "Gemini", "Ollama"].map((p) => (
                            <Button key={p} variant="outline" size="sm" className={`rounded-lg border-white/5 text-[10px] font-bold ${p === 'Openrouter' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/[0.02] text-white/40'}`}>
                              {p}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Model</p>
                        <div className="relative">
                          <Input 
                            readOnly 
                            value="meta-llama/llama-3.3-70b-instruct:free" 
                            className="bg-white/[0.02] border-white/5 text-xs text-white/60 h-10 pr-10"
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex gap-3">
                        <span className="text-yellow-500">💡</span>
                        <p className="text-[10px] text-yellow-500/80 leading-relaxed font-medium">
                          <span className="font-bold">Note:</span> Free models available! API key configured on backend.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Loading State Container */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 text-left space-y-8 shadow-2xl"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-medium text-white">Analyzing...</h3>
                    </div>
                    <span className="text-sm font-mono text-primary">{progress}%</span>
                  </div>

                  <div className="space-y-6">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-white/20">
                        {loadingMessage || 'AI analyzing content...'}
                      </p>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                         <MessageSquare className="w-4 h-4 text-white/20" />
                         <p className="text-xs text-white/40 italic">
                           {isAiPowered
                             ? 'Using AI to analyze content quality and extractability...'
                             : 'AI systems process millions of websites daily...'}
                         </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, i) => (
                        <div key={i} className={`flex items-center gap-3 text-xs transition-colors ${step.done ? 'text-green-400' : step.active ? 'text-primary' : 'text-white/20'}`}>
                          {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.active ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Clock className="w-4 h-4" /></motion.div> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                          <span className={step.active ? "font-bold" : ""}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-center">
                    <button
                      onClick={cancelAnalysis}
                      className="text-[10px] text-white/20 uppercase font-bold hover:text-white/40 transition-colors"
                    >
                      Press <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">ESC</span> to cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Scans (only if not analyzing) */}
            {!isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 text-left"
              >
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/20">Your recent scans</h4>
                  <button className="text-white/20 hover:text-white"><Layers className="w-4 h-4" /></button>
                </div>
                <div
                  onClick={() => router.push("/audit")}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-400 border border-red-500/20">
                      C-
                    </div>
                    <span className="text-sm text-white/60 font-medium group-hover:text-white transition-colors">stripe.com</span>
                    <span className="text-[10px] text-white/20">2m ago</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/10 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            )}
          </div>

          {/* FAQ Section */}
          <FAQ />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2"><Github className="w-3 h-3" /> GitHub</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">By Fayed</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Report Issue</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/10">Made with ❤️ in India</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
