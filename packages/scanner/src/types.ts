export enum SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info'
}

export enum CATEGORY {
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
  MISC = 'MISC'
}

export interface IssueLocation {
  url?: string;
  selector?: string;
  textSnippet?: string;
  line?: number; 
}

export interface Issue {
  id: string;
  title: string;
  severity: SEVERITY;
  description: string;
  remediation: string;
  impactScore: number;
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

export interface ScanResult {
  url: string;
  timestamp?: number; // ISO timestamp
  issues: Issue[];
  scores: Record<string, number>; // Legacy simple scores
  scoring?: ScoringResult; // New comprehensive scoring
  chunking?: ChunkingAnalysis; // Detailed chunking analysis
  extractability?: ExtractabilityAnalysis; // Extractability mapping
  llm?: {
    summary: string;
    pageType?: string;
    pageTypeInsights?: string[];  // LLM-generated recommendations specific to this page type
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
    readingLevel?: {
      grade: number;
      description: string;
    };
    keyTopics?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    technicalDepth?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    structureQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
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
    verifications: {
      fact: string;
      verified: boolean;
      evidence?: string[];
      contradictions?: string[];
      ambiguities?: string[];
    }
  };
  entities?: {
    entities: Array<{
      name: string;
      type: 'organization' | 'product' | 'person' | 'date' | 'number' | 'location' | 'email' | 'url' | 'phone';
      confidence: number; // 0-1
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
  faqs?: {
    faqs: Array<{
      question: string;
      suggestedAnswer: string;
      importance: 'high' | 'medium' | 'low';
      confidence: number; // 0-1
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
  // Note: llm.topEntities and llm.suggestedFAQ provide high-level overview
  // while entities and faqs provide detailed extraction with metadata
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
  llmLimitExceeded?: boolean; // Flag indicating if LLM rate limit was hit during scan
}

