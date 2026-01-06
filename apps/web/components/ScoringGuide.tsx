export default function ScoringGuide() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8 animate-fade-in-up">
      <h3 className="text-xl font-bold text-white mb-4">📊 Understanding Your Score & Grade</h3>

      <div className="space-y-6">
        {/* How Score is Calculated */}
        <div>
          <h4 className="font-semibold text-white mb-2">How the Score is Calculated:</h4>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2 text-sm">
            <p className="text-gray-300">Your AI Readiness Score (0-100) uses advanced scoring with dynamic weights and confidence tracking:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
              <li><strong className="text-gray-300">Content Quality (30%):</strong> Clarity, structure, readability, and depth</li>
              <li><strong className="text-gray-300">Comprehensibility (25%):</strong> How well AI understands your messaging and structure</li>
              <li><strong className="text-gray-300">Extractability (20%):</strong> How easily AI can extract information from your HTML</li>
              <li><strong className="text-gray-300">Discoverability (15%):</strong> How easily AI crawlers can find and index your content</li>
              <li><strong className="text-gray-300">Trustworthiness (10%):</strong> Factual accuracy and hallucination prevention</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded border-l-4 border-l-blue-500">
              <p className="text-gray-300 text-xs">
                <strong>Advanced Features:</strong> Weights automatically adjust based on data confidence. Scores use diminishing returns to prevent single issues from over-penalizing. Balance penalties apply if dimensions are uneven. ROI-based quick wins prioritize high-impact, low-effort fixes.
              </p>
            </div>
          </div>
        </div>

        {/* Grade Breakdown */}
        <div>
          <h4 className="font-semibold text-white mb-2">Grade Breakdown:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded border border-blue-500/20">
              <div className="font-bold text-blue-400">A+ (95-100)</div>
              <p className="text-sm text-gray-300 mt-1">Exceptional - Top 1% of sites. AI systems have perfect comprehension.</p>
            </div>
            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded border border-blue-500/20">
              <div className="font-bold text-blue-400">A (90-94)</div>
              <p className="text-sm text-gray-300 mt-1">Excellent - Well optimized with only minor improvements needed.</p>
            </div>
            <div className="bg-blue-500/10 border-l-4 border-blue-400 p-3 rounded border border-blue-500/20">
              <div className="font-bold text-blue-400">A- (85-89)</div>
              <p className="text-sm text-gray-300 mt-1">Very good - Minor improvements will reach excellence.</p>
            </div>
            <div className="bg-green-500/10 border-l-4 border-green-500 p-3 rounded border border-green-500/20">
              <div className="font-bold text-green-400">B+ (80-84)</div>
              <p className="text-sm text-gray-300 mt-1">Good - Solid foundation with some gaps to address.</p>
            </div>
            <div className="bg-green-500/10 border-l-4 border-green-500 p-3 rounded border border-green-500/20">
              <div className="font-bold text-green-400">B (75-79)</div>
              <p className="text-sm text-gray-300 mt-1">Above average - Multiple improvements will boost comprehension.</p>
            </div>
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded border border-yellow-500/20">
              <div className="font-bold text-yellow-400">B- (70-74)</div>
              <p className="text-sm text-gray-300 mt-1">Average - Needs work in several areas.</p>
            </div>
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded border border-yellow-500/20">
              <div className="font-bold text-yellow-400">C+ (65-69)</div>
              <p className="text-sm text-gray-300 mt-1">Below average - Multiple issues affecting AI understanding.</p>
            </div>
            <div className="bg-orange-500/10 border-l-4 border-orange-500 p-3 rounded border border-orange-500/20">
              <div className="font-bold text-orange-400">C (60-64)</div>
              <p className="text-sm text-gray-300 mt-1">Poor - Significant issues requiring attention.</p>
            </div>
            <div className="bg-orange-500/10 border-l-4 border-orange-500 p-3 rounded border border-orange-500/20">
              <div className="font-bold text-orange-400">C- (55-59)</div>
              <p className="text-sm text-gray-300 mt-1">Very poor - Major issues preventing AI comprehension.</p>
            </div>
            <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded border border-red-500/20">
              <div className="font-bold text-red-400">D (45-54)</div>
              <p className="text-sm text-gray-300 mt-1">Critical - Fundamental problems blocking AI understanding.</p>
            </div>
            <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded border border-red-500/20 md:col-span-2">
              <div className="font-bold text-red-400">F (Below 45)</div>
              <p className="text-sm text-gray-300 mt-1">Failing - Content is essentially unusable by AI. Immediate comprehensive overhaul required.</p>
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div>
          <h4 className="font-semibold text-white mb-2">What This Means For You:</h4>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2 text-sm text-gray-300">
            <p>• <strong className="text-white">A grades (85-100):</strong> AI chatbots like ChatGPT, Claude, and Perplexity accurately answer questions about your products/services with high confidence</p>
            <p>• <strong className="text-white">B grades (70-84):</strong> AI generally understands your content but may miss nuances or require clarification for complex topics</p>
            <p>• <strong className="text-white">C grades (55-69):</strong> AI frequently misses important details, may misunderstand key information, or require multiple attempts to extract facts</p>
            <p>• <strong className="text-white">D-F grades (Below 55):</strong> AI systems struggle to extract accurate information and may hallucinate facts when asked about your business, products, or services</p>
          </div>
        </div>

        {/* Statistical Context */}
        <div>
          <h4 className="font-semibold text-white mb-2">📈 Statistical Context & Benchmarks:</h4>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                <div className="font-semibold text-white">🏆 Best-in-Class (Top 5%)</div>
                <div className="text-2xl font-bold text-blue-400">92-100</div>
                <div className="text-xs text-gray-400 mt-1">AI-optimized sites that set the standard</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                <div className="font-semibold text-white">✨ Excellent (Top 15%)</div>
                <div className="text-2xl font-bold text-green-400">85-91</div>
                <div className="text-xs text-gray-400 mt-1">Strong AI readiness, minimal issues</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                <div className="font-semibold text-white">👍 Above Average</div>
                <div className="text-2xl font-bold text-yellow-400">75-84</div>
                <div className="text-xs text-gray-400 mt-1">Safe but improvable - good foundation</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded">
                <div className="font-semibold text-white">⚠️ Average (Most Sites)</div>
                <div className="text-2xl font-bold text-orange-400">60-74</div>
                <div className="text-xs text-gray-400 mt-1">Typical range - needs optimization</div>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded border-l-4 border-l-red-500">
              <div className="font-semibold text-red-400">🚨 Below 75: Likely misunderstood by AI systems</div>
              <div className="text-sm text-gray-300 mt-1">
                Sites below this threshold often experience AI hallucinations, missed information, and poor representation in AI-powered answers.
              </div>
            </div>
          </div>
        </div>

        {/* What This Means Practically */}
        <div>
          <h4 className="font-semibold text-white mb-2">🎯 Is This Good Enough to Ship?</h4>
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">90-100:</span>
              <span className="text-gray-300">✅ Ship with confidence - AI will accurately represent your brand</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold">75-89:</span>
              <span className="text-gray-300">✅ Safe to ship - but prioritize quick wins for better results</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">&lt;75:</span>
              <span className="text-gray-300">⚠️ Address critical issues first - AI may misrepresent your content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
