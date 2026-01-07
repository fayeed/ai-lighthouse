import { Command } from 'commander';
import { analyzeUrlWithRules } from '@ai-lighthouse/scanner';
import { calculateAIReadiness, exportAuditReport } from '@ai-lighthouse/scanner';
import type { ScanOptions } from '@ai-lighthouse/scanner';
import { render } from 'ink';
import React from 'react';
import { AuditReportUI } from '../ui/AuditReportUI.js';

interface AuditOptions {
  output?: string;
  rules?: string;
  depth?: number;
  pages?: string;
  cacheTtl?: number;
  threshold?: number;
  maxChunkTokens?: number;
  chunkingStrategy?: 'auto' | 'heading-based' | 'paragraph-based';
  enableChunking?: boolean;
  enableExtractability?: boolean;
  enableHallucination?: boolean;
  enableLlm?: boolean;
  minImpact?: number;
  minConfidence?: number;
  maxIssues?: number;
  llmProvider?: string;
  llmModel?: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  interactive?: boolean;
}

export function auditInteractiveCommand(program: Command) {
  program
    .command('audit-interactive')
    .description('Audit a website for AI readiness with interactive UI')
    .argument('<url>', 'URL to audit')
    .option('-r, --rules <preset>', 'Rule preset: default, strict, minimal', 'default')
    .option('-d, --depth <number>', 'Crawl depth (for multi-page audits)', parseInt, 1)
    .option('-p, --pages <urls>', 'Comma-separated list of specific pages to audit')
    .option('--cache-ttl <seconds>', 'Cache TTL in seconds to avoid re-fetching', parseInt)
    .option('--threshold <score>', 'Minimum score threshold (exit 1 if below)', parseInt)
    .option('--max-chunk-tokens <number>', 'Maximum tokens per content chunk', parseInt, 1200)
    .option('--chunking-strategy <strategy>', 'Chunking strategy: auto, heading-based, paragraph-based', 'auto')
    .option('--enable-chunking', 'Enable detailed content chunking analysis', false)
    .option('--enable-extractability', 'Enable extractability mapping', false)
    .option('--enable-hallucination', 'Enable hallucination detection', false)
    .option('--enable-llm', 'Enable LLM comprehension analysis', false)
    .option('--min-impact <number>', 'Minimum impact score to include', parseInt, 8)
    .option('--min-confidence <number>', 'Minimum confidence to include (0-1)', parseFloat, 0.7)
    .option('--max-issues <number>', 'Maximum issues to return', parseInt, 20)
    .option('--llm-provider <provider>', 'LLM provider: openai, anthropic, ollama, local')
    .option('--llm-model <model>', 'LLM model name')
    .option('--llm-base-url <url>', 'LLM API base URL')
    .option('--llm-api-key <key>', 'LLM API key')
    .action(async (url: string, options: AuditOptions) => {
      // Show loading UI
      const { waitUntilExit, clear, rerender } = render(
        React.createElement(AuditReportUI, {
          url,
          result: {},
          aiReadiness: {},
          loading: true,
          currentStep: 'Starting audit...',
        })
      );

      try {
        // Validate URL
        const urlObj = new URL(url);

        // Build scan options
        const scanOptions: ScanOptions = {
          maxChunkTokens: options.maxChunkTokens,
          chunkingStrategy: options.chunkingStrategy,
          enableChunking: options.enableChunking,
          enableExtractability: options.enableExtractability,
          enableHallucinationDetection: options.enableHallucination,
          enableLLM: options.enableLlm,
          minImpactScore: options.minImpact,
          minConfidence: options.minConfidence,
          maxIssues: options.maxIssues,
        };

        // Configure LLM if enabled
        if (options.enableLlm && options.llmProvider) {
          scanOptions.llmConfig = {
            provider: options.llmProvider as any,
            model: options.llmModel,
            baseUrl: options.llmBaseUrl,
            apiKey: options.llmApiKey,
          };
        }

        // Update loading step
        rerender(
          React.createElement(AuditReportUI, {
            url: urlObj.href,
            result: {},
            aiReadiness: {},
            loading: true,
            currentStep: 'Scanning page...',
          })
        );

        // Run the audit
        const result = await analyzeUrlWithRules(url, scanOptions);

        // Update loading step
        rerender(
          React.createElement(AuditReportUI, {
            url: urlObj.href,
            result,
            aiReadiness: {},
            loading: true,
            currentStep: 'Calculating AI readiness scores...',
          })
        );

        // Calculate AI readiness
        const aiReadiness = calculateAIReadiness(result);

        // Clear loading and show results
        clear();
        const finalRender = render(
          React.createElement(AuditReportUI, {
            url: urlObj.href,
            result,
            aiReadiness,
            loading: false,
          })
        );

        // Wait for user to exit
        await finalRender.waitUntilExit();

        // Check threshold
        if (options.threshold !== undefined) {
          const overallScore = aiReadiness.overall;
          if (overallScore !== undefined && overallScore < options.threshold) {
            process.exit(1);
          }
        }
      } catch (error) {
        clear();
        console.error('Audit failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
