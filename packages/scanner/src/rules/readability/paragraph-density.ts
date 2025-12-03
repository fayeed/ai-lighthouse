import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-047`,
  title: 'Wall of text - insufficient paragraph breaks',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['readability', 'structure', 'paragraphs'],
  priority: 13,
  description: 'Checks for large blocks of unstructured text that are difficult for AI to parse.'
})
export class ParagraphDensityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for lack of paragraph breaks (wall of text)
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const contentLength = mainContent.trim().length;
    const paragraphCount = $('main p, article p').length || $('p').length;
    
    if (contentLength > 2000 && paragraphCount < 3) {
      return {
        id: `${CATEGORY.AIREAD}-047`,
        title: 'Wall of text - insufficient paragraph breaks',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content has ${contentLength} characters but only ${paragraphCount} paragraph(s). Large blocks of unstructured text are difficult for AI to parse.`,
        remediation: 'Break content into smaller paragraphs with clear topic separation. Add headings to organize content sections.',
        impactScore: 15,
        location: { url },
        evidence: [
          `Content length: ${contentLength} chars`,
          `Paragraphs: ${paragraphCount}`,
          `Avg chars per paragraph: ${Math.round(contentLength / Math.max(1, paragraphCount))}`
        ],
        tags: ['readability', 'structure', 'paragraphs'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
