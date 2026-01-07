import React from 'react';
import { Box, Text } from 'ink';

interface HallucinationSectionProps {
  hallucinationReport: any;
}

export const HallucinationSection: React.FC<HallucinationSectionProps> = ({ hallucinationReport }) => {
  if (!hallucinationReport || Object.keys(hallucinationReport).length === 0) {
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
            💡 Enable Hallucination Detection
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>Hallucination detection is not enabled. To see risk assessment, run:</Text>
            <Box marginTop={1} borderStyle="single" paddingX={1}>
              <Text color="cyan">
                ai-lighthouse audit [URL] --enable-hallucination --enable-llm --llm-provider openai --llm-api-key YOUR_KEY
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Note: Hallucination detection requires LLM analysis to be enabled</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const riskScore = hallucinationReport.hallucinationRiskScore;
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'red';
    if (score >= 40) return 'yellow';
    return 'green';
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Risk Score */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={getRiskColor(riskScore)}
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color={getRiskColor(riskScore)}>
          ⚠️  Hallucination Risk Assessment
        </Text>
        <Box marginTop={1}>
          <Text>
            <Text bold>Risk Score: </Text>
            <Text bold color={getRiskColor(riskScore)}>
              {riskScore}/100
            </Text>
          </Text>
        </Box>
      </Box>

      {/* Fact Check Summary */}
      {hallucinationReport.factCheckSummary && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="blue"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="blue">
            📊 Fact Check Summary
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text bold>Total Facts:</Text> {hallucinationReport.factCheckSummary.totalFacts}
            </Text>
            <Text>
              <Text bold color="green">Verified:</Text> {hallucinationReport.factCheckSummary.verifiedFacts}
            </Text>
            <Text>
              <Text bold color="yellow">Unverified:</Text> {hallucinationReport.factCheckSummary.unverifiedFacts}
            </Text>
            <Text>
              <Text bold color="red">Contradictions:</Text> {hallucinationReport.factCheckSummary.contradictions}
            </Text>
            {hallucinationReport.factCheckSummary.ambiguities !== undefined && (
              <Text>
                <Text bold color="yellow">Ambiguities:</Text> {hallucinationReport.factCheckSummary.ambiguities}
              </Text>
            )}
          </Box>
        </Box>
      )}

      {/* Tip for unverified facts */}
      {hallucinationReport.factCheckSummary?.unverifiedFacts > 0 && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text color="yellow">
            💡 Tip: Add citations and links to verify claims and reduce AI hallucination risk
          </Text>
        </Box>
      )}

      {/* High-Risk Triggers */}
      {hallucinationReport.triggers && hallucinationReport.triggers.length > 0 && (
        <>
          {hallucinationReport.triggers.filter((t: any) => t.severity === 'high' || t.severity === 'critical').length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold underline color="red">
                🚨 High-Risk Triggers
              </Text>
              {hallucinationReport.triggers
                .filter((t: any) => t.severity === 'high' || t.severity === 'critical')
                .slice(0, 5)
                .map((trigger: any, idx: number) => (
                  <Box
                    key={idx}
                    flexDirection="column"
                    borderStyle="single"
                    borderColor="red"
                    paddingX={1}
                    paddingY={0.5}
                    marginTop={1}
                  >
                    <Text>
                      {idx + 1}. <Text bold color="red">[{trigger.severity.toUpperCase()}]</Text> {trigger.type}
                    </Text>
                    <Text dimColor>{trigger.description}</Text>
                    {trigger.confidence && (
                      <Text dimColor>Confidence: {Math.round(trigger.confidence * 100)}%</Text>
                    )}
                  </Box>
                ))}
            </Box>
          )}
        </>
      )}

      {/* Recommendations */}
      {hallucinationReport.recommendations && hallucinationReport.recommendations.length > 0 && (
        <Box flexDirection="column">
          <Text bold underline color="cyan">
            💡 Recommendations
          </Text>
          {hallucinationReport.recommendations.slice(0, 3).map((rec: string, idx: number) => (
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
