import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-092`,
  title: 'Reading level too complex',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['readability', 'reading-level', 'complexity'],
  priority: 7,
  description: 'Estimated reading level is too high. Content may be too complex for general audiences.'
})
export class ReadingLevelComplexRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Reading level check (simplified)
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = bodyText.split(/\s+/);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    
    // Flesch-Kincaid approximation: high = difficult
    const estimatedGrade = Math.round((0.39 * avgWordsPerSentence) + (11.8 * (words.join('').length / words.length)) - 15.59);
    
    if (estimatedGrade > 12) {
      return {
        id: `${CATEGORY.AIREAD}-092`,
        title: 'Reading level too complex',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Estimated reading level: Grade ${estimatedGrade}. Content may be too complex for general audiences.`,
        remediation: 'Simplify language and sentence structure for broader accessibility.',
        impactScore: 10,
        location: { url },
        evidence: [`Estimated grade level: ${estimatedGrade}`, 'Recommended: Grade 6-10'],
        tags: ['readability', 'reading-level', 'complexity'],
        confidence: 0.5,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
