import { CATEGORY, Issue, SEVERITY, EFFORT_LEVEL, IMPACT_LEVEL } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-011`,
  title: 'Missing mobile viewport meta tag',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['mobile', 'viewport', 'responsive', 'mobile-first'],
  priority: 35,
  description: 'No viewport meta tag found. Modern AI crawlers prioritize mobile-first indexing and may not properly parse content without proper viewport configuration.'
})
export class MissingMobileViewportRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');

    if (!viewport) {
      issues.push({
        id: `${CATEGORY.CRAWL}-011`,
        title: 'Missing mobile viewport meta tag',
        severity: SEVERITY.HIGH,
        category: CATEGORY.CRAWL,
        description: 'No viewport meta tag found. AI crawlers use mobile-first indexing and may not properly render or understand your content without proper viewport configuration.',
        remediation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> section.',
        impactScore: 35,
        effortLevel: EFFORT_LEVEL.QUICK,
        impactLevel: IMPACT_LEVEL.HIGH,
        location: { url },
        evidence: ['No viewport meta tag found'],
        tags: ['mobile', 'viewport', 'responsive'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    } else {
      // Viewport exists - validate it has proper settings
      const hasWidthDevice = viewport.includes('width=device-width');
      const hasInitialScale = viewport.includes('initial-scale=1');
      const hasUserScalableNo = viewport.includes('user-scalable=no') || viewport.includes('user-scalable=0');

      if (!hasWidthDevice) {
        issues.push({
          id: `${CATEGORY.CRAWL}-011-no-device-width`,
          title: 'Viewport missing width=device-width',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'Viewport meta tag exists but does not include "width=device-width". This can cause rendering issues on mobile devices.',
          remediation: 'Update viewport meta tag to include "width=device-width".',
          impactScore: 20,
          effortLevel: EFFORT_LEVEL.QUICK,
          impactLevel: IMPACT_LEVEL.LOW,
          location: { url },
          evidence: [`Current viewport: ${viewport}`],
          tags: ['mobile', 'viewport', 'responsive'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      if (!hasInitialScale) {
        issues.push({
          id: `${CATEGORY.CRAWL}-011-no-initial-scale`,
          title: 'Viewport missing initial-scale',
          severity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description: 'Viewport meta tag does not include "initial-scale=1". While not critical, this is a best practice for consistent rendering.',
          remediation: 'Update viewport meta tag to include "initial-scale=1".',
          impactScore: 10,
          effortLevel: EFFORT_LEVEL.QUICK,
          impactLevel: IMPACT_LEVEL.MINIMAL,
          location: { url },
          evidence: [`Current viewport: ${viewport}`],
          tags: ['mobile', 'viewport', 'best-practice'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      if (hasUserScalableNo) {
        issues.push({
          id: `${CATEGORY.CRAWL}-011-user-scalable-no`,
          title: 'Viewport disables user scaling',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'Viewport meta tag includes "user-scalable=no", which prevents users from zooming. This is an accessibility issue and may impact mobile crawlers.',
          remediation: 'Remove "user-scalable=no" from viewport meta tag to improve accessibility.',
          impactScore: 15,
          effortLevel: EFFORT_LEVEL.QUICK,
          impactLevel: IMPACT_LEVEL.LOW,
          location: { url },
          evidence: [`Current viewport: ${viewport}`],
          tags: ['mobile', 'viewport', 'accessibility', 'a11y'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    return issues.length > 0 ? issues : null;
  }
}
