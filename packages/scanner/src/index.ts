import { analyzeUrlWithRules } from './scanWithRules.js';
import { generateScoringSummary, getLetterGrade } from './scoring.js';
import { exportAuditReport } from './output-formatter.js';

const result = await analyzeUrlWithRules('https://github.com', { 
  maxChunkTokens: 1200,
  enableChunking: true,
  enableExtractability: true,
  enableHallucinationDetection: true,
  enableLLM: true,
  llmConfig: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:0.5b',
  }
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

if (result.extractability) {
  console.log('\n\n=== Extractability ===');
  console.log(`Overall Score: ${result.extractability.score.extractabilityScore}/100`);
  console.log(`Server-Rendered: ${result.extractability.score.serverRenderedPercent}%`);
  console.log(`Text Extractable: ${result.extractability.contentTypes.text.percentage}%`);
  console.log(`Images Extractable: ${result.extractability.contentTypes.images.percentage}%`);
}

if (result.llm) {
  console.log('\n\n=== LLM Comprehension ===');
  console.log('Summary:', result.llm.summary);
  console.log('Key Topics:', result.llm.keyTopics?.join(', '));
  console.log('Reading Level:', result.llm.readingLevel);
  console.log('Sentiment:', result.llm.sentiment);
  console.log('Technical Depth:', result.llm.technicalDepth);
  console.log('Top Entities:');
  result.llm.topEntities.forEach(entity => {
    console.log(` - ${entity.name} (${entity.type}): ${(entity.relevance * 100).toFixed(1)}%`);
  });
  console.log('Generated Questions:');
  result.llm.questions.forEach((q, i) => {
    console.log(` ${i + 1}. [${q.difficulty}] ${q.question}`);
  });
  console.log('Suggested FAQ:');
  result.llm.suggestedFAQ.forEach((faq, i) => {
    console.log(` ${i + 1}. Q: ${faq.question}`);
    console.log(`     A: ${faq.suggestedAnswer} (Importance: ${faq.importance})`);
  });
}

if (result.hallucinationReport) {
  console.log('\n\n=== Hallucination Detection ===');
  console.log(`Risk Score: ${result.hallucinationReport.hallucinationRiskScore}/100`);
  
  if (result.hallucinationReport.factCheckSummary.totalFacts > 0) {
    console.log('\nFact Check Summary:');
    console.log(` - Total Facts: ${result.hallucinationReport.factCheckSummary.totalFacts}`);
    console.log(` - Verified: ${result.hallucinationReport.factCheckSummary.verifiedFacts}`);
    console.log(` - Unverified: ${result.hallucinationReport.factCheckSummary.unverifiedFacts}`);
    console.log(` - Contradictions: ${result.hallucinationReport.factCheckSummary.contradictions}`);
  }
  
  if (result.hallucinationReport.triggers.length > 0) {
    console.log(`\nTriggers Found: ${result.hallucinationReport.triggers.length}`);
    result.hallucinationReport.triggers.slice(0, 5).forEach((trigger, i) => {
      console.log(` ${i + 1}. [${trigger.severity}] ${trigger.type}`);
      console.log(`     ${trigger.description}`);
      console.log(`     Confidence: ${(trigger.confidence * 100).toFixed(0)}%`);
    });
  }
  
  if (result.hallucinationReport.recommendations.length > 0) {
    console.log('\nRecommendations:');
    result.hallucinationReport.recommendations.forEach(rec => {
      console.log(` - ${rec}`);
    });
  }
}

if (result.aiSummary) {
  console.log('\n\n=== AI-Readable Summary ===');
  console.log('📝 Short Summary:');
  console.log(result.aiSummary.summaryShort);
  console.log();
  
  console.log('📄 Long Summary:');
  console.log(result.aiSummary.summaryLong);
  console.log();
  
  console.log('🏷️  Suggested Title:', result.aiSummary.suggestedTitle);
  console.log('📋 Suggested Meta:', result.aiSummary.suggestedMeta);
  console.log('🔑 Keywords:', result.aiSummary.keywords.join(', '));
  
  if (result.aiSummary.readabilityScore !== undefined) {
    console.log('📊 Readability:', result.aiSummary.readabilityScore + '/100');
  }
  
  if (result.aiSummary.structureQuality) {
    console.log('🏗️  Structure:', result.aiSummary.structureQuality);
  }
}

// console.log('\n\n=== Standardized Audit Report ===');
// const auditReport = exportAuditReport(result, {
//   pretty: true,
//   includeDetailedScoring: true,
//   includeRaw: false
// });
// console.log(auditReport);

