/**
 * SEO Analysis - Traditional Search Engine Optimization
 * Analyzes core SEO elements like title, meta tags, headings, links, etc.
 */

import type { CheerioAPI } from 'cheerio';
import { SEOAnalysis, SEOIssue, Issue, CATEGORY, SEVERITY } from '../types.js';
import { getLetterGrade } from '../scoring.js';

interface SEOAnalysisContext {
  $: CheerioAPI;
  url: string;
  response?: Response;
}

/**
 * Perform comprehensive SEO analysis
 */
export function analyzeSEO(ctx: SEOAnalysisContext): SEOAnalysis {
  const { $, url } = ctx;
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Analyze title
  const titleEl = $('title').first();
  const titleContent = titleEl.text().trim();
  const titleLength = titleContent.length;
  const titleOptimal = titleLength >= 50 && titleLength <= 60;

  if (!titleContent) {
    issues.push({
      id: 'SEO-001',
      type: 'critical',
      title: 'Missing page title',
      description: 'The page is missing a <title> tag, which is critical for SEO.',
      fix: 'Add a descriptive title tag between 50-60 characters.',
    });
    score -= 15;
  } else if (titleLength < 30) {
    issues.push({
      id: 'SEO-002',
      type: 'warning',
      title: 'Title too short',
      description: `Title is only ${titleLength} characters. Optimal length is 50-60 characters.`,
      fix: 'Expand the title to include more descriptive keywords.',
    });
    score -= 5;
  } else if (titleLength > 60) {
    issues.push({
      id: 'SEO-003',
      type: 'warning',
      title: 'Title too long',
      description: `Title is ${titleLength} characters. It may be truncated in search results.`,
      fix: 'Shorten the title to 60 characters or less.',
    });
    score -= 3;
  }

  const title = {
    present: !!titleContent,
    length: titleLength,
    optimal: titleOptimal,
    content: titleContent || undefined,
  };

  // Analyze meta description
  const metaDescEl = $('meta[name="description"]').first();
  const metaDescContent = metaDescEl.attr('content')?.trim() || '';
  const metaDescLength = metaDescContent.length;
  const metaDescOptimal = metaDescLength >= 150 && metaDescLength <= 160;

  if (!metaDescContent) {
    issues.push({
      id: 'SEO-004',
      type: 'critical',
      title: 'Missing meta description',
      description: 'The page is missing a meta description, which helps with click-through rates.',
      fix: 'Add a compelling meta description between 150-160 characters.',
    });
    score -= 10;
  } else if (metaDescLength < 120) {
    issues.push({
      id: 'SEO-005',
      type: 'warning',
      title: 'Meta description too short',
      description: `Meta description is only ${metaDescLength} characters. Optimal length is 150-160 characters.`,
      fix: 'Expand the meta description with more compelling copy.',
    });
    score -= 3;
  } else if (metaDescLength > 160) {
    issues.push({
      id: 'SEO-006',
      type: 'info',
      title: 'Meta description may be truncated',
      description: `Meta description is ${metaDescLength} characters and may be cut off in search results.`,
      fix: 'Consider shortening to 160 characters.',
    });
    score -= 1;
  }

  const metaDescription = {
    present: !!metaDescContent,
    length: metaDescLength,
    optimal: metaDescOptimal,
    content: metaDescContent || undefined,
  };

  // Analyze headings
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1Content = h1Elements.first().text().trim();

  if (h1Count === 0) {
    issues.push({
      id: 'SEO-007',
      type: 'critical',
      title: 'Missing H1 heading',
      description: 'The page has no H1 heading, which is important for SEO and accessibility.',
      fix: 'Add a single, descriptive H1 heading that matches the page content.',
    });
    score -= 10;
  } else if (h1Count > 1) {
    issues.push({
      id: 'SEO-008',
      type: 'warning',
      title: 'Multiple H1 headings',
      description: `The page has ${h1Count} H1 headings. Best practice is to have exactly one.`,
      fix: 'Use only one H1 heading and demote others to H2 or lower.',
    });
    score -= 5;
  }

  // Check heading hierarchy
  const headingStructure: { level: number; count: number }[] = [];
  let hasProperHierarchy = true;
  let lastLevel = 0;

  for (let i = 1; i <= 6; i++) {
    const count = $(`h${i}`).length;
    if (count > 0) {
      headingStructure.push({ level: i, count });
      if (i - lastLevel > 1 && lastLevel > 0) {
        hasProperHierarchy = false;
      }
      lastLevel = i;
    }
  }

  if (!hasProperHierarchy) {
    issues.push({
      id: 'SEO-009',
      type: 'warning',
      title: 'Improper heading hierarchy',
      description: 'Heading levels are skipped (e.g., H1 to H3 without H2).',
      fix: 'Maintain proper heading hierarchy without skipping levels.',
    });
    score -= 3;
  }

  const headings = {
    h1Count,
    h1Content: h1Content || undefined,
    hasProperHierarchy,
    headingStructure,
  };

  // Analyze images
  const allImages = $('img');
  const imagesWithAlt = $('img[alt]:not([alt=""])');
  const imagesWithoutAlt = allImages.length - imagesWithAlt.length;
  const altCoverage = allImages.length > 0 ? (imagesWithAlt.length / allImages.length) * 100 : 100;

  if (imagesWithoutAlt > 0) {
    issues.push({
      id: 'SEO-010',
      type: imagesWithoutAlt > 5 ? 'critical' : 'warning',
      title: 'Images missing alt text',
      description: `${imagesWithoutAlt} image(s) are missing alt attributes.`,
      fix: 'Add descriptive alt text to all images for SEO and accessibility.',
    });
    score -= Math.min(10, imagesWithoutAlt * 2);
  }

  const images = {
    total: allImages.length,
    withAlt: imagesWithAlt.length,
    withoutAlt: imagesWithoutAlt,
    altCoverage: Math.round(altCoverage),
  };

  // Analyze links
  const allLinks = $('a[href]');
  const currentHost = new URL(url).hostname;
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;

  allLinks.each((_, el) => {
    const href = $(el).attr('href');
    const rel = $(el).attr('rel') || '';

    if (href) {
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === currentHost) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        internalLinks++; // Relative links are internal
      }
    }

    if (rel.includes('nofollow')) {
      nofollowLinks++;
    }
  });

  if (internalLinks < 3) {
    issues.push({
      id: 'SEO-011',
      type: 'warning',
      title: 'Low internal linking',
      description: `Only ${internalLinks} internal links found. Internal linking helps SEO.`,
      fix: 'Add more internal links to relevant pages on your site.',
    });
    score -= 3;
  }

  const links = {
    internal: internalLinks,
    external: externalLinks,
    broken: 0, // Would need async check
    nofollow: nofollowLinks,
  };

  // Analyze canonical
  const canonicalEl = $('link[rel="canonical"]').first();
  const canonicalUrl = canonicalEl.attr('href');
  const selfReferencing = canonicalUrl === url;

  if (!canonicalUrl) {
    issues.push({
      id: 'SEO-012',
      type: 'warning',
      title: 'Missing canonical URL',
      description: 'No canonical URL is specified, which can lead to duplicate content issues.',
      fix: 'Add a canonical link tag pointing to the preferred URL.',
    });
    score -= 5;
  }

  const canonical = {
    present: !!canonicalUrl,
    url: canonicalUrl,
    selfReferencing,
  };

  // Analyze robots
  const metaRobots = $('meta[name="robots"]').attr('content');
  const isIndexable = !metaRobots?.includes('noindex');

  if (!isIndexable) {
    issues.push({
      id: 'SEO-013',
      type: 'info',
      title: 'Page set to noindex',
      description: 'This page has a noindex directive and will not appear in search results.',
      fix: 'Remove noindex if you want this page to be indexed.',
    });
  }

  const robots = {
    metaRobots,
    robotsTxtAccessible: true, // Would need async check
    isIndexable,
  };

  // Analyze mobile viewport
  const viewportEl = $('meta[name="viewport"]').first();
  const viewportContent = viewportEl.attr('content');
  const hasViewport = !!viewportContent;

  if (!hasViewport) {
    issues.push({
      id: 'SEO-014',
      type: 'critical',
      title: 'Missing viewport meta tag',
      description: 'No viewport meta tag found. This page may not be mobile-friendly.',
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
    });
    score -= 10;
  }

  const mobile = {
    hasViewport,
    viewportContent,
  };

  // Performance indicators (basic checks)
  const performance = {
    hasCompression: true, // Would need response headers
    hasCaching: true, // Would need response headers
  };

  // Generate recommendations based on issues
  if (issues.filter(i => i.type === 'critical').length > 0) {
    recommendations.push('Address critical SEO issues first: missing title, meta description, or H1.');
  }
  if (altCoverage < 100) {
    recommendations.push('Add alt text to all images to improve accessibility and image search visibility.');
  }
  if (internalLinks < 5) {
    recommendations.push('Increase internal linking to help search engines discover and understand your content.');
  }
  if (!canonicalUrl) {
    recommendations.push('Implement canonical URLs to prevent duplicate content issues.');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: getLetterGrade(score),
    title,
    metaDescription,
    headings,
    images,
    links,
    canonical,
    robots,
    mobile,
    performance,
    issues,
    recommendations,
  };
}

/**
 * Convert SEO issues to scanner Issue format
 */
export function seoIssuesToScannerIssues(seoAnalysis: SEOAnalysis): Issue[] {
  return seoAnalysis.issues.map((issue, index) => ({
    id: issue.id,
    title: issue.title,
    severity: issue.type === 'critical' ? SEVERITY.HIGH :
              issue.type === 'warning' ? SEVERITY.MEDIUM : SEVERITY.LOW,
    category: CATEGORY.SEO,
    description: issue.description,
    remediation: issue.fix,
    impactScore: issue.type === 'critical' ? 15 :
                 issue.type === 'warning' ? 8 : 3,
    tags: ['seo', issue.type],
    confidence: 0.95,
    timestamp: new Date().toISOString(),
  }));
}
