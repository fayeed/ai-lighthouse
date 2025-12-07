import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

interface ReportOptions {
  open?: boolean;
  format?: string;
}

export function reportCommand(program: Command) {
  program
    .command('report')
    .description('Generate and view reports from saved audit results')
    .argument('<file>', 'Path to audit JSON file (e.g., ./last_run.json)')
    .option('--open', 'Open the report in browser', false)
    .option('-f, --format <format>', 'Output format: html, json, csv', 'html')
    .action(async (file: string, options: ReportOptions) => {
      const spinner = ora('Loading audit results...').start();

      try {
        const filePath = resolve(process.cwd(), file);
        
        if (!existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Read the JSON report
        const jsonContent = await readFile(filePath, 'utf-8');
        const report = JSON.parse(jsonContent);

        spinner.text = 'Generating report...';

        // Determine if it's a crawl report or single audit
        const isCrawlReport = 'pages' in report && Array.isArray(report.pages);

        if (options.format === 'html') {
          const htmlPath = filePath.replace(/\.json$/, '.html');
          const html = isCrawlReport 
            ? generateCrawlHTML(report) 
            : generateSingleHTML(report);
          
          await writeFile(htmlPath, html);
          spinner.succeed(chalk.green('Report generated!'));
          console.log(chalk.dim(`HTML saved to: ${htmlPath}`));

          if (options.open) {
            spinner.text = 'Opening report in browser...';
            await open(htmlPath);
            spinner.succeed('Report opened in browser');
          }
        } else if (options.format === 'json') {
          // Pretty print to console
          spinner.succeed('Report loaded');
          console.log(JSON.stringify(report, null, 2));
        } else if (options.format === 'csv') {
          const csvPath = filePath.replace(/\.json$/, '.csv');
          const csv = generateCSV(report);
          await writeFile(csvPath, csv);
          spinner.succeed(chalk.green('CSV report generated!'));
          console.log(chalk.dim(`CSV saved to: ${csvPath}`));
        }

        // Display summary
        if (isCrawlReport) {
          console.log('\n' + chalk.bold('🌐 Crawl Summary'));
          console.log(`Pages: ${chalk.cyan(report.total_pages)}`);
          console.log(`Avg Score: ${chalk.cyan(report.summary.avg_overall_score.toFixed(1))}`);
          console.log(`Total Issues: ${chalk.yellow(report.summary.total_issues)}`);
        } else {
          console.log('\n' + chalk.bold('📊 Audit Summary'));
          console.log(`URL: ${chalk.cyan(report.input.requested_url)}`);
          console.log(`Overall Score: ${chalk.cyan(report.scores.overall)}`);
          console.log(`Issues: ${chalk.yellow(report.issues.length)}`);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to generate report'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}

function generateSingleHTML(report: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Lighthouse Report - ${report.input.requested_url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: white; padding: 40px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 10px; }
    .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 25px 0; }
    .score-card { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .score-value { font-size: 2.5em; font-weight: bold; }
    .score-label { font-size: 0.9em; opacity: 0.9; margin-top: 5px; }
    .section { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section-title { color: #1e40af; font-size: 1.5em; margin-bottom: 20px; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }
    .issues { display: grid; gap: 15px; }
    .issue { 
      background: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 15px;
      border-radius: 4px;
    }
    .issue.critical { border-left-color: #dc2626; background: #fef2f2; }
    .issue.high { border-left-color: #ea580c; background: #fff7ed; }
    .issue.medium { border-left-color: #f59e0b; background: #fffbeb; }
    .issue-title { font-weight: 600; color: #1e293b; margin-bottom: 8px; font-size: 1.05em; }
    .issue-meta { font-size: 0.85em; color: #64748b; margin-bottom: 10px; }
    .issue-fix { color: #0f766e; background: #f0fdfa; padding: 12px; border-radius: 4px; margin-top: 10px; }
    .entity { background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    .entity-name { font-weight: 600; color: #0c4a6e; font-size: 1.1em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 AI Lighthouse Report</h1>
      <div style="color: #64748b; margin-top: 5px;">${report.input.requested_url}</div>
      <div style="color: #94a3b8; font-size: 0.85em; margin-top: 5px;">
        ${new Date(report.scanned_at).toLocaleString()}
      </div>
      
      <div class="scores">
        <div class="score-card">
          <div class="score-value">${report.scores.overall}</div>
          <div class="score-label">Overall</div>
        </div>
        <div class="score-card">
          <div class="score-value">${report.scores.ai_readiness}</div>
          <div class="score-label">AI Readiness</div>
        </div>
        <div class="score-card">
          <div class="score-value">${report.scores.crawlability}</div>
          <div class="score-label">Crawlability</div>
        </div>
        <div class="score-card">
          <div class="score-value">${report.scores.content_clarity}</div>
          <div class="score-label">Content Clarity</div>
        </div>
        <div class="score-card">
          <div class="score-value">${report.scores.schema_coverage}</div>
          <div class="score-label">Schema</div>
        </div>
      </div>
    </div>

    ${report.issues.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ Issues (${report.issues.length})</div>
        <div class="issues">
          ${report.issues.map((issue: any) => `
            <div class="issue ${issue.severity}">
              <div class="issue-title">${issue.message}</div>
              <div class="issue-meta">
                <span style="text-transform: uppercase; font-weight: 600; color: ${getSeverityColor(issue.severity)}">
                  ${issue.severity}
                </span>
                · ${issue.category}
              </div>
              ${issue.evidence ? `<div style="color: #475569; margin: 10px 0;">${issue.evidence}</div>` : ''}
              <div class="issue-fix"><strong>💡 Fix:</strong> ${issue.suggested_fix}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${report.entities && report.entities.length > 0 ? `
      <div class="section">
        <div class="section-title">🏷️ Detected Entities (${report.entities.length})</div>
        ${report.entities.map((entity: any) => `
          <div class="entity">
            <div class="entity-name">${entity.name}</div>
            <div style="color: #0369a1; font-size: 0.9em; margin-top: 3px;">
              ${entity.type} · ${entity.source}
            </div>
            ${entity.description ? `<div style="margin-top: 10px; color: #334155;">${entity.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function generateCrawlHTML(report: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crawl Report - ${report.base_url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
    .stat { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; }
    .pages { display: grid; gap: 15px; }
    .page-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .page-url { color: #1e40af; font-weight: 600; word-break: break-all; margin-bottom: 12px; }
    .page-scores { display: flex; flex-wrap: wrap; gap: 10px; }
    .score-badge { background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌐 Multi-Page Crawl Report</h1>
      <div style="color: #64748b; margin-top: 8px;">${report.base_url}</div>
      <div style="color: #94a3b8; font-size: 0.85em; margin-top: 5px;">
        ${new Date(report.crawled_at).toLocaleString()}
      </div>
      
      <div class="summary">
        <div class="stat">
          <div class="stat-value">${report.total_pages}</div>
          <div style="opacity: 0.9; margin-top: 5px;">Pages</div>
        </div>
        <div class="stat">
          <div class="stat-value">${report.summary.avg_overall_score.toFixed(1)}</div>
          <div style="opacity: 0.9; margin-top: 5px;">Avg Score</div>
        </div>
        <div class="stat">
          <div class="stat-value">${report.summary.avg_ai_readiness.toFixed(1)}</div>
          <div style="opacity: 0.9; margin-top: 5px;">Avg AI Readiness</div>
        </div>
        <div class="stat">
          <div class="stat-value">${report.summary.total_issues}</div>
          <div style="opacity: 0.9; margin-top: 5px;">Total Issues</div>
        </div>
      </div>
    </div>

    <div class="pages">
      ${report.pages.map((page: any, idx: number) => `
        <div class="page-card">
          <div style="color: #94a3b8; font-size: 0.85em; margin-bottom: 5px;">Page ${idx + 1}</div>
          <div class="page-url">${page.input.requested_url}</div>
          <div class="page-scores">
            <div class="score-badge">Overall: ${page.scores.overall}</div>
            <div class="score-badge">AI Readiness: ${page.scores.ai_readiness}</div>
            <div class="score-badge">Crawlability: ${page.scores.crawlability}</div>
            <div class="score-badge">Issues: ${page.issues.length}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

function generateCSV(report: any): string {
  const isCrawlReport = 'pages' in report && Array.isArray(report.pages);
  
  if (isCrawlReport) {
    const headers = ['Page', 'URL', 'Overall Score', 'AI Readiness', 'Crawlability', 'Issues'];
    const rows = report.pages.map((page: any, idx: number) => [
      idx + 1,
      `"${page.input.requested_url}"`,
      page.scores.overall,
      page.scores.ai_readiness,
      page.scores.crawlability,
      page.issues.length,
    ]);
    return [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  } else {
    const headers = ['ID', 'Severity', 'Category', 'Message', 'Fix'];
    const rows = report.issues.map((issue: any) => [
      issue.id,
      issue.severity,
      issue.category,
      `"${issue.message.replace(/"/g, '""')}"`,
      `"${issue.suggested_fix.replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  }
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#84cc16',
    info: '#3b82f6',
  };
  return colors[severity] || '#64748b';
}
