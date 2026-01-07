import React from 'react';
import { Box, Text } from 'ink';

interface TechnicalSectionProps {
  result: any;
  scoring: any;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({ result, scoring }) => {
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
      {/* Category Scores */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="blue">
          📊 Category Scores
        </Text>
        <Box marginTop={1} flexDirection="column">
          {scoring?.crawlability !== undefined && (
            <Box flexDirection="column" marginTop={0.5}>
              <Box justifyContent="space-between">
                <Text bold>🕷️  Crawlability</Text>
                <Text>{Math.round(scoring.crawlability)}/100</Text>
              </Box>
              <Box marginTop={0.5}>{renderProgressBar(scoring.crawlability)}</Box>
            </Box>
          )}
          {scoring?.structure !== undefined && (
            <Box flexDirection="column" marginTop={1}>
              <Box justifyContent="space-between">
                <Text bold>📐 Structure</Text>
                <Text>{Math.round(scoring.structure)}/100</Text>
              </Box>
              <Box marginTop={0.5}>{renderProgressBar(scoring.structure)}</Box>
            </Box>
          )}
          {scoring?.schema_coverage !== undefined && (
            <Box flexDirection="column" marginTop={1}>
              <Box justifyContent="space-between">
                <Text bold>🏷️  Schema Coverage</Text>
                <Text>{Math.round(scoring.schema_coverage)}/100</Text>
              </Box>
              <Box marginTop={0.5}>{renderProgressBar(scoring.schema_coverage)}</Box>
            </Box>
          )}
          {scoring?.content_clarity !== undefined && (
            <Box flexDirection="column" marginTop={1}>
              <Box justifyContent="space-between">
                <Text bold>📝 Content Clarity</Text>
                <Text>{Math.round(scoring.content_clarity)}/100</Text>
              </Box>
              <Box marginTop={0.5}>{renderProgressBar(scoring.content_clarity)}</Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Chunking Analysis */}
      {result.chunking && Object.keys(result.chunking).length > 0 ? (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="green"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="green">
            📄 Content Chunking Analysis
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text bold>Strategy:</Text> {result.chunking.chunkingStrategy}
            </Text>
            <Text>
              <Text bold>Total Chunks:</Text> {result.chunking.totalChunks}
            </Text>
            <Text>
              <Text bold>Avg Tokens/Chunk:</Text> {result.chunking.averageTokensPerChunk}
            </Text>
            <Text>
              <Text bold>Avg Noise Ratio:</Text> {(result.chunking.averageNoiseRatio * 100).toFixed(1)}%
            </Text>
          </Box>

          {result.chunking.chunkingStrategy === 'heading-based' && (
            <Box marginTop={1}>
              <Text color="green">✓ Heading-based chunking is ideal for AI comprehension</Text>
            </Box>
          )}
          {result.chunking.chunkingStrategy === 'paragraph-based' && (
            <Box marginTop={1}>
              <Text color="yellow">⚠ Consider adding headings for better semantic structure</Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="gray"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text dimColor>
            💡 Enable chunking analysis with --enable-chunking to see how your content is divided for AI processing
          </Text>
        </Box>
      )}

      {/* Extractability Analysis */}
      {result.extractability && Object.keys(result.extractability).length > 0 ? (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="yellow">
            🔄 Extractability Analysis
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text bold>Overall Score:</Text> {result.extractability.score.extractabilityScore}/100
            </Text>
            <Text>
              <Text bold>Server-Rendered:</Text> {result.extractability.score.serverRenderedPercent}%
            </Text>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold underline>Content Type Extractability:</Text>
            {Object.entries(result.extractability.contentTypes).map(([type, data]: [string, any]) => {
              const percentage = data.percentage;
              const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
              return (
                <Box key={type} marginTop={0.5}>
                  <Text>
                    <Text bold>{type.charAt(0).toUpperCase() + type.slice(1)}:</Text>{' '}
                    <Text color={color}>
                      {percentage}%
                    </Text>{' '}
                    <Text dimColor>({data.extractable}/{data.total})</Text>
                  </Text>
                </Box>
              );
            })}
          </Box>

          {result.extractability.score.extractabilityScore >= 80 && (
            <Box marginTop={1}>
              <Text color="green">✓ Good extractability - AI can easily read your content</Text>
            </Box>
          )}
          {result.extractability.score.extractabilityScore < 50 && (
            <Box marginTop={1}>
              <Text color="red">⚠ Low extractability - Consider server-side rendering</Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="gray"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text dimColor>
            💡 Enable extractability analysis with --enable-extractability to see how well AI can extract your content
          </Text>
        </Box>
      )}
    </Box>
  );
};
