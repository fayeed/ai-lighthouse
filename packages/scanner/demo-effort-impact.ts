import { analyzeUrlWithRules } from './src/scanWithRules.js';
import { enrichIssuesMetadata, getQuickWins, sortByPriority } from './src/utils/effort-impact.js';
import { EFFORT_LEVEL, IMPACT_LEVEL } from './src/types.js';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║       AI Lighthouse - Effort/Impact Prioritization Demo       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Scan a URL
const url = process.argv[2] || 'https://example.com';
console.log(`Scanning: ${url}\n`);

const result = await analyzeUrlWithRules(url, {
  enableChunking: false,
  enableExtractability: false,
  enableLLM: false,
  minImpactScore: 8,
  minConfidence: 0.7,
});

console.log(`Found ${result.issues.length} issues (filtered by impact ≥8, confidence ≥70%)\n`);

// Enrich with effort/impact metadata
const enrichedIssues = enrichIssuesMetadata(result.issues);

// 1. Show Effort/Impact Matrix
console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 EFFORT/IMPACT MATRIX');
console.log('═══════════════════════════════════════════════════════════════\n');

const matrix: Record<string, Record<string, number>> = {};

// Initialize matrix
Object.values(EFFORT_LEVEL).forEach(effort => {
  matrix[effort] = {};
  Object.values(IMPACT_LEVEL).forEach(impact => {
    matrix[effort][impact] = 0;
  });
});

// Populate matrix
enrichedIssues.forEach(issue => {
  const effort = issue.effortLevel || EFFORT_LEVEL.MODERATE;
  const impact = issue.impactLevel || IMPACT_LEVEL.MEDIUM;
  matrix[effort][impact]++;
});

// Print matrix header
console.log('Effort Level    | Minimal | Low | Medium | High | Critical | Total');
console.log('----------------|---------|-----|--------|------|----------|------');

let totalByEffort: Record<string, number> = {};
Object.values(EFFORT_LEVEL).forEach(effort => {
  const counts = Object.values(IMPACT_LEVEL).map(impact => matrix[effort][impact]);
  const total = counts.reduce((a, b) => a + b, 0);
  totalByEffort[effort] = total;
  const effortLabel = effort.padEnd(14);
  console.log(
    `${effortLabel} | ${counts[0].toString().padStart(7)} | ${counts[1].toString().padStart(3)} | ${counts[2].toString().padStart(6)} | ${counts[3].toString().padStart(4)} | ${counts[4].toString().padStart(8)} | ${total.toString().padStart(5)}`
  );
});

console.log('----------------|---------|-----|--------|------|----------|------');

// Print totals row
const totalsByImpact = Object.values(IMPACT_LEVEL).map(impact =>
  Object.values(EFFORT_LEVEL)
    .map(effort => matrix[effort][impact])
    .reduce((a, b) => a + b, 0)
);
const grandTotal = totalsByImpact.reduce((a, b) => a + b, 0);
console.log(
  `TOTAL          | ${totalsByImpact[0].toString().padStart(7)} | ${totalsByImpact[1].toString().padStart(3)} | ${totalsByImpact[2].toString().padStart(6)} | ${totalsByImpact[3].toString().padStart(4)} | ${totalsByImpact[4].toString().padStart(8)} | ${grandTotal.toString().padStart(5)}`
);

// 2. Show Quick Wins
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('⚡ QUICK WINS (High Impact, Low Effort)');
console.log('═══════════════════════════════════════════════════════════════\n');

const quickWins = getQuickWins(enrichedIssues);

if (quickWins.length === 0) {
  console.log('✅ No quick wins available - either all critical issues are fixed,');
  console.log('   or remaining issues require significant effort.\n');
} else {
  console.log(`Found ${quickWins.length} quick wins. Fix these first for maximum ROI:\n`);

  quickWins.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.effortLevel?.toUpperCase()}] ${issue.title}`);
    console.log(`   Impact Score: ${issue.impactScore} | Impact Level: ${issue.impactLevel}`);
    console.log(`   Severity: ${issue.severity} | Confidence: ${((issue.confidence || 1) * 100).toFixed(0)}%`);
    console.log(`   Fix: ${issue.remediation.slice(0, 100)}...`);
    console.log('');
  });
}

// 3. Show Prioritized List
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎯 PRIORITIZED ISSUE LIST (by Priority Score)');
console.log('═══════════════════════════════════════════════════════════════\n');

const sorted = sortByPriority(enrichedIssues);

console.log('Priority score = Impact Score × Effort Weight × Confidence');
console.log('Effort weights: QUICK=5, EASY=4, MODERATE=3, SIGNIFICANT=2, MAJOR=1\n');

sorted.slice(0, 15).forEach((issue, i) => {
  const effortWeight = {
    [EFFORT_LEVEL.QUICK]: 5,
    [EFFORT_LEVEL.EASY]: 4,
    [EFFORT_LEVEL.MODERATE]: 3,
    [EFFORT_LEVEL.SIGNIFICANT]: 2,
    [EFFORT_LEVEL.MAJOR]: 1,
  }[issue.effortLevel || EFFORT_LEVEL.MODERATE];

  const priorityScore = (issue.impactScore * effortWeight * (issue.confidence || 1)).toFixed(1);

  console.log(`${(i + 1).toString().padStart(2)}. [Priority: ${priorityScore.padStart(5)}] ${issue.title}`);
  console.log(`    ${issue.severity.toUpperCase().padEnd(10)} | Impact: ${issue.impactScore.toString().padStart(2)} | Effort: ${(issue.effortLevel || 'auto').padEnd(10)} | Conf: ${((issue.confidence || 1) * 100).toFixed(0)}%`);
  console.log('');
});

// 4. Show Recommendations
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('💡 RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════════\n');

const quickWinCount = quickWins.length;
const moderateCount = totalByEffort[EFFORT_LEVEL.MODERATE] || 0;
const significantCount = totalByEffort[EFFORT_LEVEL.SIGNIFICANT] || 0;
const majorCount = totalByEffort[EFFORT_LEVEL.MAJOR] || 0;

console.log(`Quick Strategy (Sprint 1):`);
console.log(`  → Focus on ${quickWinCount} quick wins first`);
console.log(`  → Estimated time: ${quickWinCount * 1.5} hours (avg 1.5hrs each)`);
console.log(`  → Expected impact: High (maximum ROI)\n`);

if (moderateCount > 0) {
  console.log(`Medium-term Strategy (Sprint 2-3):`);
  console.log(`  → Address ${moderateCount} moderate-effort issues`);
  console.log(`  → Estimated time: ${moderateCount * 5} hours (avg 5hrs each)`);
  console.log(`  → Expected impact: Medium-High\n`);
}

if (significantCount > 0 || majorCount > 0) {
  const longTermCount = significantCount + majorCount;
  console.log(`Long-term Strategy (Sprint 4+):`);
  console.log(`  → Plan for ${longTermCount} significant/major issues`);
  console.log(`  → These may require architecture changes or major refactoring`);
  console.log(`  → Consider if the ROI justifies the effort\n`);
}

console.log('\n✅ Demo complete! Use this prioritization to plan your optimization work.\n');
