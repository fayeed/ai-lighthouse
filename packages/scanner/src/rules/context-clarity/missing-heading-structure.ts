import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-033`,
  title: 'Missing heading structure',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['headings', 'structure', 'hierarchy'],
  priority: 9,
  description: 'Checks for proper heading hierarchy and structure.'
})
export class MissingHeadingStructureRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for headings
    const h1 = $('h1');
    const allHeadings = $('h1, h2, h3, h4, h5, h6');

    if (h1.length === 0) {
      return {
        id: `${CATEGORY.AIREAD}-033`,
        title: 'Missing H1 heading',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page lacks an H1 heading. H1 provides the main topic for AI agents.',
        remediation: 'Add an H1 heading that describes the main topic of the page.',
        impactScore: 20,
        location: { url },
        evidence: ['No H1 heading found'],
        tags: ['headings', 'structure', 'hierarchy'],
        confidence: 1,
        timestamp: new Date().toISOString()
      };
    }

    if (h1.length > 1) {
      return {
        id: `${CATEGORY.AIREAD}-033`,
        title: 'Multiple H1 headings',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${h1.length} H1 headings. Multiple H1s can confuse AI agents about the main topic.`,
        remediation: 'Use only one H1 heading per page for the main topic.',
        impactScore: 15,
        location: { url },
        evidence: [`H1 count: ${h1.length}`],
        tags: ['headings', 'structure', 'hierarchy'],
        confidence: 1,
        timestamp: new Date().toISOString()
      };
    }

    if (allHeadings.length === 1) {
      return {
        id: `${CATEGORY.AIREAD}-033`,
        title: 'Poor heading structure',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page has only one heading. Multiple heading levels help AI agents understand content structure.',
        remediation: 'Add H2-H6 headings to organize content into logical sections.',
        impactScore: 15,
        location: { url },
        evidence: ['Only one heading found'],
        tags: ['headings', 'structure', 'hierarchy'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }
}
