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

interface AuditOptions {
  output?: string;
  rules?: string;
  depth?: number;
  pages?: string;
  cacheTtl?: number;
  threshold?: number;
  maxChunkTokens?: number;
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
          const html = generateHTMLReport(auditReport, aiReadiness);
          await writeFile(htmlPath, html);
          spinner.succeed(chalk.green('Audit complete!'));
          console.log(chalk.dim(`HTML report saved to: ${htmlPath}`));
          console.log(chalk.dim(`💡 Tip: Open the HTML file and use your browser's "Print > Save as PDF" to export as PDF`));
        } else if (options.output === 'pdf') {
          const htmlPath = join(outputDir, `${baseFilename}.html`);
          const html = generateHTMLReport(auditReport, aiReadiness);
          await writeFile(htmlPath, html);
          spinner.succeed(chalk.green('PDF-ready HTML generated!'));
          console.log(chalk.dim(`HTML saved to: ${htmlPath}`));
          console.log(chalk.yellow('\n📄 To generate PDF:'));
          console.log(chalk.dim('   1. Open the HTML file in your browser'));
          console.log(chalk.dim('   2. Press Ctrl+P (Cmd+P on Mac) or click "Print/Save as PDF" button'));
          console.log(chalk.dim('   3. Select "Save as PDF" as the destination'));
          console.log(chalk.dim('   4. Click "Save"\n'));
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

        // Display top issues
        const highImpactIssues = result.issues
          .filter((i: any) => i.impactScore >= 8)
          .slice(0, 5);

        if (highImpactIssues.length > 0) {
          console.log('\n' + chalk.bold('⚠️  Top Priority Issues'));
          highImpactIssues.forEach((issue: any, i: number) => {
            const icon = issue.serverity === 'critical' ? '🔴' : 
                        issue.serverity === 'high' ? '🟠' : '🟡';
            console.log(`\n${icon} ${i + 1}. ${chalk.yellow(issue.title)}`);
            console.log(`   ${chalk.dim(issue.description.slice(0, 100))}...`);
            console.log(`   ${chalk.cyan('→')} ${issue.remediation.slice(0, 100)}...`);
          });
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

function generateHTMLReport(report: any, aiReadiness: any): string {
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
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
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
      <button class="print-button" onclick="window.print()">📄 Print / Save as PDF</button>
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
