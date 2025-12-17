/**
 * Enhanced error handling with actionable guidance
 */

export interface ActionableError {
  error: string;
  message: string;
  code: string;
  action?: string;
  documentation?: string;
  statusCode: number;
}

export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public action?: string;
  public documentation?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    action?: string,
    documentation?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.action = action;
    this.documentation = documentation;
  }

  toJSON(): ActionableError {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      action: this.action,
      documentation: this.documentation,
      statusCode: this.statusCode,
    };
  }
}

// Predefined errors with actionable guidance
export const ErrorTypes = {
  INVALID_URL: (url: string) =>
    new APIError(
      `Invalid URL: ${url}`,
      400,
      'INVALID_URL',
      'Please provide a valid URL starting with http:// or https://. Example: https://example.com',
      'https://github.com/fayeed/ai-lighthouse#api-documentation'
    ),

  URL_UNREACHABLE: (url: string, reason?: string) =>
    new APIError(
      `Unable to reach ${url}${reason ? `: ${reason}` : ''}`,
      400,
      'URL_UNREACHABLE',
      'Ensure the URL is accessible from the internet. Check that the website is online and not blocking our crawler (User-Agent: AI-Lighthouse)',
      'https://github.com/fayeed/ai-lighthouse#troubleshooting'
    ),

  SSRF_BLOCKED: (url: string) =>
    new APIError(
      `Access to ${url} is blocked for security reasons`,
      403,
      'SSRF_BLOCKED',
      'Internal IPs, localhost, and cloud metadata endpoints are blocked. Please use a publicly accessible URL.',
      'https://github.com/fayeed/ai-lighthouse#security'
    ),

  RATE_LIMIT_EXCEEDED: (retryAfter: number, type: 'general' | 'llm' = 'general') =>
    new APIError(
      type === 'llm'
        ? 'LLM rate limit exceeded. You have exceeded the hourly limit for AI-powered analysis.'
        : 'Rate limit exceeded. Too many requests from your IP address.',
      429,
      type === 'llm' ? 'LLM_RATE_LIMIT' : 'RATE_LIMIT',
      `Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again${
        type === 'llm' ? ', or disable LLM features to continue with basic analysis' : ''
      }`,
      'https://github.com/fayeed/ai-lighthouse#rate-limits'
    ),

  LLM_API_KEY_REQUIRED: (provider: string) =>
    new APIError(
      `API key required for ${provider}`,
      400,
      'LLM_API_KEY_REQUIRED',
      `Provide an API key for ${provider}. OpenRouter and Ollama don't require API keys. Get API keys from: OpenAI (https://platform.openai.com), Anthropic (https://console.anthropic.com), or Google AI (https://aistudio.google.com)`,
      'https://github.com/fayeed/ai-lighthouse#llm-providers'
    ),

  LLM_API_KEY_INVALID: (provider: string) =>
    new APIError(
      `Invalid API key for ${provider}`,
      401,
      'LLM_API_KEY_INVALID',
      'Check that your API key is correct and has the necessary permissions. API keys usually start with specific prefixes: OpenAI (sk-), Anthropic (sk-ant-), Gemini (AI...)',
      'https://github.com/fayeed/ai-lighthouse#llm-providers'
    ),

  LLM_MODEL_NOT_FOUND: (model: string, provider: string) =>
    new APIError(
      `Model '${model}' not found for provider '${provider}'`,
      404,
      'LLM_MODEL_NOT_FOUND',
      `Check the model name spelling. Available models vary by provider. For OpenRouter, use models from https://openrouter.ai/models. For OpenAI: gpt-4o, gpt-4o-mini. For Anthropic: claude-3-5-sonnet-20241022. For Gemini: gemini-2.0-flash-exp`,
      'https://github.com/fayeed/ai-lighthouse#supported-models'
    ),

  LLM_QUOTA_EXCEEDED: (provider: string) =>
    new APIError(
      `API quota exceeded for ${provider}`,
      429,
      'LLM_QUOTA_EXCEEDED',
      'You have exceeded your API quota. Check your account limits and billing status, or try a different provider like OpenRouter (offers free models)',
      'https://github.com/fayeed/ai-lighthouse#llm-providers'
    ),

  TIMEOUT: (duration: number) =>
    new APIError(
      `Request timeout after ${Math.round(duration / 1000)} seconds`,
      408,
      'TIMEOUT',
      'The website took too long to respond. This may happen with large websites or slow servers. Try again or disable LLM features for faster analysis.',
      'https://github.com/fayeed/ai-lighthouse#troubleshooting'
    ),

  CONTENT_TOO_LARGE: (size: number, limit: number) =>
    new APIError(
      `Content size (${Math.round(size / 1024)}KB) exceeds limit (${Math.round(limit / 1024)}KB)`,
      413,
      'CONTENT_TOO_LARGE',
      'The webpage is too large to analyze. Try analyzing a specific page instead of the entire website, or reduce the crawl depth.',
      'https://github.com/fayeed/ai-lighthouse#limits'
    ),

  INVALID_RESPONSE: (url: string, contentType?: string) =>
    new APIError(
      `Invalid response from ${url}${contentType ? `. Content-Type: ${contentType}` : ''}`,
      400,
      'INVALID_RESPONSE',
      'The URL must return HTML content. We received a different content type (PDF, image, etc.). Please provide a URL to a web page.',
      'https://github.com/fayeed/ai-lighthouse#supported-content'
    ),

  SCAN_FAILED: (reason: string) =>
    new APIError(
      `Scan failed: ${reason}`,
      500,
      'SCAN_FAILED',
      'An error occurred during scanning. This might be temporary. Try again in a few moments. If the issue persists, check the website accessibility.',
      'https://github.com/fayeed/ai-lighthouse#troubleshooting'
    ),

  JOB_NOT_FOUND: (jobId: string) =>
    new APIError(
      `Audit job ${jobId} not found or expired`,
      404,
      'JOB_NOT_FOUND',
      'Audit jobs expire after 1 hour. Start a new audit or use synchronous mode (async: false) for immediate results.',
      'https://github.com/fayeed/ai-lighthouse#async-audits'
    ),

  REDIS_UNAVAILABLE: () =>
    new APIError(
      'Service temporarily unavailable',
      503,
      'REDIS_UNAVAILABLE',
      'Our caching service is currently unavailable. This is likely temporary. Please try again in a few moments.',
      'https://github.com/fayeed/ai-lighthouse#status'
    ),

  VALIDATION_FAILED: (details: string) =>
    new APIError(
      `Validation failed: ${details}`,
      400,
      'VALIDATION_FAILED',
      'Check your request parameters. Common issues: missing required fields, invalid data types, or values out of range.',
      'https://github.com/fayeed/ai-lighthouse#api-reference'
    ),

  ABUSE_DETECTED: (retryAfter: number) =>
    new APIError(
      'Unusual activity detected from your IP address',
      429,
      'ABUSE_DETECTED',
      `Your access has been temporarily restricted. Please wait ${Math.ceil(retryAfter / 60)} minutes. If you need higher limits, contact us about API access.`,
      'https://github.com/fayeed/ai-lighthouse#contact'
    ),
};

