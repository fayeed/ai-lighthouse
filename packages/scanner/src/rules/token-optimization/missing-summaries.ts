import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CHUNK}-006`,
  title: 'Missing content summaries',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.LOW,
  tags: ['tokens', 'summaries', 'structure'],
  priority: 15,
  description: 'Detects long content without introductory summaries for better chunking.'
})
export class MissingSummariesRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const totalWords = $('body').text().split(/\s+/).length;
    
    // Only check for long content
    if (totalWords < 800) {
      return null;
    }

    // Check for summary indicators
    const hasSummary = $('[class*="summary"], [class*="abstract"], [class*="tldr"], [class*="tl;dr"]').length > 0;
    const hasIntro = $('[class*="intro"], [class*="overview"]').length > 0;
    
    if (hasSummary || hasIntro) {
      return null;
    }

    return {
      id: `${CATEGORY.CHUNK}-006`,
      title: 'Missing content summaries',
      serverity: SEVERITY.LOW,
      category: CATEGORY.CHUNK,
      description: `Long content (${totalWords} words) lacks a summary or overview. Summaries help AI agents quickly understand main points.`,
      remediation: 'Add a summary, abstract, or TL;DR section at the beginning of long content to provide quick context.',
      impactScore: 10,
      location: { url },
      evidence: [`Content length: ${totalWords} words`, 'No summary section found'],
      tags: ['tokens', 'summaries', 'structure'],
      confidence: 0.6,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
