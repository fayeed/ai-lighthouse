import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CHUNK}-004`,
  title: 'Missing content hierarchy',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['tokens', 'hierarchy', 'structure'],
  priority: 15,
  description: 'Detects flat content structure without clear hierarchy.'
})
export class MissingContentHierarchyRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const h1 = $('h1').length;
    const h2 = $('h2').length;
    const h3 = $('h3').length;
    const totalWords = $('body').text().split(/\s+/).length;

    // Skip if page is too short
    if (totalWords < 300) {
      return null;
    }

    // Check if there's hierarchy (not just h2s or h3s)
    if (h1 > 0 && h2 === 0 && h3 === 0 && totalWords > 500) {
      return {
        id: `${CATEGORY.CHUNK}-004`,
        title: 'Missing content hierarchy',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'Content has only H1 headings without H2/H3 subheadings. Clear hierarchy improves chunking and comprehension.',
        remediation: 'Add H2 and H3 headings to create a clear content hierarchy. This helps AI agents chunk content logically.',
        impactScore: 15,
        location: { url },
        evidence: [`H1: ${h1}`, `H2: ${h2}`, `H3: ${h3}`, `Words: ${totalWords}`],
        tags: ['tokens', 'hierarchy', 'structure'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    // Check for missing top-level structure
    if (h1 === 0 && (h2 > 0 || h3 > 0)) {
      return {
        id: `${CATEGORY.CHUNK}-004`,
        title: 'Missing top-level hierarchy',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: 'Content has H2/H3 headings but no H1. Proper hierarchy starts with H1.',
        remediation: 'Add an H1 heading as the main topic, with H2/H3 as subsections.',
        impactScore: 12,
        location: { url },
        evidence: [`H1: ${h1}`, `H2: ${h2}`, `H3: ${h3}`],
        tags: ['tokens', 'hierarchy', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
