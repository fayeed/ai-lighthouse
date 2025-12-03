import { analyzeUrlWithRules } from './scanWithRules.js';
import { generateScoringSummary, getLetterGrade } from './scoring.js';
import { exportAuditReport } from './output-formatter.js';

const result = await analyzeUrlWithRules('https://www.janus.com/', { maxChunkTokens: 1200 });

console.log('=== Legacy Output ===');
console.log('Issues:', result.issues.length);
console.log('\n' + generateScoringSummary(result.scoring!));

console.log('\n\n=== Standardized Audit Report ===');
const auditReport = exportAuditReport(result, {
  pretty: true,
  includeDetailedScoring: true,
  includeRaw: false
});
console.log(auditReport);

