import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.TECH}-003`,
  title: 'Render-blocking scripts in head',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['performance', 'rendering', 'scripts'],
  priority: 14,
  description: 'Scripts in <head> without async or defer attributes block page rendering.'
})
export class LargeDomSizeRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for render-blocking resources
    const renderBlockingScripts = $('head script[src]:not([async]):not([defer])').length;
    
    if (renderBlockingScripts > 0) {
      return {
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
      } as Issue;
    }

    return null;
  }
}
