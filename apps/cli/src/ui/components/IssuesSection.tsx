import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface IssuesSectionProps {
  issues: any[];
}

export const IssuesSection: React.FC<IssuesSectionProps> = ({ issues }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'red';
    if (severity === 'high') return 'magenta';
    if (severity === 'medium') return 'yellow';
    return 'blue';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return '🔴';
    if (severity === 'high') return '🟠';
    if (severity === 'medium') return '🟡';
    return '🔵';
  };

  // Group issues by severity
  const grouped = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low'),
  };

  const filteredIssues = selectedSeverity === 'all' ? issues : grouped[selectedSeverity as keyof typeof grouped] || [];

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Summary Stats */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="blue">
          ⚠️  Issues Summary
        </Text>
        <Box marginTop={1}>
          <Box flexDirection="column" width="50%">
            <Text>
              <Text color="red" bold>
                Critical:
              </Text>{' '}
              {grouped.critical.length}
            </Text>
            <Text>
              <Text color="magenta" bold>
                High:
              </Text>{' '}
              {grouped.high.length}
            </Text>
          </Box>
          <Box flexDirection="column" width="50%">
            <Text>
              <Text color="yellow" bold>
                Medium:
              </Text>{' '}
              {grouped.medium.length}
            </Text>
            <Text>
              <Text color="blue" bold>
                Low:
              </Text>{' '}
              {grouped.low.length}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Issue List */}
      <Box flexDirection="column">
        <Text bold underline>
          {selectedSeverity === 'all' ? 'All Issues' : `${selectedSeverity.toUpperCase()} Issues`} ({filteredIssues.length})
        </Text>
        {filteredIssues.map((issue: any, idx: number) => (
          <Box
            key={idx}
            flexDirection="column"
            borderStyle="round"
            borderColor={getSeverityColor(issue.severity)}
            paddingX={2}
            paddingY={1}
            marginTop={1}
          >
            <Box>
              <Text>
                {getSeverityIcon(issue.severity)}{' '}
                <Text bold color={getSeverityColor(issue.severity)}>
                  {issue.message || issue.title}
                </Text>
              </Text>
            </Box>

            <Box marginTop={0.5}>
              <Text dimColor>
                Category: {issue.category} • Impact: {issue.impact}
              </Text>
            </Box>

            {issue.evidence && (
              <Box marginTop={0.5}>
                <Text dimColor>
                  {typeof issue.evidence === 'string'
                    ? issue.evidence.substring(0, 100)
                    : Array.isArray(issue.evidence)
                    ? issue.evidence.join(', ').substring(0, 100)
                    : ''}
                  {(typeof issue.evidence === 'string' ? issue.evidence : issue.evidence?.join(', ') || '').length > 100 ? '...' : ''}
                </Text>
              </Box>
            )}

            <Box
              marginTop={1}
              borderStyle="single"
              borderColor="cyan"
              paddingX={1}
              paddingY={0.5}
            >
              <Text color="cyan">💡 Fix: {issue.suggested_fix || issue.remediation}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
