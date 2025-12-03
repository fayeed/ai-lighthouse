import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-042`,
  title: 'Non-functional links detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'crawlability', 'accessibility'],
  priority: 11,
  description: 'Detects links with empty hrefs, "#", or javascript: URLs that AI crawlers cannot follow.'
})
export class NonDescriptiveAnchorTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for broken link patterns
    const emptyLinks = $('a[href=""], a[href="#"]').length;
    const javascriptLinks = $('a[href^="javascript:"]').length;
    
    if (emptyLinks > 0 || javascriptLinks > 0) {
      return {
        id: `${CATEGORY.AIREAD}-042`,
        title: 'Non-functional links detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${emptyLinks + javascriptLinks} link(s) with empty hrefs, "#", or javascript: URLs. AI crawlers cannot follow these links.`,
        remediation: 'Replace javascript: and empty href links with proper URLs. Use buttons for non-navigation actions.',
        impactScore: 15,
        location: { url },
        evidence: [
          `Empty/hash links: ${emptyLinks}`,
          `JavaScript links: ${javascriptLinks}`
        ],
        tags: ['links', 'crawlability', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
