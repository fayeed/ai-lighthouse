import winston from 'winston';
import { Request } from 'express';

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-lighthouse-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
  ],
});

// Logger middleware for Express
export const requestLogger = (req: Request, res: any, next: any) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.method === 'POST' ? sanitizeBody(req.body) : undefined,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

// Sanitize sensitive data from logs
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['apiKey', 'llmApiKey', 'password', 'token', 'secret'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

// Helper functions for structured logging
export const logAuditStart = (url: string, enableLLM: boolean, ip: string) => {
  logger.info('Audit started', {
    url,
    enableLLM,
    ip,
    type: 'audit_start'
  });
};

export const logAuditComplete = (url: string, duration: number, success: boolean, ip: string) => {
  logger.info('Audit completed', {
    url,
    duration: `${duration}ms`,
    success,
    ip,
    type: 'audit_complete'
  });
};

export const logAuditError = (url: string, error: Error, ip: string) => {
  logger.error('Audit failed', {
    url,
    error: error.message,
    stack: error.stack,
    ip,
    type: 'audit_error'
  });
};

export const logRateLimitHit = (ip: string, type: 'general' | 'llm') => {
  logger.warn('Rate limit hit', {
    ip,
    limitType: type,
    type: 'rate_limit'
  });
};

export const logSuspiciousActivity = (ip: string, reason: string, details?: any) => {
  logger.warn('Suspicious activity detected', {
    ip,
    reason,
    details,
    type: 'security'
  });
};
