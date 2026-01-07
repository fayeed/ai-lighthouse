import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: 'CONTENT_CLARITY-008',
  title: 'Missing publish or update date',
  category: CATEGORY.CI,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['dates', 'freshness', 'trust', 'temporal', 'recency'],
  priority: 22,
  description: 'No clear publish or last-modified date found. AI systems rely on temporal signals to assess content freshness and relevance.'
})
export class MissingPublishDateRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $, response } = ctx;
    const issues: Issue[] = [];

    let hasPublishDate = false;
    let hasModifiedDate = false;
    let hasLastModifiedHeader = false;
    let foundDates: string[] = [];

    // 1. Check Schema.org structured data for dates
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, script) => {
      try {
        const data = JSON.parse($(script).html() || '{}');
        const checkForDates = (obj: any) => {
          if (obj.datePublished) {
            hasPublishDate = true;
            foundDates.push(`Schema.org datePublished: ${obj.datePublished}`);
          }
          if (obj.dateModified) {
            hasModifiedDate = true;
            foundDates.push(`Schema.org dateModified: ${obj.dateModified}`);
          }
          if (obj.dateCreated) {
            hasPublishDate = true;
            foundDates.push(`Schema.org dateCreated: ${obj.dateCreated}`);
          }
        };

        if (Array.isArray(data)) {
          data.forEach(checkForDates);
        } else {
          checkForDates(data);
        }
      } catch (e) {
        // Invalid JSON - ignore
      }
    });

    // 2. Check meta tags for dates
    const metaTags = [
      'article:published_time',
      'article:modified_time',
      'og:published_time',
      'og:updated_time',
      'datePublished',
      'dateModified',
      'date',
      'pubdate',
      'publish_date',
      'last-modified'
    ];

    metaTags.forEach((tag) => {
      const content =
        $(`meta[property="${tag}"]`).attr('content') ||
        $(`meta[name="${tag}"]`).attr('content');

      if (content) {
        if (tag.includes('publish') || tag.includes('created') || tag === 'date' || tag === 'pubdate') {
          hasPublishDate = true;
          foundDates.push(`Meta tag ${tag}: ${content}`);
        }
        if (tag.includes('modified') || tag.includes('updated')) {
          hasModifiedDate = true;
          foundDates.push(`Meta tag ${tag}: ${content}`);
        }
      }
    });

    // 3. Check for time elements with datetime attribute
    const timeElements = $('time[datetime]');
    if (timeElements.length > 0) {
      timeElements.each((_, el) => {
        const datetime = $(el).attr('datetime');
        const text = $(el).text().trim();
        if (datetime) {
          hasPublishDate = true;
          foundDates.push(`<time> element: ${datetime} (${text})`);
        }
      });
    }

    // 4. Check HTTP Last-Modified header
    if (response) {
      const lastModified = response.headers.get('last-modified');
      if (lastModified) {
        hasLastModifiedHeader = true;
        hasModifiedDate = true;
        foundDates.push(`HTTP Last-Modified header: ${lastModified}`);
      }
    }

    // 5. Look for common date patterns in visible text (heuristic)
    const datePatterns = [
      /published:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /updated:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /last updated:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{4}-\d{2}-\d{2})/g, // ISO format
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi
    ];

    const bodyText = $('main, article, .content, body')
      .first()
      .text()
      .slice(0, 2000); // Check first 2000 chars

    let foundDateInText = false;
    datePatterns.forEach((pattern) => {
      const matches = bodyText.match(pattern);
      if (matches && matches.length > 0) {
        foundDateInText = true;
        // Don't add to foundDates as these are heuristic
      }
    });

    // Evaluate findings
    if (!hasPublishDate && !hasModifiedDate && !foundDateInText) {
      issues.push({
        id: 'CONTENT_CLARITY-008',
        title: 'Missing publish or update date',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.CI,
        description:
          'No publish date or last-modified date found in Schema.org markup, meta tags, time elements, or HTTP headers. AI systems use temporal signals to assess content freshness and relevance.',
        remediation:
          'Add datePublished and dateModified to Schema.org structured data (Article, BlogPosting, etc.). Also consider adding <time> elements with datetime attributes and ensuring Last-Modified HTTP headers are set.',
        impactScore: 25,
        location: { url },
        evidence: ['No publish or modified dates found'],
        tags: ['dates', 'freshness', 'schema-org', 'trust'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (!hasPublishDate && hasModifiedDate) {
      issues.push({
        id: 'CONTENT_CLARITY-008-no-publish',
        title: 'Missing publish date',
        severity: SEVERITY.LOW,
        category: CATEGORY.CI,
        description:
          'Modified date found but no original publish date. Including both publish and modified dates helps AI systems understand content history.',
        remediation:
          'Add datePublished to Schema.org structured data alongside dateModified.',
        impactScore: 12,
        location: { url },
        evidence: foundDates,
        tags: ['dates', 'freshness', 'schema-org'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (hasPublishDate && !hasModifiedDate && !hasLastModifiedHeader) {
      // Has publish date but no modified date - only flag if content looks substantial (likely article/blog)
      const hasArticleContent =
        $('article').length > 0 ||
        $('[itemtype*="Article"]').length > 0 ||
        jsonLdScripts.text().includes('Article');

      if (hasArticleContent) {
        issues.push({
          id: 'CONTENT_CLARITY-008-no-modified',
          title: 'Missing last-modified date',
          severity: SEVERITY.LOW,
          category: CATEGORY.CI,
          description:
            'Publish date found but no last-modified date. For content that may be updated, including dateModified helps AI systems determine if information is current.',
          remediation:
            'Add dateModified to Schema.org structured data and set Last-Modified HTTP header.',
          impactScore: 10,
          location: { url },
          evidence: foundDates,
          tags: ['dates', 'freshness', 'schema-org', 'best-practice'],
          confidence: 0.7,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Additional check: if dates found but only via heuristics (not structured)
    if (foundDateInText && !hasPublishDate && !hasModifiedDate) {
      issues.push({
        id: 'CONTENT_CLARITY-008-unstructured',
        title: 'Dates not machine-readable',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.CI,
        description:
          'Dates appear in visible text but are not in machine-readable format. AI crawlers may not recognize or parse these dates correctly.',
        remediation:
          'Add dates to Schema.org structured data using ISO 8601 format (YYYY-MM-DD).',
        impactScore: 20,
        location: { url },
        evidence: ['Dates found in text but not in structured format'],
        tags: ['dates', 'structured-data', 'schema-org'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
