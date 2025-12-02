import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';
import { estimateTokenCount } from '../utils.js';

@Rule({
  id: `${CATEGORY.CHUNK}-002`,
  title: 'Token efficiency issues',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['tokens', 'efficiency', 'performance'],
  priority: 15,
  description: 'Detects repetitive content, boilerplate waste, and poor content-to-code ratios that waste AI tokens.'
})
export class TokenOptimizationRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $, html } = ctx;
    const issues: Issue[] = [];

    // Calculate content-to-code ratio
    const bodyText = $('body').text().trim();
    const textTokens = estimateTokenCount(bodyText);
    const htmlTokens = estimateTokenCount(html);
    const contentRatio = htmlTokens > 0 ? textTokens / htmlTokens : 0;

    if (contentRatio < 0.1) {
      issues.push({
        id: `${CATEGORY.CHUNK}-002`,
        title: 'Poor content-to-code ratio',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.CHUNK,
        description: `Content-to-code ratio is ${(contentRatio * 100).toFixed(1)}%. The HTML contains significantly more markup than actual content, wasting tokens.`,
        remediation: 'Reduce excessive HTML markup, inline styles, and unnecessary wrapper elements. Consider server-side rendering or static generation instead of heavy client-side rendering.',
        impactScore: 30,
        location: { url },
        evidence: [
          `Text tokens: ~${textTokens}`,
          `HTML tokens: ~${htmlTokens}`,
          `Ratio: ${(contentRatio * 100).toFixed(1)}%`
        ],
        tags: ['tokens', 'performance', 'efficiency'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for repetitive nav/footer content
    const nav = $('nav');
    const footer = $('footer');
    let repetitiveTokens = 0;

    if (nav.length > 1) {
      nav.each((_, el) => {
        repetitiveTokens += estimateTokenCount($(el).text());
      });
      
      issues.push({
        id: `${CATEGORY.CHUNK}-003`,
        title: 'Duplicate navigation elements',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: `Found ${nav.length} <nav> elements. Multiple navigation sections waste ~${repetitiveTokens} tokens with repetitive content.`,
        remediation: 'Consolidate navigation into a single element. If multiple navs are needed, ensure they serve distinct purposes and contain unique content.',
        impactScore: 15,
        location: { url, selector: 'nav' },
        evidence: [`Navigation count: ${nav.length}`, `Estimated wasted tokens: ~${repetitiveTokens}`],
        tags: ['tokens', 'navigation', 'duplication'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for excessive inline styles
    const elementsWithStyle = $('[style]');
    if (elementsWithStyle.length > 20) {
      let inlineStyleTokens = 0;
      elementsWithStyle.each((_, el) => {
        const style = $(el).attr('style') || '';
        inlineStyleTokens += estimateTokenCount(style);
      });

      issues.push({
        id: `${CATEGORY.CHUNK}-004`,
        title: 'Excessive inline styles',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: `Found ${elementsWithStyle.length} elements with inline styles, consuming ~${inlineStyleTokens} tokens. Inline styles add noise for AI parsing.`,
        remediation: 'Move inline styles to CSS classes or external stylesheets. This reduces HTML size and improves token efficiency.',
        impactScore: 10,
        location: { url },
        evidence: [
          `Elements with inline styles: ${elementsWithStyle.length}`,
          `Estimated style tokens: ~${inlineStyleTokens}`
        ],
        tags: ['tokens', 'css', 'efficiency'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for hidden content that wastes tokens
    const hiddenElements = $('[style*="display:none"], [style*="display: none"], [hidden], .hidden');
    if (hiddenElements.length > 5) {
      let hiddenTokens = 0;
      hiddenElements.each((_, el) => {
        hiddenTokens += estimateTokenCount($(el).text());
      });

      if (hiddenTokens > 50) {
        issues.push({
          id: `${CATEGORY.CHUNK}-005`,
          title: 'Hidden content wasting tokens',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.CHUNK,
          description: `Found ${hiddenElements.length} hidden elements containing ~${hiddenTokens} tokens. Hidden content still consumes tokens but provides no value to AI agents.`,
          remediation: 'Remove hidden content from the HTML or use progressive disclosure patterns. Consider server-side rendering to exclude hidden content from initial HTML.',
          impactScore: 15,
          location: { url },
          evidence: [
            `Hidden elements: ${hiddenElements.length}`,
            `Estimated hidden tokens: ~${hiddenTokens}`
          ],
          tags: ['tokens', 'hidden-content', 'efficiency'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for repetitive text patterns (like repeated disclaimers)
    const paragraphs = $('p, li, div');
    const textMap = new Map<string, number>();
    
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) {
        textMap.set(text, (textMap.get(text) || 0) + 1);
      }
    });

    const duplicates = Array.from(textMap.entries()).filter(([_, count]) => count > 2);
    if (duplicates.length > 0) {
      const totalDuplicateTokens = duplicates.reduce((sum, [text, count]) => {
        return sum + estimateTokenCount(text) * (count - 1);
      }, 0);

      issues.push({
        id: `${CATEGORY.CHUNK}-006`,
        title: 'Repetitive text content',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.CHUNK,
        description: `Found ${duplicates.length} text pattern(s) repeated multiple times, wasting ~${totalDuplicateTokens} tokens. Repetitive disclaimers or boilerplate hurt token efficiency.`,
        remediation: 'Consolidate repetitive text into a single location. Use references or footnotes instead of repeating the same text multiple times.',
        impactScore: 20,
        location: { url },
        evidence: [
          `Repetitive patterns: ${duplicates.length}`,
          `Wasted tokens: ~${totalDuplicateTokens}`,
          `Example: "${duplicates[0][0].substring(0, 100)}..."`
        ],
        tags: ['tokens', 'duplication', 'content'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
