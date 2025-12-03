import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-088`,
  title: 'FAQ section not structured',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['faq', 'structure', 'questions'],
  priority: 7,
  description: 'Found question-style headings but no structured FAQ section.'
})
export class FaqNotStructuredRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const hasFAQ = $('[class*="faq" i], [id*="faq" i]').length > 0;
    const faqSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('FAQPage'));
    }).length > 0;
    
    const questionHeadings = $('h2, h3, h4, h5, h6').filter((_, el) => {
      return $(el).text().trim().endsWith('?');
    }).length;
    
    if (questionHeadings > 2 && !hasFAQ && !faqSchema) {
      return {
        id: `${CATEGORY.AIREAD}-088`,
        title: 'FAQ section not structured',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${questionHeadings} question-style headings but no structured FAQ section.`,
        remediation: 'Create a dedicated FAQ section with proper markup or schema.',
        impactScore: 10,
        location: { url },
        evidence: [`Question headings: ${questionHeadings}`],
        tags: ['faq', 'structure', 'questions'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
