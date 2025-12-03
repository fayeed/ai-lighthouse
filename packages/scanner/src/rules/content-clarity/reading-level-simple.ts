import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-091`,
  title: 'Reading level too simple',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.INFO,
  tags: ['readability', 'reading-level', 'quality'],
  priority: 6,
  description: 'Estimated reading level is too low. Content may be oversimplified.'
})
export class ReadingLevelSimpleRule extends BaseRule {
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
    
    if (estimatedGrade < 6) {
      return {
        id: `${CATEGORY.AIREAD}-091`,
        title: 'Reading level too simple',
        serverity: SEVERITY.INFO,
        category: CATEGORY.AIREAD,
        description: `Estimated reading level: Grade ${estimatedGrade}. Content may be oversimplified.`,
        remediation: 'Consider adding more detail and depth appropriate for your audience.',
        impactScore: 5,
        location: { url },
        evidence: [`Estimated grade level: ${estimatedGrade}`, 'Recommended: Grade 6-10'],
        tags: ['readability', 'reading-level', 'quality'],
        confidence: 0.5,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
