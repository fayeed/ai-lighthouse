import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-050`,
  title: 'Dates not marked up with time elements',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['time', 'dates', 'semantic'],
  priority: 13,
  description: 'Checks that dates are wrapped in time elements to make them machine-readable.'
})
export class MissingTransitionWordsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for date/time information
    const mainContent = $('main').length ? $('main').text() : $('article').length ? $('article').text() : $('body').text();
    const timeElements = $('time[datetime]').length;
    const datePatterns = mainContent.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi);
    const hasDates = datePatterns && datePatterns.length > 0;
    
    if (hasDates && timeElements === 0) {
      return {
        id: `${CATEGORY.AIREAD}-050`,
        title: 'Dates not marked up with time elements',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content contains dates but they are not wrapped in <time> elements. Machine-readable dates help AI understand temporal context.',
        remediation: 'Wrap dates in <time datetime="YYYY-MM-DD"> elements to make them machine-readable.',
        impactScore: 8,
        location: { url },
        evidence: [`Date patterns found: ${datePatterns?.length || 0}`],
        tags: ['time', 'dates', 'semantic'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
