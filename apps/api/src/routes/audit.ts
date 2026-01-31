import express from 'express';
import { redisClient } from '../index.js';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import {
  analyzeUrlWithRules,
  calculateAIReadiness,
  exportAuditReport,
  crawlSite,
  type CrawlProgress,
  type PageCrawlResult,
  type CrawlResult,
} from '../../../../packages/scanner/src/exports.js';
import { auditRequestSchema, crawlRequestSchema, validateRequest } from '../validation/schemas.js';
import { logger, logAuditStart, logAuditComplete, logAuditError, logRateLimitHit } from '../utils/logger.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { ErrorTypes, estimateScanDuration, formatDuration } from '../utils/errors.js';
import {
  canScanMiddleware,
  enforceLLMAccess,
  enforceFullCrawlAccess,
  incrementUsage,
  TIER_LIMITS
} from '../middleware/subscription.js';

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

// Increment scan counter
async function incrementScanCounter() {
  try {
    const now = new Date();
    const weekKey = `stats:scans:week:${now.getFullYear()}-W${getWeekNumber(now)}`;
    const totalKey = 'stats:scans:total';
    
    await redisClient.incr(weekKey);
    await redisClient.expire(weekKey, 60 * 60 * 24 * 14); // Keep for 2 weeks
    await redisClient.incr(totalKey);
  } catch (error) {
    console.error('Redis error incrementing counter:', error);
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Save scan to database
async function saveScanToDatabase(
  userId: string | null,
  url: string,
  aiReadiness: any,
  auditReport: any,
  scanResult: any,
  duration: number,
  enableLLM: boolean
) {
  try {
    // Only save for authenticated users
    if (!userId) return null;

    const domain = extractDomain(url);

    const scan = await prisma.scan.create({
      data: {
        userId,
        url,
        domain,
        scanType: 'SINGLE_PAGE',
        status: 'COMPLETED',
        enableLLM,
        enableChunking: true,
        maxPages: 1,
        overallScore: aiReadiness?.overall || null,
        grade: aiReadiness?.grade || null,
        pagesScanned: 1,
        issuesFound: auditReport?.issues?.length || 0,
        startedAt: new Date(Date.now() - duration),
        completedAt: new Date(),
        duration,
      },
    });

    // Create page result
    await prisma.pageResult.create({
      data: {
        scanId: scan.id,
        url,
        title: auditReport?.pageTitle || null,
        overallScore: aiReadiness?.overall || null,
        contentQuality: aiReadiness?.dimensions?.contentQuality?.score || null,
        discoverability: aiReadiness?.dimensions?.discoverability?.score || null,
        extractability: aiReadiness?.dimensions?.extractability?.score || null,
        comprehensibility: aiReadiness?.dimensions?.comprehensibility?.score || null,
        trustworthiness: aiReadiness?.dimensions?.trustworthiness?.score || null,
        criticalIssues: auditReport?.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        highIssues: auditReport?.issues?.filter((i: any) => i.severity === 'high').length || 0,
        mediumIssues: auditReport?.issues?.filter((i: any) => i.severity === 'medium').length || 0,
        lowIssues: auditReport?.issues?.filter((i: any) => i.severity === 'low').length || 0,
        issuesJson: auditReport?.issues || [],
        llmAnalysisJson: scanResult?.llm || null,
        extractabilityJson: scanResult?.extractability || null,
      },
    });

    // Create report
    await prisma.report.create({
      data: {
        scanId: scan.id,
        format: 'json',
        reportJson: {
          auditReport,
          aiReadiness,
          scanResult,
        },
        summaryJson: {
          score: aiReadiness?.overall,
          grade: aiReadiness?.grade,
          issueCount: auditReport?.issues?.length || 0,
          dimensions: aiReadiness?.dimensions,
        },
        quickWinsJson: aiReadiness?.quickWins || [],
        roadmapJson: aiReadiness?.roadmap || null,
      },
    });

    return scan.id;
  } catch (error) {
    logger.error('Error saving scan to database', { error, userId, url });
    return null;
  }
}

// LLM-specific rate limiter middleware using Redis
const llmRateLimiter = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip rate limiting in development
  if (!config.rateLimit.enabled) {
    return next();
  }

  const { enableLLM, llmProvider } = req.body;

  // Only apply rate limiting for OpenRouter
  if (!enableLLM || llmProvider !== 'openrouter') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rl:llm:${ip}`;
  const now = Date.now();
  const windowMs = config.rateLimit.llmWindowMs;
  const maxLLMRequests = config.rateLimit.llmMaxRequests;

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

// POST /api/audit/stream - Stream audit progress via SSE
auditRouter.post('/stream', canScanMiddleware, enforceLLMAccess, validateRequest(auditRequestSchema), llmRateLimiter, async (req, res) => {
  const startTime = Date.now();
  const ip = req.ip || 'unknown';
  const userContext = (req as any).userContext;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const sendProgress = (step: string, progress: number, message?: string) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', step, progress, message })}\n\n`);
  };

  const sendResult = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    res.end();
  };

  const sendError = (error: string, details?: any) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error, ...details })}\n\n`);
    res.end();
  };

  try {
    const validatedData = (req as any).validatedData;
    let {
      url,
      enableLLM = false,
      llmProvider = 'openrouter',
      llmModel = 'meta-llama/llama-3.3-70b-instruct:free',
      llmApiKey,
      llmBaseUrl,
      minImpactScore = 5,
      maxChunkTokens = 1200,
    } = validatedData;

    // Check if LLM was downgraded due to subscription
    const llmDowngradeWarning = (req as any).llmDowngradeWarning;
    if (llmDowngradeWarning) {
      enableLLM = false;
    }

    logAuditStart(url, enableLLM, ip);
    sendProgress('starting', 0, 'Starting analysis...');

    // Configure scan options with progress callback
    const scanOptions: any = {
      maxChunkTokens,
      enableChunking: true,
      enableExtractability: true,
      enableHallucinationDetection: enableLLM,
      enableLLM,
      minImpactScore,
      minConfidence: 0.7,
      onProgress: (step: string, progress: number) => {
        const messages: Record<string, string> = {
          fetch: 'Fetching website...',
          parse: 'Parsing HTML structure...',
          rules: 'Running audit rules...',
          extract: 'Analyzing extractability...',
          links: 'Checking for broken links...',
          llm: 'AI analyzing content...',
          processing: 'Processing results...',
          scoring: 'Calculating score...',
        };
        sendProgress(step, progress, messages[step] || step);
      }
    };

    if (enableLLM) {
      scanOptions.llmConfig = {
        provider: llmProvider,
        model: llmModel,
      };

      if (llmProvider === 'ollama') {
        scanOptions.llmConfig.baseUrl = llmBaseUrl || 'http://localhost:11434';
      } else if (llmApiKey) {
        scanOptions.llmConfig.apiKey = llmApiKey;
      } else if (llmProvider === 'openrouter') {
        const defaultKey = process.env.OPENROUTER_API_KEY;
        if (defaultKey) {
          scanOptions.llmConfig.apiKey = defaultKey;
        } else {
          sendError('OpenRouter API key not configured');
          return;
        }
      } else {
        sendError(`API key required for ${llmProvider}`);
        return;
      }
    }

    let llmWarning = (req as any).llmRateLimitWarning || llmDowngradeWarning || null;

    const result = await analyzeUrlWithRules(url, scanOptions);

    if (result.llmLimitExceeded && !llmWarning) {
      llmWarning = {
        type: 'llm_rate_limit',
        message: 'LLM provider rate limit exceeded. AI-enhanced features were disabled for this scan.',
        details: 'Rate limit exceeded during scan execution'
      };
    }

    sendProgress('finalizing', 98, 'Generating report...');

    const aiReadiness = calculateAIReadiness(result);
    const auditReportJson = exportAuditReport(result);
    const auditReport = JSON.parse(auditReportJson);

    const duration = Date.now() - startTime;
    logAuditComplete(url, duration, true, ip);
    incrementScanCounter(); // Track successful scan

    // Increment user usage
    await incrementUsage(userContext?.userId, ip, 1, enableLLM);

    // Save to database for authenticated users
    const scanId = await saveScanToDatabase(
      userContext?.userId,
      url,
      aiReadiness,
      auditReport,
      {
        llm: result.llm,
        chunking: result.chunking,
        extractability: result.extractability,
        hallucinationReport: result.hallucinationReport,
        mirrorReport: result.mirrorReport,
        scoring: result.scoring,
        seo: result.seo,
        pseo: result.pseo,
        aeo: result.aeo,
        geo: result.geo,
      },
      duration,
      enableLLM
    );

    sendResult({
      success: true,
      url,
      scanId,
      timestamp: new Date().toISOString(),
      warning: llmWarning,
      userContext: userContext ? {
        plan: userContext.plan,
        scansRemaining: userContext.usage.scansRemaining - 1,
      } : null,
      scanDuration: {
        actual: Math.round(duration / 1000),
        message: `Scan completed in ${formatDuration(Math.round(duration / 1000))}`
      },
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
          // Optimization analysis
          seo: result.seo,
          pseo: result.pseo,
          aeo: result.aeo,
          geo: result.geo,
        }
      }
    });

  } catch (error: any) {
    const validatedData = (req as any).validatedData;
    logAuditError(validatedData?.url || 'unknown', error, ip);
    sendError(error.message || 'Audit failed');
  }
});

// POST /api/audit - Start a new audit
auditRouter.post('/', canScanMiddleware, enforceLLMAccess, cacheMiddleware(1800), validateRequest(auditRequestSchema), llmRateLimiter, async (req, res) => {
  const startTime = Date.now();
  const ip = req.ip || 'unknown';
  const userContext = (req as any).userContext;

  try {
    // Use validated data from middleware
    const validatedData = (req as any).validatedData;
    let {
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

    // Estimate scan duration
    const timeEstimate = estimateScanDuration({
      enableLLM,
      enableChunking: true,
      enableExtractability: true,
      enableHallucinationDetection: enableLLM,
    });

    logger.info('Scan time estimate', {
      url,
      estimate: timeEstimate,
      enableLLM,
    });

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

      logger.info('Configuring LLM', { provider: llmProvider, model: llmModel });

      // Add API key configuration
      if (llmProvider === 'ollama') {
        // Ollama runs locally, no API key needed
        scanOptions.llmConfig.baseUrl = llmBaseUrl || 'http://localhost:11434';
        logger.info('Using Ollama', { baseUrl: scanOptions.llmConfig.baseUrl });
      } else if (llmApiKey) {
        scanOptions.llmConfig.apiKey = llmApiKey;
        logger.info('Using provided API key', { provider: llmProvider, keyLength: llmApiKey.length });
      } else if (llmProvider === 'openrouter') {
        // Use environment variable for OpenRouter if no key provided
        const defaultKey = process.env.OPENROUTER_API_KEY;
        if (defaultKey) {
          scanOptions.llmConfig.apiKey = defaultKey;
          logger.info('Using OpenRouter with environment API key', { keyLength: defaultKey.length });
        } else {
          logger.error('OpenRouter API key missing');
          const error = ErrorTypes.LLM_API_KEY_REQUIRED('OpenRouter');
          return res.status(error.statusCode).json(error.toJSON());
        }
      } else {
        // For other cloud providers (OpenAI, Anthropic, Gemini)
        logger.error('API key required for provider', { provider: llmProvider });
        const error = ErrorTypes.LLM_API_KEY_REQUIRED(llmProvider);
        return res.status(error.statusCode).json(error.toJSON());
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
        checkUrl: `/api/audit/${jobId}`,
        estimatedTime: {
          min: timeEstimate.min,
          max: timeEstimate.max,
          estimate: timeEstimate.estimate,
          description: timeEstimate.description,
          message: `Estimated completion: ${formatDuration(timeEstimate.estimate)}`
        }
      });
    }

    // Check if LLM was downgraded due to subscription
    const llmDowngradeWarning = (req as any).llmDowngradeWarning;
    if (llmDowngradeWarning) {
      enableLLM = false;
      scanOptions.enableLLM = false;
      scanOptions.enableHallucinationDetection = false;
    }

    // Synchronous mode - wait for completion
    logger.info('Starting synchronous audit', { url, enableLLM, provider: llmProvider, model: llmModel });

    // Check if rate limiter set a warning
    let llmWarning = (req as any).llmRateLimitWarning || llmDowngradeWarning || null;

    const scanStartTime = Date.now();
    logger.info('Beginning URL analysis', { url, options: scanOptions });

    const result = await analyzeUrlWithRules(url, scanOptions);

    const scanDuration = Date.now() - scanStartTime;
    logger.info('URL analysis completed', { url, duration: `${scanDuration}ms` });

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
    incrementScanCounter(); // Track successful scan

    // Increment user usage
    await incrementUsage(userContext?.userId, ip, 1, enableLLM);

    // Save to database for authenticated users
    const scanId = await saveScanToDatabase(
      userContext?.userId,
      url,
      aiReadiness,
      auditReport,
      {
        llm: result.llm,
        chunking: result.chunking,
        extractability: result.extractability,
        hallucinationReport: result.hallucinationReport,
        mirrorReport: result.mirrorReport,
        scoring: result.scoring,
        seo: result.seo,
        pseo: result.pseo,
        aeo: result.aeo,
        geo: result.geo,
      },
      duration,
      enableLLM
    );

    // Return comprehensive data (quickWins with score impact are in aiReadiness)
    return res.json({
      success: true,
      url,
      scanId,
      timestamp: new Date().toISOString(),
      warning: llmWarning,
      userContext: userContext ? {
        plan: userContext.plan,
        scansRemaining: userContext.usage.scansRemaining - 1,
      } : null,
      scanDuration: {
        actual: Math.round(duration / 1000),
        estimated: timeEstimate.estimate,
        message: `Scan completed in ${formatDuration(Math.round(duration / 1000))}`
      },
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
          // Optimization analysis
          seo: result.seo,
          pseo: result.pseo,
          aeo: result.aeo,
          geo: result.geo,
        }
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const validatedData = (req as any).validatedData;
    logAuditError(validatedData?.url || 'unknown', error, ip);
    
    // Map known errors to actionable errors
    let apiError;
    if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
      apiError = ErrorTypes.URL_UNREACHABLE(validatedData?.url || 'unknown', error.message);
    } else if (error.message?.includes('timeout')) {
      apiError = ErrorTypes.TIMEOUT(duration);
    } else if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      apiError = ErrorTypes.LLM_API_KEY_INVALID(validatedData?.llmProvider || 'unknown');
    } else if (error.message?.includes('quota') || error.message?.includes('billing')) {
      apiError = ErrorTypes.LLM_QUOTA_EXCEEDED(validatedData?.llmProvider || 'unknown');
    } else {
      apiError = ErrorTypes.SCAN_FAILED(error.message);
    }
    
    return res.status(apiError.statusCode).json({
      ...apiError.toJSON(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Stats endpoint - get scan counts (must be before /:jobId to avoid being matched as a job ID)
auditRouter.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const weekKey = `stats:scans:week:${now.getFullYear()}-W${getWeekNumber(now)}`;
    const totalKey = 'stats:scans:total';
    
    const [weekCount, totalCount] = await Promise.all([
      redisClient.get(weekKey),
      redisClient.get(totalKey)
    ]);
    
    res.json({
      success: true,
      stats: {
        thisWeek: parseInt(weekCount?.toString() || '0', 10),
        total: parseInt(totalCount?.toString() || '0', 10)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.json({
      success: true,
      stats: {
        thisWeek: 0,
        total: 0
      }
    });
  }
});

// GET /api/audit/scan/:scanId - Get a saved scan from database
auditRouter.get('/scan/:scanId', async (req, res) => {
  const { scanId } = req.params;

  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        pageResults: true,
        reports: true,
      },
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Get the report JSON which contains the full scan result
    const report = scan.reports[0];
    if (!report) {
      return res.status(404).json({ error: 'Scan report not found' });
    }

    const reportJson = report.reportJson as any;

    // Check if this is a crawl scan (FULL_CRAWL type)
    if (scan.scanType === 'FULL_CRAWL') {
      // For crawl scans, reportJson contains the crawlResult directly
      res.json({
        success: true,
        scanId: scan.id,
        url: scan.url,
        status: scan.status,
        scanType: scan.scanType,
        createdAt: scan.createdAt,
        result: {
          url: scan.url,
          crawlResult: reportJson,
        },
      });
    } else {
      // For single page scans
      res.json({
        success: true,
        scanId: scan.id,
        url: scan.url,
        status: scan.status,
        scanType: scan.scanType,
        createdAt: scan.createdAt,
        result: {
          url: scan.url,
          aiReadiness: reportJson?.aiReadiness || {
            overall: scan.overallScore,
            grade: scan.grade,
          },
          auditReport: reportJson?.auditReport,
          scanResult: reportJson?.scanResult,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error fetching scan', { scanId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch scan' });
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

// Save crawl to database
async function saveCrawlToDatabase(
  userId: string | null,
  url: string,
  crawlResult: CrawlResult,
  enableLLM: boolean
) {
  try {
    if (!userId) return null;

    const domain = extractDomain(url);

    const scan = await prisma.scan.create({
      data: {
        userId,
        url,
        domain,
        scanType: 'FULL_CRAWL',
        status: 'COMPLETED',
        enableLLM,
        enableChunking: true,
        maxPages: crawlResult.pagesScanned,
        overallScore: crawlResult.aggregatedScores.overall,
        grade: crawlResult.aggregatedScores.overall >= 90 ? 'A' :
               crawlResult.aggregatedScores.overall >= 80 ? 'B' :
               crawlResult.aggregatedScores.overall >= 70 ? 'C' :
               crawlResult.aggregatedScores.overall >= 60 ? 'D' : 'F',
        pagesScanned: crawlResult.pagesScanned,
        issuesFound: crawlResult.siteIssues.length,
        startedAt: new Date(crawlResult.startTime),
        completedAt: new Date(crawlResult.endTime),
        duration: crawlResult.duration,
      },
    });

    // Create page results for each successfully scanned page
    for (const page of crawlResult.pages.filter(p => p.success && p.scanResult)) {
      const result = page.scanResult!;
      const aiReadiness = calculateAIReadiness(result);

      await prisma.pageResult.create({
        data: {
          scanId: scan.id,
          url: page.url,
          title: result.url || null,
          overallScore: aiReadiness?.overall || null,
          contentQuality: aiReadiness?.dimensions?.contentQuality?.score || null,
          discoverability: aiReadiness?.dimensions?.discoverability?.score || null,
          extractability: aiReadiness?.dimensions?.extractability?.score || null,
          comprehensibility: aiReadiness?.dimensions?.comprehensibility?.score || null,
          trustworthiness: aiReadiness?.dimensions?.trustworthiness?.score || null,
          criticalIssues: result.issues?.filter((i: any) => i.severity === 'critical').length || 0,
          highIssues: result.issues?.filter((i: any) => i.severity === 'high').length || 0,
          mediumIssues: result.issues?.filter((i: any) => i.severity === 'medium').length || 0,
          lowIssues: result.issues?.filter((i: any) => i.severity === 'low').length || 0,
          issuesJson: result.issues as any || [],
          llmAnalysisJson: result.llm as any || null,
          extractabilityJson: result.extractability as any || null,
        },
      });
    }

    // Create report
    await prisma.report.create({
      data: {
        scanId: scan.id,
        format: 'json',
        reportJson: crawlResult as any,
        summaryJson: {
          score: crawlResult.aggregatedScores.overall,
          pagesScanned: crawlResult.pagesScanned,
          pagesFailed: crawlResult.pagesFailed,
          issueCount: crawlResult.siteIssues.length,
          aggregatedScores: crawlResult.aggregatedScores,
        } as any,
        quickWinsJson: crawlResult.siteAnalysis.topRecommendations as any,
        roadmapJson: null,
      },
    });

    return scan.id;
  } catch (error) {
    logger.error('Error saving crawl to database', { error, userId, url });
    return null;
  }
}

// POST /api/audit/crawl - Multi-page site crawl with SSE progress
auditRouter.post('/crawl', canScanMiddleware, enforceFullCrawlAccess, validateRequest(crawlRequestSchema), async (req, res) => {
  const startTime = Date.now();
  const ip = req.ip || 'unknown';
  const userContext = (req as any).userContext;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendProgress = (progress: CrawlProgress & { pageResult?: PageCrawlResult }) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`);
  };

  const sendResult = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    res.end();
  };

  const sendError = (error: string, details?: any) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error, ...details })}\n\n`);
    res.end();
  };

  try {
    const validatedData = (req as any).validatedData;
    const {
      url,
      maxPages = 10,
      maxDepth = 3,
      maxConcurrency = 3,
      crawlDelay = 1000,
      respectRobotsTxt = true,
      includeSitemap = true,
      excludePatterns,
      enableLLM = false,
      minImpactScore = 5,
      llmProvider,
      llmModel,
      llmApiKey,
    } = validatedData;

    // Apply subscription limits
    const tierLimits = TIER_LIMITS[userContext?.plan || 'FREE'];
    const effectiveMaxPages = userContext?.plan === 'FREE' ? 1 : Math.min(maxPages, tierLimits.maxPagesPerCrawl || 50);

    // If FREE tier, they shouldn't even get here (enforceFullCrawlAccess blocks them)
    // but double-check anyway
    if (userContext?.plan === 'FREE' && effectiveMaxPages > 1) {
      sendError('Upgrade required', {
        message: 'Full site crawl requires a Pro subscription.',
        upgradeUrl: '/pricing'
      });
      return;
    }

    logger.info('Starting site crawl', { url, maxPages: effectiveMaxPages, ip });

    // Configure crawl options
    const crawlOptions: any = {
      maxPages: effectiveMaxPages,
      maxDepth,
      maxConcurrency,
      crawlDelay,
      respectRobotsTxt,
      includeSitemap,
      excludePatterns,
      enableLLM,
      minImpactScore,
      minConfidence: 0.7,
      onProgress: (progress: CrawlProgress) => {
        sendProgress(progress);
      },
      onPageComplete: (pageResult: PageCrawlResult) => {
        sendProgress({
          pagesCompleted: 0,
          pagesFailed: 0,
          pagesRemaining: 0,
          totalPages: 0,
          percentComplete: 0,
          pageResult,
        });
      },
    };

    // Configure LLM if enabled
    if (enableLLM && llmProvider && llmModel) {
      crawlOptions.llmConfig = {
        provider: llmProvider,
        model: llmModel,
      };

      if (llmProvider === 'ollama') {
        crawlOptions.llmConfig.baseUrl = 'http://localhost:11434';
      } else if (llmApiKey) {
        crawlOptions.llmConfig.apiKey = llmApiKey;
      } else if (llmProvider === 'openrouter') {
        const defaultKey = process.env.OPENROUTER_API_KEY;
        if (defaultKey) {
          crawlOptions.llmConfig.apiKey = defaultKey;
        }
      }
    }

    // Run the crawl
    const crawlResult = await crawlSite(url, crawlOptions);

    const duration = Date.now() - startTime;
    logger.info('Crawl completed', {
      url,
      duration,
      pagesScanned: crawlResult.pagesScanned,
      pagesFailed: crawlResult.pagesFailed,
      ip
    });

    // Increment usage based on pages scanned
    await incrementUsage(userContext?.userId, ip, crawlResult.pagesScanned, enableLLM);

    // Save to database for authenticated users
    const scanId = await saveCrawlToDatabase(
      userContext?.userId,
      url,
      crawlResult,
      enableLLM
    );

    sendResult({
      success: true,
      url,
      scanId,
      timestamp: new Date().toISOString(),
      userContext: userContext ? {
        plan: userContext.plan,
        scansRemaining: Math.max(0, userContext.usage.scansRemaining - crawlResult.pagesScanned),
      } : null,
      scanDuration: {
        actual: Math.round(duration / 1000),
        message: `Crawl completed in ${formatDuration(Math.round(duration / 1000))}`
      },
      data: {
        crawlResult,
        summary: {
          pagesScanned: crawlResult.pagesScanned,
          pagesFailed: crawlResult.pagesFailed,
          aggregatedScores: crawlResult.aggregatedScores,
          topIssues: crawlResult.siteIssues.slice(0, 10),
          topRecommendations: crawlResult.siteAnalysis.topRecommendations,
        }
      }
    });

  } catch (error: any) {
    const validatedData = (req as any).validatedData;
    logger.error('Crawl failed', { url: validatedData?.url, error: error.message, ip });
    sendError(error.message || 'Crawl failed');
  }
});
