import { analyzeUrlWithRules } from './scanWithRules.js';
import { generateScoringSummary, getLetterGrade } from './scoring.js';
import { exportAuditReport } from './output-formatter.js';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           AI Lighthouse Scanner - Simplified Output            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const result = await analyzeUrlWithRules('https://github.com', { 
  maxChunkTokens: 1200,
  enableChunking: true,
  enableExtractability: true,
  enableHallucinationDetection: true,
  enableLLM: true,
  
  // Quality filters (reduce noise)
  minImpactScore: 8,      // Only show issues with impact ≥ 8
  minConfidence: 0.7,     // Only show issues with 70%+ confidence
  maxIssues: 15,          // Limit to top 15 issues
  
  llmConfig: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:0.5b',
  },
});

console.log('=== Scan Summary ===');
console.log('Issues:', result.issues.length);
console.log('\n' + generateScoringSummary(result.scoring!));

// Filter to show only high-impact issues (≥8 impact score)
const highImpactIssues = result.issues.filter(i => i.impactScore >= 8);
if (highImpactIssues.length > 0) {
  console.log('\n📌 Top Priority Issues (Impact ≥ 8):');
  highImpactIssues.slice(0, 10).forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.serverity.toUpperCase()}] ${issue.title}`);
    console.log(`   Impact: ${issue.impactScore} | Confidence: ${((issue.confidence || 1) * 100).toFixed(0)}%`);
    console.log(`   ${issue.description.slice(0, 120)}...`);
    console.log(`   Fix: ${issue.remediation.slice(0, 120)}...`);
  });
}

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
  console.log('\n\n=== AI Understanding Analysis ===');
  console.log('📝 Summary:', result.llm.summary);
  console.log('🏷️  Key Topics:', result.llm.keyTopics?.join(', '));
  console.log('📊 Reading Level:', result.llm.readingLevel?.description);
  console.log('🎭 Sentiment:', result.llm.sentiment);
  console.log('🎯 Technical Depth:', result.llm.technicalDepth);
  
  if (result.llm.topEntities && result.llm.topEntities.length > 0) {
    console.log('\n🔍 Key Entities:');
    result.llm.topEntities.slice(0, 5).forEach(entity => {
      console.log(`   • ${entity.name} (${entity.type}): ${(entity.relevance * 100).toFixed(0)}% relevance`);
    });
  }
  
  // Only show high-value questions (not obvious ones)
  const valuableQuestions = result.llm.questions.filter(q => 
    !q.question.toLowerCase().includes('what is') || q.difficulty !== 'basic'
  );
  if (valuableQuestions.length > 0) {
    console.log('\n❓ Key Questions AI Can Answer:');
    valuableQuestions.slice(0, 3).forEach((q, i) => {
      console.log(`   ${i + 1}. [${q.difficulty}] ${q.question}`);
    });
  }
  
  // Only show high-importance FAQs
  const importantFAQs = result.llm.suggestedFAQ.filter(f => f.importance === 'high');
  if (importantFAQs.length > 0) {
    console.log('\n💡 Suggested High-Priority FAQs:');
    importantFAQs.slice(0, 3).forEach((faq, i) => {
      console.log(`   ${i + 1}. Q: ${faq.question}`);
      console.log(`      A: ${faq.suggestedAnswer.slice(0, 100)}...`);
    });
  }
}

if (result.hallucinationReport) {
  console.log('\n\n=== Hallucination Risk Assessment ===');
  console.log(`⚠️  Risk Score: ${result.hallucinationReport.hallucinationRiskScore}/100`);
  
  // Only show if there are actual concerns
  const highSeverityTriggers = result.hallucinationReport.triggers.filter(
    t => t.severity === 'high' || t.severity === 'critical'
  );
  
  if (highSeverityTriggers.length > 0) {
    console.log('\n🚨 High Priority Concerns:');
    highSeverityTriggers.slice(0, 3).forEach((trigger, i) => {
      console.log(`   ${i + 1}. [${trigger.type}] ${trigger.description}`);
      console.log(`      Confidence: ${(trigger.confidence * 100).toFixed(0)}%`);
    });
  } else if (result.hallucinationReport.hallucinationRiskScore > 30) {
    console.log('\n📋 Moderate risk detected');
    if (result.hallucinationReport.recommendations.length > 0) {
      console.log('   Recommendation:', result.hallucinationReport.recommendations[0]);
    }
  } else {
    console.log('   ✅ Low risk - content is clear and verifiable');
  }
}

// REMOVED: AI-Readable Summary section (redundant with LLM Understanding)
// REMOVED: Named Entities section (consolidated into LLM Understanding)
// REMOVED: Suggested FAQs section (consolidated into LLM Understanding)

if (result.mirrorReport) {
  console.log('\n\n=== AI Misunderstanding Check ===');
  console.log(`🎯 Alignment Score: ${result.mirrorReport.summary.alignmentScore}/100`);
  console.log(`📖 Clarity Score: ${result.mirrorReport.summary.clarityScore}/100`);
  
  // Only show if there are actual issues
  if (result.mirrorReport.summary.critical > 0 || result.mirrorReport.summary.major > 0) {
    console.log(`\n⚠️  ${result.mirrorReport.summary.critical + result.mirrorReport.summary.major} Priority Mismatches Found`);
    
    const priorityMismatches = result.mirrorReport.mismatches.filter(
      m => m.severity === 'critical' || m.severity === 'major'
    );
    
    priorityMismatches.slice(0, 3).forEach((mismatch, i) => {
      const icon = mismatch.severity === 'critical' ? '🔴' : '🟡';
      console.log(`\n   ${icon} ${mismatch.field}: ${mismatch.description}`);
      console.log(`      Fix: ${mismatch.recommendation.slice(0, 120)}...`);
    });
    
    if (result.mirrorReport.recommendations.length > 0) {
      console.log('\n   💡 Top Recommendation:', result.mirrorReport.recommendations[0]);
    }
  } else {
    console.log('   ✅ No critical misunderstandings - AI correctly interprets your messaging');
  }
}

// console.log('\n\n=== Standardized Audit Report ===');
// const auditReport = exportAuditReport(result, {
//   pretty: true,
//   includeDetailedScoring: true,
//   includeRaw: false
// });
// console.log(auditReport);




