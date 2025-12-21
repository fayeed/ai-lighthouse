// Main exports for the scanner package

// Configuration
export { DEFAULT_CONFIG, STRICT_CONFIG, VERBOSE_CONFIG } from './config.js';
export type { ScannerConfig } from './config.js';

// Core scanning functionality
export { analyzeUrlWithRules } from './scanWithRules.js';

// AI Readiness Assessment (NEW - Primary way to understand AI optimization)
export { 
  calculateAIReadiness, 
  formatAIReadinessReport 
} from './ai-readiness-score.js';

export type {
  AIReadinessScore,
  DimensionScore
} from './ai-readiness-score.js';

// Scoring utilities (Traditional technical scoring)
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
  Question,
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

// Hallucination detection
export {
  detectHallucinations,
  hallucinationTriggersToIssues
} from './llm/hallucination.js';

export type {
  ExtractedFact,
  FactVerification,
  HallucinationTrigger,
  MisunderstandingReport
} from './llm/hallucination.js';

// Named entity extraction (dedicated, detailed)
export {
  extractNamedEntities,
  extractEntitiesQuick
} from './llm/entities.js';

export type {
  Entity as NamedEntity,
  EntityType,
  EntityExtractionResult
} from './llm/entities.js';

// FAQ generation (dedicated, detailed)
export {
  generateFAQs,
  generateFAQsQuick
} from './llm/faq.js';

export type {
  FAQEntry,
  FAQResult
} from './llm/faq.js';

// LLM Mirror Test
export {
  runMirrorTest,
  quickMirrorTest
} from './llm/mirror.js';

export type {
  IntendedMessaging,
  LLMInterpretation,
  Mismatch,
  MirrorReport
} from './llm/mirror.js';

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
