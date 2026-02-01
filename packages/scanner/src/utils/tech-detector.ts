import type { DetectedTechnology } from '../types';

interface TechSignature {
  key: string;           // Internal key
  displayName: string;   // Human-readable name
  type: 'cms' | 'framework';
  checks: Array<($: any, html: string) => boolean>;
}

const signatures: TechSignature[] = [
  // === CMS Platforms ===
  {
    key: 'wordpress',
    displayName: 'WordPress',
    type: 'cms',
    checks: [
      ($: any, html: string) => html.includes('wp-content') || html.includes('wp-includes'),
      ($: any) => $('meta[name="generator"]').attr('content')?.toLowerCase()?.includes('wordpress') || false,
      ($: any) => $('link[href*="wp-content"]').length > 0 || $('link[href*="wp-includes"]').length > 0,
    ],
  },
  {
    key: 'shopify',
    displayName: 'Shopify',
    type: 'cms',
    checks: [
      ($: any, html: string) => html.includes('cdn.shopify.com') || html.includes('Shopify.theme'),
      ($: any) => $('meta[name="shopify-checkout-api-token"]').length > 0,
      ($: any, html: string) => html.includes('myshopify.com') || html.includes('shopify-section'),
    ],
  },
  {
    key: 'wix',
    displayName: 'Wix',
    type: 'cms',
    checks: [
      ($: any, html: string) => html.includes('static.wixstatic.com') || html.includes('wix-code-sdk'),
      ($: any) => $('meta[name="generator"]').attr('content')?.toLowerCase()?.includes('wix') || false,
      ($: any, html: string) => html.includes('X-Wix') || html.includes('_wix_browser_sess'),
    ],
  },
  {
    key: 'squarespace',
    displayName: 'Squarespace',
    type: 'cms',
    checks: [
      ($: any, html: string) => html.includes('squarespace.com') || html.includes('static1.squarespace.com'),
      ($: any) => $('meta[name="generator"]').attr('content')?.toLowerCase()?.includes('squarespace') || false,
      ($: any) => $('[class*="sqs-"]').length > 0,
    ],
  },
  {
    key: 'webflow',
    displayName: 'Webflow',
    type: 'cms',
    checks: [
      ($: any, html: string) => html.includes('webflow.com') || html.includes('assets-global.website-files.com'),
      ($: any) => $('meta[name="generator"]').attr('content')?.toLowerCase()?.includes('webflow') || false,
      ($: any) => $('html[data-wf-site]').length > 0,
    ],
  },

  // === JS Frameworks ===
  {
    key: 'nextjs',
    displayName: 'Next.js',
    type: 'framework',
    checks: [
      ($: any) => $('#__next').length > 0 || $('[id^="__next"]').length > 0,
      ($: any, html: string) => html.includes('__NEXT_DATA__') || html.includes('_next/static'),
    ],
  },
  {
    key: 'nuxtjs',
    displayName: 'Nuxt.js',
    type: 'framework',
    checks: [
      ($: any) => $('#__nuxt').length > 0 || $('[id^="__nuxt"]').length > 0,
      ($: any, html: string) => html.includes('__NUXT__'),
    ],
  },
  {
    key: 'gatsby',
    displayName: 'Gatsby',
    type: 'framework',
    checks: [
      ($: any) => $('#___gatsby').length > 0 || $('[data-gatsby]').length > 0,
      ($: any, html: string) => html.includes('___gatsby'),
    ],
  },
  {
    key: 'react',
    displayName: 'React',
    type: 'framework',
    checks: [
      ($: any) => $('[data-reactroot]').length > 0 || $('[data-react-root]').length > 0,
      ($: any, html: string) => html.includes('__REACT_') || html.includes('react-root'),
    ],
  },
  {
    key: 'vue',
    displayName: 'Vue.js',
    type: 'framework',
    checks: [
      ($: any) => $('[data-v-]').length > 0 || $('[v-app]').length > 0 || $('[data-vue-app]').length > 0,
      ($: any, html: string) => html.includes('data-v-'),
    ],
  },
  {
    key: 'angular',
    displayName: 'Angular',
    type: 'framework',
    checks: [
      ($: any) => $('[ng-version]').length > 0 || $('[ng-app]').length > 0 || $('[ng-controller]').length > 0,
      ($: any, html: string) => html.includes('ng-version'),
    ],
  },
  {
    key: 'svelte',
    displayName: 'Svelte',
    type: 'framework',
    checks: [
      ($: any) => $('[data-svelte]').length > 0,
      ($: any, html: string) => html.includes('data-svelte') || html.includes('__svelte'),
    ],
  },
];

/**
 * Detect the CMS and/or JavaScript framework used by a page.
 * CMS takes priority over framework for the `platform` label.
 */
export function detectTechnology($: any, html: string): DetectedTechnology {
  const markers: string[] = [];
  let detectedCms: TechSignature | null = null;
  let detectedFramework: TechSignature | null = null;
  let cmsMatchCount = 0;
  let frameworkMatchCount = 0;

  for (const sig of signatures) {
    let matchCount = 0;
    for (const check of sig.checks) {
      try {
        if (check($, html)) matchCount++;
      } catch {
        // Ignore selector errors
      }
    }

    if (matchCount === 0) continue;

    if (sig.type === 'cms' && matchCount > cmsMatchCount) {
      detectedCms = sig;
      cmsMatchCount = matchCount;
      markers.push(`${sig.displayName} (${matchCount} signals)`);
    } else if (sig.type === 'framework' && matchCount > frameworkMatchCount) {
      detectedFramework = sig;
      frameworkMatchCount = matchCount;
      markers.push(`${sig.displayName} (${matchCount} signals)`);
    }
  }

  // CMS-specific frameworks (Next.js on top of Shopify, etc.) — CMS wins for platform label
  const platform = detectedCms?.displayName || detectedFramework?.displayName;
  const totalSignals = cmsMatchCount + frameworkMatchCount;
  const maxPossible = (detectedCms ? detectedCms.checks.length : 0) + (detectedFramework ? detectedFramework.checks.length : 0);
  const confidence = maxPossible > 0 ? Math.min(1, totalSignals / maxPossible) : 0;

  return {
    cms: detectedCms?.key,
    framework: detectedFramework?.key,
    platform: platform || undefined,
    confidence,
    markers,
  };
}
