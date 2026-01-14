/**
 * AEO Analysis - Answer Engine Optimization
 * Analyzes content for voice search, featured snippets, and answer boxes
 */

import type { CheerioAPI } from 'cheerio';
import { AEOAnalysis, SEOIssue, Issue, CATEGORY, SEVERITY } from '../types.js';
import { getLetterGrade } from '../scoring.js';

interface AEOAnalysisContext {
  $: CheerioAPI;
  url: string;
}

export function analyzeAEO(ctx: AEOAnalysisContext): AEOAnalysis {
  const { $ } = ctx;
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const questionTargeting = analyzeQuestionTargeting($);
  const answerFormatting = analyzeAnswerFormatting($);
  const featuredSnippetOptimization = analyzeFeaturedSnippetOptimization($);
  const voiceSearchOptimization = analyzeVoiceSearchOptimization($);
  const structuredData = analyzeStructuredDataForAEO($);

  // Score adjustments
  if (questionTargeting.questionsAnswered === 0) {
    issues.push({
      id: 'AEO-001',
      type: 'warning',
      title: 'No question-answer patterns detected',
      description: 'Content lacks question-answer structure for answer engines.',
      fix: 'Add questions as headings with direct answers in the following paragraph.',
    });
    score -= 10;
  }

  if (!questionTargeting.faqMarkupPresent && questionTargeting.questionsAnswered > 0) {
    issues.push({
      id: 'AEO-002',
      type: 'warning',
      title: 'FAQ content lacks schema markup',
      description: 'Question-answer content exists but lacks FAQPage schema.',
      fix: 'Add FAQPage structured data markup to your Q&A content.',
    });
    score -= 8;
  }

  if (!answerFormatting.hasConciseAnswers) {
    issues.push({
      id: 'AEO-003',
      type: 'info',
      title: 'Answers may be too long for featured snippets',
      description: 'Direct answers should be 40-60 words for optimal snippet capture.',
      fix: 'Start answers with a concise summary before expanding.',
    });
    score -= 5;
  }

  if (answerFormatting.answerBoxPotential < 50) {
    issues.push({
      id: 'AEO-004',
      type: 'warning',
      title: 'Low answer box potential',
      description: 'Content structure is not optimized for answer boxes.',
      fix: 'Add clear question headings followed by direct, concise answers.',
    });
    score -= 8;
  }

  if (!voiceSearchOptimization.conversationalTone) {
    issues.push({
      id: 'AEO-005',
      type: 'info',
      title: 'Content lacks conversational tone',
      description: 'Voice search queries are typically conversational.',
      fix: 'Write in a more natural, conversational style.',
    });
    score -= 3;
  }

  if (!structuredData.hasFAQSchema && questionTargeting.questionsAnswered > 2) {
    recommendations.push('Add FAQPage schema to capture rich results for your Q&A content.');
  }

  if (!structuredData.hasHowToSchema && answerFormatting.hasStepByStep) {
    recommendations.push('Add HowTo schema to your step-by-step content.');
  }

  if (featuredSnippetOptimization.snippetCandidates.length === 0) {
    recommendations.push('Create content that directly answers common questions in 40-60 words.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: getLetterGrade(score),
    questionTargeting,
    answerFormatting,
    featuredSnippetOptimization,
    voiceSearchOptimization,
    structuredData,
    issues,
    recommendations,
  };
}

function analyzeQuestionTargeting($: CheerioAPI) {
  const questionPatterns = [
    /^what\s/i, /^how\s/i, /^why\s/i, /^when\s/i, /^where\s/i, /^who\s/i,
    /^is\s/i, /^are\s/i, /^can\s/i, /^does\s/i, /^do\s/i, /^should\s/i,
    /\?$/
  ];

  const questionFormats: { question: string; hasDirectAnswer: boolean }[] = [];
  let questionsAnswered = 0;

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim();
    const isQuestion = questionPatterns.some(p => p.test(text));

    if (isQuestion) {
      const nextP = $(el).next('p').text().trim();
      const hasDirectAnswer = nextP.length >= 50 && nextP.length <= 500;

      questionFormats.push({ question: text, hasDirectAnswer });
      if (hasDirectAnswer) questionsAnswered++;
    }
  });

  const faqMarkupPresent = $('script[type="application/ld+json"]').text().includes('FAQPage');
  const howToMarkupPresent = $('script[type="application/ld+json"]').text().includes('HowTo');

  return {
    questionsAnswered,
    questionFormats: questionFormats.slice(0, 10),
    faqMarkupPresent,
    howToMarkupPresent,
  };
}

