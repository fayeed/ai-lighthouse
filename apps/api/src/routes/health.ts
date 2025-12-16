import { Request, Response } from 'express';
import { redisClient } from '../index.js';
import { logger } from '../utils/logger.js';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: {
        heapUsed: string;
        heapTotal: string;
        external: string;
        rss: string;
      };
      percentage: number;
    };
    api: {
      status: 'up';
      version: string;
    };
  };
  environment: string;
}

/**
 * Comprehensive health check endpoint
 * Returns detailed status of all system dependencies
 */
export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      redis: {
        status: 'down'
      },
      memory: {
        status: 'ok',
        usage: {
          heapUsed: '0 MB',
          heapTotal: '0 MB',
          external: '0 MB',
          rss: '0 MB'
        },
        percentage: 0
      },
      api: {
        status: 'up',
        version: process.env.npm_package_version || '1.0.0'
      }
    },
    environment: process.env.NODE_ENV || 'development'
  };

  // Check Redis connection
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    const redisResponseTime = Date.now() - redisStart;
    
    result.checks.redis = {
      status: 'up',
      responseTime: redisResponseTime
    };
  } catch (error: any) {
    result.checks.redis = {
      status: 'down',
      error: error.message
    };
    result.status = 'degraded';
    logger.error('Health check: Redis connection failed', { error: error.message });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const memoryPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  
  result.checks.memory = {
    status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 75 ? 'warning' : 'ok',
    usage: {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      external: `${externalMB} MB`,
      rss: `${rssMB} MB`
    },
    percentage: memoryPercentage
  };

  if (result.checks.memory.status === 'critical') {
    result.status = 'unhealthy';
    logger.warn('Health check: Memory usage critical', { percentage: memoryPercentage });
  } else if (result.checks.memory.status === 'warning' && result.status === 'healthy') {
    result.status = 'degraded';
    logger.warn('Health check: Memory usage high', { percentage: memoryPercentage });
  }

  // Determine HTTP status code based on health
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
  
  const responseTime = Date.now() - startTime;
  
  // Log health check if not healthy or if it's taking too long
  if (result.status !== 'healthy' || responseTime > 1000) {
    logger.info('Health check completed', {
      status: result.status,
      responseTime: `${responseTime}ms`,
      redisStatus: result.checks.redis.status,
      memoryStatus: result.checks.memory.status
    });
  }

  res.status(statusCode).json(result);
};

/**
 * Simple liveness probe
 * Returns 200 if server is running
 */
export const livenessProbe = (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

/**
 * Readiness probe
 * Returns 200 only if all critical dependencies are available
 */
export const readinessProbe = async (req: Request, res: Response) => {
  try {
    // Check critical dependency: Redis
    await redisClient.ping();
    
    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    logger.error('Readiness probe failed', { error: error.message });
    res.status(503).json({ 
      status: 'not ready', 
      error: 'Redis unavailable',
      timestamp: new Date().toISOString() 
    });
  }
};
