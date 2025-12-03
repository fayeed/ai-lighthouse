import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-094`,
  title: 'Low clarity score',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['clarity', 'readability', 'score'],
  priority: 8,
  description: 'Content clarity score is low. Multiple readability issues detected.'
})
export class LowClarityScoreRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    const hasSummary = $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').length > 0;
    
    const lists = $('ul, ol').filter((_, el) => {
      return $(el).find('li').length >= 3;
    });
    
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = bodyText.split(/\s+/);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    
    const textLength = bodyText.replace(/\s+/g, ' ').trim().length;
    const htmlLength = $.html().length;
    const contentRatio = textLength / htmlLength;
    
    // Clarity heuristic score
    let clarityScore = 100;
    const clarityIssues: string[] = [];
    
    if (!hasSummary) { clarityScore -= 10; clarityIssues.push('No summary'); }
    if (lists.length === 0) { clarityScore -= 8; clarityIssues.push('No lists'); }
    if (avgWordsPerSentence > 25) { clarityScore -= 15; clarityIssues.push('Long sentences'); }
    if (contentRatio < 0.15) { clarityScore -= 12; clarityIssues.push('Low content density'); }
    if (paragraphs.length > 0 && paragraphs.filter((_, el) => $(el).text().length > 1000).length > paragraphs.length / 2) {
      clarityScore -= 10;
      clarityIssues.push('Long paragraphs');
    }
    
    if (clarityScore < 60) {
      return {
        id: `${CATEGORY.AIREAD}-094`,
        title: 'Low clarity score',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content clarity score: ${clarityScore}/100. Multiple readability issues detected.`,
        remediation: 'Improve structure, readability, and organization. Issues: ' + clarityIssues.join(', '),
        impactScore: 20,
        location: { url },
        evidence: [`Clarity score: ${clarityScore}`, `Issues: ${clarityIssues.join(', ')}`],
        tags: ['clarity', 'readability', 'score'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