/**
 * Estimate scan duration based on options
 */
export function estimateScanDuration(options: {
  enableLLM?: boolean;
  enableChunking?: boolean;
  enableExtractability?: boolean;
  enableHallucinationDetection?: boolean;
  depth?: number;
  pages?: number;
}): {
  min: number; // seconds
  max: number; // seconds
  estimate: number; // seconds
  description: string;
} {
  let baseTime = 5; // Base scan time in seconds
  let maxTime = 15;

  // LLM analysis adds significant time
  // Note: OpenRouter free tier can be much slower (shared infrastructure)
  if (options.enableLLM) {
    baseTime += 20; // Increased for typical LLM delays
    maxTime += 60;  // Free tier can take much longer
  }

  // Chunking analysis
  if (options.enableChunking) {
    baseTime += 2;
    maxTime += 5;
  }

  // Extractability mapping
  if (options.enableExtractability) {
    baseTime += 3;
    maxTime += 8;
  }

  // Hallucination detection (requires LLM)
  if (options.enableHallucinationDetection) {
    baseTime += 8;
    maxTime += 20;
  }

  // Multi-page scanning
  const pageCount = options.pages || (options.depth ? Math.min(options.depth * 5, 20) : 1);
  if (pageCount > 1) {
    baseTime *= Math.min(pageCount, 10);
    maxTime *= Math.min(pageCount, 10);
  }

  const estimate = Math.round((baseTime + maxTime) / 2);

  let description = '';
  if (estimate < 15) {
    description = 'Quick scan';
  } else if (estimate < 30) {
    description = 'Standard scan';
  } else if (estimate < 60) {
    description = 'Comprehensive analysis';
  } else {
    description = 'Deep analysis (may take several minutes)';
  }

  return {
    min: baseTime,
    max: maxTime,
    estimate,
    description,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
