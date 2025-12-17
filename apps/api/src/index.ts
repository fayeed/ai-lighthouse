import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import { auditRouter } from './routes/audit.js';
import { gdprRouter } from './routes/gdpr.js';
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

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required when behind reverse proxy (Render, Heroku, etc.)
// This allows express-rate-limit to correctly identify users by IP
app.set('trust proxy', 1);

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
redisClient.on('connect', () => logger.info('Connected to Redis'));

await redisClient.connect();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
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
      message: 'Too many requests. Please try again in 15 minutes.',
      retryAfter: 900 // 15 minutes 
    });
  }
});

export { redisClient };

// Middleware - ORDER MATTERS!
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  maxAge: 86400 // 24 hours
}));

// Security middleware (before body parsing)
app.use(requestSizeLimit);
app.use(validateContentType);

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));

// Timeout handling (after body parsing)
app.use(requestTimeout(180000)); // 3 minutes timeout (LLM requests can be slow)

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

// API Routes (with rate limiting)
app.use('/api/audit', limiter, auditRouter);
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
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      audit: `http://localhost:${PORT}/api/audit`
    }
  });
});
