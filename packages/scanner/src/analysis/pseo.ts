/**
 * PSEO Analysis - Programmatic SEO
 * Analyzes content patterns for scalable, template-based SEO
 */

import type { CheerioAPI } from 'cheerio';
import { PSEOAnalysis, SEOIssue, Issue, CATEGORY, SEVERITY } from '../types.js';
import { getLetterGrade } from '../scoring.js';

interface PSEOAnalysisContext {
  $: CheerioAPI;
  url: string;
}

/**
 * Perform Programmatic SEO analysis
 */
export function analyzePSEO(ctx: PSEOAnalysisContext): PSEOAnalysis {
  const { $, url } = ctx;
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Analyze template signals
  const templateSignals = analyzeTemplateSignals($, url);

  // Analyze content uniqueness
  const contentUniqueness = analyzeContentUniqueness($);

  // Analyze keyword optimization
  const keywordOptimization = analyzeKeywordOptimization($);

  // Analyze internal linking patterns
  const internalLinking = analyzeInternalLinking($, url);

  // Analyze schema readiness
  const schemaReadiness = analyzeSchemaReadiness($);

  // Score adjustments based on PSEO factors
  if (!templateSignals.hasConsistentStructure) {
    issues.push({
      id: 'PSEO-001',
      type: 'warning',
      title: 'Inconsistent page structure',
      description: 'The page lacks consistent structural patterns that enable programmatic SEO.',
      fix: 'Establish clear, repeatable content sections with consistent HTML structure.',
    });
    score -= 5;
  }

  if (contentUniqueness.uniqueContentRatio < 0.5) {
    issues.push({
      id: 'PSEO-002',
      type: 'critical',
      title: 'Low content uniqueness',
      description: `Only ${Math.round(contentUniqueness.uniqueContentRatio * 100)}% of content appears unique.`,
      fix: 'Increase unique content ratio by adding specific, valuable information.',
    });
    score -= 15;
  } else if (contentUniqueness.uniqueContentRatio < 0.7) {
    issues.push({
      id: 'PSEO-003',
      type: 'warning',
      title: 'Moderate content uniqueness',
      description: `Content uniqueness is at ${Math.round(contentUniqueness.uniqueContentRatio * 100)}%. Aim for 70%+.`,
      fix: 'Add more unique, specific content to differentiate from similar pages.',
    });
    score -= 8;
  }

  if (contentUniqueness.boilerplateRatio > 0.4) {
    issues.push({
      id: 'PSEO-004',
      type: 'warning',
      title: 'High boilerplate ratio',
      description: `${Math.round(contentUniqueness.boilerplateRatio * 100)}% of page content appears to be boilerplate.`,
      fix: 'Reduce repetitive boilerplate content or add more unique content.',
    });
    score -= 5;
  }

  if (!keywordOptimization.keywordInTitle && keywordOptimization.primaryKeyword) {
    issues.push({
      id: 'PSEO-005',
      type: 'warning',
      title: 'Primary keyword missing from title',
      description: 'The detected primary keyword is not in the page title.',
      fix: 'Include the primary keyword in your page title.',
    });
    score -= 5;
  }

  if (!keywordOptimization.keywordInH1 && keywordOptimization.primaryKeyword) {
    issues.push({
      id: 'PSEO-006',
      type: 'warning',
      title: 'Primary keyword missing from H1',
      description: 'The detected primary keyword is not in the H1 heading.',
      fix: 'Include the primary keyword in your H1 heading.',
    });
    score -= 5;
  }

  if (keywordOptimization.keywordDensity > 3) {
    issues.push({
      id: 'PSEO-007',
      type: 'warning',
      title: 'Keyword stuffing detected',
      description: `Keyword density is ${keywordOptimization.keywordDensity.toFixed(1)}%, which may appear spammy.`,
      fix: 'Reduce keyword repetition and use natural language.',
    });
    score -= 8;
  }

  if (internalLinking.linksToOtherPages < 3) {
    issues.push({
      id: 'PSEO-008',
      type: 'warning',
      title: 'Insufficient internal linking',
      description: `Only ${internalLinking.linksToOtherPages} internal links found.`,
      fix: 'Add more internal links to related pages to improve site structure.',
    });
    score -= 5;
  }

  if (!schemaReadiness.hasSchema) {
    issues.push({
      id: 'PSEO-009',
      type: 'warning',
      title: 'No structured data found',
      description: 'Page lacks schema.org structured data for programmatic pages.',
      fix: 'Add appropriate schema markup (LocalBusiness, Product, Article, etc.).',
    });
    score -= 8;
  }

  if (!schemaReadiness.canAutoGenerate) {
    recommendations.push('Consider templating your schema markup for consistent generation across pages.');
  }

  // Generate recommendations
  if (templateSignals.templateConfidence < 0.5) {
    recommendations.push('Establish clear content templates with consistent structure for programmatic pages.');
  }

  if (contentUniqueness.duplicatePhrases.length > 5) {
    recommendations.push('Reduce duplicate phrases and add more page-specific content.');
  }

  if (internalLinking.hubPagePotential) {
    recommendations.push('This page has hub page potential - consider adding more internal links to child pages.');
  }

  if (schemaReadiness.suggestedSchemas.length > 0) {
    recommendations.push(`Consider adding schema types: ${schemaReadiness.suggestedSchemas.join(', ')}`);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: getLetterGrade(score),
    templateSignals,
    contentUniqueness,
    keywordOptimization,
    internalLinking,
    schemaReadiness,
    issues,
    recommendations,
  };
}

