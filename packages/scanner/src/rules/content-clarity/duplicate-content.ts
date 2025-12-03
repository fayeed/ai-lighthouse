import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-093`,
  title: 'Duplicate content detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['duplicate', 'quality', 'redundancy'],
  priority: 7,
  description: 'Found instances of duplicate paragraphs across the page.'
})
export class DuplicateContentRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // Duplicate content check
    const paraTexts = new Map<string, number>();
    paragraphs.each((_, el) => {
      const text = $(el).text().trim().substring(0, 100);
      if (text.length > 50) {
        paraTexts.set(text, (paraTexts.get(text) || 0) + 1);
      }
    });
    
    const duplicates = Array.from(paraTexts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      return {
        id: `${CATEGORY.AIREAD}-093`,
        title: 'Duplicate content detected',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${duplicates.length} instances of duplicate paragraphs across the page.`,
        remediation: 'Remove or consolidate duplicate content to avoid redundancy.',
        impactScore: 10,
        location: { url },
        evidence: [`Duplicate paragraphs: ${duplicates.length}`],
        tags: ['duplicate', 'quality', 'redundancy'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
