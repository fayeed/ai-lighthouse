import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-080`,
  title: 'Missing summary or intro section',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['summary', 'structure', 'clarity'],
  priority: 8,
  description: 'No clear summary or introduction section found. AI agents benefit from explicit page summaries.'
})
export class MissingSummaryRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // Check for summary/intro section
    const hasSummary = $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').length > 0;
    const firstParagraph = paragraphs.first().text().trim();
    
    if (!hasSummary && firstParagraph.length < 50) {
      return {
        id: `${CATEGORY.AIREAD}-080`,
        title: 'Missing summary or intro section',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'No clear summary or introduction section found. AI agents benefit from explicit page summaries.',
        remediation: 'Add a clear introduction or summary section at the start of your content.',
        impactScore: 15,
        location: { url },
        evidence: ['No summary section detected', `First paragraph length: ${firstParagraph.length}`],
        tags: ['summary', 'structure', 'clarity'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
