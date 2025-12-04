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

if (result.entities) {
  console.log('\n\n=== Named Entities ===');
  console.log(`Total Entities: ${result.entities.summary.totalEntities}`);
  
  console.log('\nBy Type:');
  for (const [type, count] of Object.entries(result.entities.summary.byType)) {
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  }
  
  console.log('\nConfidence Distribution:');
  console.log(`  High (≥80%): ${result.entities.summary.highConfidence}`);
  console.log(`  Medium (50-80%): ${result.entities.summary.mediumConfidence}`);
  console.log(`  Low (<50%): ${result.entities.summary.lowConfidence}`);
  
  if (result.entities.entities.length > 0) {
    console.log('\nTop Entities (by confidence):');
    result.entities.entities.slice(0, 15).forEach((entity, i) => {
      const conf = (entity.confidence * 100).toFixed(0);
      console.log(`  ${i + 1}. [${entity.type}] ${entity.name} (${conf}%)`);
      if (entity.metadata?.source) {
        console.log(`      Source: ${entity.metadata.source}`);
      }
      if (entity.metadata?.context) {
        console.log(`      Context: ${entity.metadata.context}`);
      }
    });
    
    if (result.entities.entities.length > 15) {
      console.log(`  ... and ${result.entities.entities.length - 15} more entities`);
    }
  }
  
  if (result.entities.schemaMapping && Object.keys(result.entities.schemaMapping).length > 0) {
    console.log('\nSchema.org Mappings:');
    for (const [field, entities] of Object.entries(result.entities.schemaMapping)) {
      console.log(`  ${field}: ${entities.length} entity(ies)`);
    }
  }
}

if (result.faqs) {
  console.log('\n\n=== Suggested FAQs ===');
  console.log(`Total FAQs: ${result.faqs.summary.totalFAQs}`);
  
  console.log('\nBy Importance:');
  console.log(`  High: ${result.faqs.summary.byImportance.high}`);
  console.log(`  Medium: ${result.faqs.summary.byImportance.medium}`);
  console.log(`  Low: ${result.faqs.summary.byImportance.low}`);
  
  console.log(`\nAverage Confidence: ${(result.faqs.summary.averageConfidence * 100).toFixed(0)}%`);
  
  if (result.faqs.faqs.length > 0) {
    console.log('\nTop FAQs:');
    result.faqs.faqs.slice(0, 10).forEach((faq, i) => {
      const conf = (faq.confidence * 100).toFixed(0);
      console.log(`\n  ${i + 1}. [${faq.importance.toUpperCase()}] [${faq.source}] (${conf}%)`);
      console.log(`      Q: ${faq.question}`);
      console.log(`      A: ${faq.suggestedAnswer.slice(0, 150)}${faq.suggestedAnswer.length > 150 ? '...' : ''}`);
    });
    
    if (result.faqs.faqs.length > 10) {
      console.log(`\n  ... and ${result.faqs.faqs.length - 10} more FAQs`);
    }
  }
}

// console.log('\n\n=== Standardized Audit Report ===');
// const auditReport = exportAuditReport(result, {
//   pretty: true,
//   includeDetailedScoring: true,
//   includeRaw: false
// });
// console.log(auditReport);


