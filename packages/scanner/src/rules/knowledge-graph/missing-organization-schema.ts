import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-004`,
  title: 'Missing Organization schema',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['schema', 'organization', 'identity'],
  priority: 10,
  description: 'Checks for Organization schema which helps AI understand business identity.'
})
export class MissingOrganizationSchemaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    
    // Check if there's an Organization schema
    const hasOrganization = extractor.getAllTypes().some(type => 
      type.includes('Organization')
    );

    if (hasOrganization) {
      return null;
    }

    // Only flag on likely business/organization pages
    const isHomePage = new URL(url).pathname === '/' || new URL(url).pathname === '';
    if (!isHomePage) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-004`,
      title: 'Missing Organization schema',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.KG,
      description: 'Home page lacks Organization schema. This helps AI agents understand your business identity and contact information.',
      remediation: 'Add Organization schema with name, logo, url, and social media profiles using JSON-LD.',
      impactScore: 18,
      location: { url },
      evidence: ['No Organization schema found'],
      tags: ['schema', 'organization', 'identity'],
      confidence: 0.8,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
