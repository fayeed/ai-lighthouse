import { z } from 'zod';

// URL validation helper
const urlSchema = z.string()
  .min(1, 'URL is required')
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine((url) => {
    // Block localhost and private IPs for security
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }
    
    // Block private IP ranges
    if (hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
      return false;
    }
    
    return true;
  }, 'Cannot audit localhost or private IP addresses');

// LLM Provider validation
const llmProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'openrouter', 'ollama'], {
  message: 'Invalid LLM provider. Must be one of: openai, anthropic, gemini, openrouter, ollama'
});

// Audit request schema
export const auditRequestSchema = z.object({
  url: urlSchema,
  enableLLM: z.boolean().optional().default(false),
  minImpactScore: z.number()
    .int('Impact score must be an integer')
    .min(0, 'Impact score must be at least 0')
    .max(100, 'Impact score cannot exceed 100')
    .optional()
    .default(5),
  llmProvider: llmProviderSchema.optional(),
  llmModel: z.string()
    .min(1, 'LLM model name is required when provider is specified')
    .max(200, 'LLM model name too long')
    .optional(),
  llmApiKey: z.string()
    .min(1, 'API key is required for this provider')
    .max(500, 'API key too long')
    .optional(),
  llmBaseUrl: z.string()
    .url('Invalid base URL format')
    .optional(),
  maxChunkTokens: z.number()
    .int('Max chunk tokens must be an integer')
    .min(100, 'Max chunk tokens must be at least 100')
    .max(4000, 'Max chunk tokens cannot exceed 4000')
    .optional()
}).refine((data) => {
  // If LLM is enabled, require provider and model
  if (data.enableLLM) {
    if (!data.llmProvider) {
      return false;
    }
    if (!data.llmModel) {
      return false;
    }
    // For non-OpenRouter providers (except Ollama), require API key
    if (data.llmProvider !== 'openrouter' && data.llmProvider !== 'ollama' && !data.llmApiKey) {
      return false;
    }
  }
  return true;
}, {
  message: 'When LLM is enabled, provider and model are required. API key required for non-OpenRouter providers (except Ollama).',
  path: ['enableLLM']
});

// Type inference
export type AuditRequest = z.infer<typeof auditRequestSchema>;

// Validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: any, res: any, next: any) => {
    try {
      req.validatedData = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
