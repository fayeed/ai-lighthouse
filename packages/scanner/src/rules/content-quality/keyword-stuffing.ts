import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-019`,
  title: 'Keyword stuffing detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['quality', 'spam', 'keywords'],
  priority: 10,
  description: 'Detects excessive repetition of keywords which reduces content quality.'
})
export class KeywordStuffingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    const words = bodyText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    if (words.length < 100) {
      return null;
    }

    // Count word frequencies
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Find words used excessively
    const totalWords = words.length;
    const overusedWords: Array<{word: string, count: number, percentage: number}> = [];
    
    wordFreq.forEach((count, word) => {
      const percentage = (count / totalWords) * 100;
      // Flag if a word appears more than 3% of the time
      if (percentage > 3 && count > 10) {
        overusedWords.push({ word, count, percentage });
      }
    });

    if (overusedWords.length === 0) {
      return null;
    }

    overusedWords.sort((a, b) => b.percentage - a.percentage);

    return {
      id: `${CATEGORY.AIREAD}-019`,
      title: 'Keyword stuffing detected',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${overusedWords.length} word(s) used excessively. Keyword stuffing reduces content quality and natural readability.`,
      remediation: 'Use keywords naturally and vary your vocabulary. Aim for natural language that provides value.',
      impactScore: 20,
      location: { url },
      evidence: overusedWords.slice(0, 3).map(w => 
        `"${w.word}": ${w.count} times (${w.percentage.toFixed(1)}%)`
      ),
      tags: ['quality', 'spam', 'keywords'],
      confidence: 0.75,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
