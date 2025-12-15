import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-002`,
  title: 'Invalid JSON-LD blocks detected',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['schema', 'validation', 'json-ld'],
  priority: 10,
  description: 'Detects JSON-LD scripts with parsing errors. Invalid structured data is ignored by AI crawlers.'
})
export class InvalidJsonLdRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Extract and parse all JSON-LD using the extractor
    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    
    // Report parsing errors if any
    if (jsonLd.errors.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-002`,
      title: 'Invalid JSON-LD blocks detected',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.KG,
      description: `Found ${jsonLd.errors.length} JSON-LD script(s) with parsing errors. Invalid structured data is ignored by AI crawlers.`,
      remediation: 'Validate your JSON-LD using Google\'s Structured Data Testing Tool or schema.org validator.',
      impactScore: 18,
      location: { url },
      evidence: jsonLd.errors.map(e => `Block ${e.index + 1}: ${e.error}`),
      tags: ['schema', 'validation', 'json-ld'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
