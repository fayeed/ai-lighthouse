import { motion } from "framer-motion";
import { Search, Link, Image, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type SEOTabProps = {
  seo: any;
};

const ScoreCard = ({ label, score, icon: Icon, color }: { label: string; score: number; icon: any; color: string }) => (
  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05]">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl sm:text-3xl font-display font-medium text-white">{score}</span>
      <span className="text-white/20 text-sm mb-1">/100</span>
    </div>
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

export default function SEOTab({ seo }: SEOTabProps) {
  if (!seo) {
    return (
      <div className="text-center py-12 text-white/40">
        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>SEO analysis not available</p>
      </div>
    );
  }

  const { score, grade, meta, headings, links, images, technical, issues = [], recommendations = [] } = seo;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-medium text-white text-left">SEO Analysis</h3>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            Traditional search engine optimization for Google, Bing, and other search engines
          </p>
        </div>
        <div className="glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">SEO Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-display font-medium text-white">{score}</span>
            <Badge variant="outline" className="text-xs border-white/20">{grade}</Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <ScoreCard label="Meta Tags" score={meta?.score || 0} icon={FileText} color="bg-blue-500/20 text-blue-400" />
        <ScoreCard label="Headings" score={headings?.score || 0} icon={Search} color="bg-purple-500/20 text-purple-400" />
        <ScoreCard label="Links" score={links?.score || 0} icon={Link} color="bg-green-500/20 text-green-400" />
        <ScoreCard label="Images" score={images?.score || 0} icon={Image} color="bg-orange-500/20 text-orange-400" />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Meta Information */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Meta Information
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Title</span>
              <span className="text-xs text-white">{meta?.title ? `${meta.title.length} chars` : 'Missing'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Description</span>
              <span className="text-xs text-white">{meta?.description ? `${meta.description.length} chars` : 'Missing'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Canonical URL</span>
              <span className="text-xs text-white">{meta?.hasCanonical ? 'Present' : 'Missing'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Open Graph</span>
              <span className="text-xs text-white">{meta?.hasOpenGraph ? 'Present' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {/* Link Statistics */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Link className="w-4 h-4" />
            Link Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Internal Links</span>
              <span className="text-xs text-white">{links?.internal || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">External Links</span>
              <span className="text-xs text-white">{links?.external || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Broken Links</span>
              <span className={`text-xs ${links?.broken > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {links?.broken || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Nofollow Links</span>
              <span className="text-xs text-white">{links?.nofollow || 0}</span>
            </div>
          </div>
        </div>

        {/* Image Statistics */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Total Images</span>
              <span className="text-xs text-white">{images?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">With Alt Text</span>
              <span className="text-xs text-green-400">{images?.withAlt || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Without Alt Text</span>
              <span className={`text-xs ${images?.withoutAlt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {images?.withoutAlt || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Heading Structure */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Heading Structure
          </h4>
          <div className="space-y-3">
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => (
              <div key={h} className="flex justify-between items-center">
                <span className="text-xs text-white/60 uppercase">{h}</span>
                <span className="text-xs text-white">{headings?.counts?.[h] || 0}</span>
              </div>
            ))}
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
