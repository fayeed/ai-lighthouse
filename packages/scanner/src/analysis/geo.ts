/**
 * GEO Analysis - Generative Engine Optimization
 * Analyzes content for AI/LLM consumption and citation potential
 */

import type { CheerioAPI } from 'cheerio';
import { GEOAnalysis, SEOIssue, Issue, CATEGORY, SEVERITY } from '../types.js';
import { getLetterGrade } from '../scoring.js';

interface GEOAnalysisContext {
  $: CheerioAPI;
  url: string;
}

export function analyzeGEO(ctx: GEOAnalysisContext): GEOAnalysis {
  const { $ } = ctx;
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const aiVisibility = analyzeAIVisibility($);
  const citationPotential = analyzeCitationPotential($);
  const contentAttribution = analyzeContentAttribution($);
  const aiComprehension = analyzeAIComprehension($);
  const knowledgeGraphOptimization = analyzeKnowledgeGraphOptimization($);
  const brandProtection = analyzeBrandProtection($);

  // Score adjustments
  if (aiVisibility.score < 50) {
    issues.push({
      id: 'GEO-001',
      type: 'critical',
      title: 'Low AI visibility',
      description: 'Content is not easily accessible or parseable by AI systems.',
      fix: 'Use semantic HTML, add structured data, and ensure content is crawlable.',
    });
    score -= 15;
  }

  if (!aiVisibility.semanticallyRich) {
    issues.push({
      id: 'GEO-002',
      type: 'warning',
      title: 'Content lacks semantic richness',
      description: 'AI systems may struggle to understand content context.',
      fix: 'Add semantic HTML elements, headings hierarchy, and structured data.',
    });
    score -= 8;
  }

  if (citationPotential.score < 40) {
    issues.push({
      id: 'GEO-003',
      type: 'warning',
      title: 'Low citation potential',
      description: 'Content lacks elements that make it citable by AI systems.',
      fix: 'Add unique insights, data points, and authoritative signals.',
    });
    score -= 10;
  }

  if (!contentAttribution.hasAuthor) {
    issues.push({
      id: 'GEO-004',
      type: 'warning',
      title: 'Missing author attribution',
      description: 'No author information found, reducing content authority.',
      fix: 'Add author information with schema.org Person markup.',
    });
    score -= 5;
  }

  if (!contentAttribution.hasPublishDate) {
    issues.push({
      id: 'GEO-005',
      type: 'info',
      title: 'Missing publish date',
      description: 'No publication date found, which affects freshness signals.',
      fix: 'Add datePublished metadata using schema.org or meta tags.',
    });
    score -= 3;
  }

  if (aiComprehension.ambiguityScore > 30) {
    issues.push({
      id: 'GEO-006',
      type: 'warning',
      title: 'Content ambiguity detected',
      description: 'AI systems may misinterpret or hallucinate about ambiguous content.',
      fix: 'Clarify ambiguous statements and add concrete facts.',
    });
    score -= 8;
  }

  if (knowledgeGraphOptimization.entityRichness < 50) {
    issues.push({
      id: 'GEO-007',
      type: 'info',
      title: 'Low entity richness',
      description: 'Content lacks clear entity mentions for knowledge graph linking.',
      fix: 'Mention specific entities (people, places, organizations) clearly.',
    });
    score -= 5;
  }

  if (!brandProtection.consistentMessaging) {
    issues.push({
      id: 'GEO-008',
      type: 'warning',
      title: 'Inconsistent brand messaging',
      description: 'Brand messaging varies across page, risking AI misrepresentation.',
      fix: 'Ensure consistent brand name, tagline, and value proposition.',
    });
    score -= 8;
  }

  // Recommendations
  if (citationPotential.citationReadyContent.length === 0) {
    recommendations.push('Add unique statistics, research findings, or expert quotes that AI can cite.');
  }

  if (!contentAttribution.hasSourceLinks) {
    recommendations.push('Link to authoritative sources to improve content credibility.');
  }

  if (knowledgeGraphOptimization.relationshipClarity < 50) {
    recommendations.push('Clarify relationships between entities mentioned in your content.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: getLetterGrade(score),
    aiVisibility,
    citationPotential,
    contentAttribution,
    aiComprehension,
    knowledgeGraphOptimization,
    brandProtection,
    issues,
    recommendations,
  };
}

function analyzeAIVisibility($: CheerioAPI) {
  let visibilityScore = 0;

  // Check crawlability
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const crawlable = !metaRobots.includes('noindex') && !metaRobots.includes('nofollow');
  if (crawlable) visibilityScore += 25;

  // Check extractability (semantic HTML)
  const hasSemanticElements = $('article, section, main, header, footer, nav, aside').length > 0;
  const extractable = hasSemanticElements;
  if (extractable) visibilityScore += 25;

  // Check semantic richness
  const hasHeadings = $('h1, h2, h3').length >= 3;
  const hasLists = $('ul, ol').length > 0;
  const hasTables = $('table').length > 0;
  const semanticallyRich = hasHeadings && (hasLists || hasTables);
  if (semanticallyRich) visibilityScore += 25;

  // Check for structured data
  const structuredDataPresent = $('script[type="application/ld+json"]').length > 0 ||
    $('[itemscope]').length > 0;
  if (structuredDataPresent) visibilityScore += 25;

  return {
    score: visibilityScore,
    crawlable,
    extractable,
    semanticallyRich,
    structuredDataPresent,
  };
}

function analyzeCitationPotential($: CheerioAPI) {
  let citationScore = 0;
  const citationReadyContent: string[] = [];

  const bodyText = $('body').text();

  // Check for authority signals
  const hasAuthoritySignals =
    bodyText.match(/according to|research shows|studies indicate|expert|official/gi)?.length! > 0;
  if (hasAuthoritySignals) citationScore += 20;

  // Check for unique insights
  const hasUniqueInsights =
    bodyText.match(/we found|our research|we discovered|unique|exclusive|first to/gi)?.length! > 0;
  if (hasUniqueInsights) citationScore += 25;

  // Check for data points
  const dataPatterns = /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)|[\d.]+x/gi;
  const dataMatches = bodyText.match(dataPatterns);
  const hasDataPoints = dataMatches && dataMatches.length > 2;
  if (hasDataPoints) {
    citationScore += 25;
    citationReadyContent.push(...(dataMatches?.slice(0, 5) || []));
  }

  // Check for expert quotes
  const quotePatterns = /"[^"]{30,200}"/g;
  const quotes = bodyText.match(quotePatterns);
  const hasExpertQuotes = quotes && quotes.length > 0;
  if (hasExpertQuotes) {
    citationScore += 30;
    citationReadyContent.push(...(quotes?.slice(0, 3) || []));
  }

  return {
    score: citationScore,
    hasAuthoritySignals,
    hasUniqueInsights,
    hasDataPoints: !!hasDataPoints,
    hasExpertQuotes: !!hasExpertQuotes,
    citationReadyContent,
  };
}

