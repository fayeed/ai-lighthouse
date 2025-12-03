import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-024`,
  title: 'Long unbroken text blocks',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['formatting', 'paragraphs', 'readability'],
  priority: 11,
  description: 'Detects very long paragraphs that should be broken up.'
})
export class LongUnbrokenTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const paragraphs = $('p');
    const longParagraphs: number[] = [];

    paragraphs.each((idx, el) => {
      const text = $(el).text().trim();
      const words = text.split(/\s+/).length;
      
      if (words > 150) {
        longParagraphs.push(words);
      }
    });

    if (longParagraphs.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-024`,
      title: 'Long unbroken text blocks',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${longParagraphs.length} paragraph(s) with over 150 words. Long paragraphs reduce readability and scannability.`,
      remediation: 'Break long paragraphs into smaller chunks. Aim for 3-5 sentences (50-100 words) per paragraph.',
      impactScore: 12,
      location: { url },
      evidence: [`Long paragraphs: ${longParagraphs.length}`, `Longest: ${Math.max(...longParagraphs)} words`],
      tags: ['formatting', 'paragraphs', 'readability'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
