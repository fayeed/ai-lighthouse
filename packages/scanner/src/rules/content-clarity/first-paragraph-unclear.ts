import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-084`,
  title: 'First paragraph unclear purpose',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['intro', 'clarity', 'purpose'],
  priority: 7,
  description: 'First paragraph does not clearly describe the page purpose or answer key questions.'
})
export class FirstParagraphUnclearRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    const firstParagraph = paragraphs.first().text().trim();
    
    if (firstParagraph.length > 0) {
      const firstParaWords = firstParagraph.split(/\s+/);
      const hasQuestionWords = /\b(what|why|how|when|where|who)\b/i.test(firstParagraph.substring(0, 100));
      const startsWithAction = /^(learn|discover|find|get|explore|see)/i.test(firstParagraph);
      
      if (!hasQuestionWords && !startsWithAction && firstParaWords.length < 15) {
        return {
          id: `${CATEGORY.AIREAD}-084`,
          title: 'First paragraph unclear purpose',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'First paragraph does not clearly describe the page purpose or answer key questions.',
          remediation: 'Start with a clear statement of what the page offers or answers.',
          impactScore: 12,
          location: { url },
          evidence: [`First paragraph: ${firstParagraph.substring(0, 100)}...`],
          tags: ['intro', 'clarity', 'purpose'],
          confidence: 0.6,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
