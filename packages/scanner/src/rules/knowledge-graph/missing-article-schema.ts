import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-006`,
  title: 'Article content lacks Article schema',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['article', 'schema', 'content'],
  priority: 10,
  description: 'Detects article content without Article schema markup.'
})
export class MissingArticleSchemaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    
    // Check if there's an Article schema
    const hasArticle = extractor.getAllTypes().some(type => 
      type.includes('Article') || type.includes('BlogPosting') || type.includes('NewsArticle')
    );

    if (hasArticle) {
      return null;
    }

    // Check if page looks like an article
    const hasArticleTag = $('article').length > 0;
    const hasBlogIndicators = $('[class*="blog"], [class*="post"], [class*="article"]').length > 0;
    
    if (!hasArticleTag && !hasBlogIndicators) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-006`,
      title: 'Article content lacks Article schema',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.KG,
      description: 'Page appears to contain article content but lacks Article schema. This helps AI understand authorship, dates, and content type.',
      remediation: 'Add Article, BlogPosting, or NewsArticle schema with headline, author, datePublished, and image properties.',
      impactScore: 15,
      location: { url },
      evidence: ['Article content detected but no Article schema found'],
      tags: ['article', 'schema', 'content'],
      confidence: 0.75,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
