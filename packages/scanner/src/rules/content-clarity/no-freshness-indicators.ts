import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-103`,
  title: 'No freshness indicators',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['freshness', 'dates', 'currency'],
  priority: 7,
  description: 'Page lacks date stamps or freshness indicators. AI agents prefer timestamped content.'
})
export class NoFreshnessIndicatorsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Content freshness
    const datePattern = /\b(20\d{2})[/-](0[1-9]|1[0-2])[/-](0[1-9]|[12]\d|3[01])\b/;
    const dateMatch = bodyText.match(datePattern);
    const lastModified = $('meta[property="article:modified_time"], meta[name="last-modified"]').attr('content');
    
    if (!dateMatch && !lastModified) {
      return {
        id: `${CATEGORY.AIREAD}-103`,
        title: 'No freshness indicators',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page lacks date stamps or freshness indicators. AI agents prefer timestamped content.',
        remediation: 'Add publication/update dates using meta tags or visible timestamps.',
        impactScore: 8,
        location: { url },
        evidence: ['No dates detected'],
        tags: ['freshness', 'dates', 'currency'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
