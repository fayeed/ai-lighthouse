import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CHUNK}-003`,
  title: 'Poor heading distribution',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['tokens', 'headings', 'structure'],
  priority: 15,
  description: 'Detects uneven heading distribution that affects content chunking.'
})
export class PoorHeadingDistributionRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const headings = $('h1, h2, h3, h4, h5, h6');
    const totalWords = $('body').text().split(/\s+/).length;

    if (headings.length === 0 || totalWords < 300) {
      return null;
    }

    const wordsPerHeading = totalWords / headings.length;

    // If there are too many words per heading, content is poorly chunked
    if (wordsPerHeading > 250) {
      return {
        id: `${CATEGORY.CHUNK}-003`,
        title: 'Poor heading distribution',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: `Average of ${Math.round(wordsPerHeading)} words per heading. Large sections without headings make chunking less efficient.`,
        remediation: 'Add more headings to break content into logical sections. Aim for 100-200 words per heading.',
        impactScore: 15,
        location: { url },
        evidence: [`Words per heading: ${Math.round(wordsPerHeading)}`, `Total headings: ${headings.length}`],
        tags: ['tokens', 'headings', 'structure'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
