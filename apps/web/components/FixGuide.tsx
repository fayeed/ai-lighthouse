'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Code, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import ProGate from '@/components/ProGate';

interface FixGuideEntry {
  platform: string;
  steps: string[];
  codeSnippet?: string;
  pluginOrTool?: string;
}

interface FixGuideProps {
  /** CMS-specific guides keyed by platform slug */
  guides?: Record<string, FixGuideEntry>;
  /** Detected platform key (e.g. 'wordpress', 'nextjs') — shown first */
  detectedPlatform?: string;
  /** Whether to gate behind ProGate for free users */
  isGated: boolean;
}

export default function FixGuide({ guides, detectedPlatform, isGated }: FixGuideProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  if (!guides || Object.keys(guides).length === 0) return null;

  // Order platforms: detected first, then others, generic last
  const platformKeys = Object.keys(guides).sort((a, b) => {
    if (a === detectedPlatform) return -1;
    if (b === detectedPlatform) return 1;
    if (a === 'generic') return 1;
    if (b === 'generic') return -1;
    return 0;
  });

  const selectedKey = activePlatform || platformKeys[0];
  const guide = guides[selectedKey];

  const content = (
    <div className="space-y-3">
      {/* Platform tabs */}
      {platformKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {platformKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActivePlatform(key)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                key === selectedKey
                  ? 'bg-primary/20 text-primary border-primary/30 font-bold'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
              } ${key === detectedPlatform ? 'ring-1 ring-primary/20' : ''}`}
            >
              {guides[key].platform}
              {key === detectedPlatform && (
                <span className="ml-1 text-[8px] text-primary/70">detected</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Steps */}
      {guide && (
        <div className="space-y-2">
          <ol className="space-y-1.5 list-none">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 text-white/40 text-[10px] flex items-center justify-center font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          {/* Plugin/Tool recommendation */}
          {guide.pluginOrTool && (
            <div className="flex items-center gap-2 pt-1">
              <Puzzle className="w-3 h-3 text-white/30" />
              <span className="text-[10px] text-white/40">Recommended: <span className="text-white/60 font-medium">{guide.pluginOrTool}</span></span>
            </div>
          )}

          {/* Code snippet */}
          {guide.codeSnippet && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Code className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Code Example</span>
              </div>
              <pre className="text-[11px] text-green-400/80 bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto leading-relaxed">
                <code>{guide.codeSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-teal-400 hover:text-teal-300 transition-colors"
      >
        <Wrench className="w-3 h-3" />
        <span>Step-by-Step Fix Guide</span>
        {detectedPlatform && guides[detectedPlatform] && (
          <Badge variant="outline" className="text-[8px] border-teal-400/30 text-teal-400/70 ml-1">
            {guides[detectedPlatform].platform}
          </Badge>
        )}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {isGated ? (
            <ProGate enabled teaser="CMS-specific step-by-step fix instructions">
              {content}
            </ProGate>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
}
