import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-027`,
  title: 'Inconsistent formatting detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['formatting', 'consistency', 'quality'],
  priority: 11,
  description: 'Detects inconsistent use of formatting elements across the page.'
})
export class InconsistentFormattingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const issues: string[] = [];

    // Check for mixed bold tags (<strong> vs <b>)
    const strongCount = $('strong').length;
    const bCount = $('b').length;
    if (strongCount > 0 && bCount > 0) {
      issues.push(`Mixed bold tags: ${strongCount} <strong>, ${bCount} <b>`);
    }

    // Check for mixed emphasis tags (<em> vs <i>)
    const emCount = $('em').length;
    const iCount = $('i').length;
    if (emCount > 0 && iCount > 0 && iCount > 3) {
      issues.push(`Mixed emphasis tags: ${emCount} <em>, ${iCount} <i>`);
    }

    // Check for blockquotes without consistent citation style
    const blockquotes = $('blockquote');
    if (blockquotes.length > 1) {
      let withCite = 0;
      let withoutCite = 0;
      
      blockquotes.each((_, el) => {
        const blockquote = $(el);
        const hasCite = blockquote.attr('cite') || blockquote.find('cite').length > 0;
        if (hasCite) withCite++;
        else withoutCite++;
      });

      if (withCite > 0 && withoutCite > 0) {
        issues.push(`Inconsistent blockquote citations: ${withCite} with, ${withoutCite} without`);
      }
    }

    if (issues.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-027`,
      title: 'Inconsistent formatting detected',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: 'Page uses inconsistent formatting approaches. Consistency helps AI agents parse content more reliably.',
      remediation: 'Standardize on semantic HTML5 elements: use <strong> over <b>, <em> over <i>, and consistent citation patterns.',
      impactScore: 8,
      location: { url },
      evidence: issues,
      tags: ['formatting', 'consistency', 'quality'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