function analyzeAnswerFormatting($: CheerioAPI) {
  const paragraphs = $('p').toArray();
  let hasConciseAnswers = false;
  let hasDefinitions = false;
  let hasListAnswers = false;
  let hasStepByStep = false;

  for (const p of paragraphs) {
    const text = $(p).text().trim();
    const wordCount = text.split(/\s+/).length;

    if (wordCount >= 40 && wordCount <= 60) {
      hasConciseAnswers = true;
    }

    if (/^.+\sis\s(a|an|the)\s/i.test(text) || /refers to|means|defined as/i.test(text)) {
      hasDefinitions = true;
    }
  }

  hasListAnswers = $('ul, ol').length > 0;
  hasStepByStep = $('ol').length > 0 || $(':contains("Step 1"), :contains("Step 2")').length > 0;

  let answerBoxPotential = 0;
  if (hasConciseAnswers) answerBoxPotential += 30;
  if (hasDefinitions) answerBoxPotential += 25;
  if (hasListAnswers) answerBoxPotential += 25;
  if (hasStepByStep) answerBoxPotential += 20;

  return {
    hasConciseAnswers,
    hasDefinitions,
    hasListAnswers,
    hasStepByStep,
    answerBoxPotential,
  };
}

function analyzeFeaturedSnippetOptimization($: CheerioAPI) {
  const snippetCandidates: { type: 'paragraph' | 'list' | 'table'; content: string; score: number }[] = [];

  // Check for paragraph snippets
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    const wordCount = text.split(/\s+/).length;

    if (wordCount >= 40 && wordCount <= 60) {
      snippetCandidates.push({
        type: 'paragraph',
        content: text.slice(0, 200),
        score: 80,
      });
    }
  });

  // Check for list snippets
  $('ul, ol').each((_, el) => {
    const items = $(el).find('li');
    if (items.length >= 3 && items.length <= 8) {
      snippetCandidates.push({
        type: 'list',
        content: items.map((_, li) => $(li).text().trim()).get().join(', ').slice(0, 200),
        score: 75,
      });
    }
  });

  // Check for table snippets
  $('table').each((_, el) => {
    const rows = $(el).find('tr');
    if (rows.length >= 2 && rows.length <= 10) {
      snippetCandidates.push({
        type: 'table',
        content: 'Table with ' + rows.length + ' rows',
        score: 70,
      });
    }
  });

  return {
    paragraphSnippetReady: snippetCandidates.some(s => s.type === 'paragraph'),
    listSnippetReady: snippetCandidates.some(s => s.type === 'list'),
    tableSnippetReady: snippetCandidates.some(s => s.type === 'table'),
    snippetCandidates: snippetCandidates.slice(0, 5),
  };
}

function analyzeVoiceSearchOptimization($: CheerioAPI) {
  const bodyText = $('body').text().toLowerCase();

  const conversationalIndicators = [
    /\byou\b/i, /\byour\b/i, /\bwe\b/i, /\bour\b/i, /\blet's\b/i,
    /\bhow do i\b/i, /\bwhat is\b/i, /\bwhere can\b/i
  ];

  const conversationalTone = conversationalIndicators.filter(p => p.test(bodyText)).length >= 3;

  const naturalLanguageQueries = [
    'how to', 'what is', 'why does', 'where can', 'when should',
    'best way to', 'how do i', 'can i', 'should i'
  ].filter(q => bodyText.includes(q));

  const speakableContent = $('[itemtype*="SpeakableSpecification"]').length > 0 ||
    $('meta[name="speakable"]').length > 0;

  const localRelevance = bodyText.includes('near me') ||
    bodyText.includes('local') ||
    $('address').length > 0;

  return {
    conversationalTone,
    naturalLanguageQueries,
    speakableContent,
    localRelevance,
  };
}

function analyzeStructuredDataForAEO($: CheerioAPI) {
  const schemaText = $('script[type="application/ld+json"]').text();

  return {
    hasFAQSchema: schemaText.includes('FAQPage'),
    hasHowToSchema: schemaText.includes('HowTo'),
    hasQAPageSchema: schemaText.includes('QAPage'),
    hasSpeakableSchema: schemaText.includes('speakable'),
  };
}

export function aeoIssuesToScannerIssues(aeoAnalysis: AEOAnalysis): Issue[] {
  return aeoAnalysis.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    severity: issue.type === 'critical' ? SEVERITY.HIGH :
              issue.type === 'warning' ? SEVERITY.MEDIUM : SEVERITY.LOW,
    category: CATEGORY.AEO,
    description: issue.description,
    remediation: issue.fix,
    impactScore: issue.type === 'critical' ? 15 :
                 issue.type === 'warning' ? 8 : 3,
    tags: ['aeo', 'answer-engine', issue.type],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  }));
}
