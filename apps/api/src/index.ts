import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import { auditRouter } from './routes/audit.js';
import { gdprRouter } from './routes/gdpr.js';
import { authRouter } from './routes/auth/index.js';
import { usersRouter } from './routes/users/index.js';
import { billingRouter } from './routes/billing/index.js';
import { healthCheck, livenessProbe, readinessProbe } from './routes/health.js';
import { logger, requestLogger } from './utils/logger.js';
import {
  requestTimeout,
  abuseDetection,
  requestFingerprint,
  validateUrlSecurity,
  validateContentType,
  requestSizeLimit
} from './middleware/security.js';
import {
  subscriptionMiddleware,
  tierBasedRateLimiter,
} from './middleware/subscription.js';
import config from './config/index.js';

const app = express();
const PORT = config.port;

// Trust proxy - required when behind reverse proxy (Render, Heroku, etc.)
// This allows express-rate-limit to correctly identify users by IP
app.set('trust proxy', 1);

// Redis client setup
const redisClient = createClient({
  url: config.redisUrl
});

redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
redisClient.on('connect', () => logger.info('Connected to Redis'));

await redisClient.connect();

// General rate limiter (conditionally enabled based on config)
const limiter = config.rateLimit.enabled
  ? rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: 'rl:general:'
      }),
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${Math.ceil(config.rateLimit.windowMs / 60000)} minutes.`,
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
        });
      }
    })
  : (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();

if (!config.rateLimit.enabled) {
  logger.info('Rate limiting disabled (development mode)');
}

export { redisClient };

// Middleware - ORDER MATTERS!
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Cookie parser for session management
app.use(cookieParser());

// Security middleware (before body parsing)
app.use(requestSizeLimit);
app.use(validateContentType);

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));

// Timeout handling (after body parsing)
app.use(requestTimeout(config.requestTimeout)); // 3 minutes timeout (LLM requests can be slow)

// Request logging
app.use(requestLogger);

// Security and abuse detection
app.use(requestFingerprint);
app.use(validateUrlSecurity);
app.use(abuseDetection);

// Health check endpoints (no rate limiting)
app.get('/health', healthCheck);
app.get('/health/live', livenessProbe);
app.get('/health/ready', readinessProbe);

// Authentication routes (no rate limiting for auth)
app.use('/api/auth', authRouter);

// User management routes (with subscription context)
app.use('/api/users', subscriptionMiddleware, usersRouter);

// Billing routes (Dodo Payments webhooks need raw body)
app.use('/api/billing', billingRouter);

// API Routes (with subscription-aware rate limiting)
// subscriptionMiddleware adds user context to requests
// tierBasedRateLimiter applies appropriate rate limits based on user tier
app.use('/api/audit', subscriptionMiddleware, tierBasedRateLimiter, auditRouter);
app.use('/api/gdpr', gdprRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await redisClient.quit();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info('AI Lighthouse API started', {
    port: PORT,
    environment: config.nodeEnv,
    cacheEnabled: config.cache.enabled,
    rateLimitMax: config.rateLimit.maxRequests,
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      audit: `http://localhost:${PORT}/api/audit`
    }
  });
});
