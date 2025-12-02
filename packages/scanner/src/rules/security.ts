import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.TECH}-007`,
  title: 'Security and trust signals',
  category: CATEGORY.TECH,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['security', 'https', 'trust'],
  priority: 10,
  description: 'Checks security factors that affect AI crawler trust and content credibility.'
})
export class SecurityRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check if URL is HTTPS
    const isHttps = url.startsWith('https://');
    if (!isHttps) {
      issues.push({
        id: `${CATEGORY.TECH}-007`,
        title: 'Page not served over HTTPS',
        serverity: SEVERITY.CRITICAL,
        category: CATEGORY.TECH,
        description: 'The page is served over HTTP instead of HTTPS. Many AI crawlers prefer or require HTTPS for security.',
        remediation: 'Implement HTTPS with a valid SSL/TLS certificate. HTTPS is essential for modern web security.',
        impactScore: 35,
        location: { url },
        evidence: ['Protocol: HTTP'],
        tags: ['security', 'https', 'ssl'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for mixed content (HTTPS page loading HTTP resources)
    if (isHttps) {
      const httpResources = $('script[src^="http:"], link[href^="http:"], img[src^="http:"], iframe[src^="http:"]').length;
      if (httpResources > 0) {
        issues.push({
          id: `${CATEGORY.TECH}-008`,
          title: 'Mixed content detected',
          serverity: SEVERITY.HIGH,
          category: CATEGORY.TECH,
          description: `HTTPS page loading ${httpResources} HTTP resource(s). Mixed content is blocked by browsers and raises security concerns.`,
          remediation: 'Update all resource URLs to use HTTPS or protocol-relative URLs (//).',
          impactScore: 25,
          location: { url },
          evidence: [`HTTP resources on HTTPS page: ${httpResources}`],
          tags: ['security', 'mixed-content', 'https'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for security-related headers (via meta tags)
    const cspMeta = $('meta[http-equiv="Content-Security-Policy"]').length;
    const xFrameOptions = $('meta[http-equiv="X-Frame-Options"]').length;
    
    // Note: These are more reliably checked via HTTP headers, but we can detect meta tag usage
    if (cspMeta === 0) {
      issues.push({
        id: `${CATEGORY.TECH}-009`,
        title: 'No Content Security Policy',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: 'No CSP meta tag detected. Content Security Policy helps prevent XSS attacks and signals security awareness to crawlers.',
        remediation: 'Implement Content-Security-Policy header or meta tag to enhance security.',
        impactScore: 10,
        location: { url },
        evidence: ['No CSP detected in meta tags'],
        tags: ['security', 'csp', 'headers'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for forms without HTTPS action
    const forms = $('form[action]');
    let insecureForms = 0;
    
    forms.each((_, el) => {
      const action = $(el).attr('action');
      if (action && action.startsWith('http://')) {
        insecureForms++;
      }
    });

    if (insecureForms > 0) {
      issues.push({
        id: `${CATEGORY.TECH}-010`,
        title: 'Forms submitting to HTTP',
        serverity: SEVERITY.CRITICAL,
        category: CATEGORY.TECH,
        description: `Found ${insecureForms} form(s) submitting to HTTP URLs. This exposes user data and signals poor security practices.`,
        remediation: 'Update form actions to use HTTPS URLs to protect user data in transit.',
        impactScore: 30,
        location: { url, selector: 'form[action^="http:"]' },
        evidence: [`Insecure forms: ${insecureForms}`],
        tags: ['security', 'forms', 'https'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for password inputs without autocomplete
    const passwordInputs = $('input[type="password"]');
    let passwordsWithoutAutocomplete = 0;
    
    passwordInputs.each((_, el) => {
      const autocomplete = $(el).attr('autocomplete');
      if (!autocomplete || (autocomplete !== 'current-password' && autocomplete !== 'new-password')) {
        passwordsWithoutAutocomplete++;
      }
    });

    if (passwordsWithoutAutocomplete > 0) {
      issues.push({
        id: `${CATEGORY.TECH}-011`,
        title: 'Password inputs lacking proper autocomplete',
        serverity: SEVERITY.LOW,
        category: CATEGORY.TECH,
        description: `Found ${passwordsWithoutAutocomplete} password input(s) without proper autocomplete attributes. This affects password manager integration.`,
        remediation: 'Add autocomplete="current-password" or autocomplete="new-password" to password inputs.',
        impactScore: 5,
        location: { url, selector: 'input[type="password"]' },
        evidence: [`Password inputs without autocomplete: ${passwordsWithoutAutocomplete}`],
        tags: ['security', 'forms', 'autocomplete'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for external scripts from potentially untrusted sources
    const externalScripts = $('script[src]');
    const untrustedDomains = ['unknown-cdn.com', 'suspicious-analytics.com']; // Example list
    let scriptsFromUntrustedSources = 0;
    
    externalScripts.each((_, el) => {
      const src = $(el).attr('src');
      const integrity = $(el).attr('integrity');
      
      if (src && src.startsWith('http') && !integrity) {
        scriptsFromUntrustedSources++;
      }
    });

    if (scriptsFromUntrustedSources > 0) {
      issues.push({
        id: `${CATEGORY.TECH}-012`,
        title: 'External scripts without integrity checks',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.TECH,
        description: `Found ${scriptsFromUntrustedSources} external script(s) without Subresource Integrity (SRI) checks. This poses security risks.`,
        remediation: 'Add integrity and crossorigin attributes to external script tags for SRI verification.',
        impactScore: 15,
        location: { url },
        evidence: [`Scripts without SRI: ${scriptsFromUntrustedSources}`],
        tags: ['security', 'sri', 'scripts'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
