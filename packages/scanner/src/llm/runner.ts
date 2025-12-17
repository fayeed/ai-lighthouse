/**
 * LLM Runner - Abstraction for calling different LLM providers
 * Supports OpenAI, Anthropic, OpenRouter, and local models
 */

import { OpenRouter } from '@openrouter/sdk';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'local' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

/**
 * Abstract LLM provider interface
 */
export interface LLMProvider {
  call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse>;
  supportsStreaming(): boolean;
}

/**
 * OpenAI provider
 */
class OpenAIProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const apiKey = options?.apiKey || this.config.apiKey;
    const model = options?.model || this.config.model || 'gpt-4o-mini';
    const baseUrl = options?.baseUrl || this.config.baseUrl || 'https://api.openai.com/v1';
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2000
      }),
      signal: AbortSignal.timeout(options?.timeout ?? this.config.timeout ?? 30000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * Anthropic provider
 */
class AnthropicProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const apiKey = options?.apiKey || this.config.apiKey;
    const model = options?.model || this.config.model || 'claude-3-5-sonnet-20241022';
    const baseUrl = options?.baseUrl || this.config.baseUrl || 'https://api.anthropic.com/v1';
    
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Anthropic requires system message separate
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        system: systemMessage?.content,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2000
      }),
      signal: AbortSignal.timeout(options?.timeout ?? this.config.timeout ?? 30000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      model: data.model,
      finishReason: data.stop_reason
    };
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * Ollama provider (local models)
 */
class OllamaProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const model = options?.model || this.config.model || 'llama3.2';
    const baseUrl = options?.baseUrl || this.config.baseUrl || 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? this.config.maxTokens ?? 2000
        }
      }),
      signal: AbortSignal.timeout(options?.timeout ?? this.config.timeout ?? 60000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.message.content,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: data.model,
      finishReason: data.done ? 'stop' : 'length'
    };
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * OpenRouter provider
 */
class OpenRouterProvider implements LLMProvider {
  private client: OpenRouter;

  constructor(private config: LLMConfig) {
    this.client = new OpenRouter({
      apiKey: config.apiKey || '',
    });
  }

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const apiKey = options?.apiKey || this.config.apiKey;
    const model = options?.model || this.config.model || 'meta-llama/llama-3.3-70b-instruct:free';
    const timeout = options?.timeout ?? this.config.timeout ?? 90000; // 90s for OpenRouter (slower than other providers)
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // Update client if apiKey changed
    if (options?.apiKey && options.apiKey !== this.config.apiKey) {
      this.client = new OpenRouter({ apiKey: options.apiKey });
    }

    // OpenRouter SDK doesn't support AbortSignal, so we use Promise.race for timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`OpenRouter request timeout after ${timeout}ms`)), timeout);
    });

    const requestPromise = this.client.chat.send({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 2000,
    });

    const response = await Promise.race([requestPromise, timeoutPromise]);

    return {
      content: response.choices[0].message.content?.toString() || '',
      usage: response.usage ? {
        promptTokens: response.usage.promptTokens || 0,
        completionTokens: response.usage.completionTokens || 0,
        totalTokens: response.usage.totalTokens || 0,
      } : undefined,
      model: response.model || model,
      finishReason: response.choices[0].finishReason?.toString() || '',
    };
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * Generic local provider (for custom endpoints)
 */
class LocalProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const baseUrl = options?.baseUrl || this.config.baseUrl;
    
    if (!baseUrl) {
      throw new Error('Base URL is required for local provider');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options?.model || this.config.model || 'local-model',
        messages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2000
      }),
      signal: AbortSignal.timeout(options?.timeout ?? this.config.timeout ?? 60000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0
      } : undefined,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    };
  }

  supportsStreaming(): boolean {
    return false;
  }
}

/**
 * LLM Runner - Main interface for calling LLMs
 */
export class LLMRunner {
  private provider: LLMProvider;

  constructor(private config: LLMConfig) {
    this.provider = this.createProvider();
  }

  private createProvider(): LLMProvider {
    switch (this.config.provider) {
      case 'openai':
        return new OpenAIProvider(this.config);
      case 'anthropic':
        return new AnthropicProvider(this.config);
      case 'openrouter':
        return new OpenRouterProvider(this.config);
      case 'ollama':
        return new OllamaProvider(this.config);
      case 'local':
        return new LocalProvider(this.config);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  async call(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.provider.call(messages, options);
  }

  async callWithSystem(systemPrompt: string, userPrompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], options);
  }

  supportsStreaming(): boolean {
    return this.provider.supportsStreaming();
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

/**
 * Create an LLM runner from environment variables
 */
export function createLLMRunnerFromEnv(): LLMRunner | null {
  // Check for OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return new LLMRunner({
      provider: 'openai',
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });
  }

  // Check for Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return new LLMRunner({
      provider: 'anthropic',
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    });
  }

  // Check for Ollama
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    // Try to ping Ollama
    fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1000) })
      .then(() => {
        return new LLMRunner({
          provider: 'ollama',
          baseUrl: ollamaUrl,
          model: process.env.OLLAMA_MODEL || 'llama3.2'
        });
      })
      .catch(() => null);
  } catch (e) {
    // Ollama not available
  }

  return null;
}
