import { analyzeUrlWithRules } from './scanWithRules.js';
import { generateScoringSummary, getLetterGrade } from './scoring.js';

const result = await analyzeUrlWithRules('https://www.janus.com/', { maxChunkTokens: 1200 });
console.log('Issues:', result.issues.length);
console.log('\n' + generateScoringSummary(result.scoring!));
console.log('\nDetailed Category Scores:');
result.scoring?.categoryScores.filter(cs => cs.issueCount > 0).forEach(cs => {
  console.log(`  ${cs.category}: ${cs.score}/100 (${getLetterGrade(cs.score)}) - ${cs.issueCount} issues, impact: ${cs.totalImpact}`);
});

