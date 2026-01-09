import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

/**
 * Detects client-side rendering issues that impact AI crawler accessibility
 *
 * This rule analyzes whether content is primarily server-rendered or client-rendered
 * by checking for:
 * - Framework signatures (React, Vue, Angular, Next.js, Nuxt, etc.)
 * - Empty root containers that get populated by JavaScript
 * - Presence of pre-rendered content vs. dynamic content
 * - noscript fallbacks
 */
@Rule({
  id: `${CATEGORY.CRAWL}-009`,
  title: 'Pre-rendering needed for AI accessibility',
  category: CATEGORY.CRAWL,
  defaultSeverity: SEVERITY.HIGH,
  tags: ['rendering', 'ssr', 'javascript', 'ai-accessibility', 'seo'],
  priority: 40,
  description: 'Page relies heavily on client-side rendering. AI crawlers and search engines cannot execute JavaScript, so they only see the initial HTML. Pre-rendering or server-side rendering is needed for proper content indexing.'
})
export class PreRenderingNeededRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, html, $ } = ctx;

    // Detect framework signatures
    const frameworkDetection = detectFramework($, html);

    // Check for empty root containers
    const hasEmptyRoot = checkEmptyRootContainer($);

    // Check for noscript fallback
    const hasNoscript = $('noscript').length > 0;

    // Analyze content distribution
    const contentAnalysis = analyzeContent($);

    // Check for pre-rendering markers
    const preRenderingMarkers = detectPreRenderingMarkers($, html);

    // Determine if this is a client-rendered app
    const isClientRendered = frameworkDetection.detected || hasEmptyRoot;

    if (!isClientRendered) {
      return null; // Server-rendered, no issue
    }

    // If it has pre-rendering markers and good content, it's likely SSR/SSG
    if (preRenderingMarkers.hasPreRendering && contentAnalysis.hasSubstantialContent) {
      return null; // Has proper pre-rendering
    }

    // Calculate severity based on content availability
    let severity = SEVERITY.HIGH;
    let impactScore = 40;

    if (contentAnalysis.hasSubstantialContent) {
      // Framework detected but content is available (likely SSR)
      severity = SEVERITY.MEDIUM;
      impactScore = 25;
    } else if (hasEmptyRoot && !contentAnalysis.hasSubstantialContent) {
      // Empty root with no content - critical issue
      severity = SEVERITY.CRITICAL;
      impactScore = 50;
    }

    const evidence: string[] = [];

    if (frameworkDetection.detected) {
      evidence.push(`Framework detected: ${frameworkDetection.framework}`);
      if (frameworkDetection.markers.length > 0) {
        evidence.push(`Markers found: ${frameworkDetection.markers.join(', ')}`);
      }
    }

    if (hasEmptyRoot) {
      evidence.push('Empty root container detected (likely populated by JavaScript)');
    }

    evidence.push(`Content analysis: ${contentAnalysis.textNodes} text nodes, ${contentAnalysis.textLength} characters`);
    evidence.push(`Substantial content: ${contentAnalysis.hasSubstantialContent ? 'Yes' : 'No'}`);

    if (hasNoscript) {
      evidence.push('noscript fallback present');
    }

    if (preRenderingMarkers.hasPreRendering) {
      evidence.push(`Pre-rendering markers: ${preRenderingMarkers.markers.join(', ')}`);
    }

    // Build description based on findings
    let description = 'Page uses client-side rendering';

    if (frameworkDetection.detected) {
      description += ` with ${frameworkDetection.framework}`;
    }

    if (!contentAnalysis.hasSubstantialContent) {
      description += '. The initial HTML contains minimal content, which means AI crawlers and search engines cannot index your page content.';
    } else {
      description += '. While some content is present in the HTML, the framework setup suggests heavy reliance on JavaScript for full functionality.';
    }

    const remediation = buildRemediation(frameworkDetection.framework, hasNoscript, contentAnalysis.hasSubstantialContent);

    return {
      id: `${CATEGORY.CRAWL}-009`,
      title: 'Pre-rendering needed for AI accessibility',
      severity,
      category: CATEGORY.CRAWL,
      description,
      remediation,
      impactScore,
      location: { url },
      evidence,
      tags: ['rendering', 'ssr', 'javascript', 'ai-accessibility', 'seo'],
      confidence: frameworkDetection.detected ? 0.95 : 0.75,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}

