/**
 * Answer Gap Analysis
 * Identifies questions a site should answer and shows which are missing or weak
 * Bridges AI visibility and content changes
 */

import type { CheerioAPI } from 'cheerio';
import { AnswerGapAnalysis, SEOIssue, Issue, CATEGORY, SEVERITY } from '../types.js';
import { getLetterGrade } from '../scoring.js';

interface AnswerGapContext {
  $: CheerioAPI;
  url: string;
  llmQuestions?: Array<{
    question: string;
    category: string;
    difficulty: string;
  }>;
  llmFAQs?: Array<{
    question: string;
    suggestedAnswer: string;
    importance: 'high' | 'medium' | 'low';
  }>;
}

// Common question patterns by topic/industry
const COMMON_QUESTION_PATTERNS: Record<string, Array<{ pattern: RegExp; intent: 'informational' | 'navigational' | 'transactional' | 'commercial'; priority: 'high' | 'medium' | 'low' }>> = {
  product: [
    { pattern: /what (is|does|are)/i, intent: 'informational', priority: 'high' },
    { pattern: /how (does|do|to|can)/i, intent: 'informational', priority: 'high' },
    { pattern: /why (should|would|do)/i, intent: 'commercial', priority: 'medium' },
    { pattern: /pricing|cost|price/i, intent: 'transactional', priority: 'high' },
    { pattern: /features|benefits/i, intent: 'commercial', priority: 'high' },
    { pattern: /compare|vs|versus|alternative/i, intent: 'commercial', priority: 'medium' },
    { pattern: /review|rating/i, intent: 'commercial', priority: 'medium' },
    { pattern: /demo|trial|free/i, intent: 'transactional', priority: 'high' },
    { pattern: /integration|api|connect/i, intent: 'informational', priority: 'medium' },
    { pattern: /support|help|contact/i, intent: 'navigational', priority: 'medium' },
  ],
  service: [
    { pattern: /how (does|do|to|can)/i, intent: 'informational', priority: 'high' },
    { pattern: /what (is|are|does)/i, intent: 'informational', priority: 'high' },
    { pattern: /pricing|cost|price|rates/i, intent: 'transactional', priority: 'high' },
    { pattern: /process|steps|how it works/i, intent: 'informational', priority: 'high' },
    { pattern: /experience|expertise|qualifications/i, intent: 'commercial', priority: 'medium' },
    { pattern: /location|area|serve/i, intent: 'navigational', priority: 'medium' },
    { pattern: /book|schedule|appointment/i, intent: 'transactional', priority: 'high' },
    { pattern: /guarantee|warranty/i, intent: 'commercial', priority: 'medium' },
  ],
  content: [
    { pattern: /what (is|are|does)/i, intent: 'informational', priority: 'high' },
    { pattern: /how (to|do|does|can)/i, intent: 'informational', priority: 'high' },
    { pattern: /why (is|are|do|does)/i, intent: 'informational', priority: 'medium' },
    { pattern: /when (to|should|is)/i, intent: 'informational', priority: 'medium' },
    { pattern: /best|top|recommended/i, intent: 'commercial', priority: 'medium' },
    { pattern: /example|case study/i, intent: 'informational', priority: 'medium' },
    { pattern: /definition|meaning/i, intent: 'informational', priority: 'high' },
    { pattern: /difference|vs|compare/i, intent: 'informational', priority: 'medium' },
  ],
};

// Essential questions every business page should answer
const UNIVERSAL_QUESTIONS = [
  { question: 'What does this company/product do?', intent: 'informational' as const, priority: 'high' as const, topic: 'core' },
  { question: 'Who is this for?', intent: 'commercial' as const, priority: 'high' as const, topic: 'audience' },
  { question: 'What are the main benefits?', intent: 'commercial' as const, priority: 'high' as const, topic: 'value' },
  { question: 'How does it work?', intent: 'informational' as const, priority: 'high' as const, topic: 'process' },
  { question: 'What does it cost?', intent: 'transactional' as const, priority: 'high' as const, topic: 'pricing' },
  { question: 'How do I get started?', intent: 'transactional' as const, priority: 'high' as const, topic: 'action' },
  { question: 'Why choose this over alternatives?', intent: 'commercial' as const, priority: 'medium' as const, topic: 'differentiation' },
  { question: 'What results can I expect?', intent: 'commercial' as const, priority: 'medium' as const, topic: 'outcomes' },
  { question: 'Who is behind this?', intent: 'informational' as const, priority: 'low' as const, topic: 'trust' },
  { question: 'How can I contact support?', intent: 'navigational' as const, priority: 'medium' as const, topic: 'support' },
];

