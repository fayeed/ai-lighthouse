import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-032`,
  title: 'Low text contrast detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['accessibility', 'contrast', 'readability'],
  priority: 9,
  description: 'Checks for potential low contrast text that may be difficult for AI vision models to parse.'
})
export class LowTextContrastRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for elements with style attributes that suggest low contrast
    const lowContrastElements = $('[style*="color: #"], [style*="color:#"]').filter((_, el) => {
      const style = $(el).attr('style') || '';
      // Simple heuristic: check for light colors (high hex values)
      const colorMatch = style.match(/color:\s*#([0-9a-fA-F]{6})/);
      if (colorMatch) {
        const hexValue = parseInt(colorMatch[1], 16);
        // If all RGB components are high (light color on likely white background)
        return hexValue > 0xCCCCCC;
      }
      return false;
    });

    if (lowContrastElements.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-032`,
      title: 'Low text contrast detected',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.AIREAD,
      description: `Found ${lowContrastElements.length} element(s) with potentially low contrast. Poor contrast affects both AI vision models and accessibility.`,
      remediation: 'Ensure text meets WCAG contrast ratio guidelines (4.5:1 for normal text, 3:1 for large text).',
      impactScore: 15,
      location: { url },
      evidence: [`Elements with low contrast: ${lowContrastElements.length}`],
      tags: ['accessibility', 'contrast', 'readability'],
      confidence: 0.6,
      timestamp: new Date().toISOString()
    };
  }
}
