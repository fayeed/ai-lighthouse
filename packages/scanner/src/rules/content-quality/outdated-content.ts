import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-021`,
  title: 'Outdated content indicators',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['freshness', 'dates', 'quality'],
  priority: 10,
  description: 'Detects indicators that content may be outdated.'
})
export class OutdatedContentRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for date indicators
    const timeElements = $('time[datetime]');
    
    if (timeElements.length === 0) {
      return null;
    }

    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    
    let oldestDate: Date | null = null;
    let hasOldContent = false;

    timeElements.each((_, el) => {
      const datetime = $(el).attr('datetime');
      if (!datetime) return;
      
      try {
        const date = new Date(datetime);
        if (!oldestDate || date < oldestDate) {
          oldestDate = date;
        }
        
        if (date < twoYearsAgo) {
          hasOldContent = true;
        }
      } catch (e) {
        // Invalid date
      }
    });

    if (!hasOldContent || !oldestDate) {
      return null;
    }

    const yearsDiff = (now.getTime() - (oldestDate as Date).getTime()) / (1000 * 60 * 60 * 24 * 365);

    return {
      id: `${CATEGORY.AIREAD}-021`,
      title: 'Outdated content detected',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Content appears to be ${Math.floor(yearsDiff)} years old. Outdated content may provide less value to AI agents and users.`,
      remediation: 'Consider updating content with current information, or add a "last updated" date to indicate freshness.',
      impactScore: 10,
      location: { url },
      evidence: [`Oldest date: ${(oldestDate as Date).toISOString().split('T')[0]}`, `Age: ${Math.floor(yearsDiff)} years`],
      tags: ['freshness', 'dates', 'quality'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