export function analyzeAnswerGap(ctx: AnswerGapContext): AnswerGapAnalysis {
  const { $, url, llmQuestions = [], llmFAQs = [] } = ctx;
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];

  // Extract page content for analysis
  const pageContent = extractPageContent($);
  const pageType = detectPageType($, pageContent);
  const topics = extractTopics($, pageContent);

  // Identify questions the page currently answers
  const answeredQuestions = findAnsweredQuestions($, pageContent);

  // Get suggested questions based on page type and content
  const suggestedQuestions = generateSuggestedQuestions(pageType, topics, pageContent, answeredQuestions, llmFAQs);

  // Identify gaps (missing or weak answers)
  const gaps = identifyGaps(suggestedQuestions, answeredQuestions, pageContent);

  // Identify strengths (well-answered questions)
  const strengths = identifyStrengths(answeredQuestions, pageContent);

  // Analyze topic clusters
  const topicClusters = analyzeTopicClusters(topics, suggestedQuestions, answeredQuestions);

  // Calculate coverage metrics
  const topicCoverage = calculateTopicCoverage(topicClusters);

  // Calculate score
  let score = 100;

  // Deduct for missing high-priority questions
  const missingHighPriority = gaps.filter(g => g.severity === 'critical').length;
  const missingMediumPriority = gaps.filter(g => g.severity === 'important').length;

  if (missingHighPriority > 0) {
    score -= Math.min(30, missingHighPriority * 10);
    issues.push({
      id: 'ANSGAP-001',
      type: 'critical',
      title: `${missingHighPriority} critical question(s) not answered`,
      description: 'Key questions that users are likely asking are not addressed on this page.',
      fix: 'Add clear, direct answers to the identified high-priority questions.',
    });
  }

  if (missingMediumPriority > 0) {
    score -= Math.min(20, missingMediumPriority * 5);
    issues.push({
      id: 'ANSGAP-002',
      type: 'warning',
      title: `${missingMediumPriority} important question(s) need attention`,
      description: 'Some important questions are missing or have weak answers.',
      fix: 'Strengthen content to better address these questions.',
    });
  }

  // Deduct for low topic coverage
  if (topicCoverage.coveragePercentage < 50) {
    score -= 15;
    issues.push({
      id: 'ANSGAP-003',
      type: 'warning',
      title: 'Low topic coverage',
      description: `Only ${topicCoverage.coveragePercentage}% of identified topics are well-covered.`,
      fix: 'Expand content to cover more relevant topics comprehensively.',
    });
  }

  // Deduct for weak answers
  const weakAnswers = suggestedQuestions.filter(q => q.status === 'weak').length;
  if (weakAnswers > 2) {
    score -= Math.min(15, weakAnswers * 3);
    issues.push({
      id: 'ANSGAP-004',
      type: 'info',
      title: `${weakAnswers} questions have weak answers`,
      description: 'Some questions are partially answered but could be clearer or more complete.',
      fix: 'Strengthen existing content with more specific, direct answers.',
    });
  }

  // Generate recommendations
  if (gaps.length > 0) {
    const topGaps = gaps.slice(0, 3);
    for (const gap of topGaps) {
      recommendations.push(`Add content answering: "${gap.question}"`);
    }
  }

  if (topicCoverage.coveragePercentage < 70) {
    const weakTopics = topicClusters.filter(t => t.status === 'weak' || t.status === 'missing');
    if (weakTopics.length > 0) {
      recommendations.push(`Improve coverage for topics: ${weakTopics.slice(0, 3).map(t => t.topic).join(', ')}`);
    }
  }

  if (strengths.length === 0) {
    recommendations.push('Consider adding a dedicated FAQ section to clearly answer common questions.');
  }

  if (!hasStructuredFAQ($)) {
    recommendations.push('Add FAQ schema markup to help AI systems identify your Q&A content.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    grade: getLetterGrade(score),
    topicCoverage,
    suggestedQuestions,
    gaps,
    strengths,
    topicClusters,
    issues,
    recommendations,
  };
}

