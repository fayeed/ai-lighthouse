export enum SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info'
}

export enum CATEGORY {
  // AI Readability & Understanding
  AIREAD = 'AIREAD',
  EXTRACT = 'EXTRACT',
  CHUNK = 'CHUNK',
  CRAWL = 'CRAWL',
  LLMLOCAL = 'LLMLOCAL',
  LLMAPI = 'LLMAPI',
  HALL = 'HALL',
  GAPS = 'GAPS',
  DRIFT = 'DRIFT',
  A11Y = 'A11Y',
  TECH = 'TECH',
  KG = 'KG',
  LLMCON = 'LLMCONF',
  CI = 'CI',
  DX = 'DX',
  MISC = 'MISC',

  // SEO & Optimization Categories
  SEO = 'SEO',       // Traditional Search Engine Optimization
  PSEO = 'PSEO',     // Programmatic SEO
  AEO = 'AEO',       // Answer Engine Optimization
  GEO = 'GEO',       // Generative Engine Optimization
}

export interface IssueLocation {
  url?: string;
  selector?: string;
  textSnippet?: string;
  line?: number; 
}

export enum EFFORT_LEVEL {
  QUICK = 'quick', // < 30 minutes
  EASY = 'easy', // 30min - 2 hours
  MODERATE = 'moderate', // 2-8 hours
  SIGNIFICANT = 'significant', // 1-3 days
  MAJOR = 'major' // > 3 days
}

export enum IMPACT_LEVEL {
  MINIMAL = 'minimal', // 0-10 impact score
  LOW = 'low', // 11-20 impact score
  MEDIUM = 'medium', // 21-30 impact score
  HIGH = 'high', // 31-40 impact score
  CRITICAL = 'critical' // 41+ impact score
}

export interface Issue {
  id: string;
  title: string;
  severity: SEVERITY;
  description: string;
  remediation: string;
  impactScore: number;
  scoreImpact?: number; // Estimated score improvement if fixed (0-20)

  // Effort/Impact estimation for prioritization
  effortLevel?: EFFORT_LEVEL; // How much work to fix
  impactLevel?: IMPACT_LEVEL; // How much improvement if fixed

  location?: IssueLocation;
  evidence?: string[];
  tags?: string[];
  confidence?: number;
  timestamp?: string; // ISO timestamp
  category: CATEGORY;
}

export interface ScanOptions {
  html?: string;
  timeoutMs?: number;
  maxChunkTokens?: number;
  userAgent?: string;
  enableChunking?: boolean; // Enable detailed content chunking analysis
  chunkingStrategy?: 'auto' | 'heading-based' | 'paragraph-based'; // Force specific chunking strategy (default: auto)
  enableExtractability?: boolean; // Enable extractability mapping
  enableLLM?: boolean; // Enable LLM comprehension analysis
  enableHallucinationDetection?: boolean; // Enable hallucination trigger detection
  
  // Filtering options to reduce noise
  minImpactScore?: number; // Minimum impact score to include (default: 8)
  minConfidence?: number; // Minimum confidence to include (default: 0.7)
  maxIssues?: number; // Maximum issues to return (default: 20)
  
  // Progress callback for real-time updates
  onProgress?: (step: string, progress: number) => void;
  
