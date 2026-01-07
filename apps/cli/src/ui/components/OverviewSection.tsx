import React from 'react';
import { Box, Text } from 'ink';

interface OverviewSectionProps {
  aiReadiness: any;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ aiReadiness }) => {
  const getStatusColor = (status: string) => {
    if (status === 'excellent') return 'green';
    if (status === 'good') return 'blue';
    if (status === 'needs-work') return 'yellow';
    return 'red';
  };

  const renderProgressBar = (score: number, width: number = 20) => {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    return (
      <Text color={color}>
        {'█'.repeat(filled)}
        <Text dimColor>{'░'.repeat(empty)}</Text>
        {` ${Math.round(score)}%`}
      </Text>
    );
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* AI Agent Perspective */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          🤖 AI Agent Perspective
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text>
              {aiReadiness.aiPerspective?.canUnderstand ? '✅' : '❌'} Can Understand
              {aiReadiness.aiPerspective?.canExtract ? '✅' : '❌'} Can Extract
            </Text>
          </Box>
          <Box>
            <Text>
              {aiReadiness.aiPerspective?.canIndex ? '✅' : '❌'} Can Index
              {aiReadiness.aiPerspective?.canAnswer ? '✅' : '❌'} Can Answer
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              Confidence: {Math.round((aiReadiness.aiPerspective?.confidence || 0) * 100)}%
            </Text>
          </Box>
        </Box>

        {aiReadiness.aiPerspective?.mainBlockers && aiReadiness.aiPerspective.mainBlockers.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color="red">
              Main Blockers:
            </Text>
            {aiReadiness.aiPerspective.mainBlockers.map((blocker: string, idx: number) => (
              <Text key={idx} color="red">
                • {blocker}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Dimension Scores */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>
          🎯 Dimension Scores
        </Text>
        {Object.entries(aiReadiness.dimensions || {}).map(([key, dim]: [string, any]) => (
          <Box key={key} flexDirection="column" marginTop={1}>
            <Box justifyContent="space-between">
              <Text bold color={getStatusColor(dim.status)}>
                {getDimensionIcon(key)} {formatDimensionName(key)}
              </Text>
              <Text color={getStatusColor(dim.status)}>{Math.round(dim.score)}/100</Text>
            </Box>
            <Box marginTop={0.5}>{renderProgressBar(dim.score)}</Box>
            {dim.recommendation && (
              <Box marginTop={0.5}>
                <Text dimColor>→ {dim.recommendation}</Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Quick Wins */}
      {aiReadiness.quickWins && aiReadiness.quickWins.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
          marginTop={1}
        >
          <Text bold color="yellow">
            ⚡ Quick Wins (High Impact, Low Effort)
          </Text>
          {aiReadiness.quickWins.slice(0, 5).map((win: any, idx: number) => (
            <Box key={idx} flexDirection="column" marginTop={1}>
              <Text bold>
                {idx + 1}. {win.issue}
              </Text>
              <Text dimColor>Impact: {win.impact} • Effort: {win.effort}</Text>
              <Text color="cyan">→ {win.fix}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

function getDimensionIcon(key: string): string {
  const icons: Record<string, string> = {
    technical: '⚙️',
    contentQuality: '📝',
    crawlability: '🕷️',
    discoverability: '🔍',
    knowledge: '🧠',
    extractability: '🔄',
    comprehensibility: '💡',
    trustworthiness: '✅',
    accessibility: '♿',
  };
  return icons[key] || '📌';
}

function formatDimensionName(key: string): string {
  const names: Record<string, string> = {
    technical: 'Technical',
    contentQuality: 'Content Quality',
    crawlability: 'Crawlability',
    discoverability: 'Discoverability',
    knowledge: 'Knowledge',
    extractability: 'Extractability',
    comprehensibility: 'Comprehensibility',
    trustworthiness: 'Trustworthiness',
    accessibility: 'Accessibility',
  };
  return names[key] || key;
}
