import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-014`,
  title: 'Missing main semantic container',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['semantic', 'html5', 'structure'],
  priority: 12,
  description: 'Checks for main or article elements. These semantic containers help AI agents identify primary content.'
})
export class MissingSemanticHtmlRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Check for proper use of semantic elements
    const hasMain = $('main').length > 0;
    const hasArticle = $('article').length > 0;

    if (hasMain || hasArticle) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-014`,
      title: 'Missing main semantic container',
      severity: SEVERITY.HIGH,
      category: CATEGORY.AIREAD,
      description: 'The page lacks a <main> or <article> element. These semantic containers help AI agents identify the primary content.',
      remediation: 'Wrap your main content in a <main> element, or use <article> for article-type content. This helps AI understand what content is most important.',
      impactScore: 25,
      location: { url },
      evidence: ['No <main> or <article> element found'],
      tags: ['semantic', 'html5', 'structure'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