/**
 * Detect JavaScript framework signatures
 */
function detectFramework($: any, html: string): {
  detected: boolean;
  framework: string;
  markers: string[];
} {
  const markers: string[] = [];
  let framework = 'Unknown JavaScript framework';

  // React
  if (
    $('[data-reactroot]').length > 0 ||
    $('[data-react-root]').length > 0 ||
    html.includes('__REACT_') ||
    html.includes('react-root')
  ) {
    framework = 'React';
    markers.push('data-reactroot');
  }

  // Next.js
  if (
    $('#__next').length > 0 ||
    $('[id^="__next"]').length > 0 ||
    html.includes('__NEXT_DATA__') ||
    html.includes('_next/static')
  ) {
    framework = 'Next.js';
    markers.push('__next');
    if (html.includes('__NEXT_DATA__')) {
      // Has Next.js data - likely has some SSR
      markers.push('__NEXT_DATA__ (SSR data present)');
    }
  }

  // Nuxt
  if (
    $('#__nuxt').length > 0 ||
    $('[id^="__nuxt"]').length > 0 ||
    html.includes('__NUXT__')
  ) {
    framework = 'Nuxt.js';
    markers.push('__nuxt');
  }

  // Vue
  if (
    $('[data-v-]').length > 0 ||
    $('[v-app]').length > 0 ||
    $('[data-vue-app]').length > 0 ||
    html.includes('data-v-')
  ) {
    framework = 'Vue.js';
    markers.push('data-v-* attributes');
  }

  // Angular
  if (
    $('[ng-version]').length > 0 ||
    $('[ng-app]').length > 0 ||
    $('[ng-controller]').length > 0 ||
    html.includes('ng-version')
  ) {
    framework = 'Angular';
    markers.push('ng-* attributes');
  }

  // Svelte
  if (
    $('[data-svelte]').length > 0 ||
    html.includes('data-svelte')
  ) {
    framework = 'Svelte';
    markers.push('data-svelte');
  }

  // Gatsby
  if (
    $('#___gatsby').length > 0 ||
    $('[data-gatsby]').length > 0 ||
    html.includes('___gatsby')
  ) {
    framework = 'Gatsby';
    markers.push('___gatsby');
  }

  return {
    detected: markers.length > 0,
    framework,
    markers
  };
}

/**
 * Check for empty root containers commonly used by SPAs
 */