function analyzeContentAttribution($: CheerioAPI) {
  // Check for author
  const hasAuthor =
    $('meta[name="author"]').length > 0 ||
    $('[rel="author"]').length > 0 ||
    $('[itemtype*="Person"]').length > 0 ||
    $('[class*="author"]').length > 0;

  // Check for dates
  const hasPublishDate =
    $('meta[property="article:published_time"]').length > 0 ||
    $('time[datetime]').length > 0 ||
    $('[itemprop="datePublished"]').length > 0;

  const hasLastModified =
    $('meta[property="article:modified_time"]').length > 0 ||
    $('[itemprop="dateModified"]').length > 0;

  // Check for source links
  const externalLinks = $('a[href^="http"]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const url = new URL(href);
      return url.hostname !== new URL($('link[rel="canonical"]').attr('href') || 'http://example.com').hostname;
    } catch {
      return false;
    }
  });
  const hasSourceLinks = externalLinks.length > 0;

  // Calculate authority score
  let authorityScore = 0;
  if (hasAuthor) authorityScore += 30;
  if (hasPublishDate) authorityScore += 25;
  if (hasLastModified) authorityScore += 15;
  if (hasSourceLinks) authorityScore += 30;

  return {
    hasAuthor,
    hasPublishDate,
    hasLastModified,
    hasSourceLinks,
    authorityScore,
  };
}

