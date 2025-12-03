import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-069`,
  title: 'Audio content without transcripts',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['audio', 'transcripts', 'accessibility'],
  priority: 12,
  description: 'Checks for audio elements without transcript links. Audio content is inaccessible to AI without text alternatives.'
})
export class AudioMissingTranscriptRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for audio elements
    const audioElements = $('audio');
    
    if (audioElements.length === 0) {
      return null;
    }

    // Check for audio descriptions or transcripts
    const audioTranscripts = $('a[href*="transcript"]').length;
    
    if (audioTranscripts > 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-069`,
      title: 'Audio content without transcripts',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${audioElements.length} audio element(s) without transcript links. Audio content is inaccessible to AI without text alternatives.`,
      remediation: 'Provide text transcripts for all audio content (podcasts, audio clips, etc.).',
      impactScore: 18,
      location: { url, selector: 'audio' },
      evidence: [`Audio elements: ${audioElements.length}`],
      tags: ['audio', 'transcripts', 'accessibility'],
      confidence: 0.8,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
