import { CATEGORY, Issue, SEVERITY } from "../types.js";
import { estimateTokenCount } from "../utils.js";
import { BaseRule, Rule, RuleContext } from "./registry.js";

@Rule({
  id: `${CATEGORY.CHUNK}-001`,
  title: "Chunk exceeds recommended token/window size",
  category: CATEGORY.CHUNK,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['performance', 'llm'],
  priority: 20,
  description: "Checks if the content chunk exceeds the recommended token/window size for processing."
})
export class ChunkRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const main = $('main').length ? $('main') : $('article').length ? $('article') : $('body');
    const selections: string[] = [];

    if(main.find('h2').length) {
      main.find('h2').each((_, el) => {
        const sectionText = $(el).nextUntil('h2').text().trim();
        selections.push(sectionText);
      });
    } else {
      selections.push(main.text().trim());
    }

    const totalTokens = selections.reduce((acc, text) => acc + estimateTokenCount(text), 0);
    const maxWindow = ctx.options?.maxChunkTokens || 1200;

    if (totalTokens > maxWindow) {
      return {
        id: `${CATEGORY.CHUNK}-001`,
        title: "Chunk exceeds recommended token/window size",
        severity: SEVERITY.CRITICAL,
        category: CATEGORY.CHUNK,
        description: `The content chunk contains approximately ${totalTokens} tokens, which exceeds the recommended maximum of ${maxWindow} tokens.`,
        remediation: `Consider splitting the content into smaller chunks or sections to fit within the recommended token limit of ${maxWindow} tokens for better processing performance.`,
        impactScore: 30,
        location: { url },
        evidence: [`Total tokens: ${totalTokens}`, `Recommended max tokens: ${maxWindow}`],
        tags: ['performance', 'llm', 'embeddings'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}