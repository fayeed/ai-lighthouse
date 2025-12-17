import chalk from 'chalk';

/**
 * Comprehensive CLI formatter that displays all data shown on the website
 */

export function formatComprehensiveReport(result: any, aiReadiness: any): string {
  const sections: string[] = [];

  // LLM/AI Understanding Section
  if (result.llm) {
    sections.push(formatLLMSection(result.llm));
  }

  // Chunking Section
  if (result.chunking) {
    sections.push(formatChunkingSection(result.chunking));
  }

  // Extractability Section
  if (result.extractability) {
    sections.push(formatExtractabilitySection(result.extractability));
  }

  // Hallucination Risk Section
  if (result.hallucinationReport) {
    sections.push(formatHallucinationSection(result.hallucinationReport));
  }

  // Mirror Report Section
  if (result.mirrorReport) {
    sections.push(formatMirrorReportSection(result.mirrorReport));
  }

  // Dimension Scores
  if (aiReadiness?.dimensions) {
    sections.push(formatDimensionsSection(aiReadiness.dimensions));
  }

  // Quick Wins
  if (aiReadiness?.quickWins && aiReadiness.quickWins.length > 0) {
    sections.push(formatQuickWinsSection(aiReadiness.quickWins));
  }

  return sections.join('\n\n');
}

function formatLLMSection(llm: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.blue('📝 AI Understanding Analysis'));
  lines.push('─'.repeat(70));
  
  if (llm.summary) {
    lines.push(chalk.bold('Summary:'));
    lines.push(`  ${llm.summary}`);
    lines.push('');
  }

  if (llm.pageType) {
    lines.push(chalk.bold('Inferred Page Type:'));
    lines.push(`  ${chalk.magenta.bold(llm.pageType)}`);
    
    if (llm.pageTypeInsights && llm.pageTypeInsights.length > 0) {
      lines.push('');
      lines.push(chalk.bold('💡 AI-Generated Insights:'));
      llm.pageTypeInsights.forEach((insight: string) => {
        lines.push(`  ${chalk.cyan('•')} ${insight}`);
      });
    }
    lines.push('');
  }

  if (llm.keyTopics && llm.keyTopics.length > 0) {
    lines.push(chalk.bold('Key Topics:'));
    lines.push(`  ${llm.keyTopics.map((t: string) => chalk.blue(t)).join(', ')}`);
    lines.push('');
  }

  const metadata = [];
  if (llm.readingLevel) {
    metadata.push(`Reading Level: ${llm.readingLevel.description}`);
  }
  if (llm.sentiment) {
    metadata.push(`Sentiment: ${llm.sentiment}`);
  }
  if (llm.technicalDepth) {
    metadata.push(`Technical Depth: ${llm.technicalDepth}`);
  }
  
  if (metadata.length > 0) {
    lines.push(chalk.bold('Metadata:'));
    metadata.forEach(m => lines.push(`  ${m}`));
    lines.push('');
  }

  if (llm.topEntities && llm.topEntities.length > 0) {
    lines.push(chalk.bold('🔍 Key Entities:'));
    llm.topEntities.slice(0, 5).forEach((entity: any) => {
      const relevance = entity.relevance ? ` - ${Math.round(entity.relevance * 100)}% relevance` : '';
      lines.push(`  ${chalk.cyan('•')} ${chalk.bold(entity.name)} ${chalk.dim(`(${entity.type})${relevance}`)}`);
    });
    lines.push('');
  }

  if (llm.questions && llm.questions.length > 0) {
    lines.push(chalk.bold('❓ Questions AI Can Answer:'));
    llm.questions.slice(0, 5).forEach((q: any, idx: number) => {
      const difficulty = chalk.dim(`[${q.difficulty.toUpperCase()}]`);
      lines.push(`  ${idx + 1}. ${difficulty} ${q.question}`);
    });
    lines.push('');
  }

  if (llm.suggestedFAQ && llm.suggestedFAQ.length > 0) {
    lines.push(chalk.bold('💡 Suggested FAQs:'));
    llm.suggestedFAQ
      .filter((f: any) => f.importance === 'high')
      .slice(0, 3)
      .forEach((faq: any, idx: number) => {
        lines.push(`  ${idx + 1}. Q: ${chalk.yellow(faq.question)}`);
        lines.push(`     A: ${chalk.dim(faq.suggestedAnswer)}`);
      });
  }

  return lines.join('\n');
}

