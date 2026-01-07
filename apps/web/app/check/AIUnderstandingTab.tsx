import { Eye, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type AIUnderstandingTabProps = {
  scanResult: any;
};

export default function AIUnderstandingTab({ scanResult }: AIUnderstandingTabProps) {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-medium text-white">AI Understanding</h3>
        </div>
        {scanResult.llm?.pageType && (
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary border-primary/20 capitalize">
              {scanResult.llm.pageType}
            </Badge>
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">Inferred Page Type</span>
          </div>
        )}
      </div>

      {scanResult.llm?.pageTypeInsights && scanResult.llm.pageTypeInsights.length > 0 && (
        <div className="p-8 rounded-3xl bg-primary/[0.02] border border-primary/10 space-y-6">
          <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            AI-generated Insights for {scanResult.llm.pageType}
          </div>
          <ul className="text-sm text-white/80 space-y-4 list-disc list-inside font-light leading-relaxed text-left">
            {scanResult.llm.pageTypeInsights.map((insight: string, i: number) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {scanResult.llm?.summary && (
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Summary</h4>
          <p className="text-base text-white/80 leading-relaxed font-light text-left">
            {scanResult.llm.summary}
          </p>
        </div>
      )}

      {scanResult.llm?.keyTopics && scanResult.llm.keyTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scanResult.llm.keyTopics.map((topic: string, i: number) => (
            <Badge key={i} variant="outline" className="border-white/5 text-primary text-[10px] lowercase px-3 py-1 bg-white/[0.02]">
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {(scanResult.llm?.readingLevel || scanResult.llm?.sentiment || scanResult.llm?.technicalDepth) && (
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Reading Level", val: scanResult.llm.readingLevel?.description || "N/A" },
            { label: "Sentiment", val: scanResult.llm.sentiment || "N/A" },
            { label: "Technical Depth", val: scanResult.llm.technicalDepth || "N/A" }
          ].filter(stat => stat.val !== "N/A").map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-2 text-left">{stat.label}</p>
              <p className="text-lg text-white font-medium capitalize text-left">{stat.val}</p>
            </div>
          ))}
        </div>
      )}

      {scanResult.llm?.topEntities && scanResult.llm.topEntities.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Key Entities</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {scanResult.llm.topEntities.slice(0, 6).map((entity: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-sm font-medium text-white text-left">{entity.name}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 text-left">
                  {entity.type} · {Math.round((entity.relevance || 0) * 100)}% relevance
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scanResult.llm?.suggestedFAQ && scanResult.llm.suggestedFAQ.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-left">Suggested FAQs</h4>
          <div className="grid gap-4">
            {scanResult.llm.suggestedFAQ.map((faq: any, i: number) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-4 group hover:bg-white/[0.04] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-white text-left">Q: {faq.question}</span>
                  <Badge variant="outline" className={`text-[8px] uppercase font-bold border-white/5 ${faq.importance === 'high' ? 'text-primary' : 'text-white/40'}`}>
                    {faq.importance || 'medium'} Priority
                  </Badge>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-light text-left">A: {faq.suggestedAnswer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!scanResult.llm && (
        <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
          <p className="text-sm text-white/60">
            AI-powered analysis not available. Enable LLM analysis to see detailed insights, summaries, and FAQs.
          </p>
        </div>
      )}
    </div>
  );
}
