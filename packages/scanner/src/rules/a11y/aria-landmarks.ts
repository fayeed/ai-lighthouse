import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-001`,
  title: 'No ARIA landmarks or semantic elements',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['accessibility', 'aria', 'landmarks'],
  priority: 12,
  description: 'Checks for ARIA landmark roles and semantic HTML5 elements that help AI agents identify content sections.'
})
export class AriaLandmarksRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const ariaLandmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]');
    const semanticLandmarks = $('main, nav, header, footer, aside');
    
    if (ariaLandmarks.length === 0 && semanticLandmarks.length === 0) {
      return {
        id: `${CATEGORY.A11Y}-001`,
        title: 'No ARIA landmarks or semantic elements',
        severity: SEVERITY.HIGH,
        category: CATEGORY.A11Y,
        description: 'The page lacks ARIA landmark roles and semantic HTML5 elements. These help AI agents identify and navigate content sections.',
        remediation: 'Add ARIA landmark roles (role="main", role="navigation", etc.) or use semantic HTML5 elements (<main>, <nav>, <header>, <footer>).',
        impactScore: 25,
        location: { url },
        evidence: ['No landmarks found'],
        tags: ['accessibility', 'aria', 'landmarks'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