function extractPageContent($: CheerioAPI): string {
  // Remove script and style content
  $('script, style, noscript').remove();

  const mainContent = $('main, article, [role="main"]').text() || $('body').text();
  return mainContent.replace(/\s+/g, ' ').trim().toLowerCase();
}

function detectPageType($: CheerioAPI, content: string): 'product' | 'service' | 'content' {
  const url = $('link[rel="canonical"]').attr('href') || '';

  // Check for product indicators
  const productIndicators = ['pricing', 'buy', 'purchase', 'add to cart', 'features', 'plans', 'subscribe'];
  const productScore = productIndicators.filter(i => content.includes(i)).length;

  // Check for service indicators
  const serviceIndicators = ['contact us', 'book', 'schedule', 'consultation', 'our team', 'years of experience'];
  const serviceScore = serviceIndicators.filter(i => content.includes(i)).length;

  // Check for content/blog indicators
  const contentIndicators = ['posted', 'author', 'read more', 'article', 'published', 'comments'];
  const contentScore = contentIndicators.filter(i => content.includes(i)).length;

  if (productScore >= serviceScore && productScore >= contentScore) return 'product';
  if (serviceScore >= contentScore) return 'service';
  return 'content';
}

function extractTopics($: CheerioAPI, content: string): string[] {
  const topics = new Set<string>();

  // Extract from headings
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text.length > 3 && text.length < 50) {
      topics.add(text);
    }
  });

  // Extract from meta keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    keywords.split(',').forEach(k => {
      const trimmed = k.trim().toLowerCase();
      if (trimmed.length > 2) topics.add(trimmed);
    });
  }

  // Extract from title
  const title = $('title').text().toLowerCase();
  if (title) {
    // Simple extraction of key terms from title
    const titleWords = title.split(/[\s\-|:]+/).filter(w => w.length > 3);
    titleWords.slice(0, 3).forEach(w => topics.add(w));
  }

  return Array.from(topics).slice(0, 10);
}

function findAnsweredQuestions($: CheerioAPI, content: string): Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }> {
  const answered = new Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>();

  // Look for question headings followed by content
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.includes('?') || /^(what|how|why|when|where|who|which|can|does|is|are)\s/i.test(heading)) {
      const nextP = $(el).nextAll('p').first().text().trim();
      if (nextP.length > 50) {
        const quality = nextP.length > 200 ? 'excellent' : nextP.length > 100 ? 'good' : 'weak';
        answered.set(heading.toLowerCase(), { answer: nextP.slice(0, 200), quality });
      }
    }
  });

  // Look for FAQ schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (json['@type'] === 'FAQPage' && json.mainEntity) {
        for (const qa of json.mainEntity) {
          if (qa.name && qa.acceptedAnswer?.text) {
            answered.set(qa.name.toLowerCase(), {
              answer: qa.acceptedAnswer.text.slice(0, 200),
              quality: qa.acceptedAnswer.text.length > 150 ? 'excellent' : 'good'
            });
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  });

  // Look for definition patterns in content
  const definitionPatterns = [
    /([^.]+)\s+is\s+(a|an|the)\s+([^.]+\.)/gi,
    /([^.]+)\s+refers to\s+([^.]+\.)/gi,
    /([^.]+)\s+means\s+([^.]+\.)/gi,
  ];

  for (const pattern of definitionPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 50) {
        const question = `what is ${match[1].trim()}?`;
        if (!answered.has(question)) {
          answered.set(question, { answer: match[0].slice(0, 200), quality: 'weak' });
        }
      }
    }
  }

  return answered;
}