function checkEmptyRootContainer($: any): boolean {
  const commonRootIds = ['root', 'app', '__next', '__nuxt', '___gatsby', 'main-app'];

  for (const id of commonRootIds) {
    const $root = $(`#${id}`);
    if ($root.length > 0) {
      const text = $root.text().trim();
      const children = $root.children().length;

      // Empty or minimal content
      if (text.length < 50 && children < 3) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Analyze content distribution in the HTML
 */
function analyzeContent($: any): {
  textNodes: number;
  textLength: number;
  hasSubstantialContent: boolean;
} {
  // Get meaningful text from common content elements
  const contentSelectors = 'p, h1, h2, h3, h4, h5, h6, article, section, main, li';
  const $content = $(contentSelectors);

  let textLength = 0;
  const textNodes = $content.length;

  $content.each((_i: number, el: any) => {
    textLength += $(el).text().trim().length;
  });

  // Substantial content means at least 500 characters of text
  const hasSubstantialContent = textLength >= 500 && textNodes >= 3;

  return {
    textNodes,
    textLength,
    hasSubstantialContent
  };
}

/**
 * Detect pre-rendering markers (SSR/SSG indicators)
 */
function detectPreRenderingMarkers($: any, html: string): {
  hasPreRendering: boolean;
  markers: string[];
} {
  const markers: string[] = [];

  // Next.js SSR data
  if (html.includes('__NEXT_DATA__')) {
    try {
      const scriptContent = $('script#__NEXT_DATA__').html();
      if (scriptContent && scriptContent.length > 100) {
        markers.push('Next.js SSR data (substantial)');
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Nuxt SSR data
  if (html.includes('window.__NUXT__')) {
    markers.push('Nuxt SSR data');
  }

  // Gatsby SSR markers
  if (html.includes('gatsby-loader') || html.includes('gatsby-chunk')) {
    markers.push('Gatsby static generation');
  }

  // Check for hydration markers with content
  const bodyText = $('body').text().trim();
  if (bodyText.length > 1000 && (
    html.includes('data-reactroot') ||
    html.includes('data-react-root') ||
    html.includes('data-v-')
  )) {
    markers.push('Content present with hydration markers (likely SSR)');
  }

  // Next.js App Router detection (SSG without __NEXT_DATA__)
  if (bodyText.length > 1000 && html.includes('_next/static/chunks/') && !html.includes('__NEXT_DATA__')) {
    markers.push('Next.js App Router SSG (substantial pre-rendered content)');
  }

  return {
    hasPreRendering: markers.length > 0,
    markers
  };
}

/**
 * Build remediation advice based on detected framework
 */
function buildRemediation(framework: string, hasNoscript: boolean, hasContent: boolean): string {
  let advice = '';

  if (framework.includes('Next.js')) {
    advice = 'Enable Server-Side Rendering (SSR) or Static Site Generation (SSG) in Next.js. ';
    // Check if App Router or Pages Router
    if (framework.includes('App Router')) {
      advice += 'For App Router: Pages are static by default. ';
      advice += 'Use async Server Components for SSR, or add "use client" only for interactive components. ';
      advice += 'Ensure substantial content is in Server Components, not hidden behind client-side state. ';
    } else {
      advice += 'Use `getServerSideProps` for dynamic SSR or `getStaticProps` for SSG in Pages Router. ';
      advice += 'Or migrate to App Router where pages are static by default. ';
    }
    advice += 'Ensure pages are exported with pre-rendered HTML. ';
  } else if (framework.includes('Nuxt')) {
    advice = 'Enable Universal mode or Static Site Generation in Nuxt.js. ';
    advice += 'Configure `nuxt.config.js` with `mode: \'universal\'` or use `nuxt generate` for static export. ';
  } else if (framework.includes('React')) {
    advice = 'Implement Server-Side Rendering with Next.js, Remix, or a custom Node.js SSR setup. ';
    advice += 'Alternatively, use static site generation with Gatsby or Next.js static export. ';
  } else if (framework.includes('Vue')) {
    advice = 'Use Nuxt.js for SSR, or implement SSR with Vue Server Renderer. ';
    advice += 'For static sites, use VitePress or Nuxt static generation. ';
  } else if (framework.includes('Angular')) {
    advice = 'Enable Angular Universal for server-side rendering. ';
    advice += 'Configure your app with `@nguniversal/express-engine`. ';
  } else if (framework.includes('Gatsby')) {
    advice = 'Gatsby uses static generation by default. Ensure `gatsby build` is generating HTML files properly. ';
    advice += 'Check that dynamic content is being fetched at build time. ';
  } else {
    advice = 'Implement server-side rendering (SSR) or static site generation (SSG) for your framework. ';
    advice += 'Ensure critical content is present in the initial HTML response. ';
  }

  if (!hasContent) {
    advice += 'Currently, AI crawlers see minimal content. ';
  }

  if (!hasNoscript) {
    advice += 'Consider adding <noscript> fallback content for non-JavaScript clients.';
  }

  return advice;
}
