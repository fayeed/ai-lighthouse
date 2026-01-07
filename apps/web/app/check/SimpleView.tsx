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
        <div className="glass p-8 rounded-3xl space-y-6 text-left">
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
}
