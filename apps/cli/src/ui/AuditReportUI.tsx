import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { ScoreDisplay } from './components/ScoreDisplay.js';
import { OverviewSection } from './components/OverviewSection.js';
import { IssuesSection } from './components/IssuesSection.js';
import { AIUnderstandingSection } from './components/AIUnderstandingSection.js';
import { HallucinationSection } from './components/HallucinationSection.js';
import { MessageAlignmentSection } from './components/MessageAlignmentSection.js';
import { TechnicalSection } from './components/TechnicalSection.js';

interface AuditReportUIProps {
  url: string;
  result: any;
  aiReadiness: any;
  loading?: boolean;
  currentStep?: string;
}

type TabType = 'overview' | 'issues' | 'ai-understanding' | 'hallucination' | 'message-alignment' | 'technical';

export const AuditReportUI: React.FC<AuditReportUIProps> = ({
  url,
  result,
  aiReadiness,
  loading = false,
  currentStep = '',
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'issues', label: 'Issues', icon: '⚠️' },
    { key: 'ai-understanding', label: 'AI Understanding', icon: '🧠' },
    { key: 'hallucination', label: 'Hallucination Risk', icon: '⚠️' },
    { key: 'message-alignment', label: 'Message Alignment', icon: '🔍' },
    { key: 'technical', label: 'Technical', icon: '⚙️' },
  ];

  useInput((input, key) => {
    if (loading) return;

    if (key.leftArrow) {
      const currentIndex = tabs.findIndex(t => t.key === currentTab);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      setCurrentTab(tabs[prevIndex].key);
    }

    if (key.rightArrow) {
      const currentIndex = tabs.findIndex(t => t.key === currentTab);
      const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      setCurrentTab(tabs[nextIndex].key);
    }

    // Number keys for quick tab switching
    const num = parseInt(input);
    if (num >= 1 && num <= tabs.length) {
      setCurrentTab(tabs[num - 1].key);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> {currentStep || 'Loading...'}</Text>
        </Box>
      </Box>
    );
  }

  const overallScore = aiReadiness?.overall || 0;
  const grade = aiReadiness?.grade || 'N/A';

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="cyan">
          🚨 AI Lighthouse Report
        </Text>
      </Box>

      {/* Score Display */}
      <ScoreDisplay score={overallScore} grade={grade} url={url} />

      {/* Tab Navigation */}
      <Box
        flexDirection="row"
        borderStyle="single"
        borderColor="blue"
        paddingX={1}
        marginTop={1}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === currentTab;
          return (
            <Box key={tab.key} marginRight={1}>
              <Text
                bold={isActive}
                color={isActive ? 'cyan' : 'gray'}
                backgroundColor={isActive ? 'blue' : undefined}
              >
                {` ${index + 1}. ${tab.icon} ${tab.label} `}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Help Text */}
      <Box marginTop={1} marginBottom={1}>
        <Text dimColor>
          Use ← → arrow keys or numbers (1-{tabs.length}) to navigate tabs
        </Text>
      </Box>

      {/* Tab Content */}
      <Box flexDirection="column">
        {currentTab === 'overview' && <OverviewSection aiReadiness={aiReadiness} />}
        {currentTab === 'issues' && <IssuesSection issues={result.issues || []} />}
        {currentTab === 'ai-understanding' && <AIUnderstandingSection llm={result.llm} />}
        {currentTab === 'hallucination' && <HallucinationSection hallucinationReport={result.hallucinationReport} />}
        {currentTab === 'message-alignment' && <MessageAlignmentSection mirrorReport={result.mirrorReport} />}
        {currentTab === 'technical' && <TechnicalSection result={result} scoring={result.scoring} />}
      </Box>

      {/* Footer */}
      <Box
        marginTop={2}
        borderStyle="round"
        borderColor="gray"
        paddingX={2}
        paddingY={1}
      >
        <Text dimColor>
          Press Ctrl+C to exit • Report generated at {new Date().toLocaleString()}
        </Text>
      </Box>
    </Box>
  );
};
