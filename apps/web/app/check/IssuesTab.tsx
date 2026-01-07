import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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

type IssuesTabProps = {
  issues: any[];
  overallScore: number;
  aiReadiness: any;
};

export default function IssuesTab({ issues, overallScore, aiReadiness }: IssuesTabProps) {
  const criticalIssues = issues.filter((i: any) => i.severity === 'critical').length;
  const highIssues = issues.filter((i: any) => i.severity === 'high').length;
  const mediumIssues = issues.filter((i: any) => i.severity === 'medium').length;
  const lowIssues = issues.filter((i: any) => i.severity === 'low').length;

  return (
    <div className="space-y-12">
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
    </div>
  );
}
