import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-100`,
  title: 'Too many short paragraphs',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['paragraphs', 'structure', 'readability'],
  priority: 7,
  description: 'Many paragraphs are very short. Combine related short paragraphs for better flow.'
})
export class TooManyShortParagraphsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // Paragraph length checks
    const shortParas = paragraphs.filter((_, el) => {
      const words = $(el).text().trim().split(/\s+/);
      return words.length > 0 && words.length < 20;
    }).length;
    
    if (shortParas > paragraphs.length * 0.7 && paragraphs.length > 5) {
      return {
        id: `${CATEGORY.AIREAD}-100`,
        title: 'Too many short paragraphs',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `${shortParas} out of ${paragraphs.length} paragraphs are very short (<20 words).`,
        remediation: 'Combine related short paragraphs for better flow and readability.',
        impactScore: 6,
        location: { url },
        evidence: [`Short paragraphs: ${shortParas}/${paragraphs.length}`],
        tags: ['paragraphs', 'structure', 'readability'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
