import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-097`,
  title: 'No extractable facts or data',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['facts', 'data', 'extraction'],
  priority: 7,
  description: 'Content lacks quantifiable facts, statistics, or data points for LLM extraction.'
})
export class NoExtractableFactsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // Claims/facts extractability
    const hasNumbers = /\d{1,3}(,\d{3})*(\.\d+)?%?/.test(bodyText);
    const hasStats = $('td, [class*="stat" i], [class*="metric" i]').length > 0;
    const hasCitations = $('cite, [class*="citation" i], [class*="reference" i], sup').length > 0;
    
    if (!hasNumbers && !hasStats && paragraphs.length > 5) {
      return {
        id: `${CATEGORY.AIREAD}-097`,
        title: 'No extractable facts or data',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content lacks quantifiable facts, statistics, or data points for LLM extraction.',
        remediation: 'Include specific numbers, statistics, or data points to support claims.',
        impactScore: 10,
        location: { url },
        evidence: ['No numbers or statistics detected'],
        tags: ['facts', 'data', 'extraction'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
