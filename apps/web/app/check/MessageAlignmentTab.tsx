import { MessageSquare, Search, Shield, AlertTriangle } from "lucide-react";

type MessageAlignmentTabProps = {
  mirrorReport: any;
};

export default function MessageAlignmentTab({ mirrorReport }: MessageAlignmentTabProps) {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-medium text-white">AI Misunderstanding Check</h3>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Alignment Score", val: Math.round(mirrorReport.summary?.alignmentScore || 0), color: "text-primary" },
          { label: "Clarity Score", val: Math.round(mirrorReport.summary?.clarityScore || 0), color: "text-primary" },
          { label: "Critical Issues", val: mirrorReport.summary?.critical || 0, color: "text-white/40" },
          { label: "Major Issues", val: mirrorReport.summary?.major || 0, color: "text-yellow-400" }
        ].map((s, i) => (
          <div key={i} className="glass p-6 rounded-2xl text-left">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2 ">{s.label}</p>
            <p className={`text-2xl font-display font-medium ${s.color}`}>{s.val}{['Alignment Score', 'Clarity Score'].includes(s.label) ? '/100' : ''}</p>
          </div>
        ))}
      </div>

      {mirrorReport.llmInterpretation && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white/40" />
            </div>
            <h4 className="text-sm font-medium text-white">What AI Actually Understood</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              {mirrorReport.llmInterpretation.productName && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/20">Product Name</p>
                  <p className="text-lg text-white font-medium">{mirrorReport.llmInterpretation.productName}</p>
                </div>
              )}
              {mirrorReport.llmInterpretation.purpose && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/20">Main Purpose</p>
                  <p className="text-sm text-white/80 leading-relaxed">{mirrorReport.llmInterpretation.purpose}</p>
                </div>
              )}
              {mirrorReport.llmInterpretation.targetAudience && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/20">Target Audience</p>
                  <p className="text-sm text-white/80">{mirrorReport.llmInterpretation.targetAudience}</p>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {mirrorReport.llmInterpretation.keyFeatures && mirrorReport.llmInterpretation.keyFeatures.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/20">Key Features</p>
                  <ul className="text-xs text-white/60 space-y-1">
                    {mirrorReport.llmInterpretation.keyFeatures.map((feature: string, i: number) => (
                      <li key={i}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mirrorReport.llmInterpretation.category && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/20">Category</p>
                  <p className="text-sm text-white/80">{mirrorReport.llmInterpretation.category}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mirrorReport.llmInterpretation?.commonQueries && mirrorReport.llmInterpretation.commonQueries.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-white/40" />
            <h4 className="text-sm font-medium text-white">AI Query Test</h4>
          </div>
          <div className="grid gap-4">
            {mirrorReport.llmInterpretation.commonQueries.map((query: any, i: number) => {
              const confidenceLevel = Math.round((query.confidence || 0) * 100);

              let confidenceText;
              let confidenceTextWithLevel;
              if (query.vague || query.hallucinated) {
                confidenceTextWithLevel = query.vague ? "Vague answer" : "Hallucinated answer";
              } else {
                if (confidenceLevel > 80) {
                  confidenceText = "High confidence";
                } else if (confidenceLevel > 50) {
                  confidenceText = "Medium confidence";
                } else {
                  confidenceText = "Low confidence";
                }
                confidenceTextWithLevel = `${confidenceText} (${confidenceLevel}%)`;
              }

              return (
                <div key={i} className={`p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 ${query.vague || query.hallucinated || (query.confidence && query.confidence < 0.6) ? 'border-yellow-500/20 bg-yellow-500/[0.02]' : ''
                  }`}>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-white">Q: {query.question}</p>
                    <span className={`text-[10px] font-mono ${query.confidence > 0.7 ? 'text-green-400' :
                      query.confidence > 0.5 ? 'text-yellow-500' : 'text-red-400'
                      }`}>
                      {confidenceTextWithLevel}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-light text-left">A: {query.answer}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mirrorReport.mismatches && mirrorReport.mismatches.length > 0 && (
        <div className="space-y-4">
          {mirrorReport.mismatches.map((mismatch: any, i: number) => (
            <div key={i} className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4">
              <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" />
                {mismatch.type || 'Mismatch Detected'}
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-light italic">
                {mismatch.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {!mirrorReport.llmInterpretation && !mirrorReport.mismatches && (
        <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
          <p className="text-sm text-white/60">
            Message alignment data not available. Enable LLM analysis to see how AI understands your content.
          </p>
        </div>
      )}
    </div>
  );
}