function analyzeTemplateSignals($: CheerioAPI, url: string) {
  // Check for consistent structural patterns
  const hasHeader = $('header').length > 0;
  const hasFooter = $('footer').length > 0;
  const hasNav = $('nav').length > 0;
  const hasMain = $('main').length > 0 || $('article').length > 0;

  const hasConsistentStructure = hasHeader && hasFooter && (hasNav || hasMain);

  // Check for placeholder-like patterns
  const textContent = $('body').text();
  const placeholderPatterns = [
    /\{\{[^}]+\}\}/g,  // Handlebars/Mustache
    /\{%[^%]+%\}/g,     // Jinja/Twig
    /\$\{[^}]+\}/g,     // Template literals
    /\[\[[^\]]+\]\]/g,  // Wiki-style
  ];

  let hasPlaceholderPatterns = false;
  for (const pattern of placeholderPatterns) {
    if (pattern.test(textContent)) {
      hasPlaceholderPatterns = true;
      break;
    }
  }

  // Check for dynamic content indicators
  // Note: [data-*] is not valid CSS, so we check for common data attributes
  const dataAttrCount = $('[data-id], [data-value], [data-src], [data-content], [data-type], [data-state], [data-index]').length;
  const hasDynamicContent =
    dataAttrCount > 5 ||
    $('script[type="application/json"]').length > 0 ||
    $('[id*="dynamic"], [class*="dynamic"]').length > 0;

  // Calculate template confidence
  let templateConfidence = 0;
  if (hasConsistentStructure) templateConfidence += 0.3;
  if (hasDynamicContent) templateConfidence += 0.3;
  if ($('[itemscope]').length > 0) templateConfidence += 0.2;
  if (new URL(url).pathname.split('/').length > 2) templateConfidence += 0.2;

  return {
    hasConsistentStructure,
    hasPlaceholderPatterns,
    hasDynamicContent,
    templateConfidence: Math.min(1, templateConfidence),
  };
}

function analyzeContentUniqueness($: CheerioAPI) {
  const mainContent = $('main, article, .content, #content').first().text() || $('body').text();
  const sentences = mainContent.split(/[.!?]+/).filter(s => s.trim().length > 20);

  // Simple uniqueness check based on sentence variety
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  const uniqueContentRatio = sentences.length > 0 ? uniqueSentences.size / sentences.length : 1;

  // Detect boilerplate by checking header/footer vs main content ratio
  const headerText = $('header').text().length;
  const footerText = $('footer').text().length;
  const sidebarText = $('aside, .sidebar, nav').text().length;
  const totalText = $('body').text().length;

  const boilerplateRatio = totalText > 0
    ? (headerText + footerText + sidebarText) / totalText
    : 0;

  // Find duplicate phrases (3+ words appearing multiple times)
  const words = mainContent.toLowerCase().split(/\s+/);
  const phraseCount: Record<string, number> = {};

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    if (phrase.length > 10) {
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    }
  }

  const duplicatePhrases = Object.entries(phraseCount)
    .filter(([_, count]) => count > 2)
    .map(([phrase]) => phrase)
    .slice(0, 10);

  return {
    uniqueContentRatio: Math.round(uniqueContentRatio * 100) / 100,
    boilerplateRatio: Math.round(boilerplateRatio * 100) / 100,
    uniqueSentences: uniqueSentences.size,
    duplicatePhrases,
  };
}