function generateSuggestedQuestions(
  pageType: 'product' | 'service' | 'content',
  topics: string[],
  content: string,
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>,
  llmFAQs: Array<{ question: string; suggestedAnswer: string; importance: 'high' | 'medium' | 'low' }>
): AnswerGapAnalysis['suggestedQuestions'] {
  const questions: AnswerGapAnalysis['suggestedQuestions'] = [];
  const addedQuestions = new Set<string>();

  // Add universal questions
  for (const uq of UNIVERSAL_QUESTIONS) {
    const normalizedQ = uq.question.toLowerCase();
    if (!addedQuestions.has(normalizedQ)) {
      const status = getQuestionStatus(normalizedQ, answered, content);
      const existingAnswer = findBestMatchingAnswer(normalizedQ, answered);

      questions.push({
        question: uq.question,
        intent: uq.intent,
        priority: uq.priority,
        topic: uq.topic,
        status,
        currentAnswer: existingAnswer?.answer,
        recommendation: status === 'missing' ? `Add a clear answer for: ${uq.question}` :
                       status === 'weak' ? `Strengthen the answer for: ${uq.question}` : undefined,
      });
      addedQuestions.add(normalizedQ);
    }
  }

  // Add LLM-suggested FAQs
  for (const faq of llmFAQs) {
    const normalizedQ = faq.question.toLowerCase();
    if (!addedQuestions.has(normalizedQ)) {
      const status = getQuestionStatus(normalizedQ, answered, content);
      const priority = faq.importance;

      questions.push({
        question: faq.question,
        intent: 'informational',
        priority,
        topic: 'ai-suggested',
        status,
        currentAnswer: status !== 'missing' ? faq.suggestedAnswer.slice(0, 200) : undefined,
        recommendation: status === 'missing' ? faq.suggestedAnswer : undefined,
      });
      addedQuestions.add(normalizedQ);
    }
  }

  // Add page-type specific questions based on topics
  const patterns = COMMON_QUESTION_PATTERNS[pageType] || COMMON_QUESTION_PATTERNS.content;
  for (const topic of topics.slice(0, 5)) {
    for (const pattern of patterns.slice(0, 3)) {
      const question = generateQuestionFromPattern(topic, pattern.pattern);
      if (question && !addedQuestions.has(question.toLowerCase())) {
        const status = getQuestionStatus(question.toLowerCase(), answered, content);
        const existingAnswer = findBestMatchingAnswer(question.toLowerCase(), answered);

        questions.push({
          question,
          intent: pattern.intent,
          priority: pattern.priority,
          topic,
          status,
          currentAnswer: existingAnswer?.answer,
          recommendation: status === 'missing' ? `Consider adding content about: ${question}` : undefined,
        });
        addedQuestions.add(question.toLowerCase());
      }
    }
  }

  return questions.slice(0, 20); // Limit to top 20 questions
}

function generateQuestionFromPattern(topic: string, pattern: RegExp): string | null {
  const source = pattern.source.toLowerCase();

  if (source.includes('what (is|does|are)')) {
    return `What is ${topic}?`;
  }
  if (source.includes('how (does|do|to|can)')) {
    return `How does ${topic} work?`;
  }
  if (source.includes('why')) {
    return `Why is ${topic} important?`;
  }
  if (source.includes('pricing|cost')) {
    return `What does ${topic} cost?`;
  }
  if (source.includes('features|benefits')) {
    return `What are the benefits of ${topic}?`;
  }

  return null;
}

function getQuestionStatus(
  question: string,
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>,
  content: string
): 'answered' | 'weak' | 'missing' {
  // Check if directly answered
  for (const [q, a] of answered) {
    if (q.includes(question) || question.includes(q) || calculateSimilarity(q, question) > 0.6) {
      return a.quality === 'weak' ? 'weak' : 'answered';
    }
  }

  // Check if keywords are present in content
  const keywords = question.split(/\s+/).filter(w => w.length > 3);
  const keywordMatches = keywords.filter(k => content.includes(k.toLowerCase())).length;
  const matchRatio = keywords.length > 0 ? keywordMatches / keywords.length : 0;

  if (matchRatio > 0.7) return 'weak'; // Topic is covered but not as Q&A
  if (matchRatio > 0.4) return 'weak';
  return 'missing';
}