function analyzeAIComprehension($: CheerioAPI) {
  const bodyText = $('body').text();
  const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Calculate clarity score based on sentence structure
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const clarityScore = avgSentenceLength < 25 ? 80 : avgSentenceLength < 35 ? 60 : 40;

  // Check for ambiguous language
  const ambiguousPatterns = /\b(some|might|could|possibly|perhaps|various|certain|several)\b/gi;
  const ambiguousMatches = bodyText.match(ambiguousPatterns)?.length || 0;
  const ambiguityScore = Math.min(100, (ambiguousMatches / sentences.length) * 100);

  // Calculate fact density (statements with numbers, dates, names)
  const factPatterns = /\b\d{4}\b|\b\d+%|\$[\d,]+|[A-Z][a-z]+ [A-Z][a-z]+/g;
  const factMatches = bodyText.match(factPatterns)?.length || 0;
  const factDensity = Math.min(100, (factMatches / sentences.length) * 50);

  // Topic coherence (simplified check based on heading-content alignment)
  const headings = $('h1, h2, h3').map((_, el) => $(el).text().toLowerCase()).get();
  const headingWords = headings.join(' ').split(/\s+/).filter(w => w.length > 4);
  const bodyWords = bodyText.toLowerCase().split(/\s+/).filter(w => w.length > 4);

  let matchCount = 0;
  for (const hw of headingWords) {
    if (bodyWords.includes(hw)) matchCount++;
  }
  const topicCoherence = headingWords.length > 0
    ? Math.min(100, (matchCount / headingWords.length) * 100)
    : 50;

  return {
    clarityScore: Math.round(clarityScore),
    ambiguityScore: Math.round(ambiguityScore),
    factDensity: Math.round(factDensity),
    topicCoherence: Math.round(topicCoherence),
  };
}

function analyzeKnowledgeGraphOptimization($: CheerioAPI) {
  const bodyText = $('body').text();

  // Entity richness (named entities like companies, people, places)
  const entityPatterns = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const entities = bodyText.match(entityPatterns) || [];
  const uniqueEntities = new Set(entities);
  const entityRichness = Math.min(100, uniqueEntities.size * 5);

  // Relationship clarity (explicit connections between entities)
  const relationshipPatterns = /\b(is|are|was|were|founded|created|developed|owns|manages)\s+(?:a|an|the)?\s*[A-Z]/g;
  const relationships = bodyText.match(relationshipPatterns)?.length || 0;
  const relationshipClarity = Math.min(100, relationships * 10);

  // Topic clustering (how well related topics are grouped)
  const sections = $('section, article, div.content').length;
  const headingsPerSection = $('h2, h3').length / Math.max(1, sections);
  const topicClustering = headingsPerSection >= 2 ? 80 : headingsPerSection >= 1 ? 50 : 20;

  // Concept hierarchy (proper use of heading levels)
  const h1 = $('h1').length;
  const h2 = $('h2').length;
  const h3 = $('h3').length;
  const conceptHierarchy = h1 === 1 && h2 >= 2 && h3 >= h2;

  return {
    entityRichness: Math.round(entityRichness),
    relationshipClarity: Math.round(relationshipClarity),
    topicClustering: Math.round(topicClustering),
    conceptHierarchy,
  };
}

function analyzeBrandProtection($: CheerioAPI) {
  const bodyText = $('body').text();

  // Get brand name from title or og:site_name
  const title = $('title').text();
  const siteName = $('meta[property="og:site_name"]').attr('content');
  const brandName = siteName || title.split(/[-|]/)[0].trim();

  // Count brand mentions
  const brandMentions = brandName
    ? (bodyText.match(new RegExp(brandName, 'gi'))?.length || 0)
    : 0;

  // Check messaging consistency (same description across meta tags)
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const twitterDesc = $('meta[name="twitter:description"]').attr('content') || '';

  const consistentMessaging =
    (!metaDesc && !ogDesc && !twitterDesc) ||
    (metaDesc === ogDesc || !ogDesc) && (metaDesc === twitterDesc || !twitterDesc);

  // Check for competitor mentions (simplified)
  const competitorPatterns = /\b(vs|versus|compared to|alternative to|better than)\b/gi;
  const competitorMentions = (bodyText.match(competitorPatterns)?.length || 0);

  // Messaging clarity score
  let messagingClarity = 50;
  if (brandMentions > 3) messagingClarity += 20;
  if (consistentMessaging) messagingClarity += 20;
  if (competitorMentions === 0) messagingClarity += 10;

  return {
    brandMentions,
    consistentMessaging,
    competitorMentions,
    messagingClarity: Math.min(100, messagingClarity),
  };
}

export function geoIssuesToScannerIssues(geoAnalysis: GEOAnalysis): Issue[] {
  return geoAnalysis.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    severity: issue.type === 'critical' ? SEVERITY.HIGH :
              issue.type === 'warning' ? SEVERITY.MEDIUM : SEVERITY.LOW,
    category: CATEGORY.GEO,
    description: issue.description,
    remediation: issue.fix,
    impactScore: issue.type === 'critical' ? 15 :
                 issue.type === 'warning' ? 8 : 3,
    tags: ['geo', 'generative-ai', 'llm', issue.type],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  }));
}
