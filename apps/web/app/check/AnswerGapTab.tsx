import { motion } from "framer-motion";
import { HelpCircle, Target, AlertTriangle, CheckCircle, XCircle, TrendingUp, Layers, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type AnswerGapTabProps = {
  answerGap: any;
  scanResult?: any;
  enableLLM?: boolean;
};

const MetricCard = ({ label, value, icon: Icon, color, subtext }: { label: string; value: string | number; icon: any; color: string; subtext?: string }) => (
  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05]">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xl sm:text-2xl font-display font-medium text-white">{value}</span>
    </div>
    {subtext && <p className="text-[10px] text-white/40 mt-1">{subtext}</p>}
  </div>
);

const GapItem = ({ gap }: { gap: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    className="glass p-4 rounded-xl border-white/[0.05] hover:border-white/10 transition-all"
  >
    <div className="flex items-start gap-3">
      {gap.severity === 'critical' ? (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      ) : gap.severity === 'important' ? (
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      ) : (
        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="space-y-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs sm:text-sm text-white font-medium">{gap.question}</p>
          <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${
            gap.severity === 'critical' ? 'text-red-400 border-red-400/30' :
            gap.severity === 'important' ? 'text-yellow-400 border-yellow-400/30' :
            'text-blue-400 border-blue-400/30'
          }`}>
            {gap.severity}
          </Badge>
        </div>
        <p className="text-[11px] sm:text-xs text-white/50">{gap.reason}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] text-white/40 border-white/20">
            {gap.intent}
          </Badge>
        </div>
        {gap.suggestedContent && (
          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-primary/80 flex items-start gap-1">
              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{gap.suggestedContent}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const StrengthItem = ({ strength }: { strength: any }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
    <div className="space-y-1 flex-1">
      <p className="text-xs text-white/80">{strength.question}</p>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30">
          {strength.quality}
        </Badge>
        <span className="text-[9px] text-white/40">{strength.topic}</span>
      </div>
    </div>
  </div>
);

const TopicClusterItem = ({ cluster }: { cluster: any }) => {
  const statusColors = {
    complete: 'text-green-400 border-green-400/30 bg-green-500/10',
    partial: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
    weak: 'text-orange-400 border-orange-400/30 bg-orange-500/10',
    missing: 'text-red-400 border-red-400/30 bg-red-500/10',
  };

  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white font-medium capitalize">{cluster.topic}</span>
        <Badge variant="outline" className={`text-[9px] ${statusColors[cluster.status as keyof typeof statusColors] || statusColors.missing}`}>
          {cluster.status}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                cluster.coverageScore >= 80 ? 'bg-green-500' :
                cluster.coverageScore >= 50 ? 'bg-yellow-500' :
                cluster.coverageScore > 0 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${cluster.coverageScore}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-white/40 w-12 text-right">{cluster.coverageScore}%</span>
      </div>
      <p className="text-[10px] text-white/40 mt-2">
        {cluster.questionsAnswered} of {cluster.questionsIdentified} questions answered
      </p>
    </div>
  );
};

export default function AnswerGapTab({ answerGap, scanResult, enableLLM = true }: AnswerGapTabProps) {
  if (!answerGap) {
    return (
      <div className="text-center py-12 text-white/40">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Answer Gap analysis not available</p>
      </div>
    );
  }

  const {
    score = 0,
    grade = 'N/A',
    topicCoverage = {},
    suggestedQuestions = [],
    gaps = [],
    strengths = [],
    topicClusters = [],
    issues = [],
    recommendations = []
  } = answerGap;

  const criticalGaps = gaps.filter((g: any) => g.severity === 'critical');
  const importantGaps = gaps.filter((g: any) => g.severity === 'important');
  const answeredCount = suggestedQuestions.filter((q: any) => q.status === 'answered').length;
  const weakCount = suggestedQuestions.filter((q: any) => q.status === 'weak').length;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-medium text-white text-left">Answer Gap Analysis</h3>
            <Badge variant="outline" className="text-[9px] text-primary border-primary/30 bg-primary/10">
              Content Strategy
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            Identifies questions your site should answer and shows which are missing or weak
          </p>
        </div>
        <div className="glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">Coverage Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-display font-medium text-white">{score}</span>
            <Badge variant="outline" className="text-xs border-white/20">{grade}</Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Topic Coverage"
          value={`${topicCoverage.coveragePercentage || 0}%`}
          icon={Layers}
          color="bg-purple-500/20 text-purple-400"
          subtext={`${topicCoverage.coveredTopics || 0} of ${topicCoverage.identifiedTopics || 0} topics`}
        />
        <MetricCard
          label="Questions Answered"
          value={answeredCount}
          icon={CheckCircle}
          color="bg-green-500/20 text-green-400"
          subtext={`${weakCount} weak answers`}
        />
        <MetricCard
          label="Critical Gaps"
          value={criticalGaps.length}
          icon={XCircle}
          color="bg-red-500/20 text-red-400"
          subtext="High priority to fix"
        />
        <MetricCard
          label="Content Opportunities"
          value={gaps.length}
          icon={TrendingUp}
          color="bg-blue-500/20 text-blue-400"
          subtext="Questions to address"
        />
      </div>

      {/* Critical Gaps Section */}
      {criticalGaps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-red-400">
              Critical Gaps ({criticalGaps.length})
            </h4>
          </div>
          <p className="text-xs text-white/50">These are high-priority questions that users are likely asking but your content doesn't answer</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalGaps.slice(0, 6).map((gap: any, idx: number) => (
              <GapItem key={idx} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Important Gaps Section */}
      {importantGaps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">
              Important Gaps ({importantGaps.length})
            </h4>
          </div>
          <p className="text-xs text-white/50">These questions should be addressed to improve content completeness</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {importantGaps.slice(0, 4).map((gap: any, idx: number) => (
              <GapItem key={idx} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Topic Clusters */}
      {topicClusters.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Topic Coverage by Cluster
          </h4>
          <p className="text-xs text-white/50">How well each topic area is covered with answers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topicClusters.slice(0, 9).map((cluster: any, idx: number) => (
              <TopicClusterItem key={idx} cluster={cluster} />
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions Overview */}
      <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Questions Your Site Should Answer
        </h4>
        <p className="text-xs text-white/50">Based on your content and industry, these are the key questions users expect answers to</p>
        <div className="space-y-2">
          {suggestedQuestions.slice(0, 10).map((q: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
              {q.status === 'answered' ? (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : q.status === 'weak' ? (
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="text-xs text-white/70 flex-1">{q.question}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[9px] ${
                  q.priority === 'high' ? 'text-red-400 border-red-400/30' :
                  q.priority === 'medium' ? 'text-yellow-400 border-yellow-400/30' :
                  'text-blue-400 border-blue-400/30'
                }`}>
                  {q.priority}
                </Badge>
                <Badge variant="outline" className="text-[9px] text-white/40 border-white/20">
                  {q.intent}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Content Strengths ({strengths.length})
          </h4>
          <p className="text-xs text-white/50">Questions that are well-answered on your page</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strengths.slice(0, 6).map((strength: any, idx: number) => (
              <StrengthItem key={idx} strength={strength} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendations.slice(0, 5).map((rec: string, idx: number) => (
              <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
