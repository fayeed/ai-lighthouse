/**
 * Example: Using the standardized audit report format
 * 
 * Demonstrates how to generate audit reports in the standardized format
 * with different options and export methods
 */

import { analyzeUrlWithRules } from './scanWithRules.js';
import { formatAuditReport, exportAuditReport } from './output-formatter.js';
import { writeFile } from 'fs/promises';

async function generateAuditReports() {
  console.log('🔍 Scanning URL...\n');
  
  const url = 'https://www.janus.com/';
  const result = await analyzeUrlWithRules(url, {
    maxChunkTokens: 1200
  });

  console.log('✅ Scan complete!\n');

  // 1. Basic audit report (without detailed scoring or raw HTML)
  console.log('📄 Generating basic audit report...');
  const basicReport = exportAuditReport(result, {
    pretty: true,
    includeDetailedScoring: false,
    includeRaw: false
  });
  await writeFile('audit-report-basic.json', basicReport);
  console.log('   ✓ Saved to audit-report-basic.json');

  // 2. Detailed audit report (with scoring breakdown)
  console.log('📄 Generating detailed audit report...');
  const detailedReport = exportAuditReport(result, {
    pretty: true,
    includeDetailedScoring: true,
    includeRaw: false
  });
  await writeFile('audit-report-detailed.json', detailedReport);
  console.log('   ✓ Saved to audit-report-detailed.json');

  // 3. Full audit report (with raw HTML)
  console.log('📄 Generating full audit report...');
  const fullReport = exportAuditReport(result, {
    pretty: true,
    includeDetailedScoring: true,
    includeRaw: true
  });
  await writeFile('audit-report-full.json', fullReport);
  console.log('   ✓ Saved to audit-report-full.json');

  // 4. Programmatic access to audit data
  console.log('\n📊 Audit Report Summary:');
  const audit = formatAuditReport(result);
  
  console.log(`   Audit ID: ${audit.audit_id}`);
  console.log(`   URL: ${audit.input.requested_url}`);
  console.log(`   Scanned: ${audit.scanned_at}`);
  console.log(`   Overall Score: ${audit.scores.overall}/100`);
  console.log(`   AI Readiness: ${audit.scores.ai_readiness}/100`);
  console.log('\n   Score Breakdown:');
  console.log(`   • Crawlability: ${audit.scores.crawlability}/100`);
  console.log(`   • Structure: ${audit.scores.structure}/100`);
  console.log(`   • Schema Coverage: ${audit.scores.schema_coverage}/100`);
  console.log(`   • Content Clarity: ${audit.scores.content_clarity}/100`);
  console.log(`\n   Total Issues: ${audit.issues.length}`);
  console.log(`   Top Recommendations: ${audit.recommendations.length}`);
  console.log(`   Entities Detected: ${audit.entities.length}`);

  // 5. Display top recommendations
  console.log('\n🔧 Top Recommendations:');
  audit.recommendations.slice(0, 5).forEach((rec, idx) => {
    console.log(`\n   ${idx + 1}. [${rec.impact.toUpperCase()}] ${rec.issue_id}`);
    console.log(`      ${rec.fix.substring(0, 80)}${rec.fix.length > 80 ? '...' : ''}`);
  });

  console.log('\n' + '━'.repeat(60));
  console.log('✨ All audit reports generated successfully!');
  console.log('━'.repeat(60));
}

generateAuditReports().catch(console.error);
