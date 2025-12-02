import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.TECH}-001`,
  title: 'Performance issues affecting AI crawlers',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['performance', 'crawling', 'technical'],
  priority: 14,
  description: 'Checks for performance issues that may affect AI crawler efficiency and crawl budget.'
})
export class PerformanceRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $, html } = ctx;
    const issues: Issue[] = [];

    // Check for excessive external resources
    const externalScripts = $('script[src]').filter((_, el) => {
      const src = $(el).attr('src');
      return !!(src && (src.startsWith('http') || src.startsWith('//')));
    }).length;

    const externalStyles = $('link[rel="stylesheet"][href]').filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && (href.startsWith('http') || href.startsWith('//')));
    }).length;

    if (externalScripts > 10) {
      issues.push({
        id: `${CATEGORY.TECH}-001`,
        title: 'Excessive external scripts',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `Found ${externalScripts} external script files. Too many external resources slow down page loading and may impact AI crawler efficiency.`,
        remediation: 'Bundle and minify scripts, consider lazy loading non-critical scripts, and reduce third-party dependencies.',
        impactScore: 15,
        location: { url },
        evidence: [`External scripts: ${externalScripts}`],
        tags: ['performance', 'scripts', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (externalStyles > 5) {
      issues.push({
        id: `${CATEGORY.TECH}-002`,
        title: 'Excessive external stylesheets',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${externalStyles} external stylesheet files. Multiple CSS files increase page load time.`,
        remediation: 'Combine CSS files, consider critical CSS inlining, and minimize external stylesheet requests.',
        impactScore: 10,
        location: { url },
        evidence: [`External stylesheets: ${externalStyles}`],
        tags: ['performance', 'css', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for render-blocking resources
    const renderBlockingScripts = $('head script[src]:not([async]):not([defer])').length;
    if (renderBlockingScripts > 0) {
      issues.push({
        id: `${CATEGORY.TECH}-003`,
        title: 'Render-blocking scripts in head',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `Found ${renderBlockingScripts} script(s) in <head> without async or defer attributes. These block page rendering.`,
        remediation: 'Add async or defer attributes to script tags, or move scripts to the end of <body>.',
        impactScore: 15,
        location: { url, selector: 'head script[src]:not([async]):not([defer])' },
        evidence: [`Render-blocking scripts: ${renderBlockingScripts}`],
        tags: ['performance', 'rendering', 'scripts'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check HTML size
    const htmlSize = Buffer.byteLength(html, 'utf8');
    const htmlSizeKB = Math.round(htmlSize / 1024);
    
    if (htmlSizeKB > 100) {
      issues.push({
        id: `${CATEGORY.TECH}-004`,
        title: 'Large HTML document size',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `HTML document is ${htmlSizeKB}KB. Large HTML files slow down initial page load and consume more crawl budget.`,
        remediation: 'Reduce HTML size by removing unnecessary markup, inline styles, and comments. Consider code splitting or pagination.',
        impactScore: 20,
        location: { url },
        evidence: [`HTML size: ${htmlSizeKB}KB`],
        tags: ['performance', 'size', 'optimization'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for large inline scripts
    let largeInlineScripts = 0;
    $('script:not([src])').each((_, el) => {
      const scriptContent = $(el).html() || '';
      if (scriptContent.length > 5000) {
        largeInlineScripts++;
      }
    });

    if (largeInlineScripts > 0) {
      issues.push({
        id: `${CATEGORY.TECH}-005`,
        title: 'Large inline scripts',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${largeInlineScripts} large inline script(s). Inline scripts increase HTML size and make content harder to parse.`,
        remediation: 'Move large scripts to external files. This improves caching and reduces HTML bloat.',
        impactScore: 10,
        location: { url },
        evidence: [`Large inline scripts: ${largeInlineScripts}`],
        tags: ['performance', 'scripts', 'inline'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for iframes (can be resource-intensive)
    const iframes = $('iframe').length;
    if (iframes > 3) {
      issues.push({
        id: `${CATEGORY.TECH}-006`,
        title: 'Excessive iframes',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${iframes} iframe elements. Multiple iframes can significantly slow down page load and complicate content extraction for AI.`,
        remediation: 'Reduce the number of iframes. Consider alternative approaches like lazy loading or direct content embedding.',
        impactScore: 12,
        location: { url },
        evidence: [`Iframes: ${iframes}`],
        tags: ['performance', 'iframes', 'complexity'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
