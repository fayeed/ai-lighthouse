import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-014`,
  title: 'Semantic HTML structure issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['semantic', 'html', 'structure'],
  priority: 12,
  description: 'Analyzes semantic HTML structure to ensure proper use of article, section, and semantic elements for AI readability.'
})
export class SemanticStructureRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for proper use of semantic elements
    const hasMain = $('main').length > 0;
    const hasArticle = $('article').length > 0;
    const hasSections = $('section').length > 0;
    const hasNav = $('nav').length > 0;
    const hasHeader = $('header').length > 0;
    const hasFooter = $('footer').length > 0;

    // Check if content is wrapped in divs instead of semantic elements
    const bodyChildren = $('body > *');
    const divsOnly = bodyChildren.length > 0 && bodyChildren.filter('div').length === bodyChildren.length;

    if (!hasMain && !hasArticle) {
      issues.push({
        id: `${CATEGORY.AIREAD}-014`,
        title: 'Missing main semantic container',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.AIREAD,
        description: 'The page lacks a <main> or <article> element. These semantic containers help AI agents identify the primary content.',
        remediation: 'Wrap your main content in a <main> element, or use <article> for article-type content. This helps AI understand what content is most important.',
        impactScore: 25,
        location: { url },
        evidence: ['No <main> or <article> element found'],
        tags: ['semantic', 'html5', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (divsOnly) {
      issues.push({
        id: `${CATEGORY.AIREAD}-015`,
        title: 'Poor semantic structure (div soup)',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page uses only <div> elements for structure. Semantic HTML5 elements help AI agents understand content organization.',
        remediation: 'Replace generic <div> elements with semantic alternatives: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer>.',
        impactScore: 20,
        location: { url },
        evidence: ['Body contains only div elements'],
        tags: ['semantic', 'html5', 'accessibility'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for missing semantic landmarks
    const missingLandmarks: string[] = [];
    if (!hasHeader) missingLandmarks.push('header');
    if (!hasNav) missingLandmarks.push('nav');
    if (!hasFooter) missingLandmarks.push('footer');

    if (missingLandmarks.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-015a`,
        title: 'Missing semantic landmark elements',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `The page is missing ${missingLandmarks.length} semantic landmark(s): ${missingLandmarks.join(', ')}. These elements help AI agents navigate and understand page structure.`,
        remediation: 'Add semantic landmark elements: use <header> for page headers, <nav> for navigation, and <footer> for page footers.',
        impactScore: 10,
        location: { url },
        evidence: [`Missing landmarks: ${missingLandmarks.join(', ')}`],
        tags: ['semantic', 'landmarks', 'structure'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check heading hierarchy
    const headings = $('h1, h2, h3, h4, h5, h6');
    const headingLevels = headings.map((_, el) => {
      const tagName = $(el).prop('tagName');
      return tagName ? parseInt(tagName.substring(1)) : 0;
    }).get().filter(level => level > 0);
    
    let hasSkippedLevel = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        hasSkippedLevel = true;
        break;
      }
    }

    if (hasSkippedLevel) {
      issues.push({
        id: `${CATEGORY.AIREAD}-016`,
        title: 'Broken heading hierarchy',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'The page has skipped heading levels (e.g., h1 to h3 without h2). A proper heading hierarchy helps AI agents understand content structure.',
        remediation: 'Ensure heading levels follow sequential order: h1 → h2 → h3. Don\'t skip levels in the hierarchy.',
        impactScore: 15,
        location: { url },
        evidence: [`Heading levels found: ${headingLevels.join(', ')}`],
        tags: ['headings', 'hierarchy', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper article structure
    if (hasArticle) {
      $('article').each((_, article) => {
        const articleEl = $(article);
        const hasHeading = articleEl.find('h1, h2, h3, h4, h5, h6').length > 0;
        
        if (!hasHeading) {
          issues.push({
            id: `${CATEGORY.AIREAD}-017`,
            title: 'Article missing heading',
            serverity: SEVERITY.MEDIUM,
            category: CATEGORY.AIREAD,
            description: 'An <article> element lacks a heading. Articles should have clear headings to help AI agents understand the content topic.',
            remediation: 'Add a heading (h1-h6) at the start of each <article> element.',
            impactScore: 10,
            location: { url, selector: 'article' },
            evidence: ['Article without heading found'],
            tags: ['article', 'headings', 'structure'],
            confidence: 1,
            timestamp: new Date().toISOString()
          } as Issue);
        }
      });
    }

    return issues.length > 0 ? issues : null;
  }
}
