import { CATEGORY, Issue, SEVERITY, EFFORT_LEVEL, IMPACT_LEVEL } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

function validateLlmsTxt(content: string, fileUrl: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  // Check for H1 heading (required per spec)
  const hasH1 = lines.some(line => /^# .+/.test(line.trim()));
  if (!hasH1) {
    issues.push({
      id: `${CATEGORY.CRAWL}-015-no-h1`,
      title: 'llms.txt missing required H1 heading',
      severity: SEVERITY.MEDIUM,
      category: CATEGORY.CRAWL,
      description: 'The llms.txt file is missing a required H1 heading (# Title). Per the specification, the H1 heading with the project/site name is the only required element.',
      remediation: 'Add an H1 heading (e.g., "# Your Site Name") as the first heading in your llms.txt file.',
      impactScore: 15,
      effortLevel: EFFORT_LEVEL.QUICK,
      impactLevel: IMPACT_LEVEL.LOW,
      location: { url: fileUrl },
      evidence: ['No H1 heading (# Title) found in llms.txt'],
      tags: ['llms-txt', 'format', 'validation'],
      confidence: 1,
      timestamp: new Date().toISOString()
    } as Issue);
  }

  // Check for H2 sections with links (recommended structure)
  const hasH2Sections = lines.some(line => /^## .+/.test(line.trim()));
  const hasMarkdownLinks = content.includes('](');

  if (!hasH2Sections || !hasMarkdownLinks) {
    const missing: string[] = [];
    if (!hasH2Sections) missing.push('H2 sections (## Section Name)');
    if (!hasMarkdownLinks) missing.push('markdown links ([name](url))');

    issues.push({
      id: `${CATEGORY.CRAWL}-015-sparse`,
      title: 'llms.txt lacks recommended structure',
      severity: SEVERITY.LOW,
      category: CATEGORY.CRAWL,
      description: `The llms.txt file is missing: ${missing.join(' and ')}. A well-structured llms.txt should have H2 sections with markdown links to key pages, each optionally followed by a colon and description.`,
      remediation: 'Add H2 sections (e.g., "## Documentation") with markdown link lists (e.g., "- [Page Title](https://example.com/page): Description of this page").',
      impactScore: 10,
      effortLevel: EFFORT_LEVEL.EASY,
      impactLevel: IMPACT_LEVEL.LOW,
      location: { url: fileUrl },
      evidence: [`Missing: ${missing.join(', ')}`],
      tags: ['llms-txt', 'format', 'completeness'],
      confidence: 0.9,
      timestamp: new Date().toISOString()
    } as Issue);
  }

  // Check content is not too short (likely placeholder)
  if (content.trim().length < 50) {
    issues.push({
      id: `${CATEGORY.CRAWL}-015-thin`,
      title: 'llms.txt has very little content',
      severity: SEVERITY.LOW,
      category: CATEGORY.CRAWL,
      description: 'The llms.txt file contains very little content and may be a placeholder. An effective llms.txt should provide a meaningful overview of your site for AI agents.',
      remediation: 'Expand your llms.txt to include a description of your site and links to key pages organized by topic.',
      impactScore: 10,
      effortLevel: EFFORT_LEVEL.EASY,
      impactLevel: IMPACT_LEVEL.LOW,
      location: { url: fileUrl },
      evidence: [`Content length: ${content.trim().length} characters`],
      tags: ['llms-txt', 'content', 'quality'],
      confidence: 0.85,
      timestamp: new Date().toISOString()
    } as Issue);
  }

  return issues;
}

@Rule({
  id: `${CATEGORY.CRAWL}-015`,
  title: 'Missing llms.txt file',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['llms-txt', 'ai-agents', 'discoverability', 'llm'],
  priority: 30,
  description: 'No llms.txt file found. The llms.txt standard provides AI agents and LLMs with a structured markdown overview of your site, improving AI discoverability and comprehension.'
})
export class MissingLlmsTxtRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, options } = ctx;
    const issues: Issue[] = [];

    try {
      const baseUrl = new URL(url);
      const origin = baseUrl.origin;
      const timeout = options?.timeoutMs || 5000;

      const llmsTxtUrl = `${origin}/llms.txt`;
      const llmsFullTxtUrl = `${origin}/llms-full.txt`;

      let llmsTxtExists = false;
      let llmsTxtContent = '';
      let llmsFullTxtExists = false;

      // Check llms.txt
      try {
        const response = await fetch(llmsTxtUrl, {
          signal: AbortSignal.timeout(timeout)
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          llmsTxtContent = await response.text();

          // Verify it's actually text/markdown content (not an HTML error page)
          if (contentType.includes('text/html') && llmsTxtContent.trim().startsWith('<!')) {
            llmsTxtExists = false;
          } else {
            llmsTxtExists = true;
          }
        }
      } catch {
        // llms.txt doesn't exist or timed out
      }

      // Check llms-full.txt
      try {
        const response = await fetch(llmsFullTxtUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(timeout)
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            llmsFullTxtExists = true;
          }
        }
      } catch {
        // llms-full.txt doesn't exist or timed out
      }

      if (!llmsTxtExists) {
        issues.push({
          id: `${CATEGORY.CRAWL}-015`,
          title: 'Missing llms.txt file',
          severity: SEVERITY.MEDIUM,
          category: CATEGORY.CRAWL,
          description: 'No llms.txt file found at the root of the domain. The llms.txt standard (llmstxt.org) provides AI agents and LLMs with a structured markdown overview of your site content, improving AI discoverability and reducing token usage.',
          remediation: 'Create a /llms.txt file at your domain root in markdown format. It should include an H1 with your site/project name, an optional blockquote summary, and H2 sections with links to key pages. See https://llmstxt.org for the full specification.',
          impactScore: 20,
          effortLevel: EFFORT_LEVEL.EASY,
          impactLevel: IMPACT_LEVEL.MEDIUM,
          location: { url: llmsTxtUrl },
          evidence: ['No llms.txt found at /llms.txt'],
          tags: ['llms-txt', 'ai-agents', 'discoverability'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);

        return issues;
      }

      // llms.txt exists — validate its structure
      const validationIssues = validateLlmsTxt(llmsTxtContent, llmsTxtUrl);
      issues.push(...validationIssues);

      // Check if the page supports markdown content negotiation (Accept: text/markdown)
      // Cloudflare's "Markdown for Agents" returns:
      //   content-type: text/markdown
      //   x-markdown-tokens: <count>
      //   content-signal: ai-train=yes, search=yes, ai-input=yes
      let supportsMarkdownNegotiation = false;
      let markdownTokens: string | null = null;
      let contentSignal: string | null = null;
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'text/markdown' },
          signal: AbortSignal.timeout(timeout)
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/markdown')) {
            supportsMarkdownNegotiation = true;
            markdownTokens = response.headers.get('x-markdown-tokens');
            contentSignal = response.headers.get('content-signal');
          }
        }
      } catch {
        // Content negotiation check failed
      }

      if (!supportsMarkdownNegotiation) {
        issues.push({
          id: `${CATEGORY.CRAWL}-015-no-markdown-negotiation`,
          title: 'No markdown content negotiation support',
          severity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description: 'The page does not return markdown when requested with "Accept: text/markdown" header. AI agents that use content negotiation to request markdown instead of HTML will not get an optimized response, resulting in higher token usage and noisier content extraction.',
          remediation: 'Enable markdown content negotiation so that requests with "Accept: text/markdown" return a clean markdown version of the page. If using Cloudflare, enable the "Markdown for Agents" feature in your zone settings.',
          impactScore: 12,
          effortLevel: EFFORT_LEVEL.MODERATE,
          impactLevel: IMPACT_LEVEL.LOW,
          location: { url },
          evidence: ['Response to Accept: text/markdown did not return text/markdown content-type'],
          tags: ['llms-txt', 'ai-agents', 'content-negotiation', 'markdown'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      } else {
        // Markdown negotiation is supported — check for token count and content signal headers
        if (!markdownTokens) {
          issues.push({
            id: `${CATEGORY.CRAWL}-015-no-token-count`,
            title: 'Markdown response missing token count header',
            severity: SEVERITY.INFO,
            category: CATEGORY.CRAWL,
            description: 'The markdown response does not include an "x-markdown-tokens" header. This header helps AI agents estimate context window usage before processing the content.',
            remediation: 'Include an "x-markdown-tokens" header in markdown responses indicating the approximate token count of the returned content.',
            impactScore: 5,
            effortLevel: EFFORT_LEVEL.EASY,
            impactLevel: IMPACT_LEVEL.MINIMAL,
            location: { url },
            evidence: ['x-markdown-tokens header not present in markdown response'],
            tags: ['llms-txt', 'ai-agents', 'content-negotiation', 'tokens'],
            confidence: 0.85,
            timestamp: new Date().toISOString()
          } as Issue);
        }

        if (!contentSignal) {
          issues.push({
            id: `${CATEGORY.CRAWL}-015-no-content-signal`,
            title: 'Markdown response missing content-signal header',
            severity: SEVERITY.LOW,
            category: CATEGORY.CRAWL,
            description: 'The markdown response does not include a "content-signal" header. This header communicates AI usage permissions (e.g., ai-train=yes, search=yes, ai-input=yes), helping AI agents understand how your content can be used.',
            remediation: 'Include a "content-signal" header in markdown responses to declare AI usage permissions. Example: "content-signal: ai-train=yes, search=yes, ai-input=yes".',
            impactScore: 8,
            effortLevel: EFFORT_LEVEL.EASY,
            impactLevel: IMPACT_LEVEL.LOW,
            location: { url },
            evidence: ['content-signal header not present in markdown response'],
            tags: ['llms-txt', 'ai-agents', 'content-signal', 'permissions'],
            confidence: 0.85,
            timestamp: new Date().toISOString()
          } as Issue);
        } else {
          // Parse content-signal and flag restrictive signals
          const signals = contentSignal.split(',').map(s => s.trim().toLowerCase());
          const restrictive = signals.filter(s =>
            s.startsWith('ai-train=no') || s.startsWith('ai-input=no')
          );

          if (restrictive.length > 0) {
            issues.push({
              id: `${CATEGORY.CRAWL}-015-restrictive-signal`,
              title: 'Content-signal restricts AI usage',
              severity: SEVERITY.INFO,
              category: CATEGORY.CRAWL,
              description: `The content-signal header contains restrictive directives: ${restrictive.join(', ')}. This tells AI agents that they should not use this content for training or as input, which may limit AI visibility.`,
              remediation: 'If you want AI agents to index and use your content, update the content-signal header to allow AI usage (e.g., "ai-train=yes, ai-input=yes").',
              impactScore: 15,
              effortLevel: EFFORT_LEVEL.QUICK,
              impactLevel: IMPACT_LEVEL.MEDIUM,
              location: { url },
              evidence: [`content-signal: ${contentSignal}`],
              tags: ['llms-txt', 'ai-agents', 'content-signal', 'permissions'],
              confidence: 1,
              timestamp: new Date().toISOString()
            } as Issue);
          }
        }
      }

      if (!llmsFullTxtExists) {
        issues.push({
          id: `${CATEGORY.CRAWL}-015-no-full`,
          title: 'Missing llms-full.txt file',
          severity: SEVERITY.LOW,
          category: CATEGORY.CRAWL,
          description: 'llms.txt exists but no llms-full.txt was found. The llms-full.txt file provides expanded content inline so AI agents don\'t need to follow individual links, reducing latency and improving comprehension.',
          remediation: 'Create a /llms-full.txt file that includes the full content of all pages referenced in llms.txt, expanded inline as markdown.',
          impactScore: 10,
          effortLevel: EFFORT_LEVEL.MODERATE,
          impactLevel: IMPACT_LEVEL.LOW,
          location: { url: llmsFullTxtUrl },
          evidence: ['llms.txt exists but llms-full.txt not found'],
          tags: ['llms-txt', 'ai-agents', 'completeness'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    } catch {
      return null;
    }

    return issues.length > 0 ? issues : null;
  }
}