function analyzeKeywordOptimization($: CheerioAPI) {
  const title = $('title').text().toLowerCase();
  const h1 = $('h1').first().text().toLowerCase();
  const firstParagraph = $('p').first().text().toLowerCase();
  const bodyText = $('body').text().toLowerCase();

  // Extract potential primary keyword from title/h1
  const titleWords = title.split(/\s+/).filter(w => w.length > 3);
  const h1Words = h1.split(/\s+/).filter(w => w.length > 3);

  // Find common significant words between title and h1
  const commonWords = titleWords.filter(w => h1Words.includes(w));
  const primaryKeyword = commonWords[0] || titleWords[0];

  // Calculate keyword density
  const wordCount = bodyText.split(/\s+/).length;
  const keywordCount = primaryKeyword
    ? (bodyText.match(new RegExp(primaryKeyword, 'gi')) || []).length
    : 0;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Check keyword placement
  const keywordInTitle = primaryKeyword ? title.includes(primaryKeyword) : false;
  const keywordInH1 = primaryKeyword ? h1.includes(primaryKeyword) : false;
  const keywordInFirstParagraph = primaryKeyword ? firstParagraph.includes(primaryKeyword) : false;

  // Extract related keywords (other frequently appearing words)
  const words = bodyText.split(/\s+/).filter(w => w.length > 4);
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  const stopWords = new Set(['about', 'after', 'before', 'being', 'could', 'their', 'there', 'these', 'those', 'would', 'which', 'while', 'where']);
  const relatedKeywords = Object.entries(wordFreq)
    .filter(([word]) => !stopWords.has(word) && word !== primaryKeyword)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return {
    primaryKeyword,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInTitle,
    keywordInH1,
    keywordInFirstParagraph,
    relatedKeywords,
  };
}

function analyzeInternalLinking($: CheerioAPI, url: string) {
  const currentHost = new URL(url).hostname;
  const currentPath = new URL(url).pathname;

  let linksToOtherPages = 0;
  let linksFromPattern = false;
  const linkedPaths: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === currentHost && linkUrl.pathname !== currentPath) {
        linksToOtherPages++;
        linkedPaths.push(linkUrl.pathname);
      }
    } catch {
      // Relative link
      if (href.startsWith('/') && href !== currentPath) {
        linksToOtherPages++;
        linkedPaths.push(href);
      }
    }
  });

  // Check if links follow a pattern (e.g., /category/item)
  const pathPatterns = linkedPaths.map(p => {
    const parts = p.split('/').filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}/` : p;
  });

  const patternCount: Record<string, number> = {};
  for (const pattern of pathPatterns) {
    patternCount[pattern] = (patternCount[pattern] || 0) + 1;
  }

  linksFromPattern = Object.values(patternCount).some(count => count >= 3);

  // Hub page potential: many internal links with similar patterns
  const hubPagePotential = linksToOtherPages >= 5 && linksFromPattern;

  return {
    linksToOtherPages,
    linksFromPattern,
    hubPagePotential,
  };
}

function analyzeSchemaReadiness($: CheerioAPI) {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const schemaTypes: string[] = [];
  let hasSchema = false;

  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const data = JSON.parse(content);
        hasSchema = true;
        if (data['@type']) {
          schemaTypes.push(data['@type']);
        }
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (item['@type']) {
              schemaTypes.push(item['@type']);
            }
          }
        }
      }
    } catch {
      // Invalid JSON-LD
    }
  });

  // Check for microdata
  if ($('[itemscope]').length > 0) {
    hasSchema = true;
    $('[itemtype]').each((_, el) => {
      const type = $(el).attr('itemtype');
      if (type) {
        const typeName = type.split('/').pop();
        if (typeName) schemaTypes.push(typeName);
      }
    });
  }

  // Suggest schemas based on page content
  const suggestedSchemas: string[] = [];
  const bodyText = $('body').text().toLowerCase();
  const hasPrice = $('[class*="price"], [id*="price"]').length > 0 || bodyText.includes('$') || bodyText.includes('price');
  const hasLocation = bodyText.includes('address') || $('address').length > 0;
  const hasArticle = $('article').length > 0 || $('[class*="post"], [class*="article"]').length > 0;
  const hasFAQ = bodyText.includes('faq') || $('[class*="faq"]').length > 0;

  if (hasPrice && !schemaTypes.includes('Product')) {
    suggestedSchemas.push('Product');
  }
  if (hasLocation && !schemaTypes.includes('LocalBusiness')) {
    suggestedSchemas.push('LocalBusiness');
  }
  if (hasArticle && !schemaTypes.includes('Article')) {
    suggestedSchemas.push('Article');
  }
  if (hasFAQ && !schemaTypes.includes('FAQPage')) {
    suggestedSchemas.push('FAQPage');
  }

  // Can auto-generate if we have consistent structure
  const canAutoGenerate = hasSchema || suggestedSchemas.length > 0;

  return {
    hasSchema,
    schemaTypes: [...new Set(schemaTypes)],
    canAutoGenerate,
    suggestedSchemas,
  };
}

/**
 * Convert PSEO issues to scanner Issue format
 */
export function pseoIssuesToScannerIssues(pseoAnalysis: PSEOAnalysis): Issue[] {
  return pseoAnalysis.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    severity: issue.type === 'critical' ? SEVERITY.HIGH :
              issue.type === 'warning' ? SEVERITY.MEDIUM : SEVERITY.LOW,
    category: CATEGORY.PSEO,
    description: issue.description,
    remediation: issue.fix,
    impactScore: issue.type === 'critical' ? 15 :
                 issue.type === 'warning' ? 8 : 3,
    tags: ['pseo', 'programmatic', issue.type],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  }));
}
