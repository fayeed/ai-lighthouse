import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-001`,
  title: 'Accessibility issues affecting AI comprehension',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['accessibility', 'aria', 'a11y'],
  priority: 12,
  description: 'Checks accessibility features that also help AI agents understand content structure and meaning.'
})
export class AccessibilityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for ARIA landmarks
    const ariaLandmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]');
    const semanticLandmarks = $('main, nav, header, footer, aside');
    
    if (ariaLandmarks.length === 0 && semanticLandmarks.length === 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-001`,
        title: 'No ARIA landmarks or semantic elements',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.A11Y,
        description: 'The page lacks ARIA landmark roles and semantic HTML5 elements. These help AI agents identify and navigate content sections.',
        remediation: 'Add ARIA landmark roles (role="main", role="navigation", etc.) or use semantic HTML5 elements (<main>, <nav>, <header>, <footer>).',
        impactScore: 25,
        location: { url },
        evidence: ['No landmarks found'],
        tags: ['accessibility', 'aria', 'landmarks'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for form inputs without labels
    const inputs = $('input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea, select');
    let inputsWithoutLabels = 0;
    
    inputs.each((_, el) => {
      const input = $(el);
      const id = input.attr('id');
      const ariaLabel = input.attr('aria-label');
      const ariaLabelledby = input.attr('aria-labelledby');
      const hasLabel = id && $(`label[for="${id}"]`).length > 0;
      
      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        inputsWithoutLabels++;
      }
    });

    if (inputsWithoutLabels > 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-002`,
        title: 'Form inputs without labels',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.A11Y,
        description: `Found ${inputsWithoutLabels} form input(s) without associated labels or ARIA labels. Labels help AI agents understand form purpose and context.`,
        remediation: 'Add <label> elements associated with inputs via for/id attributes, or use aria-label/aria-labelledby attributes.',
        impactScore: 15,
        location: { url, selector: 'input, textarea, select' },
        evidence: [`Unlabeled inputs: ${inputsWithoutLabels}`],
        tags: ['forms', 'labels', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for buttons without accessible text
    const buttons = $('button, [role="button"]');
    let buttonsWithoutText = 0;
    
    buttons.each((_, el) => {
      const button = $(el);
      const text = button.text().trim();
      const ariaLabel = button.attr('aria-label');
      const ariaLabelledby = button.attr('aria-labelledby');
      const title = button.attr('title');
      
      if (!text && !ariaLabel && !ariaLabelledby && !title) {
        buttonsWithoutText++;
      }
    });

    if (buttonsWithoutText > 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-003`,
        title: 'Buttons without accessible text',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.A11Y,
        description: `Found ${buttonsWithoutText} button(s) without text or ARIA labels. AI agents need text to understand button purpose.`,
        remediation: 'Add visible text to buttons, or use aria-label attribute for icon-only buttons.',
        impactScore: 15,
        location: { url, selector: 'button' },
        evidence: [`Buttons without text: ${buttonsWithoutText}`],
        tags: ['buttons', 'accessibility', 'labels'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for skip links
    const skipLinks = $('a[href^="#"]').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('skip') && (text.includes('content') || text.includes('main'));
    });

    if (skipLinks.length === 0 && $('nav').length > 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-004`,
        title: 'Missing skip navigation link',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: 'The page lacks a "skip to main content" link. While primarily for accessibility, this also helps AI agents identify main content.',
        remediation: 'Add a skip link at the beginning of the page that jumps to the main content area.',
        impactScore: 8,
        location: { url },
        evidence: ['No skip link found'],
        tags: ['navigation', 'accessibility', 'skip-links'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper heading usage in navigation
    const navs = $('nav');
    let navsWithoutHeadings = 0;
    
    navs.each((_, el) => {
      const nav = $(el);
      const hasHeading = nav.find('h1, h2, h3, h4, h5, h6').length > 0;
      const ariaLabel = nav.attr('aria-label');
      const ariaLabelledby = nav.attr('aria-labelledby');
      
      if (!hasHeading && !ariaLabel && !ariaLabelledby) {
        navsWithoutHeadings++;
      }
    });

    if (navsWithoutHeadings > 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-005`,
        title: 'Navigation without labels',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `Found ${navsWithoutHeadings} <nav> element(s) without headings or ARIA labels. Labels help AI agents distinguish between different navigation sections.`,
        remediation: 'Add aria-label to <nav> elements (e.g., aria-label="Main navigation") or include a heading within the nav.',
        impactScore: 10,
        location: { url, selector: 'nav' },
        evidence: [`Unlabeled navigation sections: ${navsWithoutHeadings}`],
        tags: ['navigation', 'labels', 'accessibility'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for tables without proper headers and scope
    const tables = $('table');
    let tablesWithScopeIssues = 0;
    
    tables.each((_, el) => {
      const table = $(el);
      const headers = table.find('th');
      const headersWithScope = table.find('th[scope]');
      
      if (headers.length > 0 && headersWithScope.length === 0) {
        tablesWithScopeIssues++;
      }
    });

    if (tablesWithScopeIssues > 0) {
      issues.push({
        id: `${CATEGORY.A11Y}-006`,
        title: 'Table headers missing scope attributes',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `Found ${tablesWithScopeIssues} table(s) with headers but no scope attributes. Scope helps AI agents understand header relationships.`,
        remediation: 'Add scope="col" or scope="row" to <th> elements to clarify whether they are column or row headers.',
        impactScore: 8,
        location: { url, selector: 'table' },
        evidence: [`Tables with scope issues: ${tablesWithScopeIssues}`],
        tags: ['tables', 'scope', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper ARIA usage (don't overuse)
    const elementsWithAria = $('[aria-label], [aria-labelledby], [aria-describedby], [role]').length;
    const totalElements = $('*').length;
    const ariaRatio = totalElements > 0 ? (elementsWithAria / totalElements) : 0;

    if (ariaRatio > 0.3) {
      issues.push({
        id: `${CATEGORY.A11Y}-007`,
        title: 'Excessive ARIA usage',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `${(ariaRatio * 100).toFixed(1)}% of elements have ARIA attributes. Overuse of ARIA can add noise for AI parsing.`,
        remediation: 'Use semantic HTML5 elements instead of ARIA roles where possible. ARIA should supplement, not replace, semantic HTML.',
        impactScore: 5,
        location: { url },
        evidence: [
          `Elements with ARIA: ${elementsWithAria}`,
          `Total elements: ${totalElements}`,
          `Ratio: ${(ariaRatio * 100).toFixed(1)}%`
        ],
        tags: ['aria', 'semantic', 'best-practices'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
