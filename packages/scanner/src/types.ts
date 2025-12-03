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
  serverity: SEVERITY;
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
  enableExtractability?: boolean; // Enable extractability mapping
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
}

