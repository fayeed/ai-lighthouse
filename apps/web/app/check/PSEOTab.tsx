import { motion } from "framer-motion";
import { Code, FileCode, Link2, Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type PSEOTabProps = {
  pseo: any;
};

const MetricCard = ({ label, value, subtext, color }: { label: string; value: string | number; subtext?: string; color: string }) => (
  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05]">
    <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">{label}</p>
    <p className={`text-xl sm:text-2xl font-display font-medium ${color}`}>{value}</p>
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

export default function PSEOTab({ pseo }: PSEOTabProps) {
  if (!pseo) {
    return (
      <div className="text-center py-12 text-white/40">
        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Programmatic SEO analysis not available</p>
      </div>
    );
  }

  const {
    score,
    grade,
    templateSignals = {},
    contentUniqueness = {},
    keywordOptimization = {},
    internalLinking = {},
    schemaReadiness = {},
    issues = [],
    recommendations = []
  } = pseo;

  const uniquenessPercent = Math.round((contentUniqueness.uniqueContentRatio || 0) * 100);
  const boilerplatePercent = Math.round((contentUniqueness.boilerplateRatio || 0) * 100);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-medium text-white text-left">Programmatic SEO</h3>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            Analysis of scalable, template-based content patterns for large-scale SEO
          </p>
        </div>
        <div className="glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">PSEO Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-display font-medium text-white">{score}</span>
            <Badge variant="outline" className="text-xs border-white/20">{grade}</Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Content Uniqueness"
          value={`${uniquenessPercent}%`}
          subtext={uniquenessPercent >= 70 ? 'Good' : 'Needs work'}
          color={uniquenessPercent >= 70 ? 'text-green-400' : 'text-yellow-400'}
        />
        <MetricCard
          label="Boilerplate"
          value={`${boilerplatePercent}%`}
          subtext={boilerplatePercent <= 40 ? 'Acceptable' : 'Too high'}
          color={boilerplatePercent <= 40 ? 'text-green-400' : 'text-red-400'}
        />
        <MetricCard
          label="Template Confidence"
          value={`${Math.round((templateSignals.templateConfidence || 0) * 100)}%`}
          color="text-blue-400"
        />
        <MetricCard
          label="Internal Links"
          value={internalLinking.linksToOtherPages || 0}
          subtext={internalLinking.hubPagePotential ? 'Hub potential' : ''}
          color="text-purple-400"
        />
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Template Signals */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Template Signals
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Consistent Structure</span>
              <Badge variant="outline" className={`text-[10px] ${templateSignals.hasConsistentStructure ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {templateSignals.hasConsistentStructure ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Dynamic Content</span>
              <Badge variant="outline" className={`text-[10px] ${templateSignals.hasDynamicContent ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {templateSignals.hasDynamicContent ? 'Detected' : 'None'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Placeholder Patterns</span>
              <Badge variant="outline" className={`text-[10px] ${templateSignals.hasPlaceholderPatterns ? 'text-yellow-400 border-yellow-400/30' : 'text-white/40 border-white/20'}`}>
                {templateSignals.hasPlaceholderPatterns ? 'Found' : 'None'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Keyword Optimization */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Keyword Optimization
          </h4>
          <div className="space-y-3">
            {keywordOptimization.primaryKeyword && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Primary Keyword</span>
                <span className="text-xs text-white font-mono">{keywordOptimization.primaryKeyword}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Keyword Density</span>
              <span className={`text-xs ${keywordOptimization.keywordDensity > 3 ? 'text-red-400' : 'text-white'}`}>
                {keywordOptimization.keywordDensity?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">In Title</span>
              <Badge variant="outline" className={`text-[10px] ${keywordOptimization.keywordInTitle ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {keywordOptimization.keywordInTitle ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">In H1</span>
              <Badge variant="outline" className={`text-[10px] ${keywordOptimization.keywordInH1 ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {keywordOptimization.keywordInH1 ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Internal Linking */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Internal Linking
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Links to Other Pages</span>
              <span className="text-xs text-white">{internalLinking.linksToOtherPages || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Pattern-based Links</span>
              <Badge variant="outline" className={`text-[10px] ${internalLinking.linksFromPattern ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {internalLinking.linksFromPattern ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Hub Page Potential</span>
              <Badge variant="outline" className={`text-[10px] ${internalLinking.hubPagePotential ? 'text-purple-400 border-purple-400/30' : 'text-white/40 border-white/20'}`}>
                {internalLinking.hubPagePotential ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Schema Readiness */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Schema Readiness
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Has Schema</span>
              <Badge variant="outline" className={`text-[10px] ${schemaReadiness.hasSchema ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {schemaReadiness.hasSchema ? 'Yes' : 'No'}
              </Badge>
            </div>
            {schemaReadiness.schemaTypes?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-white/60">Schema Types</span>
                <div className="flex flex-wrap gap-1">
                  {schemaReadiness.schemaTypes.map((type: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-[9px] text-purple-400 border-purple-400/30">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {schemaReadiness.suggestedSchemas?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-white/60">Suggested Schemas</span>
                <div className="flex flex-wrap gap-1">
                  {schemaReadiness.suggestedSchemas.map((type: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/30">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Uniqueness Details */}
      {contentUniqueness.duplicatePhrases?.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Duplicate Phrases Found</h4>
          <div className="flex flex-wrap gap-2">
            {contentUniqueness.duplicatePhrases.slice(0, 8).map((phrase: string, idx: number) => (
              <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400/80 font-mono">
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

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
