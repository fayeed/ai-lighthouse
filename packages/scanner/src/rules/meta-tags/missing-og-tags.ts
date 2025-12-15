import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-013`,
  title: 'Missing OpenGraph meta tags',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['meta', 'opengraph', 'seo'],
  priority: 8,
  description: 'Checks for OpenGraph meta tags that help AI agents understand and share your content.'
})
export class MissingOgTagsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for missing OpenGraph tags
    const ogTitle = $('meta[property="og:title"]');
    const ogDescription = $('meta[property="og:description"]');
    const ogImage = $('meta[property="og:image"]');
    
    const missingOgTags: string[] = [];
    if (ogTitle.length === 0) missingOgTags.push('og:title');
    if (ogDescription.length === 0) missingOgTags.push('og:description');
    if (ogImage.length === 0) missingOgTags.push('og:image');

    if (missingOgTags.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-013`,
      title: 'Missing OpenGraph meta tags',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `The page is missing ${missingOgTags.length} important OpenGraph meta tag(s): ${missingOgTags.join(', ')}. These help AI agents understand and share your content better.`,
      remediation: 'Add missing OpenGraph meta tags (og:title, og:description, og:image) to improve how AI agents and social platforms understand your content.',
      impactScore: 15,
      location: { url },
      evidence: [`Missing tags: ${missingOgTags.join(', ')}`],
      tags: ['meta', 'opengraph', 'seo'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
