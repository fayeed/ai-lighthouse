import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-005`,
  title: 'Large inline scripts',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.LOW,
  tags: ['performance', 'scripts', 'inline'],
  priority: 14,
  description: 'Inline scripts increase HTML size and make content harder to parse.'
})
export class MissingLazyLoadingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for large inline scripts
    let largeInlineScripts = 0;
    $('script:not([src])').each((_, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.length > 5000) {
        largeInlineScripts++;
      }
    });

    if (largeInlineScripts > 0) {
      return {
        id: `${CATEGORY.TECH}-005`,
        title: 'Large inline scripts',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${largeInlineScripts} large inline script(s). Inline scripts increase HTML size and make content harder to parse.`,
        remediation: 'Move large scripts to external files. This improves caching and reduces HTML bloat.',
        impactScore: 10,
        location: { url },
        evidence: [`Large inline scripts: ${largeInlineScripts}`],
        tags: ['performance', 'scripts', 'inline'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