function formatChunkingSection(chunking: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.green('📄 Content Chunking Analysis'));
  lines.push('─'.repeat(70));
  
  const grid = [
    ['Strategy', chunking.chunkingStrategy],
    ['Total Chunks', chunking.totalChunks.toString()],
    ['Avg Tokens/Chunk', chunking.averageTokensPerChunk.toString()],
    ['Avg Noise Ratio', `${(chunking.averageNoiseRatio * 100).toFixed(1)}%`],
  ];

  grid.forEach(([label, value]) => {
    lines.push(`  ${chalk.bold(label + ':').padEnd(25)} ${chalk.cyan(value)}`);
  });

  if (chunking.chunkingStrategy === 'heading-based') {
    lines.push('');
    lines.push(chalk.green('  ✓ Heading-based chunking is ideal for AI comprehension'));
  } else if (chunking.chunkingStrategy === 'paragraph-based') {
    lines.push('');
    lines.push(chalk.yellow('  ⚠ Consider adding headings for better semantic structure'));
  }

  if (chunking.chunks && chunking.chunks.length > 0) {
    lines.push('');
    lines.push(chalk.bold('Chunk Distribution:'));
    
    // Show token distribution
    const tokenCounts = chunking.chunks.map((c: any) => c.tokenCount);
    const min = Math.min(...tokenCounts);
    const max = Math.max(...tokenCounts);
    const avg = tokenCounts.reduce((a: number, b: number) => a + b, 0) / tokenCounts.length;
    
    lines.push(`  Min Tokens: ${min}, Max Tokens: ${max}, Avg: ${avg.toFixed(0)}`);
    
    // Show noise distribution
    const noiseRatios = chunking.chunks.map((c: any) => c.noiseRatio);
    const avgNoise = noiseRatios.reduce((a: number, b: number) => a + b, 0) / noiseRatios.length;
    lines.push(`  Avg Noise per Chunk: ${(avgNoise * 100).toFixed(1)}%`);
  }

  return lines.join('\n');
}

function formatExtractabilitySection(extractability: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.yellow('🔄 Extractability Analysis'));
  lines.push('─'.repeat(70));
  
  const grid = [
    ['Overall Score', `${extractability.score.extractabilityScore}/100`],
    ['Server-Rendered', `${extractability.score.serverRenderedPercent}%`],
  ];

  grid.forEach(([label, value]) => {
    lines.push(`  ${chalk.bold(label + ':').padEnd(25)} ${chalk.cyan(value)}`);
  });

  lines.push('');
  lines.push(chalk.bold('Content Type Extractability:'));
  
  Object.entries(extractability.contentTypes).forEach(([type, data]: [string, any]) => {
    const percentage = data.percentage;
    const color = percentage >= 80 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red;
    lines.push(`  ${chalk.bold(type.charAt(0).toUpperCase() + type.slice(1) + ':').padEnd(15)} ${color(`${percentage}%`)} (${data.extractable}/${data.total})`);
  });

  const overallScore = extractability.score.extractabilityScore;
  if (overallScore >= 80) {
    lines.push('');
    lines.push(chalk.green('  ✓ Good extractability - AI can easily read your content'));
  } else if (overallScore < 50) {
    lines.push('');
    lines.push(chalk.red('  ⚠ Low extractability - Consider server-side rendering'));
  }

  return lines.join('\n');
}

