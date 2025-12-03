import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-031`,
  title: 'Missing breadcrumb navigation',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['breadcrumbs', 'navigation', 'context'],
  priority: 9,
  description: 'Checks for breadcrumb navigation. Breadcrumbs help AI agents understand the page\'s position in the site hierarchy.'
})
export class MissingBreadcrumbsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for breadcrumb navigation
    const breadcrumbs = $('[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs');
    if (breadcrumbs.length > 0) {
      return null;
    }

    // Only flag if the page appears to be deep in the site structure
    const pathDepth = new URL(url).pathname.split('/').filter(p => p.length > 0).length;
    if (pathDepth <= 1) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-031`,
      title: 'Missing breadcrumb navigation',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: 'The page lacks breadcrumb navigation. Breadcrumbs help AI agents understand the page\'s position in the site hierarchy.',
      remediation: 'Add breadcrumb navigation with Schema.org BreadcrumbList markup to provide hierarchical context.',
      impactScore: 10,
      location: { url },
      evidence: [`URL depth: ${pathDepth} levels`],
      tags: ['breadcrumbs', 'navigation', 'context'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    };
  }
}
