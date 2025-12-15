import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeUrlWithRules } from 'scanner';
import { calculateAIReadiness, formatAIReadinessReport } from 'scanner';
import { exportAuditReport, generateScoringSummary } from 'scanner';
import type { ScanOptions } from 'scanner';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import html_to_pdf from 'html-pdf-node';
import { formatComprehensiveReport, formatDetailedIssues } from '../utils/comprehensive-formatter.js';

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
}

export function auditCommand(program: Command) {
  program
    .command('audit')
    .description('Audit a website for AI readiness')
    .argument('<url>', 'URL to audit')
    .option('-o, --output <format>', 'Output format: json, html, pdf, lhr, csv', 'json')
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
      const spinner = ora('Starting audit...').start();

      try {
        // Validate URL
        const urlObj = new URL(url);
        spinner.text = `Auditing ${chalk.cyan(urlObj.href)}...`;

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

        // Run the audit
        spinner.text = 'Scanning page...';
        const result = await analyzeUrlWithRules(url, scanOptions);

        spinner.text = 'Calculating scores...';
        const aiReadiness = calculateAIReadiness(result);

        // Format the report
        spinner.text = 'Generating report...';
        const auditReportJson = exportAuditReport(result);
        const auditReport = JSON.parse(auditReportJson);

        // Save results
        const outputDir = resolve(process.cwd(), '.ai-lighthouse');
        if (!existsSync(outputDir)) {
          await mkdir(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const baseFilename = `audit_${new URL(url).hostname}_${timestamp}`;

        // Handle different output formats
        if (options.output === 'json') {
          const jsonPath = join(outputDir, `${baseFilename}.json`);
          await writeFile(jsonPath, auditReportJson);
          spinner.succeed(chalk.green('Audit complete!'));
          console.log(chalk.dim(`Report saved to: ${jsonPath}`));
        } else if (options.output === 'html') {
          const htmlPath = join(outputDir, `${baseFilename}.html`);
          const html = generateHTMLReport(auditReport, aiReadiness, result);
          await writeFile(htmlPath, html);
          spinner.succeed(chalk.green('Audit complete!'));
          console.log(chalk.dim(`HTML report saved to: ${htmlPath}`));
          console.log(chalk.dim(`💡 Tip: Open the HTML file and use your browser's "Print > Save as PDF" to export as PDF`));
        } else if (options.output === 'pdf') {
          spinner.text = 'Generating PDF...';
          const pdfPath = join(outputDir, `${baseFilename}.pdf`);
          const html = generateHTMLReport(auditReport, aiReadiness, result);
          
          const file = { content: html };
          const pdfOptions = { 
            format: 'A4',
            printBackground: false,
          };
          
          const pdfBuffer = await html_to_pdf.generatePdf(file, pdfOptions);
          await writeFile(pdfPath, pdfBuffer);
          
          spinner.succeed(chalk.green('PDF generated!'));
          console.log(chalk.dim(`PDF report saved to: ${pdfPath}`));
        } else if (options.output === 'lhr') {
          const lhrPath = join(outputDir, `${baseFilename}.lhr.json`);
          const lhr = convertToLighthouseFormat(auditReport);
          await writeFile(lhrPath, JSON.stringify(lhr, null, 2));
          spinner.succeed(chalk.green('Audit complete!'));
          console.log(chalk.dim(`Lighthouse-compatible report saved to: ${lhrPath}`));
        } else if (options.output === 'csv') {
          const csvPath = join(outputDir, `${baseFilename}.csv`);
          const csv = generateCSVReport(auditReport);
          await writeFile(csvPath, csv);
          spinner.succeed(chalk.green('Audit complete!'));
          console.log(chalk.dim(`CSV report saved to: ${csvPath}`));
        }

        // Display summary
        console.log('\n' + chalk.bold('📊 AI Readiness Summary'));
        console.log(formatAIReadinessReport(aiReadiness));

        console.log('\n' + chalk.bold('📈 Technical Scores'));
        console.log(generateScoringSummary(result.scoring!));

        // Display comprehensive report with all website data
        console.log('\n' + chalk.bold('═══════════════════════════════════════════════════════════════════'));
        console.log(chalk.bold.cyan('                    COMPREHENSIVE ANALYSIS                           '));
        console.log(chalk.bold('═══════════════════════════════════════════════════════════════════'));
        console.log(formatComprehensiveReport(result, aiReadiness));

        // Display all issues
        if (result.issues && result.issues.length > 0) {
          console.log('\n' + formatDetailedIssues(result.issues));
        }

        // Check threshold
        if (options.threshold !== undefined) {
          const overallScore = (auditReport as any)?.scores?.overall;
          if (overallScore !== undefined && overallScore < options.threshold) {
            console.log(chalk.red(`\n❌ Score ${overallScore} is below threshold ${options.threshold}`));
            process.exit(1);
          } else if (overallScore !== undefined) {
            console.log(chalk.green(`\n✅ Score ${overallScore} meets threshold ${options.threshold}`));
          }
        }

      } catch (error) {
        spinner.fail(chalk.red('Audit failed'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}

function generateHTMLReport(report: any, aiReadiness: any, scanResult: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Lighthouse Report - ${report.input?.requested_url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { color: #333; max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
    h1 { color: #2563eb; margin-bottom: 10px; font-size: 2em; }
    h2 { color: #1e40af; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }
    h3 { color: #1e40af; margin-top: 20px; margin-bottom: 10px; font-size: 1.2em; }
    .header { margin-bottom: 30px; }
    .url { color: #64748b; font-size: 0.95em; }
    .timestamp { color: #94a3b8; font-size: 0.85em; }
    
    .ai-readiness-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .ai-readiness-banner h2 { color: white; border: none; margin: 0 0 20px 0; }
    .overall-score { font-size: 3em; font-weight: bold; margin: 10px 0; }
    .grade-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
    .agent-perspective { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin: 20px 0; }
    .agent-status { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
    .agent-status-item { display: flex; align-items: center; gap: 10px; }
    
    .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .score-card { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .score-card h3 { font-size: 0.9em; opacity: 0.9; margin-bottom: 10px; }
    .score-value { font-size: 2.5em; font-weight: bold; }
    .grade { font-size: 1.2em; opacity: 0.8; margin-left: 10px; }
    
    .dimensions { display: grid; gap: 15px; margin: 20px 0; }
    .dimension { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 20px; border-radius: 4px; }
    .dimension.excellent { border-left-color: #10b981; }
    .dimension.good { border-left-color: #84cc16; }
    .dimension.needs-work { border-left-color: #f59e0b; }
    .dimension.critical { border-left-color: #dc2626; }
    .dimension-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .dimension-name { font-weight: 600; font-size: 1.1em; color: #1e293b; }
    .dimension-score { font-size: 1.5em; font-weight: bold; }
    .dimension-level { color: #64748b; font-size: 0.9em; margin-bottom: 10px; text-transform: uppercase; }
    .dimension-recommendations { margin-top: 10px; padding-left: 20px; }
    .dimension-recommendations li { margin: 5px 0; color: #475569; }
    
    .quick-wins { background: #fffbeb; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .quick-wins h3 { color: #92400e; margin-top: 0; }
    .quick-win { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 3px solid #f59e0b; }
    .quick-win-header { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .quick-win-meta { font-size: 0.85em; color: #64748b; }
    
    .priorities { margin: 20px 0; }
    .priority-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .priority-section.immediate { border-left: 4px solid #dc2626; }
    .priority-section.short-term { border-left: 4px solid #f59e0b; }
    .priority-section.long-term { border-left: 4px solid #3b82f6; }
    .priority-item { margin: 10px 0; padding-left: 20px; }
    
    .issues { margin: 20px 0; }
    .issue { 
      background: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .issue.critical { border-left-color: #dc2626; background: #fef2f2; }
    .issue.high { border-left-color: #ea580c; background: #fff7ed; }
    .issue.medium { border-left-color: #f59e0b; background: #fffbeb; }
    .issue.low { border-left-color: #84cc16; background: #f7fee7; }
    .issue-title { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .issue-meta { font-size: 0.85em; color: #64748b; margin-bottom: 8px; }
    .issue-desc { color: #475569; margin-bottom: 8px; }
    .issue-fix { color: #0f766e; background: #f0fdfa; padding: 10px; border-radius: 4px; font-size: 0.9em; }
    
    .entity-list { display: grid; gap: 15px; }
    .entity { background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 4px; }
    .entity-name { font-weight: 600; color: #0c4a6e; }
    .entity-type { color: #0369a1; font-size: 0.85em; }
    
    .print-button { 
      background: #2563eb; 
      color: white; 
      padding: 12px 24px; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer; 
      font-size: 1em;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .print-button:hover { background: #1e40af; }
    
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 AI Lighthouse Report</h1>
      <div class="url">${report.input?.requested_url}</div>
      <div class="timestamp">Generated: ${new Date(report.scanned_at).toLocaleString()}</div>
    </div>

    ${aiReadiness ? `
    <div class="ai-readiness-banner">
      <h2>🤖 AI Readiness Assessment</h2>
      <div class="overall-score">${Math.round(aiReadiness.overall)}/100</div>
      <div class="grade-badge">Grade: ${aiReadiness.grade}</div>
      <div style="margin: 10px 0; opacity: 0.9;">
        Top ${aiReadiness.benchmark?.topPercentile || 0}% of sites • 
        Improvement potential: +${Math.round(aiReadiness.benchmark?.improvement || 0)} points to best-in-class
      </div>
      
      <div class="agent-perspective">
        <strong>AI Agent Perspective:</strong>
        <div class="agent-status">
          <div class="agent-status-item">
            <span>${aiReadiness.aiPerspective?.canUnderstand ? '✅' : '❌'}</span>
            <span>Can Understand</span>
          </div>
          <div class="agent-status-item">
            <span>${aiReadiness.aiPerspective?.canExtract ? '✅' : '❌'}</span>
            <span>Can Extract</span>
          </div>
          <div class="agent-status-item">
            <span>${aiReadiness.aiPerspective?.canIndex ? '✅' : '❌'}</span>
            <span>Can Index</span>
          </div>
          <div class="agent-status-item">
            <span>${aiReadiness.aiPerspective?.canAnswer ? '✅' : '❌'}</span>
            <span>Can Answer Questions</span>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <strong>Confidence Level:</strong> ${Math.round((aiReadiness.aiPerspective?.confidence || 0) * 100)}%
        </div>
      </div>
      
      ${(aiReadiness.aiPerspective?.mainBlockers || []).length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>Main Blockers:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${(aiReadiness.aiPerspective?.mainBlockers || []).map((blocker: string) => `<li>${blocker}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}

    <h2>📊 Technical Scores</h2>
    <div class="scores">
      <div class="score-card">
        <h3>Overall Score</h3>
        <div>
          <span class="score-value">${report.scores?.overall || 0}</span>
          <span class="grade">${getLetterGrade(report.scores?.overall || 0)}</span>
        </div>
      </div>
      <div class="score-card">
        <h3>AI Readiness</h3>
        <div class="score-value">${report.scores?.ai_readiness || 0}</div>
      </div>
      <div class="score-card">
        <h3>Crawlability</h3>
        <div class="score-value">${report.scores?.crawlability || 0}</div>
      </div>
      <div class="score-card">
        <h3>Content Clarity</h3>
        <div class="score-value">${report.scores?.content_clarity || 0}</div>
      </div>
      <div class="score-card">
        <h3>Schema Coverage</h3>
        <div class="score-value">${report.scores?.schema_coverage || 0}</div>
      </div>
      <div class="score-card">
        <h3>Structure</h3>
        <div class="score-value">${report.scores?.structure || 0}</div>
      </div>
    </div>

    ${aiReadiness?.dimensions ? `
    <h2>🎯 Dimension Analysis</h2>
    <div class="dimensions">
      ${Object.entries(aiReadiness.dimensions).map(([key, dim]: [string, any]) => `
        <div class="dimension ${dim.status}">
          <div class="dimension-header">
            <div class="dimension-name">${getEmojiForDimension(key)} ${formatDimensionName(key)}</div>
            <div class="dimension-score">${Math.round(dim.score)}/100</div>
          </div>
          <div class="dimension-level">${dim.status}</div>
          ${dim.strengths && dim.strengths.length > 0 ? `
            <div><strong>Strengths:</strong> ${dim.strengths.join(', ')}</div>
          ` : ''}
          ${dim.weaknesses && dim.weaknesses.length > 0 ? `
            <div style="margin-top: 8px;"><strong>Weaknesses:</strong> ${dim.weaknesses.join(', ')}</div>
          ` : ''}
          ${dim.recommendation ? `
            <div class="dimension-recommendations">
              <div style="margin-top: 10px;">→ ${dim.recommendation}</div>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${aiReadiness?.quickWins && aiReadiness.quickWins.length > 0 ? `
    <div class="quick-wins">
      <h3>⚡ Quick Wins (High Impact, Low Effort)</h3>
      ${aiReadiness.quickWins.slice(0, 5).map((win: any, idx: number) => `
        <div class="quick-win">
          <div class="quick-win-header">${idx + 1}. ${win.issue}</div>
          <div class="quick-win-meta">Impact: ${win.impact} | Effort: ${win.effort}</div>
          <div style="margin-top: 8px; color: #0f766e;">→ ${win.fix}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${aiReadiness?.roadmap ? `
    <h2>📋 Priority Roadmap</h2>
    <div class="priorities">
      ${aiReadiness.roadmap.immediate && aiReadiness.roadmap.immediate.length > 0 ? `
        <div class="priority-section immediate">
          <h3>🔴 Immediate (&lt; 1 day)</h3>
          ${aiReadiness.roadmap.immediate.slice(0, 5).map((item: string) => `
            <div class="priority-item">• ${item}</div>
          `).join('')}
        </div>
      ` : ''}
      
      ${aiReadiness.roadmap.shortTerm && aiReadiness.roadmap.shortTerm.length > 0 ? `
        <div class="priority-section short-term">
          <h3>🟡 Short-term (1-7 days)</h3>
          ${aiReadiness.roadmap.shortTerm.slice(0, 5).map((item: string) => `
            <div class="priority-item">• ${item}</div>
          `).join('')}
        </div>
      ` : ''}
      
      ${aiReadiness.roadmap.longTerm && aiReadiness.roadmap.longTerm.length > 0 ? `
        <div class="priority-section long-term">
          <h3>🔵 Long-term (&gt; 7 days)</h3>
          ${aiReadiness.roadmap.longTerm.slice(0, 5).map((item: string) => `
            <div class="priority-item">• ${item}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${scanResult?.llm ? `
    <h2>📝 AI Understanding Analysis</h2>
    <div style="background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="margin-bottom: 15px;">
        <strong>Summary:</strong> ${scanResult.llm.summary || 'N/A'}
      </div>
      ${scanResult.llm.pageType ? `
        <div style="margin-bottom: 15px;">
          <strong>📄 Page Type:</strong> ${scanResult.llm.pageType}
        </div>
      ` : ''}
      ${scanResult.llm.keyTopics && scanResult.llm.keyTopics.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <strong>🏷️ Key Topics:</strong> ${scanResult.llm.keyTopics.join(', ')}
        </div>
      ` : ''}
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
        ${scanResult.llm.readingLevel ? `
          <div><strong>📊 Reading Level:</strong> ${scanResult.llm.readingLevel.description}</div>
        ` : ''}
        ${scanResult.llm.sentiment ? `
          <div><strong>🎭 Sentiment:</strong> ${scanResult.llm.sentiment}</div>
        ` : ''}
        ${scanResult.llm.technicalDepth ? `
          <div><strong>🎯 Technical Depth:</strong> ${scanResult.llm.technicalDepth}</div>
        ` : ''}
      </div>
      
      ${scanResult.llm.pageTypeInsights && scanResult.llm.pageTypeInsights.length > 0 ? `
        <div style="margin-top: 20px; background: #dbeafe; padding: 15px; border-radius: 4px; border-left: 4px solid #0ea5e9;">
          <div style="font-weight: 600; margin-bottom: 10px;">💡 AI-Generated Insights for ${scanResult.llm.pageType || 'This Page'}</div>
          <ul style="margin: 0; padding-left: 20px;">
            ${scanResult.llm.pageTypeInsights.map((insight: string) => `<li style="margin: 5px 0;">${insight}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      
      ${scanResult.llm.topEntities && scanResult.llm.topEntities.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>🔍 Key Entities:</strong>
          <div style="margin-top: 10px; display: grid; gap: 10px;">
            ${scanResult.llm.topEntities.slice(0, 5).map((entity: any) => `
              <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #0ea5e9;">
                <strong>${entity.name}</strong> (${entity.type}) - ${Math.round((entity.relevance || 0) * 100)}% relevance
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${scanResult.llm.questions && scanResult.llm.questions.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>❓ Key Questions AI Can Answer:</strong>
          <ol style="margin-top: 10px; padding-left: 25px;">
            ${scanResult.llm.questions.slice(0, 5).map((q: any) => `
              <li style="margin: 8px 0;"><span style="text-transform: uppercase; font-size: 0.8em; background: #dbeafe; padding: 2px 6px; border-radius: 3px;">${q.difficulty}</span> ${q.question}</li>
            `).join('')}
          </ol>
        </div>
      ` : ''}
      
      ${scanResult.llm.suggestedFAQ && scanResult.llm.suggestedFAQ.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>💡 Suggested FAQs:</strong>
          <div style="margin-top: 10px; display: grid; gap: 15px;">
            ${scanResult.llm.suggestedFAQ.filter((f: any) => f.importance === 'high').slice(0, 3).map((faq: any) => `
              <div style="background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #f59e0b;">
                <div style="font-weight: 600; margin-bottom: 5px;">Q: ${faq.question}</div>
                <div style="color: #64748b;">A: ${faq.suggestedAnswer}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${scanResult?.chunking ? `
    <h2>📄 Content Chunking Analysis</h2>
    <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div><strong>Strategy:</strong> ${scanResult.chunking.chunkingStrategy}</div>
        <div><strong>Total Chunks:</strong> ${scanResult.chunking.totalChunks}</div>
        <div><strong>Avg Tokens/Chunk:</strong> ${scanResult.chunking.averageTokensPerChunk}</div>
        <div><strong>Avg Noise:</strong> ${(scanResult.chunking.averageNoiseRatio * 100).toFixed(1)}%</div>
      </div>
    </div>
    ` : ''}

    ${scanResult?.extractability ? `
    <h2>🔄 Extractability Analysis</h2>
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
        <div><strong>Overall Score:</strong> ${scanResult.extractability.score.extractabilityScore}/100</div>
        <div><strong>Server-Rendered:</strong> ${scanResult.extractability.score.serverRenderedPercent}%</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div><strong>Text Extractable:</strong> ${scanResult.extractability.contentTypes.text.percentage}%</div>
        <div><strong>Images Extractable:</strong> ${scanResult.extractability.contentTypes.images.percentage}%</div>
      </div>
    </div>
    ` : ''}

    ${scanResult?.hallucinationReport ? `
    <h2>⚠️ Hallucination Risk Assessment</h2>
    <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 15px;">
        Risk Score: ${scanResult.hallucinationReport.hallucinationRiskScore}/100
      </div>
      
      ${scanResult.hallucinationReport.factCheckSummary ? `
        <div style="margin-top: 20px; background: white; padding: 15px; border-radius: 4px;">
          <strong>📊 Fact Check Summary:</strong>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
            <div>✅ Verified: ${scanResult.hallucinationReport.factCheckSummary.verifiedFacts}</div>
            <div>❓ Unverified: ${scanResult.hallucinationReport.factCheckSummary.unverifiedFacts}</div>
            <div>⚠️ Contradictions: ${scanResult.hallucinationReport.factCheckSummary.contradictions}</div>
            <div>🤔 Ambiguities: ${scanResult.hallucinationReport.factCheckSummary.ambiguities}</div>
          </div>
        </div>
      ` : ''}
      
      ${scanResult.hallucinationReport.factCheckSummary && scanResult.hallucinationReport.factCheckSummary.unverifiedFacts > 0 ? `
        <div style="margin-top: 15px; background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; border-radius: 4px;">
          <div style="display: flex; align-items: start; gap: 10px;">
            <span style="font-size: 1.5em;">💡</span>
            <div>
              <div style="font-weight: 600; margin-bottom: 8px;">Why Some Facts Can't Be Verified</div>
              <div style="color: #854d0e; margin-bottom: 8px;">
                AI systems need external sources to verify claims. When information lacks citations, links, or 
                references, it becomes difficult to confirm accuracy, increasing the risk of AI hallucination or misinformation.
              </div>
              <div style="font-weight: 600; margin-top: 12px; margin-bottom: 6px;">Best Practices:</div>
              <ul style="margin: 0; padding-left: 20px; color: #854d0e;">
                <li>Add source links directly in or near claim text</li>
                <li>Include dates for time-sensitive information</li>
                <li>Link to authoritative sources (research, official docs)</li>
                <li>Provide context for statistics and data points</li>
                <li>Use schema.org markup to specify citations</li>
              </ul>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${scanResult.hallucinationReport.triggers && scanResult.hallucinationReport.triggers.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>🚨 Identified Triggers:</strong>
          <div style="margin-top: 10px; display: grid; gap: 10px;">
            ${scanResult.hallucinationReport.triggers.filter((t: any) => t.severity === 'high' || t.severity === 'critical').slice(0, 5).map((trigger: any) => `
              <div style="background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #dc2626;">
                <div style="font-weight: 600; text-transform: uppercase; font-size: 0.85em; color: #dc2626;">${trigger.type} - ${trigger.severity}</div>
                <div style="margin-top: 5px;">${trigger.description}</div>
                <div style="margin-top: 5px; font-size: 0.9em; color: #64748b;">Confidence: ${Math.round((trigger.confidence || 0) * 100)}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${scanResult.hallucinationReport.recommendations && scanResult.hallucinationReport.recommendations.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>💡 Recommendations:</strong>
          <ul style="margin-top: 10px; padding-left: 25px;">
            ${scanResult.hallucinationReport.recommendations.slice(0, 3).map((rec: string) => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${scanResult?.mirrorReport ? `
    <h2>🔍 AI Misunderstanding Check</h2>
    <div style="background: #faf5ff; border: 2px solid #a855f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
        <div><strong>🎯 Alignment Score:</strong> ${scanResult.mirrorReport.summary.alignmentScore}/100</div>
        <div><strong>📖 Clarity Score:</strong> ${scanResult.mirrorReport.summary.clarityScore}/100</div>
        <div><strong>⚠️ Critical Issues:</strong> ${scanResult.mirrorReport.summary.critical}</div>
        <div><strong>🟡 Major Issues:</strong> ${scanResult.mirrorReport.summary.major}</div>
      </div>
      
      ${scanResult.mirrorReport.mismatches && scanResult.mirrorReport.mismatches.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>Priority Mismatches:</strong>
          <div style="margin-top: 10px; display: grid; gap: 10px;">
            ${scanResult.mirrorReport.mismatches.filter((m: any) => m.severity === 'critical' || m.severity === 'major').slice(0, 5).map((mismatch: any) => `
              <div style="background: white; padding: 15px; border-radius: 4px; border-left: 3px solid ${mismatch.severity === 'critical' ? '#dc2626' : '#f59e0b'};">
                <div style="font-weight: 600;">${mismatch.severity === 'critical' ? '🔴' : '🟡'} ${mismatch.field}</div>
                <div style="margin-top: 5px; color: #64748b;">${mismatch.description}</div>
                <div style="margin-top: 10px; padding: 10px; background: #f0fdfa; border-radius: 4px;">
                  <strong>Fix:</strong> ${mismatch.recommendation}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${scanResult.mirrorReport.recommendations && scanResult.mirrorReport.recommendations.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong>💡 Top Recommendations:</strong>
          <ul style="margin-top: 10px; padding-left: 25px;">
            ${scanResult.mirrorReport.recommendations.slice(0, 3).map((rec: string) => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}

    <h2>⚠️ All Issues (${report.issues?.length || 0})</h2>
    <div class="issues">
      ${(report.issues || []).map((issue: any) => `
        <div class="issue ${issue.severity}">
          <div class="issue-title">${issue.message}</div>
          <div class="issue-meta">
            <span style="text-transform: uppercase; font-weight: 600;">${issue.severity}</span> 
            · Impact: ${issue.impact} 
            · Category: ${issue.category}
          </div>
          <div class="issue-desc">${issue.evidence || 'No additional evidence'}</div>
          <div class="issue-fix"><strong>Fix:</strong> ${issue.suggested_fix}</div>
        </div>
      `).join('')}
    </div>

    ${(report.entities || []).length > 0 ? `
      <h2>🏷️ Detected Entities (${(report.entities || []).length})</h2>
      <div class="entity-list">
        ${(report.entities || []).map((entity: any) => `
          <div class="entity">
            <div class="entity-name">${entity.name}</div>
            <div class="entity-type">${entity.type} · Source: ${entity.source}</div>
            ${entity.description ? `<div style="margin-top: 8px; color: #334155;">${entity.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function getLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getEmojiForDimension(name: string): string {
  const emojiMap: Record<string, string> = {
    'contentQuality': '📝',
    'discoverability': '🔍',
    'extractability': '🔄',
    'comprehensibility': '🧠',
    'trustworthiness': '✅',
    'structured': '📊',
    'semantic': '🏷️'
  };
  return emojiMap[name] || '📌';
}

function formatDimensionName(key: string): string {
  const nameMap: Record<string, string> = {
    'contentQuality': 'Content Quality',
    'discoverability': 'Discoverability',
    'extractability': 'Extractability',
    'comprehensibility': 'Comprehensibility',
    'trustworthiness': 'Trustworthiness'
  };
  return nameMap[key] || key;
}

function convertToLighthouseFormat(report: any): any {
  return {
    lighthouseVersion: '1.0.0',
    userAgent: 'AI-Lighthouse/1.0.0',
    fetchTime: report.scanned_at,
    requestedUrl: report.input?.requested_url,
    finalUrl: report.input?.final_url,
    categories: {
      'ai-readiness': {
        id: 'ai-readiness',
        title: 'AI Readiness',
        score: (report.scores?.ai_readiness || 0) / 100,
      },
      'crawlability': {
        id: 'crawlability',
        title: 'Crawlability',
        score: (report.scores?.crawlability || 0) / 100,
      },
      'content-clarity': {
        id: 'content-clarity',
        title: 'Content Clarity',
        score: (report.scores?.content_clarity || 0) / 100,
      },
    },
    audits: (report.issues || []).reduce((acc: any, issue: any, idx: number) => {
      acc[`issue-${idx}`] = {
        id: issue.id,
        title: issue.message,
        description: issue.evidence || '',
        score: issue.severity === 'critical' ? 0 : issue.severity === 'high' ? 0.25 : 0.5,
        displayValue: issue.suggested_fix,
      };
      return acc;
    }, {}),
  };
}

function generateCSVReport(report: any): string {
  const headers = ['ID', 'Severity', 'Category', 'Message', 'Impact', 'Suggested Fix'];
  const rows = (report.issues || []).map((issue: any) => [
    issue.id,
    issue.severity,
    issue.category,
    `"${issue.message.replace(/"/g, '""')}"`,
    issue.impact,
    `"${issue.suggested_fix.replace(/"/g, '""')}"`,
  ]);
  
  return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
}
