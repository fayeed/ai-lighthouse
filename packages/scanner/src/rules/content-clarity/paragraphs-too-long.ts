import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-101`,
  title: 'Paragraphs too long',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['paragraphs', 'readability', 'structure'],
  priority: 7,
  description: 'Some paragraphs are too long. Break up for better readability.'
})
export class ParagraphsTooLongRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    const longParas = paragraphs.filter((_, el) => {
      const words = $(el).text().trim().split(/\s+/);
      return words.length > 150;
    }).length;
    
    if (longParas > 0) {
      return {
        id: `${CATEGORY.AIREAD}-101`,
        title: 'Paragraphs too long',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${longParas} paragraph(s) longer than 150 words. Break up for better readability.`,
        remediation: 'Split long paragraphs into smaller chunks (50-150 words ideal).',
        impactScore: 8,
        location: { url },
        evidence: [`Long paragraphs: ${longParas}`],
        tags: ['paragraphs', 'readability', 'structure'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