  llmConfig?: {
    provider: 'openai' | 'anthropic' | 'ollama' | 'local';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface ContentChunk {
  id: string;
  startSelector: string;
  endSelector?: string;
  tokenCount: number;
  text: string;
  heading?: string;
  headingLevel?: number;
  noiseRatio: number;
  wordCount: number;
  characterCount: number;
  hasCode: boolean;
  hasLists: boolean;
  hasTables: boolean;
}

export interface ChunkingAnalysis {
  chunks: ContentChunk[];
  totalTokens: number;
  totalChunks: number;
  averageTokensPerChunk: number;
  averageNoiseRatio: number;
  chunkingStrategy: string;
}

export interface ExtractabilityAnalysis {
  score: {
    extractabilityScore: number;
    serverRenderedPercent: number;
    hiddenContentPercent: number;
    interactiveContentPercent: number;
    iframeContentPercent: number;
  };
  summary: {
    totalNodes: number;
    extractableNodes: number;
    hiddenNodes: number;
    interactiveNodes: number;
    iframeNodes: number;
    clientRenderedNodes: number;
    serverRenderedNodes: number;
  };
  contentTypes: {
    text: { extractable: number; total: number; percentage: number };
    images: { extractable: number; total: number; percentage: number };
    links: { extractable: number; total: number; percentage: number };
    structured: { extractable: number; total: number; percentage: number };
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    count: number;
  }>;
  recommendations: string[];
}

export interface CategoryScore {
  category: CATEGORY;
  score: number;
  issueCount: number;
  totalImpact: number;
  weight: number;
  issues: {
    severity: SEVERITY;
    count: number;
    impact: number;
  }[];
}

export interface ScoringResult {
  overallScore: number;
  categoryScores: CategoryScore[];
  totalIssues: number;
  severityBreakdown: Record<SEVERITY, number>;
  maxPossibleScore: number;
  normalizedScore: number;
}

/**
 * Main scan result interface
 * Reorganized for clarity with logical groupings
 */
export interface ScanResult {
  // ===== METADATA =====
  url: string;
  timestamp?: number;
  llmLimitExceeded?: boolean; // Flag if LLM rate limit was hit
  
  // ===== ISSUES & SCORING =====
  issues: Issue[];
  scores: Record<string, number>; // Legacy category scores (for backward compatibility)
  scoring?: ScoringResult; // Comprehensive scoring system with weights and breakdowns
  
  // ===== TECHNICAL ANALYSIS =====
  /** Content chunking analysis - how content splits for RAG/embeddings */
  chunking?: ChunkingAnalysis;
  
  /** Extractability mapping - how easily content can be parsed from HTML */
  extractability?: ExtractabilityAnalysis;
  
  // ===== AI COMPREHENSION =====
  /** High-level AI understanding and content analysis */
  llm?: {
    // Content Understanding
    summary: string;
    pageType?: string;
    pageTypeInsights?: string[]; // AI-generated recommendations for this page type
    keyTopics?: string[];
    
    // Content Characteristics
    readingLevel?: {
      grade: number;
      description: string;
    };
    sentiment?: 'positive' | 'neutral' | 'negative';
    technicalDepth?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    structureQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    
    // Extracted Elements (high-level summaries for UI)
    topEntities: Array<{
      name: string;
      type: string;
      relevance: number;
      mentions?: number;
    }>;
    
    questions: Array<{
      question: string;
      category: 'what' | 'why' | 'how' | 'when' | 'where' | 'who';
      difficulty: 'basic' | 'intermediate' | 'advanced';
    }>;
    
    suggestedFAQ: Array<{
      question: string;
      suggestedAnswer: string;
      importance: 'high' | 'medium' | 'low';
    }>;
  };
  
  // ===== DETAILED EXTRACTIONS =====
  /** Detailed entity extraction with metadata and locations (for advanced use) */
  entities?: {
    entities: Array<{
      name: string;
      type: 'organization' | 'product' | 'person' | 'date' | 'number' | 'location' | 'email' | 'url' | 'phone';
      confidence: number;
      locator: {
        selector?: string;
        textSnippet: string;
        position: number;
      };
      metadata?: {
        normalized?: string;
        schemaField?: string;
        context?: string;
        source?: 'regex' | 'llm' | 'schema';
      };
    }>;
    summary: {
      totalEntities: number;
      byType: Record<string, number>;
      highConfidence: number;
      mediumConfidence: number;
      lowConfidence: number;
    };
    schemaMapping?: Record<string, any[]>;
  };
  
  /** Detailed FAQ generation with sources and confidence (for advanced use) */
  faqs?: {
    faqs: Array<{
      question: string;
      suggestedAnswer: string;
      importance: 'high' | 'medium' | 'low';
      confidence: number;
      source: 'llm' | 'heuristic' | 'schema';
    }>;
    summary: {
      totalFAQs: number;
      byImportance: {
        high: number;
        medium: number;
        low: number;
      };
      averageConfidence: number;
    };
  };
  
  // ===== QUALITY & ACCURACY CHECKS =====
  /** Hallucination risk assessment and fact verification */
  hallucinationReport?: {
    hallucinationRiskScore: number; // 0-100
    triggers: Array<{
      type: 'missing_fact' | 'contradiction' | 'ambiguity' | 'inconsistency';
      severity: SEVERITY;
      description: string;
      confidence: number;
    }>;
    factCheckSummary: {
      totalFacts: number;
      verifiedFacts: number;
      unverifiedFacts: number;
      contradictions: number;
      ambiguities: number;
    };
    recommendations: string[];
    verifications: Array<{
      fact: string;
      verified: boolean;
      evidence?: string[];
      contradictions?: string[];
      ambiguities?: string[];
    }>;
  };
  
  /** AI messaging alignment - how AI interprets vs. intended messaging */
  mirrorReport?: {
    intendedMessaging: Array<{
      productName?: string;
      tagline?: string;
      description?: string;
      keyFeatures?: string[];
      targetAudience?: string;
      pricing?: string;
      category?: string;
      source: 'h1' | 'meta' | 'schema' | 'hero';
    }>;
    llmInterpretation: {
      productName?: string;
      purpose?: string;
      keyFeatures?: string[];
      targetAudience?: string;
      pricing?: string;
      category?: string;
      confidence: number;
    };
    mismatches: Array<{
      field: string;
      intended: string;
      interpreted: string;
      severity: 'critical' | 'major' | 'minor';
      description: string;
      recommendation: string;
      confidence: number;
    }>;
    summary: {
      totalMismatches: number;
      critical: number;
      major: number;
      minor: number;
      alignmentScore: number;
      clarityScore: number;
    };
    recommendations: string[];
  };

  // ===== OPTIMIZATION ANALYSIS =====
  /** SEO analysis - Traditional search engine optimization */
  seo?: SEOAnalysis;

  /** PSEO analysis - Programmatic SEO optimization */
  pseo?: PSEOAnalysis;

  /** AEO analysis - Answer Engine Optimization */
  aeo?: AEOAnalysis;

  /** GEO analysis - Generative Engine Optimization */
  geo?: GEOAnalysis;
}

/**
 * SEO Analysis - Traditional Search Engine Optimization
 */
export interface SEOAnalysis {
  score: number; // 0-100
  grade: string;

  // Core SEO elements
  title: {
    present: boolean;
    length: number;
    optimal: boolean; // 50-60 chars
    content?: string;
  };

  metaDescription: {
    present: boolean;
    length: number;
    optimal: boolean; // 150-160 chars
    content?: string;
  };

  headings: {
    h1Count: number;
    h1Content?: string;
    hasProperHierarchy: boolean;
    headingStructure: { level: number; count: number }[];
  };

  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    altCoverage: number; // percentage
  };

  links: {
    internal: number;
    external: number;
    broken: number;
    nofollow: number;
  };

  canonical: {
    present: boolean;
    url?: string;
    selfReferencing: boolean;
  };

  robots: {
    metaRobots?: string;
    robotsTxtAccessible: boolean;
    isIndexable: boolean;
  };

  mobile: {
    hasViewport: boolean;
    viewportContent?: string;
  };

  performance: {
    hasCompression: boolean;
    hasCaching: boolean;
  };

  issues: SEOIssue[];
  recommendations: string[];
}

export interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  fix: string;
}

