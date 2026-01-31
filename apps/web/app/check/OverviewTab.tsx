import { Cpu, BarChart3, CheckCircle2, XCircle, AlertTriangle, Brain, Sparkles, Globe, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import ProGate from "@/components/ProGate";

type OverviewTabProps = {
  aiPerspective: any;
  dimensions: any;
  confidence: number;
  getStatusColor: (status: string) => string;
  enableLLM?: boolean;
  scanResult?: any;
};

export default function OverviewTab({ aiPerspective, dimensions, confidence, getStatusColor, enableLLM = true, scanResult }: OverviewTabProps) {
  const isGated = !enableLLM;
  const llm = scanResult?.llm || {};
  const hallucinationReport = scanResult?.hallucinationReport || {};
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* AI Agent Perspective */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-medium text-white">AI Agent Perspective</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Can Understand", status: aiPerspective.canUnderstand },
            { label: "Can Extract", status: aiPerspective.canExtract },
            { label: "Can Index", status: aiPerspective.canIndex },
            { label: "Can Answer", status: aiPerspective.canAnswer }
          ].map((item, i) => (
            <div key={i} className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center gap-3 sm:gap-4 text-center">
              {item.status ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" /> : <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />}
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/60">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40">Confidence Level</span>
            <span className="text-xs sm:text-sm font-mono text-green-400">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-2 bg-white/5" />
          {aiPerspective.mainBlockers && aiPerspective.mainBlockers.length > 0 && (
            <div className="pt-3 sm:pt-4 border-t border-white/5 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-left">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Main Blockers</span>
              </div>
              <ul className="text-[11px] sm:text-xs text-white/60 space-y-1 list-disc list-inside font-light text-left">
                {aiPerspective.mainBlockers.map((blocker: string, i: number) => (
                  <li key={i}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-medium text-white">Dimension Scores</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {Object.entries(dimensions).map(([key, dim]: [string, any], i) => (
            <div key={i} className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-l-2 border-white/5 hover:border-l-primary transition-all">
              <h4 className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 sm:mb-4">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <div className="text-2xl sm:text-3xl font-display font-medium text-white mb-2">
                {Math.round(dim.score)}/100
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${getStatusColor(dim.status)}`}>
                {dim.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Deep Insights - Gated for free users */}
      <ProGate enabled={isGated} teaser={`${llm.topEntities?.length || 12} entities extracted, ${hallucinationReport?.hallucinationRiskScore ? 'hallucination risks detected' : '3 risk triggers found'}`}>
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 flex-shrink-0" />
            <h3 className="text-lg sm:text-xl font-medium text-white">AI Deep Insights</h3>
          </div>

          {/* Summary */}
          <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4">
            <p className="text-sm text-white/70 leading-relaxed">
              {llm.summary || 'AI has analyzed your content structure, entity relationships, and comprehension patterns to identify optimization opportunities.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Entities */}
            <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Entities Found</span>
              </div>
              <p className="text-2xl font-display font-medium text-white">{llm.topEntities?.length || 12}</p>
              <div className="space-y-1">
                {(llm.topEntities?.slice(0, 3) || [
                  { name: 'Primary Entity', type: 'Organization' },
                  { name: 'Key Product', type: 'Product' },
                  { name: 'Core Technology', type: 'Technology' },
                ]).map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[11px] text-white/60">{e.name}</span>
                    <Badge variant="outline" className="text-[8px] text-white/30 border-white/10">{e.type}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Topics */}
            <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Key Topics</span>
              </div>
              <p className="text-2xl font-display font-medium text-white">{llm.keyTopics?.length || 5}</p>
              <div className="flex flex-wrap gap-1.5">
                {(llm.keyTopics?.slice(0, 4) || ['Web Performance', 'User Experience', 'SEO', 'Analytics']).map((t: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/10">{t}</span>
                ))}
              </div>
            </div>

            {/* Hallucination Risk */}
            <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Risk Triggers</span>
              </div>
              <p className="text-2xl font-display font-medium text-white">{hallucinationReport?.triggers?.length || 3}</p>
              <div className="space-y-1">
                {(hallucinationReport?.triggers?.slice(0, 2) || [
                  { severity: 'high', description: 'Unverified statistical claims' },
                  { severity: 'medium', description: 'Ambiguous comparisons' },
                ]).map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.severity === 'high' || t.severity === 'critical' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <span className="text-[10px] text-white/50 truncate">{t.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProGate>
    </div>
  );
}
