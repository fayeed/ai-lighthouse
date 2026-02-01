import { motion } from "framer-motion";
import { MessageCircle, HelpCircle, List, Mic, CheckCircle, XCircle, AlertCircle, Brain, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ProGate from "@/components/ProGate";
import FixGuide from "@/components/FixGuide";

type AEOTabProps = {
  aeo: any;
  scanResult?: any; // For LLM analysis data
  enableLLM?: boolean;
  detectedTech?: any;
};

const MetricCard = ({ label, value, icon: Icon, color, achieved }: { label: string; value: string | number; icon: any; color: string; achieved?: boolean }) => (
  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05]">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xl sm:text-2xl font-display font-medium text-white">{value}</span>
      {achieved !== undefined && (
        <Badge variant="outline" className={`text-[9px] ${achieved ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
          {achieved ? 'Ready' : 'Not Ready'}
        </Badge>
      )}
    </div>
  </div>
);

const IssueItem = ({ issue, detectedPlatform, isGated }: { issue: any; detectedPlatform?: string; isGated?: boolean }) => (
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
        {issue.cms_guides && (
          <FixGuide guides={issue.cms_guides} detectedPlatform={detectedPlatform} isGated={isGated || false} />
        )}
      </div>
    </div>
  </motion.div>
);

export default function AEOTab({ aeo, scanResult, enableLLM = true, detectedTech }: AEOTabProps) {
  // Extract LLM analysis data (questions and FAQs)
  const llm = scanResult?.llm || {};
  const suggestedFAQ = llm.suggestedFAQ || [];
  const llmQuestions = llm.questions || [];
  const isGated = !enableLLM;
  const detectedPlatform = detectedTech?.cms || detectedTech?.framework;

  if (!aeo && suggestedFAQ.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Answer Engine Optimization analysis not available</p>
      </div>
    );
  }

  const {
    score = 0,
    grade = 'N/A',
    questionTargeting = {},
    answerFormatting = {},
    featuredSnippetOptimization = {},
    voiceSearchOptimization = {},
    structuredData = {},
    issues = [],
    recommendations = []
  } = aeo || {};

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-medium text-white text-left">Answer Engine Optimization</h3>
            {suggestedFAQ.length > 0 ? (
              <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30 bg-green-500/10">
                <Brain className="w-3 h-3 mr-1" />
                AI Analysis
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/30 bg-yellow-500/10">
                Heuristic Mode
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            Optimization for voice search, featured snippets, and answer boxes in search results
          </p>
        </div>
        <div className="glass px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">AEO Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-display font-medium text-white">{score}</span>
            <Badge variant="outline" className="text-xs border-white/20">{grade}</Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Questions Answered"
          value={questionTargeting.questionsAnswered || 0}
          icon={HelpCircle}
          color="bg-purple-500/20 text-purple-400"
        />
        <MetricCard
          label="Answer Box Potential"
          value={`${answerFormatting.answerBoxPotential || 0}%`}
          icon={MessageCircle}
          color="bg-blue-500/20 text-blue-400"
        />
        <MetricCard
          label="Snippet Candidates"
          value={featuredSnippetOptimization.snippetCandidates?.length || 0}
          icon={List}
          color="bg-green-500/20 text-green-400"
        />
        <MetricCard
          label="Voice Ready"
          value={voiceSearchOptimization.conversationalTone ? 'Yes' : 'No'}
          icon={Mic}
          color="bg-orange-500/20 text-orange-400"
        />
      </div>

      {/* AI-Suggested FAQs */}
      <ProGate enabled={isGated} teaser="AI identified FAQ opportunities for your content">
        {(suggestedFAQ.length > 0 || isGated) && (
          <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI-Suggested FAQ Content
            </h4>
            <p className="text-xs text-white/50">Questions users are likely asking that your content should answer</p>
            <div className="space-y-4">
              {(suggestedFAQ.length > 0 ? suggestedFAQ : [
                { question: 'What does this product do and how does it work?', suggestedAnswer: 'This analysis identifies the key questions your audience is asking and suggests optimized FAQ content to improve your visibility in AI answer engines.', importance: 'high' },
                { question: 'How can I improve my search rankings?', suggestedAnswer: 'Focus on creating concise, direct answers to common questions in your niche. Structure content with clear headings and use FAQ schema markup.', importance: 'medium' },
                { question: 'What are the pricing options available?', suggestedAnswer: 'Detailed pricing and feature comparison information helps AI systems provide accurate answers when users ask about your offerings.', importance: 'low' },
              ]).map((faq: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      faq.importance === 'high' ? 'bg-red-500/20 text-red-400' :
                      faq.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      <HelpCircle className="w-3 h-3" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-sm text-white font-medium">{faq.question}</p>
                      <p className="text-xs text-white/50 leading-relaxed">{faq.suggestedAnswer}</p>
                      <Badge variant="outline" className={`text-[9px] ${
                        faq.importance === 'high' ? 'text-red-400 border-red-400/30' :
                        faq.importance === 'medium' ? 'text-yellow-400 border-yellow-400/30' : 'text-blue-400 border-blue-400/30'
                      }`}>
                        {faq.importance} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProGate>

      {/* User Questions AI Identified */}
      <ProGate enabled={isGated} teaser="AI detected key questions users would ask about your content">
        {(llmQuestions.length > 0 || isGated) && (
          <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Questions Users Would Ask
            </h4>
            <p className="text-xs text-white/50">Key questions AI systems identify as important for this content</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(llmQuestions.length > 0 ? llmQuestions : [
                { question: 'How does this service compare to competitors?', category: 'how', difficulty: 'intermediate' },
                { question: 'What are the main features and benefits?', category: 'what', difficulty: 'basic' },
                { question: 'Why should I choose this over alternatives?', category: 'why', difficulty: 'intermediate' },
                { question: 'How do I get started with the product?', category: 'how', difficulty: 'basic' },
              ]).map((q: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${
                    q.category === 'how' ? 'text-purple-400 border-purple-400/30' :
                    q.category === 'what' ? 'text-blue-400 border-blue-400/30' :
                    q.category === 'why' ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'
                  }`}>
                    {q.category}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-xs text-white/70">{q.question}</p>
                    <span className={`text-[9px] ${
                      q.difficulty === 'basic' ? 'text-green-400/60' :
                      q.difficulty === 'intermediate' ? 'text-yellow-400/60' : 'text-red-400/60'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProGate>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Question Targeting */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Question Targeting
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Questions Found</span>
              <span className="text-xs text-white">{questionTargeting.questionFormats?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">FAQ Markup</span>
              <Badge variant="outline" className={`text-[10px] ${questionTargeting.faqMarkupPresent ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                {questionTargeting.faqMarkupPresent ? 'Present' : 'Missing'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">HowTo Markup</span>
              <Badge variant="outline" className={`text-[10px] ${questionTargeting.howToMarkupPresent ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {questionTargeting.howToMarkupPresent ? 'Present' : 'Missing'}
              </Badge>
            </div>
          </div>
          {questionTargeting.questionFormats?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Sample Questions</span>
              {questionTargeting.questionFormats.slice(0, 3).map((q: any, idx: number) => (
                <div key={idx} className="text-xs text-white/60 flex items-start gap-2">
                  <span className={q.hasDirectAnswer ? 'text-green-400' : 'text-yellow-400'}>
                    {q.hasDirectAnswer ? '✓' : '○'}
                  </span>
                  <span className="line-clamp-1">{q.question}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Formatting */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Answer Formatting
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Concise Answers (40-60 words)</span>
              <Badge variant="outline" className={`text-[10px] ${answerFormatting.hasConciseAnswers ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {answerFormatting.hasConciseAnswers ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Definitions Present</span>
              <Badge variant="outline" className={`text-[10px] ${answerFormatting.hasDefinitions ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {answerFormatting.hasDefinitions ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">List Answers</span>
              <Badge variant="outline" className={`text-[10px] ${answerFormatting.hasListAnswers ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {answerFormatting.hasListAnswers ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Step-by-Step Content</span>
              <Badge variant="outline" className={`text-[10px] ${answerFormatting.hasStepByStep ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {answerFormatting.hasStepByStep ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Featured Snippet Optimization */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <List className="w-4 h-4" />
            Featured Snippet Readiness
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Paragraph Snippets</span>
              <Badge variant="outline" className={`text-[10px] ${featuredSnippetOptimization.paragraphSnippetReady ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {featuredSnippetOptimization.paragraphSnippetReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">List Snippets</span>
              <Badge variant="outline" className={`text-[10px] ${featuredSnippetOptimization.listSnippetReady ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {featuredSnippetOptimization.listSnippetReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Table Snippets</span>
              <Badge variant="outline" className={`text-[10px] ${featuredSnippetOptimization.tableSnippetReady ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {featuredSnippetOptimization.tableSnippetReady ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Voice Search Optimization */}
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Search Optimization
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Conversational Tone</span>
              <Badge variant="outline" className={`text-[10px] ${voiceSearchOptimization.conversationalTone ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}`}>
                {voiceSearchOptimization.conversationalTone ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Speakable Content</span>
              <Badge variant="outline" className={`text-[10px] ${voiceSearchOptimization.speakableContent ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {voiceSearchOptimization.speakableContent ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Local Relevance</span>
              <Badge variant="outline" className={`text-[10px] ${voiceSearchOptimization.localRelevance ? 'text-green-400 border-green-400/30' : 'text-white/40 border-white/20'}`}>
                {voiceSearchOptimization.localRelevance ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
          {voiceSearchOptimization.naturalLanguageQueries?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Natural Language Queries Found</span>
              <div className="flex flex-wrap gap-1">
                {voiceSearchOptimization.naturalLanguageQueries.slice(0, 6).map((query: string, idx: number) => (
                  <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400/80">
                    {query}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snippet Candidates */}
      {featuredSnippetOptimization.snippetCandidates?.length > 0 && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/[0.05] space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-green-400">Snippet Candidates</h4>
          <div className="space-y-3">
            {featuredSnippetOptimization.snippetCandidates.slice(0, 3).map((candidate: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[9px] text-blue-400 border-blue-400/30">
                    {candidate.type}
                  </Badge>
                  <span className="text-[10px] text-white/40">Score: {candidate.score}</span>
                </div>
                <p className="text-xs text-white/60 line-clamp-2">{candidate.content}</p>
              </div>
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
              <IssueItem key={idx} issue={issue} detectedPlatform={detectedPlatform} isGated={isGated} />
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
