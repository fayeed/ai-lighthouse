export default function ScoringGuide() {
  return (
    <div className="">
      <h3 className="text-xl font-medium text-white mb-8">📊 Understanding Your Score & Grade</h3>

      <div className="space-y-8">
        {/* How Score is Calculated */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">How the Score is Calculated</h4>
          <div className="glass p-8 rounded-3xl border-white/[0.05] space-y-4 text-sm">
            <p className="text-white/80 font-light leading-relaxed">Your AI Readiness Score (0-100) uses advanced scoring with dynamic weights and confidence tracking:</p>
            <ul className="list-disc list-inside space-y-2 text-white/60 ml-2 font-light">
              <li><strong className="text-white/80">Content Quality (30%):</strong> Clarity, structure, readability, and depth</li>
              <li><strong className="text-white/80">Comprehensibility (25%):</strong> How well AI understands your messaging and structure</li>
              <li><strong className="text-white/80">Extractability (20%):</strong> How easily AI can extract information from your HTML</li>
              <li><strong className="text-white/80">Discoverability (15%):</strong> How easily AI crawlers can find and index your content</li>
              <li><strong className="text-white/80">Trustworthiness (10%):</strong> Factual accuracy and hallucination prevention</li>
            </ul>
            <div className="mt-4 p-6 rounded-2xl bg-primary/[0.02] border border-primary/10">
              <p className="text-white/70 text-xs font-light leading-relaxed">
                <strong className="text-primary">Advanced Features:</strong> Weights automatically adjust based on data confidence. Scores use diminishing returns to prevent single issues from over-penalizing. Balance penalties apply if dimensions are uneven. ROI-based quick wins prioritize high-impact, low-effort fixes.
              </p>
            </div>
          </div>
        </div>

        {/* Grade Breakdown */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Grade Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border-l-2 border-blue-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-blue-400 text-lg mb-2">A+ (95-100)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Exceptional - Top 1% of sites. AI systems have perfect comprehension.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-blue-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-blue-400 text-lg mb-2">A (90-94)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Excellent - Well optimized with only minor improvements needed.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-blue-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-blue-400 text-lg mb-2">A- (85-89)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Very good - Minor improvements will reach excellence.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-green-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-green-400 text-lg mb-2">B+ (80-84)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Good - Solid foundation with some gaps to address.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-green-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-green-400 text-lg mb-2">B (75-79)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Above average - Multiple improvements will boost comprehension.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-yellow-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-yellow-400 text-lg mb-2">B- (70-74)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Average - Needs work in several areas.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-yellow-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-yellow-400 text-lg mb-2">C+ (65-69)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Below average - Multiple issues affecting AI understanding.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-orange-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-orange-400 text-lg mb-2">C (60-64)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Poor - Significant issues requiring attention.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-orange-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-orange-400 text-lg mb-2">C- (55-59)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Very poor - Major issues preventing AI comprehension.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-red-400 hover:border-l-primary transition-all">
              <div className="font-display font-medium text-red-400 text-lg mb-2">D (45-54)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Critical - Fundamental problems blocking AI understanding.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-l-2 border-red-400 hover:border-l-primary transition-all md:col-span-2">
              <div className="font-display font-medium text-red-400 text-lg mb-2">F (Below 45)</div>
              <p className="text-sm text-white/70 font-light leading-relaxed">Failing - Content is essentially unusable by AI. Immediate comprehensive overhaul required.</p>
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">What This Means For You</h4>
          <div className="glass p-8 rounded-3xl border-white/[0.05] space-y-3 text-sm text-white/70 font-light leading-relaxed">
            <p>• <strong className="text-white">A grades (85-100):</strong> AI chatbots like ChatGPT, Claude, and Perplexity accurately answer questions about your products/services with high confidence</p>
            <p>• <strong className="text-white">B grades (70-84):</strong> AI generally understands your content but may miss nuances or require clarification for complex topics</p>
            <p>• <strong className="text-white">C grades (55-69):</strong> AI frequently misses important details, may misunderstand key information, or require multiple attempts to extract facts</p>
            <p>• <strong className="text-white">D-F grades (Below 55):</strong> AI systems struggle to extract accurate information and may hallucinate facts when asked about your business, products, or services</p>
          </div>
        </div>

        {/* Statistical Context */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">📈 Statistical Context & Benchmarks</h4>
          <div className="glass p-8 rounded-3xl border-white/[0.05] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-6 rounded-2xl border-white/[0.05]">
                <div className="font-medium text-white mb-2">🏆 Best-in-Class (Top 5%)</div>
                <div className="text-3xl font-display font-medium text-blue-400 mb-1">92-100</div>
                <div className="text-xs text-white/60 font-light">AI-optimized sites that set the standard</div>
              </div>
              <div className="glass p-6 rounded-2xl border-white/[0.05]">
                <div className="font-medium text-white mb-2">✨ Excellent (Top 15%)</div>
                <div className="text-3xl font-display font-medium text-green-400 mb-1">85-91</div>
                <div className="text-xs text-white/60 font-light">Strong AI readiness, minimal issues</div>
              </div>
              <div className="glass p-6 rounded-2xl border-white/[0.05]">
                <div className="font-medium text-white mb-2">👍 Above Average</div>
                <div className="text-3xl font-display font-medium text-yellow-400 mb-1">75-84</div>
                <div className="text-xs text-white/60 font-light">Safe but improvable - good foundation</div>
              </div>
              <div className="glass p-6 rounded-2xl border-white/[0.05]">
                <div className="font-medium text-white mb-2">⚠️ Average (Most Sites)</div>
                <div className="text-3xl font-display font-medium text-orange-400 mb-1">60-74</div>
                <div className="text-xs text-white/60 font-light">Typical range - needs optimization</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 border-l-2 ">
              <div className="font-medium text-red-400 mb-2">🚨 Below 75: Likely misunderstood by AI systems</div>
              <div className="text-sm text-white/70 font-light leading-relaxed">
                Sites below this threshold often experience AI hallucinations, missed information, and poor representation in AI-powered answers.
              </div>
            </div>
          </div>
        </div>

        {/* What This Means Practically */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">🎯 Is This Good Enough to Ship?</h4>
          <div className="glass p-8 rounded-3xl border-white/[0.05] space-y-4 text-sm font-light">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-blue-400 font-display font-medium">90-100:</span>
              <span className="text-white/80 leading-relaxed">✅ Ship with confidence - AI will accurately represent your brand</span>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-green-400 font-display font-medium">75-89:</span>
              <span className="text-white/80 leading-relaxed">✅ Safe to ship - but prioritize quick wins for better results</span>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-orange-400 font-display font-medium">&lt;75:</span>
              <span className="text-white/80 leading-relaxed">⚠️ Address critical issues first - AI may misrepresent your content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
