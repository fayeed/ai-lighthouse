import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-046`,
  title: 'Content readability and structure',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['readability', 'content', 'structure'],
  priority: 13,
  description: 'Analyzes content readability factors: paragraph length, sentence structure, and content organization.'
})
export class AvgSentenceLengthRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for very long paragraphs
    const paragraphs = $('p');
    let longParagraphs = 0;
    let totalParas = 0;
    
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) {
        totalParas++;
        if (text.length > 1000) {
          longParagraphs++;
        }
      }
    });

    if (longParagraphs > 0 && totalParas > 0 && (longParagraphs / totalParas) > 0.3) {
      return {
        id: `${CATEGORY.AIREAD}-046`,
        title: 'Excessively long paragraphs',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `${longParagraphs} paragraph(s) exceed 1000 characters. Long paragraphs are harder for AI to process and extract key information.`,
        remediation: 'Break long paragraphs into smaller, focused paragraphs. Aim for 3-5 sentences per paragraph.',
        impactScore: 10,
        location: { url },
        evidence: [
          `Long paragraphs: ${longParagraphs}`,
          `Total paragraphs: ${totalParas}`,
          `Percentage: ${((longParagraphs / totalParas) * 100).toFixed(1)}%`
        ],
        tags: ['readability', 'paragraphs', 'content'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
