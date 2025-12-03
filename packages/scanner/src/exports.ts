// Main exports for the scanner package

// Core scanning functionality
export { analyzeUrlWithRules } from './scanWithRules.js';

// Scoring utilities
export { 
  calculateScore, 
  getLetterGrade, 
  generateScoringSummary 
} from './scoring.js';

// Chunking utilities
export {
  chunkContent,
  analyzeChunkQuality
} from './chunker.js';

export type {
  ContentChunk,
  ChunkingResult
} from './chunker.js';

// Extractability utilities
export {
  buildExtractabilityMap,
  analyzeContentTypeExtractability
} from './extractability.js';

export type {
  ExtractabilityMap,
  ExtractableNode,
  ContentSource,
  ExtractabilityLevel
} from './extractability.js';

// Output formatting
export {
  formatAuditReport,
  exportAuditReport
} from './output-formatter.js';

export type { AuditReport } from './output-formatter.js';

// LLM comprehension
export {
  generateLLMComprehension,
  generateQuickSummary
} from './llm/comprehension.js';

export type {
  Entity,
  Question,
  FAQItem,
  LLMComprehension
} from './llm/comprehension.js';

export {
  LLMRunner,
  createLLMRunnerFromEnv
} from './llm/runner.js';

export type {
  LLMConfig,
  LLMMessage,
  LLMResponse,
  LLMProvider
} from './llm/runner.js';

// Types
export type {
  Issue,
  IssueLocation,
  ScanOptions,
  ScanResult,
  ScoringResult,
  CategoryScore,
  ChunkingAnalysis,
  ExtractabilityAnalysis
} from './types.js';

export { SEVERITY, CATEGORY } from './types.js';

// Utilities
export { 
  fetchHtml, 
  parseHtml, 
  estimateTokenCount 
} from './utils.js';
