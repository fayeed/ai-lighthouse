import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';
import ubdici from 'undici';

const AI_CRAWLERS = [
  { name: 'GPTBot', agent: 'gptbot' },
  { name: 'ClaudeBot', agent: 'claudebot' },
  { name: 'Claude-Web', agent: 'claude-web' },
  { name: 'Anthropic-AI', agent: 'anthropic-ai' },
  { name: 'PerplexityBot', agent: 'perplexitybot' },
  { name: 'Perplexity', agent: 'perplexity' },
  { name: 'Google-Extended', agent: 'google-extended' },
  { name: 'CCBot', agent: 'ccbot' },
  { name: 'Cohere-AI', agent: 'cohere-ai' },
  { name: 'Omgilibot', agent: 'omgilibot' },
  { name: 'FacebookBot', agent: 'facebookbot' },
  { name: 'Diffbot', agent: 'diffbot' },
  { name: 'Bytespider', agent: 'bytespider' },
  { name: 'ImagesiftBot', agent: 'imagesiftbot' }
]

@Rule({
  id: `${CATEGORY.AIREAD}-009`,
  title: 'robots.txt blocks AI crawlers',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.CRITICAL,
  tags: ['crawl','robots', 'ai-agents'],
  priority: 5,
  description: 'Detects robots directives that block popular AI crawlers such as GPTBot, ClaudeBot, Perplexity, and others.'
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

      const blockedCrawlers: string[] = [];
      
      for (const crawler of AI_CRAWLERS) {
        if (lower.includes(crawler.agent) && lower.includes('disallow')) {
          blockedCrawlers.push(crawler.name);
        }
      }

      if (blockedCrawlers.length > 0) {
        return {
          id: `${CATEGORY.AIREAD}-009`,
          title: 'robots.txt blocks AI crawlers',
          severity: SEVERITY.CRITICAL,
          category: CATEGORY.AIREAD,
          description: `robots.txt disallows ${blockedCrawlers.length} known AI crawler(s): ${blockedCrawlers.join(', ')}. This prevents AI indexers from accessing content for training and search.`,
          remediation: 'Consider allowing AI crawlers in robots.txt if you want your content indexed by AI systems. Review which crawlers should have access and update robots.txt accordingly.',
          impactScore: 40,
          location: { url: robotsUrl },
          evidence: [
            `Blocked crawlers: ${blockedCrawlers.join(', ')}`,
            `robots.txt preview: ${txt.slice(0, 800)}`
          ],
          tags: ['crawl','robots', 'ai-agents'],
          confidence: 0.95,
          timestamp: new Date().toISOString()
        } as Issue;
      }
    } catch (err) {
      return null;
    }

    return null;
  }
}