/**
 * PSEO Analysis - Programmatic SEO
 * Analyzes content patterns for scalable, template-based SEO
 */
export interface PSEOAnalysis {
  score: number;
  grade: string;

  // Template detection
  templateSignals: {
    hasConsistentStructure: boolean;
    hasPlaceholderPatterns: boolean;
    hasDynamicContent: boolean;
    templateConfidence: number;
  };

  // Content uniqueness
  contentUniqueness: {
    uniqueContentRatio: number; // 0-1
    boilerplateRatio: number;
    uniqueSentences: number;
    duplicatePhrases: string[];
  };

  // Keyword optimization
  keywordOptimization: {
    primaryKeyword?: string;
    keywordDensity: number;
    keywordInTitle: boolean;
    keywordInH1: boolean;
    keywordInFirstParagraph: boolean;
    relatedKeywords: string[];
  };

  // Internal linking patterns
  internalLinking: {
    linksToOtherPages: number;
    linksFromPattern: boolean; // links following a pattern (e.g., /city/service)
    hubPagePotential: boolean;
  };

  // Schema readiness
  schemaReadiness: {
    hasSchema: boolean;
    schemaTypes: string[];
    canAutoGenerate: boolean;
    suggestedSchemas: string[];
  };

  issues: SEOIssue[];
  recommendations: string[];
}

