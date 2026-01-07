import { analyzeUrlWithRules } from './src/scanWithRules.js';
import { enrichIssuesMetadata, getQuickWins, sortByPriority } from './src/utils/effort-impact.js';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           Testing New AI Lighthouse Rules                      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test with a simple site
const result = await analyzeUrlWithRules('https://example.com', {
  enableChunking: false,
  enableExtractability: false,
  enableLLM: false,
  enableHallucinationDetection: false,
  minImpactScore: 0,
  minConfidence: 0,
});

console.log(`\n✅ Scan completed! Found ${result.issues.length} total issues\n`);

// Enrich issues with effort/impact metadata
const enrichedIssues = enrichIssuesMetadata(result.issues);

// Find our new rules
const newRuleIds = [
  'CRAWL-010', // Missing sitemap
  'CRAWL-011', // Missing mobile viewport
  'CRAWL-012', // Redirect chain
  'CRAWL-013', // Missing alternative access (RSS/API)
  'CONTENT_CLARITY-008', // Missing publish date
  'CONTENT_CLARITY-009', // Inconsistent numerical formatting
];

const newRuleIssues = enrichedIssues.filter(issue =>
  newRuleIds.some(id => issue.id.includes(id))
);

if (newRuleIssues.length > 0) {
  console.log('🎯 New Rules Detected:\n');
  newRuleIssues.forEach(issue => {
    console.log(`✓ [${issue.id}] ${issue.title}`);
    console.log(`  Severity: ${issue.severity} | Impact: ${issue.impactScore}`);
    console.log(`  Effort: ${issue.effortLevel || 'N/A'} | Impact Level: ${issue.impactLevel || 'N/A'}`);
    console.log(`  ${issue.description.slice(0, 100)}...`);
    console.log('');
  });
} else {
  console.log('ℹ️  No issues from new rules detected on example.com (this is expected - it\'s a simple page)\n');
}

// Show quick wins
const quickWins = getQuickWins(enrichedIssues);
console.log(`\n🚀 Quick Wins (High Impact, Low Effort): ${quickWins.length} issues\n`);
if (quickWins.length > 0) {
  quickWins.slice(0, 5).forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.effortLevel}] ${issue.title}`);
    console.log(`   Impact: ${issue.impactScore} | ${issue.remediation.slice(0, 80)}...`);
  });
}

// Show all issues sorted by priority
console.log(`\n\n📊 All Issues (sorted by priority):\n`);
const sortedIssues = sortByPriority(enrichedIssues);
sortedIssues.slice(0, 10).forEach((issue, i) => {
  console.log(`${i + 1}. [${issue.severity}] ${issue.title}`);
  console.log(`   Impact: ${issue.impactScore} | Effort: ${issue.effortLevel || 'auto'} | Confidence: ${(issue.confidence || 1) * 100}%`);
});

console.log('\n\n✅ Test completed successfully!');
console.log('\n💡 To test specific rules, try scanning sites that trigger them:');
console.log('   - Blog/news sites for RSS/publish date rules');
console.log('   - Sites without sitemaps');
console.log('   - Sites with redirect chains');
console.log('   - Pages with inconsistent number formatting\n');
