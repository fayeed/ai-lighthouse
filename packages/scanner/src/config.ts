/**
 * Scanner Configuration
 * Controls which checks run and filtering thresholds
 * 
 * RULE REDUCTION UPDATE:
 * Reduced from 127 → 36 rules (72% reduction)
 * Removed low-value rules (impact <8, confidence <0.6, edge cases)
 * Focus on high-quality, actionable insights for AI comprehension
 */

export interface ScannerConfig {
  // Minimum impact score to include in results (filters noise)
  minImpactScore: number;
  
  // Minimum confidence to include (filters uncertain issues)
  minConfidence: number;
  
  // Maximum issues to return (prevents overwhelming output)
  maxIssues: number;
  
  // Rule categories to enable/disable
  rules: {
    airead: boolean;      // Core AI readability (9 rules: H1, content quality, meta, alt text)
    extract: boolean;     // Content extraction (1 rule)
    chunk: boolean;       // Chunking analysis (1 rule)
    crawl: boolean;       // Crawlability (7 rules: robots, status, canonical, H1 duplicates)
    tech: boolean;        // Technical SEO (deprecated - merged into other categories)
    kg: boolean;          // Knowledge graph (5 rules: JSON-LD, schema.org validation)
    a11y: boolean;        // Accessibility (1 rule: ARIA landmarks for structure)
    hall: boolean;        // Hallucination detection (via LLM)
  };
  
  // LLM feature toggles
  llm: {
    comprehension: boolean;    // LLM summary (2 calls, fast overview)
    entities: boolean;          // Named entity extraction (detailed with confidence)
    faqs: boolean;              // FAQ generation (detailed with sources)
    mirrorTest: boolean;        // AI misunderstanding detection
    hallucination: boolean;     // Hallucination risk analysis
  };
  
  // Display preferences
  display: {
    showLowPriorityIssues: boolean;  // Show issues below minImpactScore
    consolidateOutput: boolean;       // Merge redundant sections
    verboseMode: boolean;             // Show detailed breakdowns
  };
}

/**
 * Default configuration: focused on high-value insights
 */
export const DEFAULT_CONFIG: ScannerConfig = {
  minImpactScore: 8,      // Only show issues with impact ≥ 8
  minConfidence: 0.7,     // Only show issues with 70%+ confidence
  maxIssues: 15,          // Limit to top 15 issues
  
  rules: {
    airead: true,         // Keep AI readability (but will be filtered by impact)
    extract: true,
    chunk: true,
    crawl: true,
    tech: true,
    kg: true,             // Knowledge graph valuable for AI
    a11y: true,
    hall: true,
  },
  
  llm: {
    comprehension: true,   // High value
    entities: true,        // Consolidated into comprehension display
    faqs: true,            // Consolidated into comprehension display
    mirrorTest: true,      // Unique insight
    hallucination: true,   // Unique insight
  },
  
  display: {
    showLowPriorityIssues: false,  // Hide low-priority by default
    consolidateOutput: true,        // Merge redundant sections
    verboseMode: false,             // Concise by default
  }
};

/**
 * Strict configuration: only critical issues
 */
export const STRICT_CONFIG: ScannerConfig = {
  minImpactScore: 15,
  minConfidence: 0.8,
  maxIssues: 10,
  
  rules: {
    airead: true,
    extract: true,
    chunk: true,
    crawl: false,          // Disable crawl checks
    tech: false,           // Disable technical SEO
    kg: true,
    a11y: false,           // Disable a11y (focus on AI)
    hall: true,
  },
  
  llm: {
    comprehension: true,
    entities: true,
    faqs: false,           // Disable FAQ generation
    mirrorTest: true,
    hallucination: true,
  },
  
  display: {
    showLowPriorityIssues: false,
    consolidateOutput: true,
    verboseMode: false,
  }
};

/**
 * Verbose configuration: show everything (for debugging)
 */
export const VERBOSE_CONFIG: ScannerConfig = {
  minImpactScore: 0,
  minConfidence: 0,
  maxIssues: 100,
  
  rules: {
    airead: true,
    extract: true,
    chunk: true,
    crawl: true,
    tech: true,
    kg: true,
    a11y: true,
    hall: true,
  },
  
  llm: {
    comprehension: true,
    entities: true,
    faqs: true,
    mirrorTest: true,
    hallucination: true,
  },
  
  display: {
    showLowPriorityIssues: true,
    consolidateOutput: false,
    verboseMode: true,
  }
};
