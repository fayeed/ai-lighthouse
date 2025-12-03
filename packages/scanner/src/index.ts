import { analyzeUrlWithRules } from './scanWithRules.js';
import { generateScoringSummary, getLetterGrade } from './scoring.js';
import { exportAuditReport } from './output-formatter.js';

const result = await analyzeUrlWithRules('https://www.janus.com/', { 
  maxChunkTokens: 1200,
  enableChunking: true 
});

console.log('=== Legacy Output ===');
console.log('Issues:', result.issues.length);
console.log('\n' + generateScoringSummary(result.scoring!));

if (result.chunking) {
  console.log('\n\n=== Content Chunking ===');
  console.log(`Strategy: ${result.chunking.chunkingStrategy}`);
  console.log(`Total Chunks: ${result.chunking.totalChunks}`);
  console.log(`Average Tokens/Chunk: ${result.chunking.averageTokensPerChunk}`);
  console.log(`Average Noise: ${(result.chunking.averageNoiseRatio * 100).toFixed(1)}%`);
}

console.log('\n\n=== Standardized Audit Report ===');
const auditReport = exportAuditReport(result, {
  pretty: true,
  includeDetailedScoring: true,
  includeRaw: false
});
console.log(auditReport);

