import { Cpu, BarChart3, Zap, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

type SimpleViewProps = {
  overallScore: number;
  grade: string;
  aiPerspective: any;
  dimensions: any;
  quickWins: any[];
  issues: any[];
  getGradeColor: (grade: string) => string;
  getStatusColor: (status: string) => string;
};

export default function SimpleView({
  overallScore,
  grade,
  aiPerspective,
  dimensions,
  quickWins,
  issues,
  getGradeColor,
  getStatusColor
}: SimpleViewProps) {
  const criticalIssues = issues.filter((i: any) => i.severity === 'critical');
  const highIssues = issues.filter((i: any) => i.severity === 'high');
  const topIssues = [...criticalIssues, ...highIssues].slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center">
          <div className={`text-2xl sm:text-3xl font-display font-medium mb-1 sm:mb-2 ${getGradeColor(grade)}`}>{grade}</div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40">Grade</div>
        </div>
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center">
          <div className="text-2xl sm:text-3xl font-display font-medium text-white mb-1 sm:mb-2">{overallScore}</div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40">Score</div>
        </div>
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center">
          <div className="text-2xl sm:text-3xl font-display font-medium text-white mb-1 sm:mb-2">{issues.length}</div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40">Issues</div>
        </div>
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center">
          <div className="text-2xl sm:text-3xl font-display font-medium text-green-400 mb-1 sm:mb-2">{quickWins.length}</div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/40">Quick Wins</div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="glass p-6 sm:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl space-y-4 sm:space-y-6">
        <h3 className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 flex-shrink-0" />
          <span>AI Agent Capabilities</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Can Understand", status: aiPerspective.canUnderstand },
            { label: "Can Extract", status: aiPerspective.canExtract },
            { label: "Can Index", status: aiPerspective.canIndex },
            { label: "Can Answer", status: aiPerspective.canAnswer }
          ].map((item, i) => (
            <div key={i} className="glass p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 sm:gap-3 text-center">
              {item.status ?
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" /> :
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              }
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-white/60">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="glass p-6 sm:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl space-y-4 sm:space-y-6">
        <h3 className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          <span>Key Dimensions</span>
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(dimensions).map(([key, dim]: [string, any]) => (
            <div key={key} className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="text-base sm:text-lg font-display font-medium text-white flex-shrink-0">{Math.round(dim.score)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-medium text-white/80 capitalize truncate">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${getStatusColor(dim.status)}`}>
                    {dim.status}
                  </div>
                </div>
              </div>
              <Progress value={dim.score} className="w-16 sm:w-24 h-2 bg-white/5 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="glass p-6 sm:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl space-y-4 sm:space-y-6 text-left">
          <h3 className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>Quick Wins ({quickWins.length})</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {quickWins.map((win: any, i: number) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-xs sm:text-sm font-medium text-white text-left flex-1">{win.issue}</span>
                  <Badge className="text-[9px] sm:text-[10px] bg-green-500/10 text-green-400 border-green-500/20 flex-shrink-0">
                    +{win.scoreImpact} pts
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-xs text-white/60 mb-2">{win.fix}</p>
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/40">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{win.effortDescription}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
