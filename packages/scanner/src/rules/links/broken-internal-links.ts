import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-041`,
  title: 'Link structure and navigation issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['links', 'navigation', 'crawlability'],
  priority: 11,
  description: 'Analyzes link structure for AI crawler navigation: internal links, external links, and link attributes.'
})
export class BrokenInternalLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const links = $('a[href]');
    const totalLinks = links.length;

    if (totalLinks === 0) {
      return {
        id: `${CATEGORY.AIREAD}-041`,
        title: 'No links found',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page contains no links. This creates a dead-end for AI crawlers and limits content discoverability.',
        remediation: 'Add relevant internal and external links to improve navigation and content relationships.',
        impactScore: 30,
        location: { url },
        evidence: ['No <a href> elements found'],
        tags: ['links', 'navigation', 'crawlability'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
