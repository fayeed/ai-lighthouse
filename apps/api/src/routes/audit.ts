import express from 'express';
import { analyzeUrlWithRules, calculateAIReadiness, exportAuditReport } from '../../../../packages/scanner/src/exports.js';

export const auditRouter = express.Router();

// Store for ongoing audits (in production, use Redis or similar)
const auditJobs = new Map<string, any>();

// POST /api/audit - Start a new audit
auditRouter.post('/', async (req, res) => {
  try {
    const { 
      url, 
      enableLLM = false,
      llmProvider = 'openrouter',
      llmModel = 'meta-llama/llama-3.3-70b-instruct:free',
      llmApiKey,
      minImpactScore = 5,
      async = false
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Configure scan options
    const scanOptions: any = {
      maxChunkTokens: 1200,
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
      if (llmApiKey) {
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
      auditJobs.set(jobId, { status: 'running', progress: 0 });

      // Start audit in background
      runAudit(jobId, url, scanOptions).catch(err => {
        console.error(`Job ${jobId} failed:`, err);
        auditJobs.set(jobId, { 
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
    console.log(`Starting audit for ${url}...`);
    const result = await analyzeUrlWithRules(url, scanOptions);
    
    console.log('Calculating AI readiness...');
    const aiReadiness = calculateAIReadiness(result);
    
    console.log('Generating audit report...');
    const auditReportJson = exportAuditReport(result);
    const auditReport = JSON.parse(auditReportJson);

    console.log('Audit complete!');
    
    // Return comprehensive data
    return res.json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
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
    console.error('Audit error:', error);
    return res.status(500).json({
      error: 'Audit failed',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// GET /api/audit/:jobId - Check job status
auditRouter.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = auditJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Helper function to run audit asynchronously
async function runAudit(jobId: string, url: string, scanOptions: any) {
  try {
    auditJobs.set(jobId, { status: 'running', progress: 10 });
    
    const result = await analyzeUrlWithRules(url, scanOptions);
    auditJobs.set(jobId, { status: 'running', progress: 60 });
    
    const aiReadiness = calculateAIReadiness(result);
    auditJobs.set(jobId, { status: 'running', progress: 80 });
    
    const auditReportJson = exportAuditReport(result);
    const auditReport = JSON.parse(auditReportJson);
    
    auditJobs.set(jobId, { 
      status: 'completed', 
      progress: 100,
      url,
      timestamp: new Date().toISOString(),
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
    auditJobs.set(jobId, { 
      status: 'failed', 
      error: error.message,
      stack: error.stack
    });
  }
}
