import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-095`,
  title: 'Excessive jargon detected',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['jargon', 'technical', 'accessibility'],
  priority: 7,
  description: 'High density of technical terms/acronyms detected.'
})
export class ExcessiveJargonRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    const words = bodyText.split(/\s+/);
    
    // Jargon/technical language check
    const technicalTerms = bodyText.match(/\b[A-Z]{2,}\b/g) || []; // Acronyms
    const jargonDensity = technicalTerms.length / Math.max(words.length, 1);
    
    if (jargonDensity > 0.05) {
      return {
        id: `${CATEGORY.AIREAD}-095`,
        title: 'Excessive jargon detected',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `High density of technical terms/acronyms: ${(jargonDensity * 100).toFixed(1)}% of words.`,
        remediation: 'Define acronyms on first use and consider adding a glossary for technical terms.',
        impactScore: 8,
        location: { url },
        evidence: [`Acronyms found: ${technicalTerms.length}`, `Density: ${(jargonDensity * 100).toFixed(1)}%`],
        tags: ['jargon', 'technical', 'accessibility'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
