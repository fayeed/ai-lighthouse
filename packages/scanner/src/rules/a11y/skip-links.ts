import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-004`,
  title: 'Missing skip navigation link',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.LOW,
  tags: ['navigation', 'accessibility', 'skip-links'],
  priority: 12,
  description: 'Checks for skip links that help AI agents identify main content.'
})
export class SkipLinksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const skipLinks = $('a[href^="#"]').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('skip') && (text.includes('content') || text.includes('main'));
    });

    if (skipLinks.length === 0 && $('nav').length > 0) {
      return {
        id: `${CATEGORY.A11Y}-004`,
        title: 'Missing skip navigation link',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: 'The page lacks a "skip to main content" link. While primarily for accessibility, this also helps AI agents identify main content.',
        remediation: 'Add a skip link at the beginning of the page that jumps to the main content area.',
        impactScore: 8,
        location: { url },
        evidence: ['No skip link found'],
        tags: ['navigation', 'accessibility', 'skip-links'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
