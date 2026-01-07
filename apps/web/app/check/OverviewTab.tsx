import { Cpu, BarChart3, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/Progress";

type OverviewTabProps = {
  aiPerspective: any;
  dimensions: any;
  confidence: number;
  getStatusColor: (status: string) => string;
};

export default function OverviewTab({ aiPerspective, dimensions, confidence, getStatusColor }: OverviewTabProps) {
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
    </div>
  );
}
