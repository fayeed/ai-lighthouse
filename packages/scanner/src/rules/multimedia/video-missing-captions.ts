import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-066`,
  title: 'Videos without captions',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['video', 'captions', 'accessibility'],
  priority: 12,
  description: 'Checks for videos without caption tracks. Captions provide text alternatives that AI can process.'
})
export class VideoMissingCaptionsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for videos
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
    
    if (videos.length === 0) {
      return null;
    }

    // Check for video captions/tracks
    let videosWithoutCaptions = 0;
    
    $('video').each((_, el) => {
      const video = $(el);
      const hasCaptions = video.find('track[kind="captions"], track[kind="subtitles"]').length > 0;
      if (!hasCaptions) {
        videosWithoutCaptions++;
      }
    });

    if (videosWithoutCaptions === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-066`,
      title: 'Videos without captions',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${videosWithoutCaptions} video(s) without caption tracks. Captions provide text alternatives that AI can process.`,
      remediation: 'Add <track kind="captions"> elements to video tags with WebVTT caption files.',
      impactScore: 20,
      location: { url, selector: 'video' },
      evidence: [`Videos without captions: ${videosWithoutCaptions}`],
      tags: ['video', 'captions', 'accessibility'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
