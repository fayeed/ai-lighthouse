import { Code, FileText, Shield, CheckCircle2 } from "lucide-react";

type TechnicalTabProps = {
  auditReport: any;
  chunking: any;
};

export default function TechnicalTab({ auditReport, chunking }: TechnicalTabProps) {
  return (
    <div className="space-y-12">
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
    </div>
  );
}
