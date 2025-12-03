import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-013`,
  title: 'Homepage missing H1',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.LOW,
  tags: ['homepage', 'h1', 'structure'],
  priority: 12,
  description: 'Homepage has no H1 heading. This is important for AI crawlers to understand your site\'s purpose.'
})
export class DeepPageLevelRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const urlObj = new URL(url);
    const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';
    
    if (!isHomepage) {
      return null;
    }

    const hasH1 = $('h1').length > 0;
    
    if (!hasH1) {
      return {
        id: `${CATEGORY.CRAWL}-013`,
        title: 'Homepage missing H1',
        serverity: SEVERITY.LOW,
        category: CATEGORY.CRAWL,
        description: 'Homepage has no H1 heading. This is important for AI crawlers to understand your site\'s purpose.',
        remediation: 'Add a clear H1 heading to your homepage describing your site or business.',
        impactScore: 12,
        location: { url },
        evidence: ['No H1 found on homepage'],
        tags: ['homepage', 'h1', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
