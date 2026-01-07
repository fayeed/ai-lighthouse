import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

interface ScoreDisplayProps {
  score: number;
  grade: string;
  url: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, grade, url }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'green';
    if (grade.startsWith('B')) return 'blue';
    if (grade.startsWith('C')) return 'yellow';
    return 'red';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { status: 'Excellent', message: 'Your site is AI-ready!', color: 'green' };
    if (score >= 80) return { status: 'Good', message: 'Your site works well with AI', color: 'blue' };
    if (score >= 70) return { status: 'Fair', message: 'Room for improvement', color: 'yellow' };
    if (score >= 60) return { status: 'Poor', message: 'Needs significant work', color: 'yellow' };
    return { status: 'Critical', message: 'Major issues detected', color: 'red' };
  };

  const { status, message, color } = getScoreMessage(score);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Gradient name="rainbow">
          <BigText text={`${score}`} font="block" />
        </Gradient>
      </Box>

      <Box marginBottom={1}>
        <Text bold color={getGradeColor(grade)}>
          Grade: {grade} • {status}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{url}</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor={color as any}
        paddingX={2}
        paddingY={1}
      >
        <Text color={color as any}>{message}</Text>
      </Box>
    </Box>
  );
};
