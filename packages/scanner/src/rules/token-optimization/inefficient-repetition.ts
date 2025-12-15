import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { estimateTokenCount } from '../../utils.js';

@Rule({
  id: `${CATEGORY.CHUNK}-005`,
  title: 'Inefficient repetition detected',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['tokens', 'efficiency', 'duplication'],
  priority: 15,
  description: 'Detects inefficient repetition of navigation or boilerplate content.'
})
export class InefficientRepetitionRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for repetitive nav/footer content
    const nav = $('nav');
    const footer = $('footer');
    let repetitiveTokens = 0;

    if (nav.length > 1) {
      nav.each((_, el) => {
        repetitiveTokens += estimateTokenCount($(el).text());
      });
      
      return {
        id: `${CATEGORY.CHUNK}-005`,
        title: 'Duplicate navigation elements',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: `Found ${nav.length} <nav> elements. Multiple navigation sections waste ~${repetitiveTokens} tokens with repetitive content.`,
        remediation: 'Consolidate navigation into a single element. If multiple navs are needed, ensure they serve distinct purposes and contain unique content.',
        impactScore: 15,
        location: { url, selector: 'nav' },
        evidence: [`Navigation count: ${nav.length}`, `Estimated wasted tokens: ~${repetitiveTokens}`],
        tags: ['tokens', 'navigation', 'duplication'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    if (footer.length > 1) {
      let footerTokens = 0;
      footer.each((_, el) => {
        footerTokens += estimateTokenCount($(el).text());
      });

      return {
        id: `${CATEGORY.CHUNK}-005`,
        title: 'Duplicate footer elements',
        severity: SEVERITY.LOW,
        category: CATEGORY.CHUNK,
        description: `Found ${footer.length} <footer> elements wasting ~${footerTokens} tokens with repetitive content.`,
        remediation: 'Consolidate footers into a single element to reduce token waste.',
        impactScore: 10,
        location: { url, selector: 'footer' },
        evidence: [`Footer count: ${footer.length}`, `Estimated wasted tokens: ~${footerTokens}`],
        tags: ['tokens', 'footer', 'duplication'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
