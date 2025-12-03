import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-070`,
  title: 'Audio content lacks podcast schema',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['audio', 'schema', 'podcast'],
  priority: 12,
  description: 'Checks for PodcastEpisode/PodcastSeries schema. Structured data helps AI categorize audio content.'
})
export class MediaMissingFallbackRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for audio elements
    const audioElements = $('audio');
    
    if (audioElements.length === 0) {
      return null;
    }

    // Check for PodcastEpisode schema
    const podcastSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && (content.includes('PodcastEpisode') || content.includes('PodcastSeries')));
    }).length;

    if (podcastSchema > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-070`,
      title: 'Audio content lacks podcast schema',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: 'Audio content present but no PodcastEpisode/PodcastSeries schema. Structured data helps AI categorize audio content.',
      remediation: 'Add PodcastEpisode or AudioObject schema for audio content.',
      impactScore: 10,
      location: { url },
      evidence: [`Audio elements: ${audioElements.length}`],
      tags: ['audio', 'schema', 'podcast'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
