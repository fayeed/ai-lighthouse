import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-003`,
  title: 'Schema.org data lacks main entity',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['schema', 'entities', 'knowledge-graph'],
  priority: 10,
  description: 'Detects Schema.org data without a main entity type.'
})
export class IncompleteSchemaOrgRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    const schemaCount = jsonLd.schemas.length;
    
    if (schemaCount === 0) {
      return null;
    }

    // Check for main entity
    if (jsonLd.hasMainEntity) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-003`,
      title: 'Schema.org data lacks main entity',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.KG,
      description: `Found ${schemaCount} Schema.org object(s) but no main entity type (Organization, Person, Article, WebPage, etc.).`,
      remediation: 'Add a primary Schema.org type that describes the main content or purpose of the page.',
      impactScore: 20,
      location: { url },
      evidence: [`Schema types found: ${extractor.getAllTypes().join(', ') || 'none'}`],
      tags: ['schema', 'entities', 'knowledge-graph'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
