import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-023`,
  title: 'Insufficient whitespace',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['formatting', 'whitespace', 'readability'],
  priority: 11,
  description: 'Detects dense content without adequate paragraph breaks or spacing.'
})
export class InsufficientWhitespaceRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const mainContent = $('main, article, [role="main"]').first();
    const contentArea = mainContent.length > 0 ? mainContent : $('body');
    
    const paragraphs = contentArea.find('p');
    const totalText = contentArea.text().trim();
    const words = totalText.split(/\s+/).length;

    if (paragraphs.length === 0 && words > 100) {
      return {
        id: `${CATEGORY.AIREAD}-023`,
        title: 'Insufficient whitespace',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${words} words with no paragraph breaks. Dense text without spacing reduces readability.`,
        remediation: 'Break content into paragraphs using <p> tags. Aim for 3-5 sentences per paragraph.',
        impactScore: 15,
        location: { url },
        evidence: [`Words: ${words}`, 'No paragraphs found'],
        tags: ['formatting', 'whitespace', 'readability'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    // Check for very few paragraphs with lots of text
    if (paragraphs.length > 0 && paragraphs.length < 3 && words > 500) {
      return {
        id: `${CATEGORY.AIREAD}-023`,
        title: 'Insufficient paragraph breaks',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${words} words in only ${paragraphs.length} paragraph(s). More breaks improve scannability.`,
        remediation: 'Break long text blocks into smaller paragraphs for better readability.',
        impactScore: 10,
        location: { url },
        evidence: [`Words: ${words}`, `Paragraphs: ${paragraphs.length}`],
        tags: ['formatting', 'whitespace', 'readability'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