function formatHallucinationSection(report: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.red('⚠️  Hallucination Risk Assessment'));
  lines.push('─'.repeat(70));
  
  const riskScore = report.hallucinationRiskScore;
  const riskColor = riskScore >= 70 ? chalk.red : riskScore >= 40 ? chalk.yellow : chalk.green;
  lines.push(`  ${chalk.bold('Risk Score:')} ${riskColor.bold(`${riskScore}/100`)}`);
  
  if (report.factCheckSummary) {
    lines.push('');
    lines.push(chalk.bold('Fact Check Summary:'));
    const summary = report.factCheckSummary;
    lines.push(`  Total Facts:      ${chalk.cyan(summary.totalFacts)}`);
    lines.push(`  Verified:         ${chalk.green(summary.verifiedFacts)}`);
    lines.push(`  Unverified:       ${chalk.yellow(summary.unverifiedFacts)}`);
    lines.push(`  Contradictions:   ${chalk.red(summary.contradictions)}`);
    if (summary.ambiguities !== undefined) {
      lines.push(`  Ambiguities:      ${chalk.yellow(summary.ambiguities)}`);
    }
  }

  if (report.factCheckSummary && report.factCheckSummary.unverifiedFacts > 0) {
    lines.push('');
    lines.push(chalk.yellow('💡 Tip: Add citations and links to verify claims and reduce AI hallucination risk'));
  }

  if (report.triggers && report.triggers.length > 0) {
    const highSeverityTriggers = report.triggers.filter(
      (t: any) => t.severity === 'high' || t.severity === 'critical'
    );
    
    if (highSeverityTriggers.length > 0) {
      lines.push('');
      lines.push(chalk.bold('🚨 High-Risk Triggers:'));
      highSeverityTriggers.slice(0, 5).forEach((trigger: any, idx: number) => {
        lines.push(`  ${idx + 1}. ${chalk.red(`[${trigger.severity.toUpperCase()}]`)} ${trigger.type}`);
        lines.push(`     ${chalk.dim(trigger.description)}`);
        if (trigger.confidence) {
          lines.push(`     ${chalk.dim(`Confidence: ${Math.round(trigger.confidence * 100)}%`)}`);
        }
      });
    }
  }

  if (report.recommendations && report.recommendations.length > 0) {
    lines.push('');
    lines.push(chalk.bold('💡 Recommendations:'));
    report.recommendations.slice(0, 3).forEach((rec: string, idx: number) => {
      lines.push(`  ${idx + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

function formatMirrorReportSection(report: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.magenta('🔍 AI Misunderstanding Check'));
  lines.push('─'.repeat(70));
  
  const alignmentColor = report.summary.alignmentScore >= 80 ? chalk.green : 
                        report.summary.alignmentScore >= 60 ? chalk.yellow : chalk.red;
  const clarityColor = report.summary.clarityScore >= 80 ? chalk.green : 
                      report.summary.clarityScore >= 60 ? chalk.yellow : chalk.red;

  lines.push(`  ${chalk.bold('Alignment Score:').padEnd(25)} ${alignmentColor.bold(`${report.summary.alignmentScore}/100`)}`);
  lines.push(`  ${chalk.bold('Clarity Score:').padEnd(25)} ${clarityColor.bold(`${report.summary.clarityScore}/100`)}`);
  lines.push(`  ${chalk.bold('Critical Issues:').padEnd(25)} ${chalk.red(report.summary.critical)}`);
  lines.push(`  ${chalk.bold('Major Issues:').padEnd(25)} ${chalk.yellow(report.summary.major)}`);

  // AI Interpretation - What AI Actually Understood
  if (report.llmInterpretation) {
    lines.push('');
    lines.push(chalk.bold.blue('🤖 What AI Actually Understood'));
    lines.push(chalk.dim(`   (${Math.round(report.llmInterpretation.confidence * 100)}% confident)`));
    
    if (report.llmInterpretation.productName) {
      lines.push(`  ${chalk.bold('Product:')} ${report.llmInterpretation.productName}`);
    }
    
    if (report.llmInterpretation.purpose) {
      lines.push(`  ${chalk.bold('Purpose:')} ${report.llmInterpretation.purpose}`);
    }
    
    if (report.llmInterpretation.valueProposition) {
      lines.push(`  ${chalk.bold.magenta('💎 Value:')} ${report.llmInterpretation.valueProposition}`);
    }
    
    if (report.llmInterpretation.keyBenefits && report.llmInterpretation.keyBenefits.length > 0) {
      lines.push(`  ${chalk.bold('Benefits:')}`);
      report.llmInterpretation.keyBenefits.forEach((benefit: string) => {
        lines.push(`    • ${benefit}`);
      });
    }
    
    if (report.llmInterpretation.keyFeatures && report.llmInterpretation.keyFeatures.length > 0) {
      lines.push(`  ${chalk.bold('Features:')}`);
      report.llmInterpretation.keyFeatures.slice(0, 3).forEach((feature: string) => {
        lines.push(`    • ${feature}`);
      });
    }
    
    if (report.llmInterpretation.targetAudience) {
      lines.push(`  ${chalk.bold('Audience:')} ${report.llmInterpretation.targetAudience}`);
    }
  }

  if (report.mismatches && report.mismatches.length > 0) {
    const priorityMismatches = report.mismatches.filter(
      (m: any) => m.severity === 'critical' || m.severity === 'major'
    );
    
    if (priorityMismatches.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Priority Mismatches:'));
      priorityMismatches.slice(0, 5).forEach((mismatch: any, idx: number) => {
        const icon = mismatch.severity === 'critical' ? '🔴' : '🟡';
        lines.push(`  ${icon} ${idx + 1}. ${chalk.bold(mismatch.field)}`);
        lines.push(`     ${chalk.dim(mismatch.description)}`);
        lines.push(`     ${chalk.cyan('→')} ${mismatch.recommendation}`);
      });
    }
  }

  if (report.recommendations && report.recommendations.length > 0) {
    lines.push('');
    lines.push(chalk.bold('💡 Top Recommendations:'));
    report.recommendations.slice(0, 3).forEach((rec: string, idx: number) => {
      lines.push(`  ${idx + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

function formatDimensionsSection(dimensions: any): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.cyan('🎯 Dimension Analysis'));
  lines.push('─'.repeat(70));

  const dimensionDescriptions: Record<string, string> = {
    technical: '⚙️  Technical',
    contentQuality: '📝 Content Quality',
    crawlability: '🕷️  Crawlability',
    discoverability: '🔍 Discoverability',
    knowledge: '🧠 Knowledge',
    extractability: '🔄 Extractability',
    comprehensibility: '💡 Comprehensibility',
    trustworthiness: '✅ Trustworthiness',
    accessibility: '♿ Accessibility',
  };

  Object.entries(dimensions).forEach(([key, dim]: [string, any]) => {
    const name = dimensionDescriptions[key] || key;
    const scoreColor = dim.score >= 90 ? chalk.green :
                      dim.score >= 75 ? chalk.yellow :
                      dim.score >= 60 ? chalk.hex('#FFA500') : chalk.red;
    
    lines.push('');
    lines.push(`${name}: ${scoreColor.bold(`${Math.round(dim.score)}/100`)} ${chalk.dim(`(${dim.status})`)}`);
    
    if (dim.strengths && dim.strengths.length > 0) {
      lines.push(`  ${chalk.green('Strengths:')} ${dim.strengths.join(', ')}`);
    }
    if (dim.weaknesses && dim.weaknesses.length > 0) {
      lines.push(`  ${chalk.yellow('Weaknesses:')} ${dim.weaknesses.join(', ')}`);
    }
    if (dim.recommendation) {
      lines.push(`  ${chalk.cyan('→')} ${dim.recommendation}`);
    }
  });

  return lines.join('\n');
}

function formatQuickWinsSection(quickWins: any[]): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold.yellow('⚡ Quick Wins (High Impact, Low Effort)'));
  lines.push('─'.repeat(70));

  quickWins.slice(0, 5).forEach((win: any, idx: number) => {
    lines.push('');
    lines.push(`${chalk.bold(`${idx + 1}.`)} ${chalk.yellow(win.issue)}`);
    lines.push(`   ${chalk.dim(`Impact: ${win.impact} · Effort: ${win.effort}`)}`);
    lines.push(`   ${chalk.cyan('→')} ${win.fix}`);
  });

  return lines.join('\n');
}

export function formatDetailedIssues(issues: any[]): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('⚠️  All Issues'));
  lines.push('─'.repeat(70));

  // Group by severity
  const grouped = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low'),
  };

  // Stats
  lines.push('');
  lines.push(chalk.bold('Issue Count by Severity:'));
  lines.push(`  Critical: ${chalk.red.bold(grouped.critical.length)}`);
  lines.push(`  High:     ${chalk.yellow.bold(grouped.high.length)}`);
  lines.push(`  Medium:   ${chalk.blue.bold(grouped.medium.length)}`);
  lines.push(`  Low:      ${chalk.dim(grouped.low.length)}`);

  // Show all issues by severity
  for (const [severity, severityIssues] of Object.entries(grouped)) {
    if (severityIssues.length === 0) continue;
    
    lines.push('');
    lines.push(chalk.bold(`${severity.toUpperCase()} Issues:`));
    
    severityIssues.forEach((issue: any, idx: number) => {
      const icon = severity === 'critical' ? '🔴' :
                   severity === 'high' ? '🟠' :
                   severity === 'medium' ? '🟡' : '🔵';
      
      lines.push('');
      lines.push(`${icon} ${idx + 1}. ${chalk.bold(issue.message || issue.title)}`);
      lines.push(`   ${chalk.dim(`Category: ${issue.category} · Impact: ${issue.impact}`)}`);
      if (issue.evidence) {
        const evidenceText = typeof issue.evidence === 'string' ? issue.evidence : issue.evidence.join(', ');
        lines.push(`   ${chalk.dim(evidenceText.substring(0, 100))}${evidenceText.length > 100 ? '...' : ''}`);
      }
      if (issue.element) {
        lines.push(`   ${chalk.dim(issue.element.substring(0, 100))}${issue.element.length > 100 ? '...' : ''}`);
      }
      lines.push(`   ${chalk.cyan('💡 Fix:')} ${issue.suggested_fix || issue.remediation}`);
    });
  }

  return lines.join('\n');
}
