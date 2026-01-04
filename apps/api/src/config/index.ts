/**
 * API Configuration
 * Environment variables with sensible defaults
 */

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Cache - can be disabled via CACHE_ENABLED=false
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false', // enabled by default
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
    auditTtl: parseInt(process.env.CACHE_AUDIT_TTL || '1800', 10), // 30 minutes
  },
  
  // Rate Limiting
  rateLimit: {
    // General rate limit
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10),
    
    // LLM-specific rate limit (for OpenRouter)
    llmWindowMs: parseInt(process.env.LLM_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour default
    llmMaxRequests: parseInt(process.env.LLM_RATE_LIMIT_MAX_REQUESTS || '5', 10),
  },
  
  // Timeouts
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '180000', 10), // 3 minutes
};

export default config;
