import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.CRAWL}-012`,
  title: 'Redirect chain detected',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['redirects', 'performance', 'crawl-budget', 'http'],
  priority: 28,
  description: 'Multiple redirects detected before reaching final destination. Redirect chains waste crawl budget and slow down AI crawler indexing.'
})
export class RedirectChainRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, response } = ctx;
    const issues: Issue[] = [];

    if (!response) {
      return null;
    }

    try {
      // Check if we were redirected by comparing original URL with final URL
      const originalUrl = new URL(url);
      const finalUrl = new URL(response.url);

      // If URLs are different, a redirect occurred
      if (originalUrl.href !== finalUrl.href) {
        // Detect redirect chain by checking how many hops occurred
        // We'll do a manual fetch with redirect tracking
        const redirectChain: string[] = [];
        let currentUrl = url;
        let redirectCount = 0;
        const maxRedirects = 10;

        try {
          // Trace the redirect chain
          for (let i = 0; i < maxRedirects; i++) {
            const testResponse = await fetch(currentUrl, {
              method: 'HEAD',
              redirect: 'manual',
              signal: AbortSignal.timeout(ctx.options?.timeoutMs || 5000)
            });

            redirectChain.push(currentUrl);

            if (testResponse.status >= 300 && testResponse.status < 400) {
              const location = testResponse.headers.get('location');
              if (location) {
                // Resolve relative URLs
                currentUrl = new URL(location, currentUrl).href;
                redirectCount++;
              } else {
                break;
              }
            } else {
              // Final destination reached
              redirectChain.push(currentUrl);
              break;
            }
          }

          // Analyze the redirect chain
          if (redirectCount > 1) {
            // Multiple redirects - this is a chain
            issues.push({
              id: `${CATEGORY.CRAWL}-012`,
              title: 'Redirect chain detected',
              severity: SEVERITY.MEDIUM,
              category: CATEGORY.CRAWL,
              description: `Page has ${redirectCount} redirect(s) before reaching the final destination. Redirect chains waste crawl budget and delay content indexing by AI crawlers.`,
              remediation: 'Update links to point directly to the final destination URL. Use direct 301 redirects instead of chains.',
              impactScore: 25,
              location: { url },
              evidence: [
                `Redirect chain (${redirectCount} hops):`,
                ...redirectChain.map((u, i) => `${i + 1}. ${u}`)
              ],
              tags: ['redirects', 'performance', 'crawl-budget'],
              confidence: 1,
              timestamp: new Date().toISOString()
            } as Issue);
          } else if (redirectCount === 1) {
            // Single redirect - check if it's permanent or temporary
            const testResponse = await fetch(url, {
              method: 'HEAD',
              redirect: 'manual',
              signal: AbortSignal.timeout(ctx.options?.timeoutMs || 5000)
            });

            const isTemporary = testResponse.status === 302 || testResponse.status === 307;

            if (isTemporary) {
              issues.push({
                id: `${CATEGORY.CRAWL}-012-temporary`,
                title: 'Temporary redirect used',
                severity: SEVERITY.LOW,
                category: CATEGORY.CRAWL,
                description: `Page uses temporary redirect (${testResponse.status}). AI crawlers may continue indexing the old URL instead of the new one.`,
                remediation: 'Use 301 (permanent redirect) instead of 302/307 for permanent moves to help crawlers update their index.',
                impactScore: 15,
                location: { url },
                evidence: [
                  `HTTP Status: ${testResponse.status}`,
                  `Original: ${url}`,
                  `Redirects to: ${finalUrl.href}`
                ],
                tags: ['redirects', 'http-status', 'seo'],
                confidence: 1,
                timestamp: new Date().toISOString()
              } as Issue);
            }

            // Check for protocol redirects (http -> https)
            if (originalUrl.protocol === 'http:' && finalUrl.protocol === 'https:') {
              // This is actually good, just note it
              issues.push({
                id: `${CATEGORY.CRAWL}-012-http-to-https`,
                title: 'HTTP to HTTPS redirect',
                severity: SEVERITY.INFO,
                category: CATEGORY.CRAWL,
                description: 'Page redirects from HTTP to HTTPS. This is good for security, but direct HTTPS links are more efficient.',
                remediation: 'Update internal and external links to use HTTPS directly to avoid unnecessary redirects.',
                impactScore: 5,
                location: { url },
                evidence: [
                  `Original: ${originalUrl.href}`,
                  `Redirects to: ${finalUrl.href}`
                ],
                tags: ['redirects', 'https', 'performance'],
                confidence: 1,
                timestamp: new Date().toISOString()
              } as Issue);
            }

            // Check for www/non-www redirects
            const originalHost = originalUrl.hostname;
            const finalHost = finalUrl.hostname;
            const wwwRedirect =
              (originalHost.startsWith('www.') && !finalHost.startsWith('www.')) ||
              (!originalHost.startsWith('www.') && finalHost.startsWith('www.'));

            if (wwwRedirect) {
              issues.push({
                id: `${CATEGORY.CRAWL}-012-www-redirect`,
                title: 'WWW redirect detected',
                severity: SEVERITY.INFO,
                category: CATEGORY.CRAWL,
                description: 'Page redirects between www and non-www versions. This is normal, but direct links are more efficient.',
                remediation: 'Update links to use your preferred domain format (www or non-www) directly.',
                impactScore: 5,
                location: { url },
                evidence: [
                  `Original: ${originalUrl.href}`,
                  `Redirects to: ${finalUrl.href}`
                ],
                tags: ['redirects', 'canonicalization', 'performance'],
                confidence: 1,
                timestamp: new Date().toISOString()
              } as Issue);
            }
          }
        } catch (error) {
          // Couldn't trace redirects - skip detailed analysis
          // But we know a redirect happened (URLs differ)
          if (redirectCount === 0) {
            issues.push({
              id: `${CATEGORY.CRAWL}-012-unknown`,
              title: 'Redirect detected',
              severity: SEVERITY.LOW,
              category: CATEGORY.CRAWL,
              description: 'Page redirects to a different URL. Could not determine redirect chain details.',
              remediation: 'Ensure redirects are necessary and use 301 for permanent moves.',
              impactScore: 10,
              location: { url },
              evidence: [
                `Original: ${originalUrl.href}`,
                `Final: ${finalUrl.href}`
              ],
              tags: ['redirects', 'http'],
              confidence: 0.7,
              timestamp: new Date().toISOString()
            } as Issue);
          }
        }
      }
    } catch (error) {
      // URL parsing error or other issues - skip this rule
      return null;
    }

    return issues.length > 0 ? issues : null;
  }
}
