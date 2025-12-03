import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-082`,
  title: 'Summary too long',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['summary', 'length', 'clarity'],
  priority: 7,
  description: 'Summary is too long. Optimal length is 40-120 words for concise AI understanding.'
})
export class SummaryTooLongRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    const hasSummary = $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').length > 0;
    const firstParagraph = paragraphs.first().text().trim();
    
    if (hasSummary || firstParagraph.length > 50) {
      const summaryText = hasSummary 
        ? $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').first().text()
        : firstParagraph;
      const wordCount = summaryText.trim().split(/\s+/).length;
      
      if (wordCount > 120) {
        return {
          id: `${CATEGORY.AIREAD}-082`,
          title: 'Summary too long',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Summary is ${wordCount} words. Optimal length is 40-120 words for concise AI understanding.`,
          remediation: 'Condense the summary to 40-120 words for better scannability.',
          impactScore: 6,
          location: { url },
          evidence: [`Word count: ${wordCount}`, 'Optimal: 40-120 words'],
          tags: ['summary', 'length', 'clarity'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
