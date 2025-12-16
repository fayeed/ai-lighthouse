import express from 'express';
import rateLimit from 'express-rate-limit';
import { redisClient } from '../index.js';
import { analyzeUrlWithRules, calculateAIReadiness, exportAuditReport } from '../../../../packages/scanner/src/exports.js';
import { auditRequestSchema, validateRequest } from '../validation/schemas.js';
import { logger, logAuditStart, logAuditComplete, logAuditError, logRateLimitHit } from '../utils/logger.js';

export const auditRouter = express.Router();

// Helper functions for Redis-based job storage
async function setAuditJob(jobId: string, jobData: any) {
  try {
    await redisClient.set(`audit:job:${jobId}`, JSON.stringify(jobData), {
      EX: 3600 // Expire after 1 hour
    });
  } catch (error) {
    console.error('Redis error storing job:', error);
  }
}

async function getAuditJob(jobId: string) {
  try {
    const data = await redisClient.get(`audit:job:${jobId}`);
    return data ? JSON.parse(data.toString()) : null;
  } catch (error) {
    console.error('Redis error retrieving job:', error);
    return null;
  }
}

// LLM-specific rate limiter middleware using Redis
const llmRateLimiter = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { enableLLM, llmProvider } = req.body;
  
  // Only apply rate limiting for OpenRouter
  if (!enableLLM || llmProvider !== 'openrouter') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:llm:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; 
  const maxLLMRequests = 5; // 5 LLM requests per hour

  try {
    const data = await redisClient.get(key);
    let tracker = data ? JSON.parse(data.toString()) : null;
    
    if (!tracker || now > tracker.resetTime) {
      tracker = { count: 0, resetTime: now + windowMs };
    }

    if (tracker.count >= maxLLMRequests) {
      const remainingTime = Math.ceil((tracker.resetTime - now) / 1000 / 60); // minutes
      
      logRateLimitHit(ip, 'llm');
      
      // Set warning on request object instead of blocking
      (req as any).llmRateLimitWarning = {
        type: 'llm_rate_limit',
        message: `Internal LLM rate limit reached (${maxLLMRequests} requests per hour). Please try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
        details: `Rate limit: ${maxLLMRequests} requests per hour per IP`
      };
      
      // Disable LLM in the request body
      req.body.enableLLM = false;
    } else {
      tracker.count++;
      
      await redisClient.set(key, JSON.stringify(tracker), {
        PX: windowMs // Expire after window duration
      });
    }
    
    next();
  } catch (error) {
    logger.error('Redis error in LLM rate limiter', { error });
    next();
  }
};

// POST /api/audit - Start a new audit
auditRouter.post('/', validateRequest(auditRequestSchema), llmRateLimiter, async (req, res) => {
  const startTime = Date.now();
  const ip = req.ip || 'unknown';
  
  try {
    // Use validated data from middleware
    const validatedData = (req as any).validatedData;
    const { 
      url, 
      enableLLM = false,
      llmProvider = 'openrouter',
      llmModel = 'meta-llama/llama-3.3-70b-instruct:free',
      llmApiKey,
      llmBaseUrl,
      minImpactScore = 5,
      maxChunkTokens = 1200,
      async = false
    } = validatedData;

    // Log audit start
    logAuditStart(url, enableLLM, ip);

    // Configure scan options
    const scanOptions: any = {
      maxChunkTokens,
      enableChunking: true,
      enableExtractability: true,
      enableHallucinationDetection: enableLLM,
      enableLLM,
      minImpactScore,
      minConfidence: 0.7,
    };

    if (enableLLM) {
      scanOptions.llmConfig = {
        provider: llmProvider,
        model: llmModel,
      };

      // Add API key configuration
      if (llmProvider === 'ollama') {
        // Ollama runs locally, no API key needed
        scanOptions.llmConfig.baseUrl = llmBaseUrl || 'http://localhost:11434';
      } else if (llmApiKey) {
        scanOptions.llmConfig.apiKey = llmApiKey;
      } else if (llmProvider === 'openrouter') {
        // Use environment variable for OpenRouter if no key provided
        const defaultKey = process.env.OPENROUTER_API_KEY;
        if (defaultKey) {
          scanOptions.llmConfig.apiKey = defaultKey;
        } else {
          return res.status(400).json({ 
            error: 'API key is required for OpenRouter. Please provide an API key or set OPENROUTER_API_KEY environment variable.' 
          });
        }
      } else {
        // For other cloud providers (OpenAI, Anthropic, Gemini)
        return res.status(400).json({ 
          error: `API key is required for ${llmProvider}` 
        });
      }
    }

    // If async mode, start job and return job ID
    if (async) {
      const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await setAuditJob(jobId, { status: 'running', progress: 0 });

      // Start audit in background
      runAudit(jobId, url, scanOptions).catch(async err => {
        console.error(`Job ${jobId} failed:`, err);
        await setAuditJob(jobId, { 
          status: 'failed', 
          error: err.message 
        });
      });

      return res.json({ 
        jobId, 
        status: 'started',
        checkUrl: `/api/audit/${jobId}`
      });
    }

    // Synchronous mode - wait for completion
    logger.info('Starting synchronous audit', { url, enableLLM });
    
    // Check if rate limiter set a warning
    let llmWarning = (req as any).llmRateLimitWarning || null;
    
    const result = await analyzeUrlWithRules(url, scanOptions);
    
    // Check if LLM limit was exceeded during the scan
    if (result.llmLimitExceeded && !llmWarning) {
      llmWarning = {
        type: 'llm_rate_limit',
        message: 'LLM provider rate limit exceeded. AI-enhanced features were disabled for this scan.',
        details: 'Rate limit exceeded during scan execution'
      };
    }
    
    logger.info('Calculating AI readiness', { url });
    const aiReadiness = calculateAIReadiness(result);
    
    logger.info('Generating audit report', { url });
    const auditReportJson = exportAuditReport(result);
    const auditReport = JSON.parse(auditReportJson);

    const duration = Date.now() - startTime;
    logAuditComplete(url, duration, true, ip);
    
    // Return comprehensive data
    return res.json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
      warning: llmWarning,
      data: {
        auditReport,
        aiReadiness,
        scanResult: {
          llm: result.llm,
          chunking: result.chunking,
          extractability: result.extractability,
          hallucinationReport: result.hallucinationReport,
          mirrorReport: result.mirrorReport,
          scoring: result.scoring,
        }
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const validatedData = (req as any).validatedData;
    logAuditError(validatedData?.url || 'unknown', error, ip);
    
    return res.status(500).json({
      error: 'Audit failed',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// GET /api/audit/:jobId - Check job status
auditRouter.get('/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = await getAuditJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Helper function to run audit asynchronously
async function runAudit(jobId: string, url: string, scanOptions: any) {
  try {
    await setAuditJob(jobId, { status: 'running', progress: 10 });
    
    let llmWarning = null;
    
    const result = await analyzeUrlWithRules(url, scanOptions);
    
    // Check if LLM limit was exceeded during the scan
    if (result.llmLimitExceeded) {
      llmWarning = {
        type: 'llm_rate_limit',
        message: 'LLM provider rate limit exceeded. AI-enhanced features were disabled for this scan.',
        details: 'Rate limit exceeded during scan execution'
      };
    }
    
    await setAuditJob(jobId, { status: 'running', progress: 60 });
    
    const aiReadiness = calculateAIReadiness(result);
    await setAuditJob(jobId, { status: 'running', progress: 80 });
    
    const auditReportJson = exportAuditReport(result);
    const auditReport = JSON.parse(auditReportJson);
    
    await setAuditJob(jobId, { 
      status: 'completed', 
      progress: 100,
      url,
      timestamp: new Date().toISOString(),
      warning: llmWarning,
      data: {
        auditReport,
        aiReadiness,
        scanResult: {
          llm: result.llm,
          chunking: result.chunking,
          extractability: result.extractability,
          hallucinationReport: result.hallucinationReport,
          mirrorReport: result.mirrorReport,
          scoring: result.scoring,
        }
      }
    });
  } catch (error: any) {
    await setAuditJob(jobId, { 
      status: 'failed', 
      error: error.message,
      stack: error.stack
    });
  }
}
