import React from 'react';
import { Box, Text } from 'ink';

interface AIUnderstandingSectionProps {
  llm: any;
}

export const AIUnderstandingSection: React.FC<AIUnderstandingSectionProps> = ({ llm }) => {
  if (!llm || Object.keys(llm).length === 0) {
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
            💡 Enable AI Understanding Analysis
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>LLM analysis is not enabled. To see AI understanding insights, run:</Text>
            <Box marginTop={1} borderStyle="single" paddingX={1}>
              <Text color="cyan">
                ai-lighthouse audit [URL] --enable-llm --llm-provider openai --llm-api-key YOUR_KEY
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Supported providers: openai, anthropic, ollama, local</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Page Type */}
      {llm.pageType && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="magenta"
          paddingX={2}
          paddingY={1}
          marginBottom={1}
        >
          <Text bold color="magenta">
            📄 Inferred Page Type
          </Text>
          <Text color="cyan">{llm.pageType}</Text>
        </Box>
      )}

      {/* AI-Generated Insights */}
      {llm.pageTypeInsights && llm.pageTypeInsights.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline color="blue">
            💡 AI-Generated Insights
          </Text>
          {llm.pageTypeInsights.map((insight: string, idx: number) => (
            <Box key={idx} marginTop={0.5}>
              <Text color="cyan">• {insight}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Summary */}
      {llm.summary && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>
            Summary
          </Text>
          <Box marginTop={0.5}>
            <Text>{llm.summary}</Text>
          </Box>
        </Box>
      )}

      {/* Key Topics */}
      {llm.keyTopics && llm.keyTopics.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>
            🏷️  Key Topics
          </Text>
          <Box marginTop={0.5}>
            <Text>{llm.keyTopics.map((t: string) => `[${t}]`).join(' ')}</Text>
          </Box>
        </Box>
      )}

      {/* Metadata Grid */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold underline>
          Metadata
        </Text>
        <Box marginTop={0.5} flexDirection="column">
          {llm.readingLevel && (
            <Text>
              <Text bold>Reading Level:</Text> {llm.readingLevel.description}
            </Text>
          )}
          {llm.sentiment && (
            <Text>
              <Text bold>Sentiment:</Text> {llm.sentiment}
            </Text>
          )}
          {llm.technicalDepth && (
            <Text>
              <Text bold>Technical Depth:</Text> {llm.technicalDepth}
            </Text>
          )}
        </Box>
      </Box>

      {/* Top Entities */}
      {llm.topEntities && llm.topEntities.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>
            🔍 Key Entities
          </Text>
          {llm.topEntities.slice(0, 5).map((entity: any, idx: number) => (
            <Box key={idx} marginTop={0.5}>
              <Text>
                • <Text bold>{entity.name}</Text>{' '}
                <Text dimColor>
                  ({entity.type}) - {Math.round((entity.relevance || 0) * 100)}% relevance
                </Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Questions AI Can Answer */}
      {llm.questions && llm.questions.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>
            ❓ Questions AI Can Answer
          </Text>
          {llm.questions.slice(0, 5).map((q: any, idx: number) => (
            <Box key={idx} marginTop={0.5}>
              <Text>
                {idx + 1}. <Text dimColor>[{q.difficulty.toUpperCase()}]</Text> {q.question}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Suggested FAQs */}
      {llm.suggestedFAQ && llm.suggestedFAQ.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
        >
          <Text bold color="yellow">
            💡 Suggested FAQs
          </Text>
          {llm.suggestedFAQ
            .filter((f: any) => f.importance === 'high')
            .slice(0, 3)
            .map((faq: any, idx: number) => (
              <Box key={idx} flexDirection="column" marginTop={1}>
                <Text>
                  <Text bold>Q:</Text> {faq.question}
                </Text>
                <Text dimColor>
                  <Text bold>A:</Text> {faq.suggestedAnswer}
                </Text>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
};
