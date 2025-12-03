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
}

