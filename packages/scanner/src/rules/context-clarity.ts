import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-028`,
  title: 'Context clarity issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['context', 'metadata', 'navigation'],
  priority: 9,
  description: 'Checks for elements that provide context clarity: breadcrumbs, page titles, descriptions, timestamps, and author information.'
})
export class ContextClarityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for page title
    const title = $('title').text().trim();
    if (!title || title.length < 3) {
      issues.push({
        id: `${CATEGORY.AIREAD}-028`,
        title: 'Missing or inadequate page title',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page lacks a proper <title> element. Page titles provide essential context for AI agents.',
        remediation: 'Add a descriptive <title> element that clearly describes the page content. Aim for 50-60 characters.',
        impactScore: 25,
        location: { url },
        evidence: [`Title: "${title || 'none'}"`],
        tags: ['title', 'metadata', 'context'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (title.length > 100) {
      issues.push({
        id: `${CATEGORY.AIREAD}-029`,
        title: 'Page title too long',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `The page title is ${title.length} characters. Titles over 60 characters may be truncated and provide less effective context.`,
        remediation: 'Shorten the page title to 50-60 characters while keeping it descriptive.',
        impactScore: 5,
        location: { url },
        evidence: [`Title length: ${title.length} chars`],
        tags: ['title', 'metadata', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (!metaDesc || metaDesc.trim().length < 50) {
      issues.push({
        id: `${CATEGORY.AIREAD}-030`,
        title: 'Missing or short meta description',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page lacks a proper meta description. Descriptions help AI agents understand page content and purpose.',
        remediation: 'Add a meta description tag with 150-160 characters that summarizes the page content.',
        impactScore: 20,
        location: { url },
        evidence: [`Description length: ${metaDesc?.length || 0} chars`],
        tags: ['meta', 'description', 'context'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for breadcrumb navigation
    const breadcrumbs = $('[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs');
    if (breadcrumbs.length === 0) {
      // Only flag if the page appears to be deep in the site structure
      const pathDepth = new URL(url).pathname.split('/').filter(p => p.length > 0).length;
      if (pathDepth > 1) {
        issues.push({
          id: `${CATEGORY.AIREAD}-031`,
          title: 'Missing breadcrumb navigation',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'The page lacks breadcrumb navigation. Breadcrumbs help AI agents understand the page\'s position in the site hierarchy.',
          remediation: 'Add breadcrumb navigation with Schema.org BreadcrumbList markup to provide hierarchical context.',
          impactScore: 10,
          location: { url },
          evidence: [`URL depth: ${pathDepth} levels`],
          tags: ['breadcrumbs', 'navigation', 'context'],
          confidence: 0.7,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for article metadata (author, published date)
    const articles = $('article');
    if (articles.length > 0) {
      articles.each((_, article) => {
        const articleEl = $(article);
        
        // Check for author information
        const author = articleEl.find('[rel="author"], [itemprop="author"], .author, .byline').text().trim();
        if (!author) {
          issues.push({
            id: `${CATEGORY.AIREAD}-032`,
            title: 'Article missing author information',
            serverity: SEVERITY.MEDIUM,
            category: CATEGORY.AIREAD,
            description: 'The article lacks clear author information. Author attribution helps AI agents assess credibility and context.',
            remediation: 'Add author information using semantic markup: rel="author", itemprop="author", or Schema.org Person.',
            impactScore: 15,
            location: { url, selector: 'article' },
            evidence: ['No author information found'],
            tags: ['article', 'author', 'metadata'],
            confidence: 0.8,
            timestamp: new Date().toISOString()
          } as Issue);
        }

        // Check for publish date
        const dateSelectors = 'time[datetime], [itemprop="datePublished"], [itemprop="dateModified"], .published, .date';
        const hasDate = articleEl.find(dateSelectors).length > 0;
        if (!hasDate) {
          issues.push({
            id: `${CATEGORY.AIREAD}-033`,
            title: 'Article missing timestamp',
            serverity: SEVERITY.MEDIUM,
            category: CATEGORY.AIREAD,
            description: 'The article lacks a publication or modification date. Timestamps help AI agents assess content freshness and relevance.',
            remediation: 'Add publication date using <time datetime="..."> elements or Schema.org datePublished/dateModified properties.',
            impactScore: 15,
            location: { url, selector: 'article' },
            evidence: ['No timestamp found'],
            tags: ['article', 'timestamp', 'metadata'],
            confidence: 0.85,
            timestamp: new Date().toISOString()
          } as Issue);
        }
      });
    }

    // Check for language declaration
    const htmlLang = $('html').attr('lang');
    if (!htmlLang) {
      issues.push({
        id: `${CATEGORY.AIREAD}-034`,
        title: 'Missing language declaration',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The HTML element lacks a lang attribute. Language declaration helps AI agents apply appropriate language processing.',
        remediation: 'Add a lang attribute to the <html> element (e.g., lang="en" for English).',
        impactScore: 15,
        location: { url },
        evidence: ['No lang attribute on <html>'],
        tags: ['language', 'i18n', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for viewport meta tag (important for responsive content)
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) {
      issues.push({
        id: `${CATEGORY.AIREAD}-035`,
        title: 'Missing viewport meta tag',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'The page lacks a viewport meta tag. While primarily for responsive design, this affects how AI agents with visual capabilities interpret the page.',
        remediation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the <head>.',
        impactScore: 5,
        location: { url },
        evidence: ['No viewport meta tag'],
        tags: ['viewport', 'responsive', 'meta'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
      issues.push({
        id: `${CATEGORY.AIREAD}-036`,
        title: 'Missing canonical URL',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'The page lacks a canonical URL. Canonical tags help AI agents identify the authoritative version of content.',
        remediation: 'Add <link rel="canonical" href="..."> to indicate the preferred URL for this content.',
        impactScore: 10,
        location: { url },
        evidence: ['No canonical link tag'],
        tags: ['canonical', 'seo', 'deduplication'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
