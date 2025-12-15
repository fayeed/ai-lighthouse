import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-005`,
  title: 'Breadcrumbs lack structured data',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.LOW,
  tags: ['breadcrumbs', 'schema', 'hierarchy'],
  priority: 10,
  description: 'Detects breadcrumb navigation without BreadcrumbList schema.'
})
export class MissingBreadcrumbSchemaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    
    // Check for breadcrumb schema
    const breadcrumbNav = $('[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb" i]').length > 0;
    const pathDepth = new URL(url).pathname.split('/').filter(p => p.length > 0).length;

    if (pathDepth <= 1 || jsonLd.hasBreadcrumbs || !breadcrumbNav) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-005`,
      title: 'Breadcrumbs lack structured data',
      severity: SEVERITY.LOW,
      category: CATEGORY.KG,
      description: 'Page has breadcrumb navigation but no BreadcrumbList schema. Structured breadcrumbs help AI understand site hierarchy.',
      remediation: 'Add BreadcrumbList structured data to complement your breadcrumb navigation.',
      impactScore: 8,
      location: { url },
      evidence: [`URL depth: ${pathDepth}`, 'No BreadcrumbList schema'],
      tags: ['breadcrumbs', 'schema', 'hierarchy'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
