import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-096`,
  title: 'Inconsistent entity references',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.LOW,
  tags: ['entity', 'consistency', 'references'],
  priority: 7,
  description: 'Main entity mentioned inconsistently throughout the content.'
})
export class InconsistentEntityReferencesRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    
    // Entity mentions consistency
    const h1Text = $('h1').first().text();
    const titleText = $('title').text();
    const mainEntityMatch = (h1Text || titleText).match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    
    if (mainEntityMatch) {
      const entity = mainEntityMatch[0];
      const mentions = (bodyText.match(new RegExp(entity, 'gi')) || []).length;
      
      if (mentions < 2) {
        return {
          id: `${CATEGORY.AIREAD}-096`,
          title: 'Inconsistent entity references',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Main entity "${entity}" mentioned only ${mentions} time(s) in content.`,
          remediation: 'Reference the main entity consistently throughout the content.',
          impactScore: 6,
          location: { url },
          evidence: [`Entity: ${entity}`, `Mentions: ${mentions}`],
          tags: ['entity', 'consistency', 'references'],
          confidence: 0.5,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    }

    return null;
  }
}
