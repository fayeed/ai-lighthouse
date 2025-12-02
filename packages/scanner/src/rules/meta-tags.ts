import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-010`,
  title: 'AI-blocking meta tags detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['meta', 'ai-agents', 'seo'],
  priority: 8,
  description: 'Detects meta tags that prevent AI agents from indexing or using content.'
})
export class MetaTagsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for noai meta tags
    const noaiMeta = $('meta[name="robots"][content*="noai"]');
    if (noaiMeta.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-010`,
        title: 'Meta robots tag blocks AI',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page contains a meta robots tag with "noai" directive, which blocks AI indexing.',
        remediation: 'Remove the "noai" directive from the robots meta tag if you want AI agents to index this content.',
        impactScore: 35,
        location: { url, selector: 'meta[name="robots"]' },
        evidence: [noaiMeta.attr('content') || 'noai detected'],
        tags: ['meta', 'ai-agents', 'indexing'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for googlebot noai-content
    const googlebotNoAi = $('meta[name="googlebot"][content*="noai"]');
    if (googlebotNoAi.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-011`,
        title: 'Googlebot meta tag blocks AI content',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page contains a googlebot meta tag that blocks AI from using the content.',
        remediation: 'Remove the "noai" directive from the googlebot meta tag to allow Google\'s AI features to use this content.',
        impactScore: 30,
        location: { url, selector: 'meta[name="googlebot"]' },
        evidence: [googlebotNoAi.attr('content') || 'noai detected'],
        tags: ['meta', 'ai-agents', 'google'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for missing OpenGraph tags
    const ogTitle = $('meta[property="og:title"]');
    const ogDescription = $('meta[property="og:description"]');
    const ogImage = $('meta[property="og:image"]');
    
    const missingOgTags: string[] = [];
    if (ogTitle.length === 0) missingOgTags.push('og:title');
    if (ogDescription.length === 0) missingOgTags.push('og:description');
    if (ogImage.length === 0) missingOgTags.push('og:image');

    if (missingOgTags.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-012`,
        title: 'Missing OpenGraph meta tags',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `The page is missing ${missingOgTags.length} important OpenGraph meta tag(s): ${missingOgTags.join(', ')}. These help AI agents understand and share your content better.`,
        remediation: 'Add missing OpenGraph meta tags (og:title, og:description, og:image) to improve how AI agents and social platforms understand your content.',
        impactScore: 15,
        location: { url },
        evidence: [`Missing tags: ${missingOgTags.join(', ')}`],
        tags: ['meta', 'opengraph', 'seo'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for missing structured data
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-013`,
        title: 'Missing structured data (JSON-LD)',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page lacks structured data in JSON-LD format. Structured data helps AI agents understand the content type, author, dates, and other metadata.',
        remediation: 'Add Schema.org structured data using JSON-LD format. Consider using Article, WebPage, Organization, or other relevant schemas.',
        impactScore: 20,
        location: { url },
        evidence: ['No <script type="application/ld+json"> found'],
        tags: ['structured-data', 'schema', 'ai-agents'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