function findBestMatchingAnswer(
  question: string,
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>
): { answer: string; quality: 'excellent' | 'good' | 'weak' } | undefined {
  let bestMatch: { answer: string; quality: 'excellent' | 'good' | 'weak' } | undefined;
  let bestSimilarity = 0;

  for (const [q, a] of answered) {
    const similarity = calculateSimilarity(q, question);
    if (similarity > bestSimilarity && similarity > 0.4) {
      bestSimilarity = similarity;
      bestMatch = a;
    }
  }

  return bestMatch;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function identifyGaps(
  suggested: AnswerGapAnalysis['suggestedQuestions'],
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>,
  content: string
): AnswerGapAnalysis['gaps'] {
  const gaps: AnswerGapAnalysis['gaps'] = [];

  for (const sq of suggested) {
    if (sq.status === 'missing' || sq.status === 'weak') {
      const severity = sq.priority === 'high' ? 'critical' :
                      sq.priority === 'medium' ? 'important' : 'nice-to-have';

      gaps.push({
        question: sq.question,
        intent: sq.intent,
        severity: severity as 'critical' | 'important' | 'nice-to-have',
        reason: sq.status === 'missing'
          ? 'This question is not addressed on the page'
          : 'This question has a weak or incomplete answer',
        suggestedContent: sq.recommendation,
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return gaps.slice(0, 10); // Top 10 gaps
}

function identifyStrengths(
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>,
  content: string
): AnswerGapAnalysis['strengths'] {
  const strengths: AnswerGapAnalysis['strengths'] = [];

  for (const [question, data] of answered) {
    if (data.quality === 'excellent' || data.quality === 'good') {
      strengths.push({
        question,
        topic: extractTopicFromQuestion(question),
        quality: data.quality,
      });
    }
  }

  return strengths.slice(0, 10);
}

function extractTopicFromQuestion(question: string): string {
  // Simple topic extraction from question
  const words = question.replace(/[?.,!]/g, '').split(/\s+/);
  const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'does', 'do', 'the', 'a', 'an', 'to', 'for']);
  const meaningfulWords = words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
  return meaningfulWords.slice(0, 3).join(' ') || 'general';
}

function analyzeTopicClusters(
  topics: string[],
  suggested: AnswerGapAnalysis['suggestedQuestions'],
  answered: Map<string, { answer: string; quality: 'excellent' | 'good' | 'weak' }>
): AnswerGapAnalysis['topicClusters'] {
  const clusters: AnswerGapAnalysis['topicClusters'] = [];

  // Group questions by topic
  const topicQuestions = new Map<string, { identified: number; answered: number }>();

  for (const sq of suggested) {
    const topic = sq.topic;
    if (!topicQuestions.has(topic)) {
      topicQuestions.set(topic, { identified: 0, answered: 0 });
    }
    const data = topicQuestions.get(topic)!;
    data.identified++;
    if (sq.status === 'answered') {
      data.answered++;
    }
  }

  for (const [topic, data] of topicQuestions) {
    const coverageScore = data.identified > 0
      ? Math.round((data.answered / data.identified) * 100)
      : 0;

    let status: 'complete' | 'partial' | 'weak' | 'missing';
    if (coverageScore >= 80) status = 'complete';
    else if (coverageScore >= 50) status = 'partial';
    else if (coverageScore > 0) status = 'weak';
    else status = 'missing';

    clusters.push({
      topic,
      questionsIdentified: data.identified,
      questionsAnswered: data.answered,
      coverageScore,
      status,
    });
  }

  // Sort by coverage score (ascending to show gaps first)
  clusters.sort((a, b) => a.coverageScore - b.coverageScore);

  return clusters;
}

function calculateTopicCoverage(clusters: AnswerGapAnalysis['topicClusters']): AnswerGapAnalysis['topicCoverage'] {
  const totalTopics = clusters.length;
  const coveredTopics = clusters.filter(c => c.status === 'complete' || c.status === 'partial').length;
  const coveragePercentage = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  return {
    identifiedTopics: totalTopics,
    coveredTopics,
    coveragePercentage,
  };
}

function hasStructuredFAQ($: CheerioAPI): boolean {
  const schemaText = $('script[type="application/ld+json"]').text();
  return schemaText.includes('FAQPage') || schemaText.includes('Question');
}

export function answerGapIssuesToScannerIssues(analysis: AnswerGapAnalysis): Issue[] {
  return analysis.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    severity: issue.type === 'critical' ? SEVERITY.HIGH :
              issue.type === 'warning' ? SEVERITY.MEDIUM : SEVERITY.LOW,
    category: CATEGORY.GAPS,
    description: issue.description,
    remediation: issue.fix,
    impactScore: issue.type === 'critical' ? 15 :
                 issue.type === 'warning' ? 8 : 3,
    tags: ['answer-gap', 'content-strategy', issue.type],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  }));
}
