import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-087`,
  title: 'No bullet or ordered lists',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['lists', 'structure', 'scannability'],
  priority: 7,
  description: 'Page has substantial content but no lists. Lists improve scannability for AI and users.'
})
export class NoListsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // Bullet/ordered lists present
    const lists = $('ul, ol').filter((_, el) => {
      return $(el).find('li').length >= 3; // At least 3 items
    });
    
    if (lists.length === 0 && paragraphs.length > 5) {
      return {
        id: `${CATEGORY.AIREAD}-087`,
        title: 'No bullet or ordered lists',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page has substantial content but no lists. Lists improve scannability for AI and users.',
        remediation: 'Break up content with bullet points or numbered lists where appropriate.',
        impactScore: 8,
        location: { url },
        evidence: [`Paragraphs: ${paragraphs.length}`, 'Lists: 0'],
        tags: ['lists', 'structure', 'scannability'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
