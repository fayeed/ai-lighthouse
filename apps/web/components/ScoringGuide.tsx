export default function ScoringGuide() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8 animate-fade-in-up">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Understanding Your Score & Grade</h3>
      
      <div className="space-y-6">
        {/* How Score is Calculated */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">How the Score is Calculated:</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">Your AI Readiness Score (0-100) uses advanced scoring with dynamic weights and confidence tracking:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
              <li><strong>Content Quality (30%):</strong> Clarity, structure, readability, and depth</li>
              <li><strong>Comprehensibility (25%):</strong> How well AI understands your messaging and structure</li>
              <li><strong>Extractability (20%):</strong> How easily AI can extract information from your HTML</li>
              <li><strong>Discoverability (15%):</strong> How easily AI crawlers can find and index your content</li>
              <li><strong>Trustworthiness (10%):</strong> Factual accuracy and hallucination prevention</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-500">
              <p className="text-gray-700 dark:text-gray-300 text-xs">
                <strong>Advanced Features:</strong> Weights automatically adjust based on data confidence. Scores use diminishing returns to prevent single issues from over-penalizing. Balance penalties apply if dimensions are uneven. ROI-based quick wins prioritize high-impact, low-effort fixes.
              </p>
            </div>
          </div>
        </div>

        {/* Grade Breakdown */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Grade Breakdown:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
              <div className="font-bold text-blue-800 dark:text-blue-300">A+ (95-100)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Exceptional - Top 1% of sites. AI systems have perfect comprehension.</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
              <div className="font-bold text-blue-800 dark:text-blue-300">A (90-94)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Excellent - Well optimized with only minor improvements needed.</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-800/30 border-l-4 border-blue-400 p-3 rounded">
              <div className="font-bold text-blue-700 dark:text-blue-400">A- (85-89)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Very good - Minor improvements will reach excellence.</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-3 rounded">
              <div className="font-bold text-green-800 dark:text-green-300">B+ (80-84)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Good - Solid foundation with some gaps to address.</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-3 rounded">
              <div className="font-bold text-green-800 dark:text-green-300">B (75-79)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Above average - Multiple improvements will boost comprehension.</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded">
              <div className="font-bold text-yellow-800 dark:text-yellow-300">B- (70-74)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Average - Needs work in several areas.</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded">
              <div className="font-bold text-yellow-800 dark:text-yellow-300">C+ (65-69)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Below average - Multiple issues affecting AI understanding.</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-3 rounded">
              <div className="font-bold text-orange-800 dark:text-orange-300">C (60-64)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Poor - Significant issues requiring attention.</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-3 rounded">
              <div className="font-bold text-orange-800 dark:text-orange-300">C- (55-59)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Very poor - Major issues preventing AI comprehension.</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded">
              <div className="font-bold text-red-800 dark:text-red-300">D (45-54)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Critical - Fundamental problems blocking AI understanding.</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded md:col-span-2">
              <div className="font-bold text-red-800 dark:text-red-300">F (Below 45)</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Failing - Content is essentially unusable by AI. Immediate comprehensive overhaul required.</p>
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">What This Means For You:</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>• <strong>A grades (85-100):</strong> AI chatbots like ChatGPT, Claude, and Perplexity accurately answer questions about your products/services with high confidence</p>
            <p>• <strong>B grades (70-84):</strong> AI generally understands your content but may miss nuances or require clarification for complex topics</p>
            <p>• <strong>C grades (55-69):</strong> AI frequently misses important details, may misunderstand key information, or require multiple attempts to extract facts</p>
            <p>• <strong>D-F grades (Below 55):</strong> AI systems struggle to extract accurate information and may hallucinate facts when asked about your business, products, or services</p>
          </div>
        </div>

        {/* Statistical Context */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📈 Statistical Context & Benchmarks:</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                <div className="font-semibold text-gray-900 dark:text-gray-100">🏆 Best-in-Class (Top 5%)</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">92-100</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI-optimized sites that set the standard</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded">
                <div className="font-semibold text-gray-900 dark:text-gray-100">✨ Excellent (Top 15%)</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">85-91</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Strong AI readiness, minimal issues</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded">
                <div className="font-semibold text-gray-900 dark:text-gray-100">👍 Above Average</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">75-84</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Safe but improvable - good foundation</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded">
                <div className="font-semibold text-gray-900 dark:text-gray-100">⚠️ Average (Most Sites)</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">60-74</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Typical range - needs optimization</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-3 rounded border border-red-200 dark:border-red-700">
              <div className="font-semibold text-red-900 dark:text-red-300">🚨 Below 75: Likely misunderstood by AI systems</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Sites below this threshold often experience AI hallucinations, missed information, and poor representation in AI-powered answers.
              </div>
            </div>
          </div>
        </div>

        {/* What This Means Practically */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🎯 Is This Good Enough to Ship?</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">90-100:</span>
              <span className="text-gray-700 dark:text-gray-300">✅ Ship with confidence - AI will accurately represent your brand</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold">75-89:</span>
              <span className="text-gray-700 dark:text-gray-300">✅ Safe to ship - but prioritize quick wins for better results</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">&lt;75:</span>
              <span className="text-gray-700 dark:text-gray-300">⚠️ Address critical issues first - AI may misrepresent your content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
