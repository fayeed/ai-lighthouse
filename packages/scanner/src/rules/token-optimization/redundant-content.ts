import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { estimateTokenCount } from '../../utils.js';

@Rule({
  id: `${CATEGORY.CHUNK}-002`,
  title: 'Redundant content detected',
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['tokens', 'duplication', 'content'],
  priority: 15,
  description: 'Detects repetitive text patterns that waste AI tokens.'
})
export class RedundantContentRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

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
    if (duplicates.length === 0) {
      return null;
    }

    const totalDuplicateTokens = duplicates.reduce((sum, [text, count]) => {
      return sum + estimateTokenCount(text) * (count - 1);
    }, 0);

    return {
      id: `${CATEGORY.CHUNK}-002`,
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
    } as Issue;
  }
}