/**
 * AEO Analysis - Answer Engine Optimization
 * Analyzes content for voice search, featured snippets, and answer boxes
 */
export interface AEOAnalysis {
  score: number;
  grade: string;

  // Question targeting
  questionTargeting: {
    questionsAnswered: number;
    questionFormats: { question: string; hasDirectAnswer: boolean }[];
    faqMarkupPresent: boolean;
    howToMarkupPresent: boolean;
  };

  // Answer formatting
  answerFormatting: {
    hasConciseAnswers: boolean; // 40-60 word answers
    hasDefinitions: boolean;
    hasListAnswers: boolean;
    hasStepByStep: boolean;
    answerBoxPotential: number; // 0-100
  };

  // Featured snippet optimization
  featuredSnippetOptimization: {
    paragraphSnippetReady: boolean;
    listSnippetReady: boolean;
    tableSnippetReady: boolean;
    snippetCandidates: {
      type: 'paragraph' | 'list' | 'table';
      content: string;
      score: number;
    }[];
  };

  // Voice search optimization
  voiceSearchOptimization: {
    conversationalTone: boolean;
    naturalLanguageQueries: string[];
    speakableContent: boolean;
    localRelevance: boolean;
  };

  // Structured data
  structuredData: {
    hasFAQSchema: boolean;
    hasHowToSchema: boolean;
    hasQAPageSchema: boolean;
    hasSpeakableSchema: boolean;
  };

  issues: SEOIssue[];
  recommendations: string[];
}

/**
 * GEO Analysis - Generative Engine Optimization
 * Analyzes content for AI/LLM consumption and citation potential
 */
export interface GEOAnalysis {
  score: number;
  grade: string;

  // AI Visibility
  aiVisibility: {
    score: number; // 0-100
    crawlable: boolean;
    extractable: boolean;
    semanticallyRich: boolean;
    structuredDataPresent: boolean;
  };

  // Citation potential
  citationPotential: {
    score: number; // 0-100
    hasAuthoritySignals: boolean;
    hasUniqueInsights: boolean;
    hasDataPoints: boolean;
    hasExpertQuotes: boolean;
    citationReadyContent: string[];
  };

  // Content attribution
  contentAttribution: {
    hasAuthor: boolean;
    hasPublishDate: boolean;
    hasLastModified: boolean;
    hasSourceLinks: boolean;
    authorityScore: number;
  };

  // AI comprehension
  aiComprehension: {
    clarityScore: number; // 0-100
    ambiguityScore: number; // lower is better
    factDensity: number;
    topicCoherence: number;
  };

  // Knowledge graph optimization
  knowledgeGraphOptimization: {
    entityRichness: number;
    relationshipClarity: number;
    topicClustering: number;
    conceptHierarchy: boolean;
  };

  // Brand protection
  brandProtection: {
    brandMentions: number;
    consistentMessaging: boolean;
    competitorMentions: number;
    messagingClarity: number;
  };

  issues: SEOIssue[];
  recommendations: string[];
}

