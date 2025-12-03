import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-036`,
  title: 'Page title too long or generic',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['title', 'metadata', 'optimization'],
  priority: 9,
  description: 'Checks if page title is generic or overly long.'
})
export class GenericPageTitleRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const title = $('title').text().trim();
    if (!title || title.length < 3) {
      return null;
    }

    // Check for generic titles
    const genericTitles = ['home', 'welcome', 'untitled', 'new page', 'page'];
    if (genericTitles.includes(title.toLowerCase())) {
      return {
        id: `${CATEGORY.AIREAD}-036`,
        title: 'Generic page title',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `The page title "${title}" is too generic. Descriptive titles help AI agents understand page purpose.`,
        remediation: 'Use a specific, descriptive title that clearly indicates the page content.',
        impactScore: 15,
        location: { url },
        evidence: [`Title: "${title}"`],
        tags: ['title', 'metadata', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      };
    }

    // Check for overly long titles
    if (title.length > 60) {
      return {
        id: `${CATEGORY.AIREAD}-036`,
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
      };
    }

    return null;
  }
}
