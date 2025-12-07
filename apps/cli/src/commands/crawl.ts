import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeUrlWithRules } from 'scanner';
import { exportAuditReport } from 'scanner';
import type { ScanOptions } from 'scanner';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

interface CrawlOptions {
  depth?: number;
  sitemap?: boolean;
  maxPages?: number;
  output?: string;
  followExternal?: boolean;
  respectRobots?: boolean;
}

export function crawlCommand(program: Command) {
  program
    .command('crawl')
    .description('Crawl and audit multiple pages from a website')
    .argument('<url>', 'Starting URL to crawl from')
    .option('-d, --depth <number>', 'Maximum crawl depth', parseInt, 2)
    .option('--sitemap', 'Parse sitemap.xml for URLs', false)
    .option('--max-pages <number>', 'Maximum number of pages to crawl', parseInt, 50)
    .option('-o, --output <format>', 'Output format: json, html', 'json')
    .option('--follow-external', 'Follow external links', false)
    .option('--respect-robots', 'Respect robots.txt rules', true)
    .action(async (url: string, options: CrawlOptions) => {
      const spinner = ora('Starting crawl...').start();

      try {
        const urlObj = new URL(url);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        
        // Discover URLs
        spinner.text = 'Discovering URLs...';
        let urlsToCrawl: string[] = [];

        if (options.sitemap) {
          // Try to parse sitemap
          const sitemapUrl = `${baseUrl}/sitemap.xml`;
          spinner.text = `Fetching sitemap from ${sitemapUrl}...`;
          urlsToCrawl = await parseSitemap(sitemapUrl);
          spinner.succeed(`Found ${urlsToCrawl.length} URLs in sitemap`);
        } else {
          // Crawl by depth
          urlsToCrawl = await crawlByDepth(url, options.depth!, options.maxPages!, options.followExternal!);
          spinner.succeed(`Discovered ${urlsToCrawl.length} URLs`);
        }

        // Limit pages
        if (urlsToCrawl.length > options.maxPages!) {
          urlsToCrawl = urlsToCrawl.slice(0, options.maxPages);
        }

        // Audit each page
        const results: any[] = [];
        for (let i = 0; i < urlsToCrawl.length; i++) {
          const pageUrl = urlsToCrawl[i];
          spinner.text = `Auditing ${i + 1}/${urlsToCrawl.length}: ${pageUrl}`;
          
          try {
            const result = await analyzeUrlWithRules(pageUrl, {
              maxChunkTokens: 1200,
              enableChunking: false,
              enableExtractability: false,
              enableLLM: false,
              minImpactScore: 8,
            });
            
            const report = exportAuditReport(result);
            results.push(report);
          } catch (error) {
            console.error(chalk.yellow(`\n⚠️  Failed to audit ${pageUrl}: ${error}`));
          }
        }

        spinner.text = 'Generating crawl report...';

        // Aggregate results
        const crawlReport = {
          crawl_id: generateId(),
          crawled_at: new Date().toISOString(),
          base_url: baseUrl,
          start_url: url,
          total_pages: results.length,
          crawl_depth: options.depth,
          pages: results,
          summary: {
            avg_overall_score: average(results.map(r => r.scores.overall)),
            avg_ai_readiness: average(results.map(r => r.scores.ai_readiness)),
            total_issues: results.reduce((sum, r) => sum + r.issues.length, 0),
            issues_by_severity: aggregateIssuesBySeverity(results),
          },
        };

        // Save results
        const outputDir = resolve(process.cwd(), '.ai-lighthouse');
        if (!existsSync(outputDir)) {
          await mkdir(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const baseFilename = `crawl_${new URL(url).hostname}_${timestamp}`;

        if (options.output === 'json') {
          const jsonPath = join(outputDir, `${baseFilename}.json`);
          await writeFile(jsonPath, JSON.stringify(crawlReport, null, 2));
          spinner.succeed(chalk.green('Crawl complete!'));
          console.log(chalk.dim(`Report saved to: ${jsonPath}`));
        } else if (options.output === 'html') {
          const htmlPath = join(outputDir, `${baseFilename}.html`);
          const html = generateCrawlHTML(crawlReport);
          await writeFile(htmlPath, html);
          spinner.succeed(chalk.green('Crawl complete!'));
          console.log(chalk.dim(`HTML report saved to: ${htmlPath}`));
        }

        // Display summary
        console.log('\n' + chalk.bold('🌐 Crawl Summary'));
        console.log(`Pages audited: ${chalk.cyan(crawlReport.total_pages)}`);
        console.log(`Average overall score: ${chalk.cyan(crawlReport.summary.avg_overall_score.toFixed(1))}`);
        console.log(`Average AI readiness: ${chalk.cyan(crawlReport.summary.avg_ai_readiness.toFixed(1))}`);
        console.log(`Total issues found: ${chalk.yellow(crawlReport.summary.total_issues)}`);

      } catch (error) {
        spinner.fail(chalk.red('Crawl failed'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}

async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    
    const text = await response.text();
    const urlMatches = text.match(/<loc>(.*?)<\/loc>/g) || [];
    return urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
  } catch (error) {
    console.warn(chalk.yellow(`Could not parse sitemap: ${error}`));
    return [];
  }
}

async function crawlByDepth(
  startUrl: string,
  maxDepth: number,
  maxPages: number,
  followExternal: boolean
): Promise<string[]> {
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const baseHost = new URL(startUrl).host;

  while (toVisit.length > 0 && visited.size < maxPages) {
    const { url, depth } = toVisit.shift()!;
    
    if (visited.has(url) || depth > maxDepth) {
      continue;
    }

    visited.add(url);

    if (depth < maxDepth) {
      try {
        const links = await extractLinks(url);
        for (const link of links) {
          const linkHost = new URL(link).host;
          if (followExternal || linkHost === baseHost) {
            if (!visited.has(link)) {
              toVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        // Skip pages that fail to load
      }
    }
  }

  return Array.from(visited);
}

async function extractLinks(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Simple regex-based link extraction (in production, use a proper HTML parser)
    const linkMatches = html.match(/href=["'](https?:\/\/[^"']+)["']/g) || [];
    return linkMatches
      .map(match => match.match(/href=["'](https?:\/\/[^"']+)["']/)![1])
      .filter((link, idx, arr) => arr.indexOf(link) === idx); // unique
  } catch {
    return [];
  }
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function aggregateIssuesBySeverity(results: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const result of results) {
    for (const issue of result.issues) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    }
  }

  return counts;
}

function generateId(): string {
  return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    h1 { color: #2563eb; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
    .stat { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 2em; font-weight: bold; }
    .stat-label { opacity: 0.9; font-size: 0.9em; }
    .pages { display: grid; gap: 15px; }
    .page-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .page-url { color: #1e40af; font-weight: 600; margin-bottom: 10px; word-break: break-all; }
    .page-scores { display: flex; gap: 15px; margin-top: 10px; }
    .score-badge { background: #dbeafe; color: #1e40af; padding: 5px 12px; border-radius: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌐 Crawl Report</h1>
      <div style="color: #64748b; margin-top: 5px;">${report.base_url}</div>
      <div style="color: #94a3b8; font-size: 0.85em; margin-top: 5px;">
        Generated: ${new Date(report.crawled_at).toLocaleString()}
      </div>
      
      <div class="summary">
        <div class="stat">
          <div class="stat-label">Pages Audited</div>
          <div class="stat-value">${report.total_pages}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Avg Overall Score</div>
          <div class="stat-value">${report.summary.avg_overall_score.toFixed(1)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Avg AI Readiness</div>
          <div class="stat-value">${report.summary.avg_ai_readiness.toFixed(1)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Issues</div>
          <div class="stat-value">${report.summary.total_issues}</div>
        </div>
      </div>
    </div>

    <div class="pages">
      ${report.pages.map((page: any) => `
        <div class="page-card">
          <div class="page-url">${page.input.requested_url}</div>
          <div class="page-scores">
            <div class="score-badge">Overall: ${page.scores.overall}</div>
            <div class="score-badge">AI Readiness: ${page.scores.ai_readiness}</div>
            <div class="score-badge">Issues: ${page.issues.length}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}
