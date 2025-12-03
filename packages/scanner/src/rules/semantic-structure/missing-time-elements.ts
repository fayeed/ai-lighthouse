import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-017`,
  title: 'Missing time elements for dates',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['time', 'dates', 'semantic'],
  priority: 12,
  description: 'Detects dates without semantic <time> elements. Time elements help AI parse dates correctly.'
})
export class MissingTimeElementsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for articles with dates
    const articles = $('article');
    
    if (articles.length === 0) {
      return null;
    }

    let articlesWithoutTime = 0;
    
    articles.each((_, article) => {
      const articleEl = $(article);
      const dateSelectors = 'time[datetime], [itemprop="datePublished"], [itemprop="dateModified"]';
      const hasDate = articleEl.find(dateSelectors).length > 0;
      
      if (!hasDate) {
        articlesWithoutTime++;
      }
    });

    if (articlesWithoutTime === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-017`,
      title: 'Articles missing time elements',
      serverity: SEVERITY.LOW,
      category: CATEGORY.AIREAD,
      description: `Found ${articlesWithoutTime} article(s) without <time> elements. Timestamps help AI agents assess content freshness and relevance.`,
      remediation: 'Add publication date using <time datetime="..."> elements or Schema.org datePublished/dateModified properties.',
      impactScore: 12,
      location: { url, selector: 'article' },
      evidence: [`Articles without time elements: ${articlesWithoutTime}`],
      tags: ['time', 'dates', 'semantic'],
      confidence: 0.85,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
