import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { SetupWizard, type AuditConfig } from '../ui/SetupWizard.js';
import { AuditReportUI } from '../ui/AuditReportUI.js';
import { analyzeUrlWithRules, calculateAIReadiness } from '@ai-lighthouse/scanner';
import type { ScanOptions } from '@ai-lighthouse/scanner';

export function auditWizardCommand(program: Command) {
  program
    .command('wizard')
    .alias('w')
    .description('Interactive wizard to configure and run an audit')
    .argument('[url]', 'Optional URL to audit (will prompt if not provided)')
    .action(async (url?: string) => {
      // Suppress console.error and console.warn for cleaner UI
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      console.error = () => {};
      console.warn = () => {};

      let auditConfig: AuditConfig | null = null;

      // Show setup wizard
      const wizardRender = render(
        React.createElement(SetupWizard, {
          initialUrl: url,
          onComplete: (config: AuditConfig) => {
            auditConfig = config;
          },
        })
      );

      // Wait for wizard to complete
      await wizardRender.waitUntilExit();

      if (!auditConfig) {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log('\nAudit cancelled.');
        process.exit(0);
      }

      // Start the audit with the configured options
      const { clear, rerender } = render(
        React.createElement(AuditReportUI, {
          url: auditConfig.url,
          result: {},
          aiReadiness: {},
          loading: true,
          currentStep: 'Starting audit...',
        })
      );

      try {
        // Build scan options from config
        const scanOptions: ScanOptions = {
          maxChunkTokens: 1200,
          chunkingStrategy: 'auto',
          enableChunking: auditConfig.enableChunking,
          enableExtractability: auditConfig.enableExtractability,
          enableHallucinationDetection: auditConfig.enableHallucination,
          enableLLM: auditConfig.enableLlm,
          minImpactScore: 8,
          minConfidence: 0.7,
          maxIssues: 20,
        };

        // Configure LLM if enabled
        if (auditConfig.enableLlm && auditConfig.llmProvider) {
          scanOptions.llmConfig = {
            provider: auditConfig.llmProvider as any,
            model: auditConfig.llmModel,
            baseUrl: auditConfig.llmBaseUrl,
            apiKey: auditConfig.llmApiKey,
          };
        }

        // Update loading step
        rerender(
          React.createElement(AuditReportUI, {
            url: auditConfig.url,
            result: {},
            aiReadiness: {},
            loading: true,
            currentStep: 'Scanning page...',
          })
        );

        // Run the audit
        const result = await analyzeUrlWithRules(auditConfig.url, scanOptions);

        // Update loading step
        rerender(
          React.createElement(AuditReportUI, {
            url: auditConfig.url,
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
            url: auditConfig.url,
            result,
            aiReadiness,
            loading: false,
          })
        );

        // Wait for user to exit
        await finalRender.waitUntilExit();

        // Restore console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      } catch (error) {
        // Restore console methods before showing error
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;

        clear();
        console.log('\n\x1b[1m\x1b[31m❌ Audit Failed\x1b[0m');
        console.log('\x1b[31m' + '─'.repeat(70) + '\x1b[0m');
        console.log('\x1b[31m' + (error instanceof Error ? error.message : String(error)) + '\x1b[0m');
        console.log('\n\x1b[2mPlease check the URL and your configuration.\x1b[0m');
        process.exit(1);
      }
    });
}
