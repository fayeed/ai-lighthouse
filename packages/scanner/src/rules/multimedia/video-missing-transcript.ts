import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-068`,
  title: 'No video transcripts available',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['video', 'transcripts', 'accessibility'],
  priority: 12,
  description: 'Checks for video transcript links. Full text transcripts are ideal for AI content understanding.'
})
export class VideoMissingTranscriptRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for videos
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
    
    if (videos.length === 0) {
      return null;
    }

    // Check for transcript links
    const transcriptLinks = $('a[href*="transcript"], a:contains("Transcript"), a:contains("transcript")').length;
    
    if (transcriptLinks > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-068`,
      title: 'No video transcripts available',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: 'Videos present but no transcript links found. Full text transcripts are ideal for AI content understanding.',
      remediation: 'Provide full text transcripts for videos. Link to them near the video or include them on the page.',
      impactScore: 12,
      location: { url },
      evidence: [`Videos: ${videos.length}`, 'No transcript links'],
      tags: ['video', 'transcripts', 'accessibility'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
