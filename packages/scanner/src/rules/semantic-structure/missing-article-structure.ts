import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-016`,
  title: 'Article missing heading',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['article', 'headings', 'structure'],
  priority: 12,
  description: 'Detects article elements without headings. Articles should have clear headings.'
})
export class MissingArticleStructureRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for proper article structure
    const articles = $('article');
    
    if (articles.length === 0) {
      return null;
    }

    const articlesWithoutHeading: number[] = [];
    
    articles.each((idx, article) => {
      const articleEl = $(article);
      const hasHeading = articleEl.find('h1, h2, h3, h4, h5, h6').length > 0;
      
      if (!hasHeading) {
        articlesWithoutHeading.push(idx);
      }
    });

    if (articlesWithoutHeading.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-016`,
      title: 'Article missing heading',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${articlesWithoutHeading.length} <article> element(s) without headings. Articles should have clear headings to help AI agents understand the content topic.`,
      remediation: 'Add a heading (h1-h6) at the start of each <article> element.',
      impactScore: 10,
      location: { url, selector: 'article' },
      evidence: [`Articles without headings: ${articlesWithoutHeading.length}`],
      tags: ['article', 'headings', 'structure'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
