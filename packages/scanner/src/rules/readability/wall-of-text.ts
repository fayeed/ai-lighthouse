import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-051`,
  title: 'Abbreviations without markup',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['abbreviations', 'semantic', 'clarity'],
  priority: 13,
  description: 'Detects abbreviations that should be marked up with abbr elements for clarity.'
})
export class WallOfTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for abbreviations without expansions
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const abbrs = $('abbr[title]').length;
    const potentialAbbrs = mainContent.match(/\b[A-Z]{2,}\b/g);
    const potentialAbbrCount = potentialAbbrs ? new Set(potentialAbbrs).size : 0;
    
    if (potentialAbbrCount > 5 && abbrs === 0) {
      return {
        id: `${CATEGORY.AIREAD}-051`,
        title: 'Abbreviations without markup',
        severity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${potentialAbbrCount} potential abbreviation(s) without <abbr> markup. Expanded abbreviations help AI understand specialized terms.`,
        remediation: 'Use <abbr title="Full Name">ABBR</abbr> to provide expansions for abbreviations and acronyms.',
        impactScore: 8,
        location: { url },
        evidence: [`Potential abbreviations: ${potentialAbbrCount}`, `Marked up: ${abbrs}`],
        tags: ['abbreviations', 'semantic', 'clarity'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
