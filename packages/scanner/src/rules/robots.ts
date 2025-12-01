import { CATEGORY, Issue, SEVERITY } from '../types';
import { Rule, BaseRule, RuleContext } from './registry';
import ubdici from 'undici';

@Rule({
  id: `${CATEGORY.AIREAD}-009`,
  title: 'robots.txt blocks GPTBot/known AI crawlers',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['crawl','robots'],
  priority: 5,
  description: 'Detects robots directives that block popular AI crawlers such as GPTBot or Perplexity.'
})
export class RobotsRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url } = ctx;
    try {
      const root = new URL(url).origin;
      const robotsUrl = `${root}/robots.txt`;

      const res = await fetch(robotsUrl);
      if (!res || res.status >= 400) return null;
      const txt = await res.text();
      const lower = txt.toLowerCase();
      const blocksGPT = lower.includes('gptbot') && lower.includes('disallow');
      const blocksPerplex = lower.includes('perplexity') && lower.includes('disallow');

      if (blocksGPT || blocksPerplex) {
        return {
          id: `${CATEGORY.AIREAD}-009`,
          title: 'robots.txt blocks GPTBot/known AI crawlers',
          serverity: SEVERITY.CRITICAL,
          category: CATEGORY.AIREAD,
          description: 'robots.txt appears to disallow one or more known AI crawler user-agents (e.g., GPTBot, Perplexity). This prevents AI indexers from accessing content.',
          remediation: 'Allow desired AI crawlers in robots.txt or provide an alternative feed for AI ingestion.',
          impactScore: 40,
          location: { url: robotsUrl },
          evidence: [txt.slice(0, 1000)],
          tags: ['crawl','robots'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    } catch (err) {
      return null;
    }

    return null;
  }
}
