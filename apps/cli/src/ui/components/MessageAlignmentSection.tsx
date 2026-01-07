import React from 'react';
import { Box, Text } from 'ink';

interface MessageAlignmentSectionProps {
  mirrorReport: any;
}

export const MessageAlignmentSection: React.FC<MessageAlignmentSectionProps> = ({ mirrorReport }) => {
  if (!mirrorReport || Object.keys(mirrorReport).length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
        >
          <Text bold color="yellow">
            💡 Enable Message Alignment Analysis
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>Message alignment analysis is not available. To see what AI understands, run:</Text>
            <Box marginTop={1} borderStyle="single" paddingX={1}>
              <Text color="cyan">
                ai-lighthouse audit [URL] --enable-llm --llm-provider openai --llm-api-key YOUR_KEY
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>This requires LLM analysis to compare AI understanding with your intended message</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Summary Stats */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="magenta"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="magenta">
          🔍 AI Misunderstanding Check
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text>
              <Text bold>Alignment Score:</Text>{' '}
              <Text bold color={getScoreColor(mirrorReport.summary.alignmentScore)}>
                {mirrorReport.summary.alignmentScore}/100
              </Text>
            </Text>
          </Box>
          <Box>
            <Text>
              <Text bold>Clarity Score:</Text>{' '}
              <Text bold color={getScoreColor(mirrorReport.summary.clarityScore)}>
                {mirrorReport.summary.clarityScore}/100
              </Text>
            </Text>
          </Box>
          <Box>
            <Text>
              <Text bold>Critical Issues:</Text>{' '}
              <Text color="red">{mirrorReport.summary.critical}</Text>
            </Text>
          </Box>
          <Box>
            <Text>
              <Text bold>Major Issues:</Text>{' '}
              <Text color="yellow">{mirrorReport.summary.major}</Text>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* What AI Actually Understood */}
      {mirrorReport.llmInterpretation && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="blue"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="blue">
            🤖 What AI Actually Understood
          </Text>
          <Text dimColor>({Math.round(mirrorReport.llmInterpretation.confidence * 100)}% confident)</Text>

          <Box marginTop={1} flexDirection="column">
            {mirrorReport.llmInterpretation.productName && (
              <Text>
                <Text bold>Product:</Text> {mirrorReport.llmInterpretation.productName}
              </Text>
            )}
            {mirrorReport.llmInterpretation.purpose && (
              <Text>
                <Text bold>Purpose:</Text> {mirrorReport.llmInterpretation.purpose}
              </Text>
            )}
            {mirrorReport.llmInterpretation.valueProposition && (
              <Text>
                <Text bold color="magenta">💎 Value:</Text> {mirrorReport.llmInterpretation.valueProposition}
              </Text>
            )}
          </Box>

          {mirrorReport.llmInterpretation.keyBenefits && mirrorReport.llmInterpretation.keyBenefits.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text bold>Benefits:</Text>
              {mirrorReport.llmInterpretation.keyBenefits.map((benefit: string, idx: number) => (
                <Text key={idx}>• {benefit}</Text>
              ))}
            </Box>
          )}

          {mirrorReport.llmInterpretation.keyFeatures && mirrorReport.llmInterpretation.keyFeatures.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text bold>Features:</Text>
              {mirrorReport.llmInterpretation.keyFeatures.slice(0, 3).map((feature: string, idx: number) => (
                <Text key={idx}>• {feature}</Text>
              ))}
            </Box>
          )}

          {mirrorReport.llmInterpretation.targetAudience && (
            <Box marginTop={1}>
              <Text>
                <Text bold>Audience:</Text> {mirrorReport.llmInterpretation.targetAudience}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Priority Mismatches */}
      {mirrorReport.mismatches && mirrorReport.mismatches.length > 0 && (
        <>
          {mirrorReport.mismatches.filter((m: any) => m.severity === 'critical' || m.severity === 'major').length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold underline>
                Priority Mismatches
              </Text>
              {mirrorReport.mismatches
                .filter((m: any) => m.severity === 'critical' || m.severity === 'major')
                .slice(0, 5)
                .map((mismatch: any, idx: number) => (
                  <Box
                    key={idx}
                    flexDirection="column"
                    borderStyle="single"
                    borderColor={mismatch.severity === 'critical' ? 'red' : 'yellow'}
                    paddingX={1}
                    paddingY={0.5}
                    marginTop={1}
                  >
                    <Text>
                      {mismatch.severity === 'critical' ? '🔴' : '🟡'} {idx + 1}. <Text bold>{mismatch.field}</Text>
                    </Text>
                    <Text dimColor>{mismatch.description}</Text>
                    <Box marginTop={0.5}>
                      <Text color="cyan">→ {mismatch.recommendation}</Text>
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </>
      )}

      {/* Recommendations */}
      {mirrorReport.recommendations && mirrorReport.recommendations.length > 0 && (
        <Box flexDirection="column">
          <Text bold underline color="cyan">
            💡 Top Recommendations
          </Text>
          {mirrorReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
            <Box key={idx} marginTop={0.5}>
              <Text color="cyan">
                {idx + 1}. {rec}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
