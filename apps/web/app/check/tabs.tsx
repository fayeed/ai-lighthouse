import { useState } from "react";
import { ShieldAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import ShareButton from "@/components/ShareButton";
import OverviewTab from "./OverviewTab";
import SEOTab from "./SEOTab";
import PSEOTab from "./PSEOTab";
import AEOTab from "./AEOTab";
import GEOTab from "./GEOTab";
import IssuesTab from "./IssuesTab";

type AuditReportProps = {
  reportData: any;
  interpretationMessage: string;
  score: number;
  enableLLM: boolean;
};

export default function AuditReport({ reportData, interpretationMessage, score, enableLLM }: AuditReportProps) {
  const [url, setUrl] = useState("https://stripe.com");
  const [activeTab, setActiveTab] = useState("overview");

  // Return null if no report data
  if (!reportData) {
    return null;
  }

  // Extract data from reportData
  const aiReadiness = reportData.aiReadiness || {};
  const auditReport = reportData.auditReport || {};
  const scanResult = reportData.scanResult || {};

  const dimensions = aiReadiness.dimensions || {};
  const aiPerspective = aiReadiness.aiPerspective || {};
  const quickWins = aiReadiness.quickWins || [];
  const issues = auditReport.issues || [];

  // Optimization analysis data
  const seo = scanResult.seo || null;
  const pseo = scanResult.pseo || null;
  const aeo = scanResult.aeo || null;
  const geo = scanResult.geo || null;
  const detectedTech = auditReport.detectedTech || scanResult.detectedTech || null;

  // Calculate stats
  const overallScore = Math.round(aiReadiness.overall || 0);
  const grade = aiReadiness.grade || 'N/A';
  const finalUrl = auditReport.input?.final_url || url;
  const confidence = Math.round((aiPerspective.confidence || 0) * 100);

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'needs-work': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  // Tab configuration with scores - always show all tabs
  const tabs = [
    { id: "overview", label: "Overview", score: null },
    { id: "seo", label: "SEO", score: seo?.score },
    { id: "pseo", label: "PSEO", score: pseo?.score },
    { id: "aeo", label: "AEO", score: aeo?.score },
    { id: "geo", label: "GEO", score: geo?.score },
    { id: "issues", label: "Issues", score: issues.length },
  ];

  return (
    <div className="min-h-screen text-foreground pb-12 sm:pb-20 selection:bg-white selection:text-black">
      <main className="container mx-auto pt-8 sm:pt-12 md:pt-16 max-w-5xl">
        {/* Score Section - Persistent Top */}
        <div className="glass p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[3rem] border-white/[0.08] relative overflow-hidden mb-6 sm:mb-8">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold text-white/40 text-left">AI Readiness Score</h2>
                <a
                  href="check/scoring-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1 text-white/20 hover:text-white/60 transition-colors"
                  title="View Scoring Guide"
                >
                  <Info className="w-3 h-3" />
                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Guide</span>
                </a>
              </div>
              <div className="space-y-2">
                <div className="text-6xl sm:text-7xl md:text-8xl font-display font-medium text-white tracking-tighter">
                  {overallScore}<span className="text-white/20">/100</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className={`border-opacity-30 font-mono text-xs ${getGradeColor(grade)} border-current bg-current bg-opacity-10`}>
                    Grade: {grade}
                  </Badge>
                  <span className="text-xs text-white/40 font-light break-all">Target: {finalUrl}</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-primary/[0.02] border-primary/10 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>What this means for you</span>
              </div>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light text-left">
                {interpretationMessage.split(' – ')[1] || 'Analyzing your website\'s AI readiness...'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <TabsList className="w-full min-w-max sm:min-w-0 justify-start bg-transparent border-b border-white/5 h-auto p-0 mb-8 sm:mb-12 flex gap-2 sm:gap-4">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-white/40 rounded-none px-2 sm:px-3 py-3 sm:py-4 text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] font-bold hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2"
                >
                  {tab.label}
                  {tab.score !== null && tab.score !== undefined && (
                    <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full ${
                      tab.id === 'issues'
                        ? 'bg-red-500/20 text-red-400'
                        : tab.score >= 80
                          ? 'bg-green-500/20 text-green-400'
                          : tab.score >= 60
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tab.id === 'issues' ? tab.score : tab.score}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-12">
            <OverviewTab
              aiPerspective={aiPerspective}
              dimensions={dimensions}
              confidence={confidence}
              getStatusColor={getStatusColor}
              enableLLM={enableLLM}
              scanResult={scanResult}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-12">
            <SEOTab seo={seo} detectedTech={detectedTech} enableLLM={enableLLM} />
          </TabsContent>

          <TabsContent value="pseo" className="space-y-12">
            <PSEOTab pseo={pseo} />
          </TabsContent>

          <TabsContent value="aeo" className="space-y-12">
            <AEOTab aeo={aeo} scanResult={scanResult} enableLLM={enableLLM} detectedTech={detectedTech} />
          </TabsContent>

          <TabsContent value="geo" className="space-y-12">
            <GEOTab geo={geo} scanResult={scanResult} enableLLM={enableLLM} detectedTech={detectedTech} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-12">
            <IssuesTab
              issues={issues}
              overallScore={overallScore}
              aiReadiness={aiReadiness}
              detectedTech={detectedTech}
              enableLLM={enableLLM}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <ShareButton
              score={overallScore}
              grade={grade}
              url={finalUrl}
              enableLLM={enableLLM}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
