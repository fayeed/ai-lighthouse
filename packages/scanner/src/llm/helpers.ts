/**
 * Helper utilities for LLM configuration
 */

import { LLMConfig } from './runner.js';

/**
 * Get LLM configuration from environment variables
 */
export function getLLMConfigFromEnv(): LLMConfig | null {
  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL,
      maxTokens: process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS) : undefined,
      temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : undefined
    };
  }

  // Check Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      maxTokens: process.env.ANTHROPIC_MAX_TOKENS ? parseInt(process.env.ANTHROPIC_MAX_TOKENS) : undefined,
      temperature: process.env.ANTHROPIC_TEMPERATURE ? parseFloat(process.env.ANTHROPIC_TEMPERATURE) : undefined
    };
  }

  // Check Ollama
  if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA) {
    return {
      provider: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      maxTokens: process.env.OLLAMA_MAX_TOKENS ? parseInt(process.env.OLLAMA_MAX_TOKENS) : undefined,
      temperature: process.env.OLLAMA_TEMPERATURE ? parseFloat(process.env.OLLAMA_TEMPERATURE) : undefined
    };
  }

  // Check Local
  if (process.env.LOCAL_LLM_URL) {
    return {
      provider: 'local',
      baseUrl: process.env.LOCAL_LLM_URL,
      model: process.env.LOCAL_LLM_MODEL || 'default',
      maxTokens: process.env.LOCAL_LLM_MAX_TOKENS ? parseInt(process.env.LOCAL_LLM_MAX_TOKENS) : undefined,
      temperature: process.env.LOCAL_LLM_TEMPERATURE ? parseFloat(process.env.LOCAL_LLM_TEMPERATURE) : undefined
    };
  }

  return null;
}

/**
 * Check if LLM is available (any provider configured)
 */
export function isLLMAvailable(): boolean {
  return getLLMConfigFromEnv() !== null;
}

/**
 * Get available LLM providers from environment
 */
export function getAvailableProviders(): string[] {
  const providers: string[] = [];

  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA) providers.push('ollama');
  if (process.env.LOCAL_LLM_URL) providers.push('local');

  return providers;
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: LLMConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Provider is required');
  }

  if ((config.provider === 'openai' || config.provider === 'anthropic') && !config.apiKey) {
    errors.push(`API key is required for ${config.provider}`);
  }

  if (config.provider === 'ollama' && !config.baseUrl) {
    errors.push('Base URL is required for Ollama');
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
    errors.push('Temperature must be between 0 and 1');
  }

  if (config.maxTokens !== undefined && config.maxTokens <= 0) {
    errors.push('Max tokens must be positive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get recommended model for a provider
 */
export function getRecommendedModel(provider: string): string {
  const recommendations: Record<string, string> = {
    openai: 'gpt-4o-mini',       // Fast, cheap, good quality
    anthropic: 'claude-3-5-haiku-20241022',  // Balanced
    ollama: 'llama3.2',          // General purpose
    local: 'default'
  };

  return recommendations[provider] || 'default';
}

/**
 * Estimate cost per request (in USD)
 */
export function estimateCost(provider: string, tokens: number): number {
  // Rough estimates (as of 2024)
  const costPer1kTokens: Record<string, { input: number; output: number }> = {
    'openai-gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'openai-gpt-4o': { input: 0.0025, output: 0.01 },
    'anthropic-haiku': { input: 0.00025, output: 0.00125 },
    'anthropic-sonnet': { input: 0.003, output: 0.015 },
    'ollama': { input: 0, output: 0 },
    'local': { input: 0, output: 0 }
  };

  const key = `${provider}-${getRecommendedModel(provider)}`.toLowerCase();
  const cost = costPer1kTokens[key] || { input: 0, output: 0 };

  // Assume 50/50 split between input and output
  const inputCost = (tokens * 0.5 / 1000) * cost.input;
  const outputCost = (tokens * 0.5 / 1000) * cost.output;

  return inputCost + outputCost;
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    ollama: 'Ollama (Local)',
    local: 'Local LLM'
  };

  return names[provider] || provider;
}

/**
 * Print LLM configuration summary
 */
export function printLLMConfig(config: LLMConfig): void {
  console.log('LLM Configuration:');
  console.log(`  Provider: ${getProviderDisplayName(config.provider)}`);
  console.log(`  Model: ${config.model || getRecommendedModel(config.provider)}`);
  if (config.baseUrl) console.log(`  Base URL: ${config.baseUrl}`);
  if (config.temperature !== undefined) console.log(`  Temperature: ${config.temperature}`);
  if (config.maxTokens) console.log(`  Max Tokens: ${config.maxTokens}`);
  if (config.apiKey) console.log(`  API Key: ${config.apiKey.substring(0, 8)}...`);
}

/**
 * Safely parse JSON from LLM response, handling markdown code blocks and malformed JSON
 */
export function safeJSONParse<T = any>(content: string, context: string = 'LLM response'): T {
  try {
    // Clean response - remove markdown code blocks if present
    let cleanContent = content.trim();
    
    // Remove markdown code fences
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/,'').replace(/\n?```\s*$/,'').trim();
    }
    
    // Remove any leading/trailing whitespace and newlines
    cleanContent = cleanContent.trim();
    
    // Try to find JSON object/array if surrounded by other text
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }
    
    // Attempt to parse
    return JSON.parse(cleanContent);
  } catch (err) {
    const error = err as Error;
    console.error(`Failed to parse JSON from ${context}:`, error.message);
    console.error('Raw content:', content.substring(0, 500));
    
    // Try to provide helpful error message
    if (error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const contextStart = Math.max(0, pos - 50);
        const contextEnd = Math.min(content.length, pos + 50);
        console.error('Error context:', content.substring(contextStart, contextEnd));
        console.error('Error position marker:', ' '.repeat(Math.min(50, pos - contextStart)) + '^');
      }
    }
    
    throw new Error(`Failed to parse JSON from ${context}: ${error.message}`);
  }
}
