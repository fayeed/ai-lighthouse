/**
 * CLI Presets - Streamlined configurations for common use cases
 *
 * Instead of overwhelming users with 24+ flags, we provide 4 presets
 * that cover the most common scanning scenarios.
 */

import type { ScanOptions } from '@ai-lighthouse/scanner';

export type PresetName = 'basic' | 'ai-optimized' | 'full' | 'minimal';

export interface PresetConfig extends ScanOptions {
  name: PresetName;
  description: string;
  estimatedDuration: string;
  minImpactScore: number;
  minConfidence: number;
  maxIssues: number;
}

/**
 * BASIC - Fast scan without LLM analysis
 *
 * Use when:
 * - You want quick results
 * - You don't need AI-powered insights
 * - You're running automated checks
 *
 * Duration: ~5-10 seconds
 */
export const BASIC_PRESET: PresetConfig = {
  name: 'basic',
  description: 'Fast scan with core rules only (no LLM)',
  estimatedDuration: '5-10 seconds',

  // Filtering
  minImpactScore: 8,
  minConfidence: 0.7,
  maxIssues: 20,

  // Features
  enableLLM: false,
  enableChunking: false,
  enableExtractability: false,
  enableHallucinationDetection: false,

  // LLM config (disabled)
  llmConfig: undefined,
};

/**
 * AI-OPTIMIZED - Recommended for most users
 *
 * Use when:
 * - You want AI insights without waiting too long
 * - You care about comprehension and messaging alignment
 * - You want actionable recommendations
 *
 * Duration: ~30-60 seconds
 * Includes: LLM comprehension, entity extraction, FAQ generation, message alignment
 */
export const AI_OPTIMIZED_PRESET: PresetConfig = {
  name: 'ai-optimized',
  description: 'Balanced scan with AI comprehension and messaging alignment',
  estimatedDuration: '30-60 seconds',

  // Filtering
  minImpactScore: 8,
  minConfidence: 0.7,
  maxIssues: 20,

  // Features (balanced approach)
  enableLLM: true,
  enableChunking: false, // Skip for speed
  enableExtractability: false, // Skip for speed
  enableHallucinationDetection: false, // Skip for speed

  // LLM config (will be populated from CLI flags)
  llmConfig: {
    provider: 'ollama', // Default to local
    model: 'qwen2.5:0.5b',
    maxTokens: 2000,
    temperature: 0.3,
  },
};

/**
 * FULL - Comprehensive analysis with all features
 *
 * Use when:
 * - You want the most detailed report
 * - You're doing a thorough audit before launch
 * - Speed is not a concern
 *
 * Duration: ~2-5 minutes
 * Includes: Everything
 */
export const FULL_PRESET: PresetConfig = {
  name: 'full',
  description: 'Comprehensive scan with all features enabled',
  estimatedDuration: '2-5 minutes',

  // Filtering (show more)
  minImpactScore: 5,
  minConfidence: 0.6,
  maxIssues: 50,

  // Features (everything enabled)
  enableLLM: true,
  enableChunking: true,
  enableExtractability: true,
  enableHallucinationDetection: true,

  // Chunking config
  chunkingStrategy: 'auto',
  maxChunkTokens: 1200,

  // LLM config (will be populated from CLI flags)
  llmConfig: {
    provider: 'ollama',
    model: 'qwen2.5:0.5b',
    maxTokens: 2000,
    temperature: 0.3,
  },
};

/**
 * MINIMAL - Only critical issues
 *
 * Use when:
 * - You only want to see blockers
 * - You're doing a quick health check
 * - You want the fastest possible scan
 *
 * Duration: ~3-5 seconds
 */
export const MINIMAL_PRESET: PresetConfig = {
  name: 'minimal',
  description: 'Quick scan showing only critical issues',
  estimatedDuration: '3-5 seconds',

  // Strict filtering
  minImpactScore: 15,
  minConfidence: 0.8,
  maxIssues: 10,

  // Features (minimal)
  enableLLM: false,
  enableChunking: false,
  enableExtractability: false,
  enableHallucinationDetection: false,

  // LLM config (disabled)
  llmConfig: undefined,
};

/**
 * Preset registry
 */
export const PRESETS: Record<PresetName, PresetConfig> = {
  basic: BASIC_PRESET,
  'ai-optimized': AI_OPTIMIZED_PRESET,
  full: FULL_PRESET,
  minimal: MINIMAL_PRESET,
};

/**
 * Get preset configuration by name
 */
export function getPreset(name: PresetName): PresetConfig {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown preset: ${name}. Available: ${Object.keys(PRESETS).join(', ')}`);
  }
  return { ...preset }; // Return a copy to avoid mutations
}

/**
 * List all available presets with descriptions
 */
export function listPresets(): Array<{ name: PresetName; description: string; duration: string }> {
  return Object.values(PRESETS).map(preset => ({
    name: preset.name,
    description: preset.description,
    duration: preset.estimatedDuration,
  }));
}

/**
 * Merge preset with user-provided options
 * User options override preset defaults
 */
export function mergePresetWithOptions(
  presetName: PresetName,
  userOptions: Partial<ScanOptions> & {
    llmProvider?: string;
    llmModel?: string;
    llmApiKey?: string;
    llmBaseUrl?: string;
  }
): ScanOptions {
  const preset = getPreset(presetName);

  // Start with preset
  const merged: ScanOptions = {
    minImpactScore: preset.minImpactScore,
    minConfidence: preset.minConfidence,
    maxIssues: preset.maxIssues,
    enableLLM: preset.enableLLM,
    enableChunking: preset.enableChunking,
    enableExtractability: preset.enableExtractability,
    enableHallucinationDetection: preset.enableHallucinationDetection,
    chunkingStrategy: preset.chunkingStrategy,
    maxChunkTokens: preset.maxChunkTokens,
  };

  // Apply user overrides
  if (userOptions.minImpactScore !== undefined) merged.minImpactScore = userOptions.minImpactScore;
  if (userOptions.minConfidence !== undefined) merged.minConfidence = userOptions.minConfidence;
  if (userOptions.maxIssues !== undefined) merged.maxIssues = userOptions.maxIssues;
  if (userOptions.enableLLM !== undefined) merged.enableLLM = userOptions.enableLLM;
  if (userOptions.enableChunking !== undefined) merged.enableChunking = userOptions.enableChunking;
  if (userOptions.enableExtractability !== undefined) merged.enableExtractability = userOptions.enableExtractability;
  if (userOptions.enableHallucinationDetection !== undefined) merged.enableHallucinationDetection = userOptions.enableHallucinationDetection;
  if (userOptions.chunkingStrategy !== undefined) merged.chunkingStrategy = userOptions.chunkingStrategy;
  if (userOptions.maxChunkTokens !== undefined) merged.maxChunkTokens = userOptions.maxChunkTokens;

  // Handle LLM config
  if (merged.enableLLM) {
    merged.llmConfig = {
      provider: (userOptions.llmProvider as any) || preset.llmConfig?.provider || 'ollama',
      model: userOptions.llmModel || preset.llmConfig?.model,
      apiKey: userOptions.llmApiKey || preset.llmConfig?.apiKey,
      baseUrl: userOptions.llmBaseUrl || preset.llmConfig?.baseUrl,
      maxTokens: preset.llmConfig?.maxTokens,
      temperature: preset.llmConfig?.temperature,
    };
  }

  return merged;
}
