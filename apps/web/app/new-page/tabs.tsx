import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  History,
  Layout,
  ExternalLink,
  MessageSquare,
  Search,
  Eye,
  Activity,
  Cpu,
  Shield,
  FileText,
  BarChart3,
  XCircle,
  Clock,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Link } from "wouter";
import ShareButton from "@/components/ShareButton";

const AuditItem = ({ title, score, time, description, fix }: { title: string, score: string, time: string, description: string, fix: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    className="glass p-6 rounded-2xl border-white/[0.05] hover:border-white/10 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">{title}</h4>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-white/40">
          <span>{score}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{time}</span>
        </div>
      </div>
      <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 group-hover:text-white group-hover:border-white/20">Action Required</Badge>
    </div>
    <p className="text-sm text-muted-foreground font-light mb-6 leading-relaxed line-clamp-3">
      {description}
    </p>
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-primary">
        <Zap className="w-3 h-3" />
        How to fix
      </div>
      <p className="text-xs text-white/60 leading-relaxed italic">
        {fix}
      </p>
    </div>
  </motion.div>
);

// Simple View Component
const SimpleView = ({
  overallScore,
  grade,
  aiPerspective,
  dimensions,
  quickWins,
  issues,
  getGradeColor,
  getStatusColor
}: {
  overallScore: number;
  grade: string;
  aiPerspective: any;
  dimensions: any;
  quickWins: any[];
  issues: any[];
  getGradeColor: (grade: string) => string;
  getStatusColor: (status: string) => string;
}) => {
  const criticalIssues = issues.filter((i: any) => i.severity === 'critical');
  const highIssues = issues.filter((i: any) => i.severity === 'high');
  const topIssues = [...criticalIssues, ...highIssues].slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-6 rounded-2xl text-center">
          <div className={`text-3xl font-display font-medium mb-2 ${getGradeColor(grade)}`}>{grade}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">Grade</div>
        </div>
        <div className="glass p-6 rounded-2xl text-center">
          <div className="text-3xl font-display font-medium text-white mb-2">{overallScore}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">Score</div>
        </div>
        <div className="glass p-6 rounded-2xl text-center">
          <div className="text-3xl font-display font-medium text-white mb-2">{issues.length}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">Issues</div>
        </div>
        <div className="glass p-6 rounded-2xl text-center">
          <div className="text-3xl font-display font-medium text-green-400 mb-2">{quickWins.length}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">Quick Wins</div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="glass p-8 rounded-3xl space-y-6">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          AI Agent Capabilities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Can Understand", status: aiPerspective.canUnderstand },
            { label: "Can Extract", status: aiPerspective.canExtract },
            { label: "Can Index", status: aiPerspective.canIndex },
            { label: "Can Answer", status: aiPerspective.canAnswer }
          ].map((item, i) => (
            <div key={i} className="glass p-4 rounded-xl flex flex-col items-center gap-3 text-center">
              {item.status ?
                <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                <XCircle className="w-5 h-5 text-red-400" />
              }
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="glass p-8 rounded-3xl space-y-6">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Key Dimensions
        </h3>
        <div className="space-y-3">
          {Object.entries(dimensions).map(([key, dim]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex  gap-3">
                <div className="text-lg font-display font-medium text-white">{Math.round(dim.score)}</div>
                <div>
                  <div className="text-xs font-medium text-white/80 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`text-[10px] uppercase tracking-widest font-bold ${getStatusColor(dim.status)}`}>
                    {dim.status}
                  </div>
                </div>
              </div>
              <Progress value={dim.score} className="w-24 h-2 bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="glass p-8 rounded-3xl space-y-6">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400" />
            Quick Wins ({quickWins.length})
          </h3>
          <div className="space-y-3">
            {quickWins.map((win: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-white text-left">{win.issue}</span>
                  <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
                    +{win.scoreImpact} pts
                  </Badge>
                </div>
                <p className="text-xs text-white/60 mb-2">{win.fix}</p>
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <Clock className="w-3 h-3" />
                  {win.effortDescription}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

type AuditReportProps = {
  reportData: any;
  interpretationMessage: string;
  score: number;
  enableLLM: boolean;
};

export default function AuditReport({ reportData, interpretationMessage, score, enableLLM }: AuditReportProps) {
  const [url, setUrl] = useState("https://stripe.com");
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<'simple' | 'complex'>('complex');

  // Return null if no report data
  if (!reportData) {
    return null;
  }

  // Extract data from reportData
  const aiReadiness = reportData.aiReadiness || {};
  const auditReport = reportData.auditReport || {};
  const scanResult = reportData.scanResult || {};

  const dimensions = aiReadiness.dimensions || {};
  const aiPerspective = aiReadiness.aiPerspective || {};
  const quickWins = aiReadiness.quickWins || [];
  const issues = auditReport.issues || [];
  const chunking = scanResult.chunking || {};
  const extractability = scanResult.extractability || {};
  const hallucinationReport = scanResult.hallucinationReport || {};
  const mirrorReport = scanResult.mirrorReport || {};

  // Calculate stats
  const overallScore = Math.round(aiReadiness.overall || 0);
  const grade = aiReadiness.grade || 'N/A';
  const finalUrl = auditReport.input?.final_url || url;
  const confidence = Math.round((aiPerspective.confidence || 0) * 100);

  // Issue counts by severity
  const criticalIssues = issues.filter((i: any) => i.severity === 'critical').length;
  const highIssues = issues.filter((i: any) => i.severity === 'high').length;
  const mediumIssues = issues.filter((i: any) => i.severity === 'medium').length;
  const lowIssues = issues.filter((i: any) => i.severity === 'low').length;

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'needs-work': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  return (
    <div className="min-h-screen text-foreground pb-20 selection:bg-white selection:text-black">
      <main className="container mx-auto px-6 pt-16 max-w-5xl">
        {/* Score Section - Persistent Top */}
        <div className="glass p-10 rounded-[3rem] border-white/[0.08] relative overflow-hidden mb-8">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">AI Readiness Score</h2>
                <a
                  href="/scoring-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1 text-white/20 hover:text-white/60 transition-colors"
                  title="View Scoring Guide"
                >
                  <Info className="w-3 h-3" />
                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Guide</span>
                </a>
              </div>
              <div className="space-y-2">
                <div className="text-8xl font-display font-medium text-white tracking-tighter">
                  {overallScore}<span className="text-white/20">/100</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`border-opacity-30 font-mono ${getGradeColor(grade)} border-current bg-current bg-opacity-10`}>
                    Grade: {grade}
                  </Badge>
                  <span className="text-xs text-white/40 font-light">Target: {finalUrl}</span>
                </div>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl bg-primary/[0.02] border-primary/10 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                <ShieldAlert className="w-4 h-4" />
                What this means for you
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-light text-left">
                {interpretationMessage.split(' – ')[1] || 'Analyzing your website\'s AI readiness...'}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle and Tab Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Layout className="w-4 h-4 text-white/40" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">View Mode</span>
          </div>
          <div className="flex items-center gap-2 glass rounded-full p-1">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${viewMode === 'simple' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
            >
              Simple
            </button>
            <button
              onClick={() => setViewMode('complex')}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${viewMode === 'complex' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
            >
              Detailed
            </button>
          </div>
        </div>

        {viewMode === 'simple' ? (
          // Simple View
          <div className="space-y-8">
            <SimpleView
              overallScore={overallScore}
              grade={grade}
              aiPerspective={aiPerspective}
              dimensions={dimensions}
              quickWins={quickWins}
              issues={issues}
              getGradeColor={getGradeColor}
              getStatusColor={getStatusColor}
            />
          </div>
        ) : (
          // Complex/Detailed View with Tabs
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/5 h-auto p-0 mb-12 overflow-x-auto gap-8">
              {["Overview", "AI Understanding", "Hallucination Risk", "Message Alignment", "Issues", "Technical"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().replace(" ", "-")}
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-0 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-white transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-12">
              {/* AI Agent Perspective */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-white/40" />
                  <h3 className="text-xl font-medium text-white">AI Agent Perspective</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Can Understand", status: aiPerspective.canUnderstand },
                    { label: "Can Extract", status: aiPerspective.canExtract },
                    { label: "Can Index", status: aiPerspective.canIndex },
                    { label: "Can Answer", status: aiPerspective.canAnswer }
                  ].map((item, i) => (
                    <div key={i} className="glass p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
                      {item.status ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="glass p-8 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Confidence Level</span>
                    <span className="text-sm font-mono text-green-400">{confidence}%</span>
                  </div>
                  <Progress value={confidence} className="h-2 bg-white/5" />
                  {aiPerspective.mainBlockers && aiPerspective.mainBlockers.length > 0 && (
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest text-left">
                        <AlertTriangle className="w-3 h-3" />
                        Main Blockers
                      </div>
                      <ul className="text-xs text-white/60 space-y-1 list-disc list-inside font-light text-left">
                        {aiPerspective.mainBlockers.map((blocker: string, i: number) => (
                          <li key={i}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Dimension Scores */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-white/40" />
                  <h3 className="text-xl font-medium text-white">Dimension Scores</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(dimensions).map(([key, dim]: [string, any], i) => (
                    <div key={i} className="glass p-8 rounded-3xl border-l-2 border-white/5 hover:border-l-primary transition-all">
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="text-3xl font-display font-medium text-white mb-2">
                        {Math.round(dim.score)}/100
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${getStatusColor(dim.status)}`}>
                        {dim.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-understanding" className="space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-medium text-white">AI Understanding</h3>
                  </div>
                  {scanResult.llm?.pageType && (
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 capitalize">
                        {scanResult.llm.pageType}
                      </Badge>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Inferred Page Type</span>
                    </div>
                  )}
                </div>

                {scanResult.llm?.pageTypeInsights && scanResult.llm.pageTypeInsights.length > 0 && (
                  <div className="p-8 rounded-3xl bg-primary/[0.02] border border-primary/10 space-y-6">
                    <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
                      <Zap className="w-4 h-4" />
                      AI-generated Insights for {scanResult.llm.pageType}
                    </div>
                    <ul className="text-sm text-white/80 space-y-4 list-disc list-inside font-light leading-relaxed text-left">
                      {scanResult.llm.pageTypeInsights.map((insight: string, i: number) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {scanResult.llm?.summary && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Summary</h4>
                    <p className="text-base text-white/80 leading-relaxed font-light text-left">
                      {scanResult.llm.summary}
                    </p>
                  </div>
                )}

                {scanResult.llm?.keyTopics && scanResult.llm.keyTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {scanResult.llm.keyTopics.map((topic: string, i: number) => (
                      <Badge key={i} variant="outline" className="border-white/5 text-primary text-[10px] lowercase px-3 py-1 bg-white/[0.02]">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}

                {(scanResult.llm?.readingLevel || scanResult.llm?.sentiment || scanResult.llm?.technicalDepth) && (
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { label: "Reading Level", val: scanResult.llm.readingLevel?.description || "N/A" },
                      { label: "Sentiment", val: scanResult.llm.sentiment || "N/A" },
                      { label: "Technical Depth", val: scanResult.llm.technicalDepth || "N/A" }
                    ].filter(stat => stat.val !== "N/A").map((stat, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2 text-left">{stat.label}</p>
                        <p className="text-lg text-white font-medium capitalize text-left">{stat.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {scanResult.llm?.topEntities && scanResult.llm.topEntities.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Key Entities</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {scanResult.llm.topEntities.slice(0, 6).map((entity: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <p className="text-sm font-medium text-white text-left">{entity.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 text-left">
                            {entity.type} · {Math.round((entity.relevance || 0) * 100)}% relevance
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.llm?.suggestedFAQ && scanResult.llm.suggestedFAQ.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Suggested FAQs</h4>
                    <div className="grid gap-4">
                      {scanResult.llm.suggestedFAQ.map((faq: any, i: number) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4 group hover:bg-white/[0.04] transition-all">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-white text-left">Q: {faq.question}</span>
                            <Badge variant="outline" className={`text-[8px] uppercase font-bold border-white/5 ${faq.importance === 'high' ? 'text-primary' : 'text-white/40'}`}>
                              {faq.importance || 'medium'} Priority
                            </Badge>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed font-light text-left">A: {faq.suggestedAnswer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!scanResult.llm && (
                  <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
                    <p className="text-sm text-white/60">
                      AI-powered analysis not available. Enable LLM analysis to see detailed insights, summaries, and FAQs.
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="hallucination-risk" className="space-y-12">
                <div className="flex items-center gap-3 mb-8">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-xl font-medium text-white">Hallucination Risk Assessment</h3>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Facts", val: hallucinationReport.factCheckSummary?.totalFacts || 0, bg: "bg-zinc-800" },
                    { label: "Verified", val: hallucinationReport.factCheckSummary?.verifiedFacts || 0, color: "text-green-400", bg: "bg-zinc-800" },
                    { label: "Unverified", val: hallucinationReport.factCheckSummary?.unverifiedFacts || 0, color: "text-yellow-400", bg: "bg-zinc-800" },
                    { label: "Contradictory", val: hallucinationReport.factCheckSummary?.contradictions || 0, color: "text-red-400", bg: "bg-zinc-800" }
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} p-6 rounded-xl border border-zinc-700 text-left`}>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{s.label}</p>
                      <p className={`text-3xl font-display font-medium ${s.color || "text-white"}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {hallucinationReport.verifications && hallucinationReport.verifications.length > 0 ? (
                  <div className="space-y-6">
                    {(() => {
                      const verifiedFacts = hallucinationReport.verifications.filter((v: any) => v.verified);
                      const unverifiedFacts = hallucinationReport.verifications.filter((v: any) => !v.verified && (!v.contradictions || v.contradictions.length === 0));
                      const contradictoryFacts = hallucinationReport.verifications.filter((v: any) => v.contradictions && v.contradictions.length > 0);

                      return (
                        <>
                          {verifiedFacts.length > 0 && (
                            <div className="mb-8">
                              <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">
                                  Verified Facts ({verifiedFacts.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {verifiedFacts.map((verification: any, i: number) => (
                                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-white/80">{verification.fact?.statement || 'Verified claim'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {unverifiedFacts.length > 0 && (
                            <div className="mb-8">
                              <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">
                                  Unverified Facts ({unverifiedFacts.length})
                                </span>
                              </div>

                              <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-start gap-2 mb-2">
                                  <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Why these couldn't be verified</span>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed italic ml-6 text-left">
                                  AI could not find supporting evidence on the page for these specific claims regarding private beta enrollment.
                                </p>
                              <div className="space-y-2 mt-6">
                                {unverifiedFacts.map((verification: any, i: number) => (
                                  <div key={i} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-left px-6 mb-4">
                                    <span className="text-sm text-white/70">{verification.fact?.statement || 'Unverified claim'}</span>
                                  </div>
                                ))}
                              </div>
                              </div>
                            </div>
                          )}

                          {contradictoryFacts.length > 0 && (
                            <div className="bg-zinc-900 border border-red-800/50 rounded-xl p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 text-left">
                                  Contradictory Facts ({contradictoryFacts.length})
                                </span>
                              </div>

                              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2 mb-2">
                                  <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider text-left">Found 1 claim that contradicts AI training data</span>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed ml-6 text-left">
                                  "Stripe has a 100% historical uptime for its services" contradicts model training data which includes documented outages. AI is likely to provide incorrect information.
                                </p>
                              </div>

                              <div className="space-y-2">
                                {contradictoryFacts.map((verification: any, idx: number) => (
                                  <div key={idx} className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Conflicting numbers found</div>
                                        <div className="text-sm text-white/90 font-mono">
                                          <span className="line-through">"100%"</span> vs <span className="text-red-400">"99.99%"</span>
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-xs text-white/60 mt-2 text-left">
                                      Page contains inconsistent specifications compared to public records.
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
                    <p className="text-sm text-white/60">
                      Hallucination risk data not available. Enable LLM analysis to see fact verification.
                    </p>
                  </div>
                )}

                {hallucinationReport.triggers && hallucinationReport.triggers.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Risk Triggers</h4>
                    <div className="space-y-3">
                      {hallucinationReport.triggers.map((trigger: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-left">
                          <div className="text-xs text-white/60 font-mono">
                            {trigger.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hallucinationReport.recommendations && hallucinationReport.recommendations.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Recommendations</h4>
                    <ul className="space-y-3">
                      {hallucinationReport.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-left">
                          <span className="text-sm text-white/70">•&nbsp;&nbsp;{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="message-alignment" className="space-y-12">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-medium text-white">AI Misunderstanding Check</h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Alignment Score", val: Math.round(mirrorReport.summary?.alignmentScore || 0), color: "text-primary" },
                    { label: "Clarity Score", val: Math.round(mirrorReport.summary?.clarityScore || 0), color: "text-primary" },
                    { label: "Critical Issues", val: mirrorReport.summary?.critical || 0, color: "text-white/40" },
                    { label: "Major Issues", val: mirrorReport.summary?.major || 0, color: "text-yellow-400" }
                  ].map((s, i) => (
                    <div key={i} className="glass p-6 rounded-2xl text-left">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2 ">{s.label}</p>
                      <p className={`text-2xl font-display font-medium ${s.color}`}>{s.val}{['Alignment Score', 'Clarity Score'].includes(s.label) ? '/100' : ''}</p>
                    </div>
                  ))}
                </div>

                {mirrorReport.llmInterpretation && (
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white/40" />
                      </div>
                      <h4 className="text-sm font-medium text-white">What AI Actually Understood</h4>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        {mirrorReport.llmInterpretation.productName && (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-white/20">Product Name</p>
                            <p className="text-lg text-white font-medium">{mirrorReport.llmInterpretation.productName}</p>
                          </div>
                        )}
                        {mirrorReport.llmInterpretation.purpose && (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-white/20">Main Purpose</p>
                            <p className="text-sm text-white/80 leading-relaxed">{mirrorReport.llmInterpretation.purpose}</p>
                          </div>
                        )}
                        {mirrorReport.llmInterpretation.targetAudience && (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-white/20">Target Audience</p>
                            <p className="text-sm text-white/80">{mirrorReport.llmInterpretation.targetAudience}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        {mirrorReport.llmInterpretation.keyFeatures && mirrorReport.llmInterpretation.keyFeatures.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-white/20">Key Features</p>
                            <ul className="text-xs text-white/60 space-y-1">
                              {mirrorReport.llmInterpretation.keyFeatures.map((feature: string, i: number) => (
                                <li key={i}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mirrorReport.llmInterpretation.category && (
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-white/20">Category</p>
                            <p className="text-sm text-white/80">{mirrorReport.llmInterpretation.category}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mirrorReport.llmInterpretation?.commonQueries && mirrorReport.llmInterpretation.commonQueries.length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-white/40" />
                      <h4 className="text-sm font-medium text-white">AI Query Test</h4>
                    </div>
                    <div className="grid gap-4">
                      {mirrorReport.llmInterpretation.commonQueries.map((query: any, i: number) => {
                        const confidenceLevel = Math.round((query.confidence || 0) * 100);

                        let confidenceText;
                        let confidenceTextWithLevel;
                        if (query.vague || query.hallucinated) {
                          confidenceTextWithLevel = query.vague ? "Vague answer" : "Hallucinated answer";
                        } else {
                          if (confidenceLevel > 80) {
                            confidenceText = "High confidence";
                          } else if (confidenceLevel > 50) {
                            confidenceText = "Medium confidence";
                          } else {
                            confidenceText = "Low confidence";
                          }
                          confidenceTextWithLevel = `${confidenceText} (${confidenceLevel}%)`;
                        }

                        return (
                          <div key={i} className={`p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 ${query.vague || query.hallucinated || (query.confidence && query.confidence < 0.6) ? 'border-yellow-500/20 bg-yellow-500/[0.02]' : ''
                            }`}>
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-white">Q: {query.question}</p>
                              <span className={`text-[10px] font-mono ${query.confidence > 0.7 ? 'text-green-400' :
                                query.confidence > 0.5 ? 'text-yellow-500' : 'text-red-400'
                                }`}>
                                {confidenceTextWithLevel}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed font-light text-left">A: {query.answer}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {mirrorReport.mismatches && mirrorReport.mismatches.length > 0 && (
                  <div className="space-y-4">
                    {mirrorReport.mismatches.map((mismatch: any, i: number) => (
                      <div key={i} className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4">
                        <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
                          <AlertTriangle className="w-4 h-4" />
                          {mismatch.type || 'Mismatch Detected'}
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-light italic">
                          {mismatch.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!mirrorReport.llmInterpretation && !mirrorReport.mismatches && (
                  <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
                    <p className="text-sm text-white/60">
                      Message alignment data not available. Enable LLM analysis to see how AI understands your content.
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-12">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-white text-left">{issues.length} Issues Found</h3>
                    <p className="text-sm text-red-400 font-light">
                      {criticalIssues} critical • {highIssues} high priority{(criticalIssues + highIssues) > 0 && ' — address these first'}
                    </p>
                  </div>
                  {aiReadiness.benchmark?.improvement && (
                    <div className="text-right glass px-6 py-4 rounded-2xl">
                      <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">Potential Improvement</p>
                      <p className="text-xl font-display font-medium text-green-400">
                        {overallScore} → {Math.round(overallScore + aiReadiness.benchmark.improvement)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Critical", val: criticalIssues, color: "bg-red-500/20 text-red-400" },
                    { label: "High", val: highIssues, color: "bg-orange-500/20 text-orange-400" },
                    { label: "Medium", val: mediumIssues, color: "bg-yellow-500/20 text-yellow-400" },
                    { label: "Low", val: lowIssues, color: "bg-blue-500/20 text-blue-400" }
                  ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-2xl ${s.color.split(' ')[0]} flex flex-col items-center gap-2`}>
                      <span className={`text-2xl font-display font-medium ${s.color.split(' ')[1]}`}>{s.val}</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-12">
                  {/* Critical Issues */}
                  {issues.filter((i: any) => i.severity === 'critical').length > 0 && (
                    <div className="space-y-6 text-left">
                      <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Critical ({criticalIssues})
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {issues.filter((i: any) => i.severity === 'critical').map((issue: any, idx: number) => (
                          <AuditItem
                            key={idx}
                            title={issue.message}
                            score={issue.scoreImpact ? `+${issue.scoreImpact}` : '+0'}
                            time="~30 min"
                            description={issue.evidence || issue.impact || 'Critical issue that needs immediate attention'}
                            fix={issue.suggested_fix || 'Review and fix this issue'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* High Priority Issues */}
                  {issues.filter((i: any) => i.severity === 'high').length > 0 && (
                    <div className="space-y-6 text-left">
                      <div className="flex items-center gap-2 text-orange-400 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        High ({highIssues})
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {issues.filter((i: any) => i.severity === 'high').slice(0, 4).map((issue: any, idx: number) => (
                          <AuditItem
                            key={idx}
                            title={issue.message}
                            score={issue.scoreImpact ? `+${issue.scoreImpact}` : '+0'}
                            time="~15 min"
                            description={issue.evidence || issue.impact || 'High priority issue'}
                            fix={issue.suggested_fix || 'Address this issue'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium Priority Issues */}
                  {issues.filter((i: any) => i.severity === 'medium').length > 0 && (
                    <div className="space-y-6 opacity-60 text-left">
                      <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium ({mediumIssues})
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {issues.filter((i: any) => i.severity === 'medium').slice(0, 4).map((issue: any, idx: number) => (
                          <div key={idx} className="glass p-6 rounded-2xl border-white/5 text-sm text-white/40">
                            {issue.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-12">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-medium text-white">Technical Architecture</h3>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Crawlability", val: Math.round(auditReport.scores?.crawlability || 0) },
                    { label: "Structure", val: Math.round(auditReport.scores?.structure || 0) },
                    { label: "Schema Coverage", val: Math.round(auditReport.scores?.schema_coverage || 0), color: "text-green-400" },
                    { label: "Content Clarity", val: Math.round(auditReport.scores?.content_clarity || 0) }
                  ].map((s, i) => (
                    <div key={i} className="glass p-6 rounded-2xl">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2">{s.label}</p>
                      <p className={`text-2xl font-display font-medium ${s.color || "text-white"}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="glass p-10 rounded-3xl border-white/[0.05] space-y-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-white/40" />
                      <h4 className="text-sm font-medium text-white">Content Chunking</h4>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-white/20">Strategy</p>
                        <p className="text-xs text-white">{chunking.chunkingStrategy || 'heading-based'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-white/20">Total Chunks</p>
                        <p className="text-xs text-white">{chunking.totalChunks || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">Token Distribution Heatmap</p>
                    <div className="h-6 w-full rounded-sm overflow-hidden flex">
                      {[...Array(50)].map((_, i) => (
                        <div key={i} className={`h-full flex-1 ${i % 7 === 0 ? 'bg-red-500' : i % 5 === 0 ? 'bg-yellow-500' : i % 3 === 0 ? 'bg-blue-500' : 'bg-green-500'}`} />
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] uppercase font-bold text-white/20 pt-1">
                      <span>Chunk 1</span>
                      <span>Chunk 88</span>
                    </div>
                  </div>

                  {chunking.chunks && chunking.chunks.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">Chunk Viewer</p>
                      <div className="glass p-2 rounded-xl border-white/5 h-64 overflow-y-auto scrollbar-hide">
                        <div className="space-y-1">
                          {chunking.chunks.map((chunk: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-all">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-white/80">{chunk.heading || `Chunk ${i + 1}`}</span>
                              </div>
                              <span className="text-[10px] font-mono text-white/20">{chunk.tokenCount} tokens</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-white/40" />
                    <h4 className="text-sm font-medium text-white">Technical Scoring</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "AI Readability", score: "0/100", color: "text-red-400" },
                      { label: "Content Chunking", score: "0/100", color: "text-red-400" },
                      { label: "Crawlability", score: "0/100", color: "text-red-400" },
                      { label: "Hallucination Prevention", score: "0/100", color: "text-red-400" },
                      { label: "LLM Confidence", score: "72/100", color: "text-yellow-400" },
                      { label: "Data Extraction", score: "100/100", color: "text-green-400" },
                      { label: "Local LLM", score: "100/100", color: "text-green-400" },
                      { label: "API LLM", score: "100/100", color: "text-green-400" }
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl glass border-white/5">
                        <span className="text-[10px] uppercase text-white/40 font-bold">{s.label}</span>
                        <span className={`text-xs font-mono font-bold ${s.color}`}>{s.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </TabsContent>

          </Tabs>
        )}

        {/* Footer Actions */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <ShareButton
              score={overallScore}
              grade={grade}
              url={finalUrl}
              enableLLM={enableLLM}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
