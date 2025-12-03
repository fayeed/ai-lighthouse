// Main exports for the scanner package

// Core scanning functionality
export { analyzeUrlWithRules } from './scanWithRules.js';

// Scoring utilities
export { 
  calculateScore, 
  getLetterGrade, 
  generateScoringSummary 
} from './scoring.js';

// Types
export type {
  Issue,
  IssueLocation,
  ScanOptions,
  ScanResult,
  ScoringResult,
  CategoryScore
} from './types.js';

export { SEVERITY, CATEGORY } from './types.js';

// Utilities
export { 
  fetchHtml, 
  parseHtml, 
  estimateTokenCount 
} from './utils.js';
