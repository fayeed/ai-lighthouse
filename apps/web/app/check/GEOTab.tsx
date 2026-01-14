import { motion } from "framer-motion";
import { Bot, Eye, Quote, User, Globe, Shield, CheckCircle, XCircle, AlertCircle, Brain, AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type GEOTabProps = {
  geo: any;
  scanResult?: any; // For LLM analysis data
};

const MetricCard = ({ label, value, icon: Icon, color, subtext }: { label: string; value: string | number; icon: any; color: string; subtext?: string }) => (
  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05]">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</span>
    </div>
    <p className="text-xl sm:text-2xl font-display font-medium text-white">{value}</p>
    {subtext && <p className="text-[10px] text-white/40 mt-1">{subtext}</p>}
  </div>
);

const IssueItem = ({ issue }: { issue: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    className="glass p-4 rounded-xl border-white/[0.05] hover:border-white/10 transition-all"
  >
    <div className="flex items-start gap-3">
      {issue.type === 'critical' ? (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      ) : issue.type === 'warning' ? (
        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="space-y-1 flex-1">
        <p className="text-xs sm:text-sm text-white font-medium">{issue.title}</p>
        <p className="text-[11px] sm:text-xs text-white/50">{issue.description}</p>
        {issue.fix && (
          <p className="text-[10px] sm:text-[11px] text-primary/80 italic mt-2">Fix: {issue.fix}</p>
        )}
      </div>
    </div>
  </motion.div>
);

export default function GEOTab({ geo, scanResult }: GEOTabProps) {
  // Extract LLM analysis data
  const llm = scanResult?.llm || {};
  const hallucinationReport = scanResult?.hallucinationReport || {};

  if (!geo && !llm.summary) {
    return (
      <div className="text-center py-12 text-white/40">
        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Generative Engine Optimization analysis not available</p>
      </div>
    );
  }

  const {
    score = 0,
    grade = 'N/A',
    aiVisibility = {},
    citationPotential = {},
    contentAttribution = {},
    aiComprehension = {},
    knowledgeGraphOptimization = {},
    brandProtection = {},
    issues = [],
    recommendations = []
  } = geo || {};

  const hallucinationRiskScore = hallucinationReport?.hallucinationRiskScore || 0;
  const hallucinationTriggers = hallucinationReport?.triggers || [];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-medium text-white text-left">Generative Engine Optimization</h3>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            Optimization for AI systems like ChatGPT, Claude, and Perplexity to cite and reference your content
          </p>
        </div>
        <div className="glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">GEO Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-display font-medium text-white">{score}</span>
            <Badge variant="outline" className="text-xs border-white/20">{grade}</Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="AI Visibility"
          value={`${aiVisibility.score || 0}%`}
          icon={Eye}
          color="bg-blue-500/20 text-blue-400"
          subtext={aiVisibility.crawlable ? 'Crawlable' : 'Not crawlable'}
        />
        <MetricCard
          label="Citation Potential"
          value={`${citationPotential.score || 0}%`}
          icon={Quote}
          color="bg-purple-500/20 text-purple-400"
        />
        <MetricCard
          label="Hallucination Risk"
          value={`${100 - hallucinationRiskScore}%`}
          icon={AlertTriangle}
          color={hallucinationRiskScore > 50 ? "bg-red-500/20 text-red-400" : hallucinationRiskScore > 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}
          subtext={hallucinationRiskScore > 50 ? 'High risk' : hallucinationRiskScore > 25 ? 'Medium risk' : 'Low risk'}
        />
        <MetricCard
          label="Clarity Score"
          value={`${aiComprehension.clarityScore || 0}%`}
          icon={Bot}
          color="bg-orange-500/20 text-orange-400"
        />
      </div>

      {/* AI Content Understanding Section */}
      {llm.summary && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            How AI Understands Your Content
          </h4>
          <p className="text-sm text-white/70 leading-relaxed">{llm.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
            {llm.pageType && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Page Type</p>
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400/30">{llm.pageType}</Badge>
              </div>
            )}
            {llm.sentiment && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Sentiment</p>
                <Badge variant="outline" className={`text-xs ${llm.sentiment === 'positive' ? 'text-green-400 border-green-400/30' : llm.sentiment === 'negative' ? 'text-red-400 border-red-400/30' : 'text-white/60 border-white/20'}`}>
                  {llm.sentiment}
                </Badge>
              </div>
            )}
            {llm.technicalDepth && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Technical Depth</p>
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">{llm.technicalDepth}</Badge>
              </div>
            )}
            {llm.structureQuality && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Structure Quality</p>
                <Badge variant="outline" className={`text-xs ${llm.structureQuality === 'excellent' || llm.structureQuality === 'good' ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                  {llm.structureQuality}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Topics & Entities */}
      {(llm.keyTopics?.length > 0 || llm.topEntities?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {llm.keyTopics?.length > 0 && (
            <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Key Topics Detected
              </h4>
              <div className="flex flex-wrap gap-2">
                {llm.keyTopics.map((topic: string, idx: number) => (
                  <span key={idx} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {llm.topEntities?.length > 0 && (
            <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Entities Recognized
              </h4>
              <div className="space-y-2">
                {llm.topEntities.slice(0, 6).map((entity: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{entity.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] text-white/40 border-white/20">{entity.type}</Badge>
                      <span className="text-[10px] text-white/30">{Math.round((entity.relevance || 0) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hallucination Risk Section */}
      {hallucinationTriggers.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Hallucination Risk Triggers ({hallucinationTriggers.length})
          </h4>
          <p className="text-xs text-white/50">Content that AI systems may misinterpret or fabricate information about</p>
          <div className="space-y-3">
            {hallucinationTriggers.slice(0, 5).map((trigger: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${
                    trigger.severity === 'critical' || trigger.severity === 'high' ? 'text-red-400 border-red-400/30' :
                    trigger.severity === 'medium' ? 'text-yellow-400 border-yellow-400/30' : 'text-blue-400 border-blue-400/30'
                  }`}>
                    {trigger.severity}
                  </Badge>
                  <p className="text-xs text-white/60">{trigger.description}</p>
                </div>
              </div>
            ))}
          </div>
          {hallucinationReport?.recommendations?.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Recommendations</p>
              <ul className="space-y-1">
                {hallucinationReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx} className="text-xs text-white/50 flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Page Type Insights */}
      {llm.pageTypeInsights?.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            AI Recommendations for {llm.pageType || 'This Page'}
          </h4>
          <ul className="space-y-2">
            {llm.pageTypeInsights.map((insight: string, idx: number) => (
              <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* AI Visibility */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            AI Visibility
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Crawlable</span>
              <Badge variant="outline" className={`text-[10px] ${aiVisibility.crawlable ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {aiVisibility.crawlable ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Extractable</span>
              <Badge variant="outline" className={`text-[10px] ${aiVisibility.extractable ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {aiVisibility.extractable ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Semantically Rich</span>
              <Badge variant="outline" className={`text-[10px] ${aiVisibility.semanticallyRich ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {aiVisibility.semanticallyRich ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Structured Data</span>
              <Badge variant="outline" className={`text-[10px] ${aiVisibility.structuredDataPresent ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {aiVisibility.structuredDataPresent ? 'Present' : 'Missing'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Attribution */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <User className="w-4 h-4" />
            Content Attribution
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Author Present</span>
              <Badge variant="outline" className={`text-[10px] ${contentAttribution.hasAuthor ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {contentAttribution.hasAuthor ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Publish Date</span>
              <Badge variant="outline" className={`text-[10px] ${contentAttribution.hasPublishDate ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {contentAttribution.hasPublishDate ? 'Present' : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Source Links</span>
              <Badge variant="outline" className={`text-[10px] ${contentAttribution.hasSourceLinks ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {contentAttribution.hasSourceLinks ? 'Present' : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Authority Score</span>
              <span className="text-xs text-white">{contentAttribution.authorityScore || 0}%</span>
            </div>
          </div>
        </div>

        {/* Citation Potential */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Quote className="w-4 h-4" />
            Citation Potential
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Authority Signals</span>
              <Badge variant="outline" className={`text-[10px] ${citationPotential.hasAuthoritySignals ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {citationPotential.hasAuthoritySignals ? 'Present' : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Unique Insights</span>
              <Badge variant="outline" className={`text-[10px] ${citationPotential.hasUniqueInsights ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {citationPotential.hasUniqueInsights ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Data Points</span>
              <Badge variant="outline" className={`text-[10px] ${citationPotential.hasDataPoints ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {citationPotential.hasDataPoints ? 'Present' : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Expert Quotes</span>
              <Badge variant="outline" className={`text-[10px] ${citationPotential.hasExpertQuotes ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {citationPotential.hasExpertQuotes ? 'Present' : 'Missing'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Brand Protection */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Brand Protection
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Brand Mentions</span>
              <span className="text-xs text-white">{brandProtection.brandMentions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Consistent Messaging</span>
              <Badge variant="outline" className={`text-[10px] ${brandProtection.consistentMessaging ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {brandProtection.consistentMessaging ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Competitor Mentions</span>
              <span className={`text-xs ${(brandProtection.competitorMentions || 0) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {brandProtection.competitorMentions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Messaging Clarity</span>
              <span className="text-xs text-white">{brandProtection.messagingClarity || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Issues ({issues.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {issues.slice(0, 6).map((issue: any, idx: number) => (
              <IssueItem key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary">Recommendations</h4>
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
