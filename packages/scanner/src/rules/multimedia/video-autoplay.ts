import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-067`,
  title: 'Videos lack structured data',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['video', 'schema', 'structured-data'],
  priority: 12,
  description: 'Checks for VideoObject schema markup. Structured data helps AI understand video content.'
})
export class VideoAutoplayRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for videos
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
    
    if (videos.length === 0) {
      return null;
    }

    // Check for video descriptions
    const videoSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('VideoObject'));
    }).length;

    if (videoSchema > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-067`,
      title: 'Videos lack structured data',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: 'Page contains videos but no VideoObject schema markup. Structured data helps AI understand video content.',
      remediation: 'Add VideoObject schema with name, description, thumbnailUrl, and other metadata.',
      impactScore: 18,
      location: { url },
      evidence: [`Videos: ${videos.length}`, 'No VideoObject schema'],
      tags: ['video', 'schema', 'structured-data'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
