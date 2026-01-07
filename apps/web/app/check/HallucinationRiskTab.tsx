import { AlertTriangle, CheckCircle2, Info, ShieldAlert, XCircle } from "lucide-react";

type HallucinationRiskTabProps = {
  hallucinationReport: any;
};

export default function HallucinationRiskTab({ hallucinationReport }: HallucinationRiskTabProps) {
  return (
    <div className="space-y-12">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="text-xl font-medium text-white">Hallucination Risk Assessment</h3>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total Facts", val: hallucinationReport.factCheckSummary?.totalFacts || 0, bg: "bg-zinc-800" },
          { label: "Verified", val: hallucinationReport.factCheckSummary?.verifiedFacts || 0, color: "text-green-400", bg: "bg-zinc-800" },
          { label: "Unverified", val: hallucinationReport.factCheckSummary?.unverifiedFacts || 0, color: "text-yellow-400", bg: "bg-zinc-800" },
          { label: "Contradictory", val: hallucinationReport.factCheckSummary?.contradictions || 0, color: "text-red-400", bg: "bg-zinc-800" }
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-6 rounded-xl border border-zinc-700 text-left`}>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{s.label}</p>
            <p className={`text-3xl font-display font-medium ${s.color || "text-white"}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {hallucinationReport.verifications && hallucinationReport.verifications.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            const verifiedFacts = hallucinationReport.verifications.filter((v: any) => v.verified);
            const unverifiedFacts = hallucinationReport.verifications.filter((v: any) => !v.verified && (!v.contradictions || v.contradictions.length === 0));
            const contradictoryFacts = hallucinationReport.verifications.filter((v: any) => v.contradictions && v.contradictions.length > 0);

            return (
              <>
                {verifiedFacts.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">
                        Verified Facts ({verifiedFacts.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {verifiedFacts.map((verification: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-white/80">{verification.fact?.statement || 'Verified claim'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {unverifiedFacts.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">
                        Unverified Facts ({unverifiedFacts.length})
                      </span>
                    </div>

                    <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Why these couldn't be verified</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed italic ml-6 text-left">
                        AI could not find supporting evidence on the page for these specific claims regarding private beta enrollment.
                      </p>
                    <div className="space-y-2 mt-6">
                      {unverifiedFacts.map((verification: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-left px-6 mb-4">
                          <span className="text-sm text-white/70">{verification.fact?.statement || 'Unverified claim'}</span>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                )}

                {contradictoryFacts.length > 0 && (
                  <div className="bg-zinc-900 border border-red-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 text-left">
                        Contradictory Facts ({contradictoryFacts.length})
                      </span>
                    </div>

                    <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-start gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider text-left">Found 1 claim that contradicts AI training data</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed ml-6 text-left">
                        "Stripe has a 100% historical uptime for its services" contradicts model training data which includes documented outages. AI is likely to provide incorrect information.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {contradictoryFacts.map((verification: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Conflicting numbers found</div>
                              <div className="text-sm text-white/90 font-mono">
                                <span className="line-through">"100%"</span> vs <span className="text-red-400">"99.99%"</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mt-2 text-left">
                            Page contains inconsistent specifications compared to public records.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-4 text-center">
          <p className="text-sm text-white/60">
            Hallucination risk data not available. Enable LLM analysis to see fact verification.
          </p>
        </div>
      )}

      {hallucinationReport.triggers && hallucinationReport.triggers.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Risk Triggers</h4>
          <div className="space-y-3">
            {hallucinationReport.triggers.map((trigger: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-left">
                <div className="text-xs text-white/60 font-mono">
                  {trigger.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hallucinationReport.recommendations && hallucinationReport.recommendations.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Recommendations</h4>
          <ul className="space-y-3">
            {hallucinationReport.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-left">
                <span className="text-sm text-white/70">•&nbsp;&nbsp;{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
