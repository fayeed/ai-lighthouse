import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-083`,
  title: 'Summary missing main entity',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['summary', 'entity', 'clarity'],
  priority: 7,
  description: 'Summary does not mention the main entity, product, or organization name.'
})
export class SummaryMissingEntityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    const hasSummary = $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').length > 0;
    const firstParagraph = paragraphs.first().text().trim();
    
    if (hasSummary || firstParagraph.length > 50) {
      const summaryText = hasSummary 
        ? $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').first().text()
        : firstParagraph;
      
      // Check if summary contains main entity
      const title = $('title').text();
      const h1 = $('h1').first().text();
      const mainEntity = (title || h1).split(/[-–—|:]/)[0].trim();
      
      if (mainEntity.length > 3 && !summaryText.toLowerCase().includes(mainEntity.toLowerCase().substring(0, 20))) {
        return {
          id: `${CATEGORY.AIREAD}-083`,
          title: 'Summary missing main entity',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'Summary does not mention the main entity, product, or organization name.',
          remediation: 'Include the main subject/entity name in the opening summary for clarity.',
          impactScore: 10,
          location: { url },
          evidence: [`Main entity: ${mainEntity.substring(0, 50)}`],
          tags: ['summary', 'entity', 'clarity'],
          confidence: 0.6,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
