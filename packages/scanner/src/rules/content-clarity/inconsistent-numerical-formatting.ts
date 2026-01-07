import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: 'CONTENT_CLARITY-009',
  title: 'Inconsistent numerical data formatting',
  category: CATEGORY.CI,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['numbers', 'dates', 'formatting', 'hallucination-prevention', 'consistency'],
  priority: 20,
  description: 'Inconsistent formatting of numbers, dates, currencies, or units. Inconsistent formatting increases hallucination risk in AI systems.'
})
export class InconsistentNumericalFormattingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];
    const evidence: string[] = [];

    // Get main content
    const mainContent = $('main, article, .content, body').first();
    const text = mainContent.text();

    // Track formatting inconsistencies
    const dateFormats: Set<string> = new Set();
    const currencyFormats: Set<string> = new Set();
    const numberFormats: { withCommas: number; withoutCommas: number } = {
      withCommas: 0,
      withoutCommas: 0
    };
    const percentageFormats: { withSpace: number; withoutSpace: number } = {
      withSpace: 0,
      withoutSpace: 0
    };

    // 1. Check date formatting inconsistencies
    const datePatterns = {
      'MM/DD/YYYY': /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      'DD/MM/YYYY': /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // Same pattern, context dependent
      'YYYY-MM-DD': /\b\d{4}-\d{2}-\d{2}\b/g,
      'Month DD, YYYY': /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi,
      'DD Month YYYY': /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi
    };

    Object.entries(datePatterns).forEach(([format, pattern]) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        dateFormats.add(format);
      }
    });

    if (dateFormats.size > 2) {
      issues.push({
        id: 'CONTENT_CLARITY-009-dates',
        title: 'Inconsistent date formatting',
        severity: SEVERITY.MEDIUM,
        category: CATEGORY.CI,
        description: `Multiple date formats detected (${Array.from(dateFormats).join(', ')}). Inconsistent date formatting can confuse AI systems and lead to incorrect temporal understanding.`,
        remediation: 'Standardize on a single date format across the page. ISO 8601 (YYYY-MM-DD) is recommended for machine readability.',
        impactScore: 22,
        location: { url },
        evidence: [`Date formats found: ${Array.from(dateFormats).join(', ')}`],
        tags: ['dates', 'formatting', 'consistency', 'hallucination-prevention'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 2. Check currency formatting
    const currencyPatterns = {
      '$X,XXX.XX': /\$\d{1,3}(,\d{3})*(\.\d{2})?/g,
      '$XXXX': /\$\d+(?!,)/g,
      'X,XXX USD': /\d{1,3}(,\d{3})*\s*(USD|dollars?)/gi,
      '€X,XXX': /€\d{1,3}(,\d{3})*(\.\d{2})?/g,
      '£X,XXX': /£\d{1,3}(,\d{3})*(\.\d{2})?/g
    };

    Object.entries(currencyPatterns).forEach(([format, pattern]) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        currencyFormats.add(format);
      }
    });

    if (currencyFormats.size > 1) {
      issues.push({
        id: 'CONTENT_CLARITY-009-currency',
        title: 'Inconsistent currency formatting',
        severity: SEVERITY.LOW,
        category: CATEGORY.CI,
        description: `Multiple currency formats detected. Inconsistent formatting may cause AI systems to misinterpret prices.`,
        remediation: 'Use consistent currency formatting. For international audiences, always specify the currency code (USD, EUR, GBP).',
        impactScore: 15,
        location: { url },
        evidence: [`Currency formats found: ${Array.from(currencyFormats).join(', ')}`],
        tags: ['currency', 'formatting', 'consistency'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 3. Check large number formatting (with/without commas)
    const largeNumbersWithCommas = text.match(/\b\d{1,3}(,\d{3})+\b/g);
    const largeNumbersWithoutCommas = text.match(/\b\d{5,}\b/g);

    if (largeNumbersWithCommas) {
      numberFormats.withCommas = largeNumbersWithCommas.length;
    }
    if (largeNumbersWithoutCommas) {
      // Filter out years (1900-2099) and common IDs
      const filteredNumbers = largeNumbersWithoutCommas.filter(
        (num) => !(num.length === 4 && parseInt(num) >= 1900 && parseInt(num) <= 2099)
      );
      numberFormats.withoutCommas = filteredNumbers.length;
    }

    if (numberFormats.withCommas > 0 && numberFormats.withoutCommas > 2) {
      issues.push({
        id: 'CONTENT_CLARITY-009-numbers',
        title: 'Inconsistent large number formatting',
        severity: SEVERITY.LOW,
        category: CATEGORY.CI,
        description: `Large numbers formatted inconsistently (some with commas, some without). This can affect readability and AI parsing.`,
        remediation: 'Format all large numbers consistently, preferably with comma separators (e.g., 1,000,000) for readability.',
        impactScore: 12,
        location: { url },
        evidence: [
          `Numbers with commas: ${numberFormats.withCommas}`,
          `Numbers without commas: ${numberFormats.withoutCommas}`
        ],
        tags: ['numbers', 'formatting', 'consistency'],
        confidence: 0.75,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 4. Check percentage formatting
    const percentWithSpace = text.match(/\d+\s+%/g);
    const percentWithoutSpace = text.match(/\d+%/g);

    if (percentWithSpace) {
      percentageFormats.withSpace = percentWithSpace.length;
    }
    if (percentWithoutSpace) {
      percentageFormats.withoutSpace = percentWithoutSpace.length;
    }

    if (percentageFormats.withSpace > 0 && percentageFormats.withoutSpace > 0) {
      issues.push({
        id: 'CONTENT_CLARITY-009-percentages',
        title: 'Inconsistent percentage formatting',
        severity: SEVERITY.LOW,
        category: CATEGORY.CI,
        description: `Percentages formatted inconsistently (some with space before %, some without).`,
        remediation: 'Standardize percentage formatting. Recommended: no space before % (e.g., 95%).',
        impactScore: 8,
        location: { url },
        evidence: [
          `With space: ${percentageFormats.withSpace} occurrences`,
          `Without space: ${percentageFormats.withoutSpace} occurrences`
        ],
        tags: ['percentages', 'formatting', 'consistency'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 5. Check for unit inconsistencies (metric vs imperial)
    const metricUnits = text.match(/\d+\s*(kg|km|cm|mm|m|l|ml|g)\b/gi);
    const imperialUnits = text.match(/\d+\s*(lbs?|miles?|feet|ft|inches?|in|oz|gal)\b/gi);

    if (metricUnits && imperialUnits && metricUnits.length > 1 && imperialUnits.length > 1) {
      issues.push({
        id: 'CONTENT_CLARITY-009-units',
        title: 'Mixed metric and imperial units',
        severity: SEVERITY.LOW,
        category: CATEGORY.CI,
        description: `Both metric and imperial units detected. Mixed unit systems can confuse AI and international audiences.`,
        remediation: 'Use consistent measurement units. For international audiences, prefer metric with imperial in parentheses, or vice versa.',
        impactScore: 10,
        location: { url },
        evidence: [
          `Metric units: ${metricUnits.length} occurrences`,
          `Imperial units: ${imperialUnits.length} occurrences`
        ],
        tags: ['units', 'measurements', 'consistency'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 6. Check for ambiguous numbers without context
    const ambiguousNumbers = text.match(/\b\d+\b/g);
    if (ambiguousNumbers && ambiguousNumbers.length > 20) {
      // Count how many have nearby context (units, labels, etc.)
      const numbersWithContext = text.match(/\d+\s*(kg|lbs?|km|miles?|%|USD|\$|€|£|years?|months?|days?|hours?|minutes?|people|users|customers)/gi);

      const contextRatio = numbersWithContext ? numbersWithContext.length / ambiguousNumbers.length : 0;

      if (contextRatio < 0.3) {
        issues.push({
          id: 'CONTENT_CLARITY-009-ambiguous',
          title: 'Numbers lacking context',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CI,
          description: `Many numbers found without clear units or context. Ambiguous numbers increase hallucination risk as AI systems may guess meanings.`,
          remediation: 'Always provide context for numbers: include units (kg, miles, USD), labels (users, downloads), or surrounding descriptive text.',
          impactScore: 18,
          location: { url },
          evidence: [
            `Total numbers: ${ambiguousNumbers.length}`,
            `Numbers with context: ${numbersWithContext?.length || 0}`,
            `Context ratio: ${(contextRatio * 100).toFixed(1)}%`
          ],
          tags: ['numbers', 'context', 'clarity', 'hallucination-prevention'],
          confidence: 0.7,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    return issues.length > 0 ? issues : null;
  }
}
