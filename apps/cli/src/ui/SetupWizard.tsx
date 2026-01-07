import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';

interface SetupWizardProps {
  onComplete: (config: AuditConfig) => void;
  initialUrl?: string;
}

export interface AuditConfig {
  url: string;
  enableLlm: boolean;
  enableChunking: boolean;
  enableExtractability: boolean;
  enableHallucination: boolean;
  llmProvider?: string;
  llmModel?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
}

type Step = 'url' | 'features' | 'llm-provider' | 'llm-model' | 'llm-api-key' | 'llm-base-url';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialUrl }) => {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>(initialUrl ? 'features' : 'url');
  const [url, setUrl] = useState(initialUrl || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [llmProvider, setLlmProvider] = useState<string>('');
  const [llmModel, setLlmModel] = useState<string>('');
  const [llmApiKey, setLlmApiKey] = useState<string>('');
  const [llmBaseUrl, setLlmBaseUrl] = useState<string>('');

  const featureOptions = [
    { label: '🧠 AI Understanding (LLM Analysis)', value: 'llm' },
    { label: '📄 Content Chunking Analysis', value: 'chunking' },
    { label: '🔄 Extractability Analysis', value: 'extractability' },
    { label: '⚠️  Hallucination Detection', value: 'hallucination' },
    { label: '✅ Continue with selected features', value: 'done' },
  ];

  const llmProviderOptions = [
    { label: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
    { label: 'Anthropic (Claude)', value: 'anthropic' },
    { label: 'Ollama (Local)', value: 'ollama' },
    { label: 'Custom/Local Provider', value: 'local' },
  ];

  const handleUrlSubmit = (value: string) => {
    setUrl(value);
    setStep('features');
  };

  const handleFeatureSelect = (item: any) => {
    if (item.value === 'done') {
      // Check if LLM is needed
      if (selectedFeatures.includes('llm') || selectedFeatures.includes('hallucination')) {
        setStep('llm-provider');
      } else {
        completeSetup();
      }
    } else {
      // Toggle feature selection
      if (selectedFeatures.includes(item.value)) {
        setSelectedFeatures(selectedFeatures.filter(f => f !== item.value));
      } else {
        setSelectedFeatures([...selectedFeatures, item.value]);
      }
    }
  };

  const handleLlmProviderSelect = (item: any) => {
    setLlmProvider(item.value);

    // Set default base URL for ollama
    if (item.value === 'ollama') {
      setLlmBaseUrl('http://localhost:11434');
    }

    setStep('llm-model');
  };

  const handleLlmModelSubmit = (value: string) => {
    setLlmModel(value);

    // If ollama, skip API key and go to base URL
    if (llmProvider === 'ollama') {
      setStep('llm-base-url');
    } else {
      setStep('llm-api-key');
    }
  };

  const handleLlmApiKeySubmit = (value: string) => {
    setLlmApiKey(value);

    // If provider needs base URL, go there, otherwise complete
    if (llmProvider === 'local' || llmProvider === 'anthropic') {
      setStep('llm-base-url');
    } else {
      completeSetup();
    }
  };

  const handleLlmBaseUrlSubmit = (value: string) => {
    setLlmBaseUrl(value);
    completeSetup();
  };

  const completeSetup = () => {
    const config: AuditConfig = {
      url,
      enableLlm: selectedFeatures.includes('llm') || selectedFeatures.includes('hallucination'),
      enableChunking: selectedFeatures.includes('chunking'),
      enableExtractability: selectedFeatures.includes('extractability'),
      enableHallucination: selectedFeatures.includes('hallucination'),
    };

    if (config.enableLlm) {
      config.llmProvider = llmProvider;
      config.llmModel = llmModel;
      config.llmApiKey = llmApiKey || undefined;
      config.llmBaseUrl = llmBaseUrl || undefined;
    }

    onComplete(config);
    // Exit the wizard app
    exit();
  };

  const getModelPlaceholder = () => {
    switch (llmProvider) {
      case 'openai':
        return 'gpt-4o-mini (default)';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022 (default)';
      case 'ollama':
        return 'qwen2.5:0.5b';
      default:
        return 'model-name';
    }
  };

  const getApiKeyPlaceholder = () => {
    switch (llmProvider) {
      case 'openai':
        return 'sk-...';
      case 'anthropic':
        return 'sk-ant-...';
      default:
        return 'your-api-key';
    }
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Header */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          🚨 AI Lighthouse Setup Wizard
        </Text>
        <Text dimColor>Configure your audit settings</Text>
      </Box>

      {/* URL Input */}
      {step === 'url' && (
        <Box flexDirection="column">
          <Text bold>Enter the URL to audit:</Text>
          <Box marginTop={1}>
            <Text color="cyan">URL: </Text>
            <TextInput
              value={url}
              onChange={setUrl}
              onSubmit={handleUrlSubmit}
              placeholder="https://example.com"
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {/* Feature Selection */}
      {step === 'features' && (
        <Box flexDirection="column">
          <Text bold>Select features to enable:</Text>
          <Box marginTop={1}>
            <Text dimColor>
              Selected: {selectedFeatures.length === 0 ? 'None (basic audit only)' : selectedFeatures.map(f => {
                const feature = featureOptions.find(opt => opt.value === f);
                return feature?.label.split(' ')[0];
              }).join(', ')}
            </Text>
          </Box>
          <Box marginTop={1}>
            <SelectInput
              items={featureOptions.map(opt => ({
                ...opt,
                label: selectedFeatures.includes(opt.value) && opt.value !== 'done'
                  ? `✓ ${opt.label}`
                  : opt.label,
              }))}
              onSelect={handleFeatureSelect}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Use ↑↓ to navigate, Enter to toggle/continue</Text>
          </Box>
        </Box>
      )}

      {/* LLM Provider Selection */}
      {step === 'llm-provider' && (
        <Box flexDirection="column">
          <Text bold>Select LLM provider:</Text>
          <Box marginTop={1}>
            <SelectInput items={llmProviderOptions} onSelect={handleLlmProviderSelect} />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Use ↑↓ to navigate, Enter to select</Text>
          </Box>
        </Box>
      )}

      {/* LLM Model Input */}
      {step === 'llm-model' && (
        <Box flexDirection="column">
          <Text bold>Enter LLM model name:</Text>
          <Box marginTop={1}>
            <Text color="cyan">Model: </Text>
            <TextInput
              value={llmModel}
              onChange={setLlmModel}
              onSubmit={handleLlmModelSubmit}
              placeholder={getModelPlaceholder()}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Leave empty for default, or press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {/* LLM API Key Input */}
      {step === 'llm-api-key' && (
        <Box flexDirection="column">
          <Text bold>Enter API key:</Text>
          <Box marginTop={1}>
            <Text color="cyan">API Key: </Text>
            <TextInput
              value={llmApiKey}
              onChange={setLlmApiKey}
              onSubmit={handleLlmApiKeySubmit}
              placeholder={getApiKeyPlaceholder()}
              mask="*"
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Your API key will not be stored</Text>
          </Box>
        </Box>
      )}

      {/* LLM Base URL Input */}
      {step === 'llm-base-url' && (
        <Box flexDirection="column">
          <Text bold>Enter API base URL (optional):</Text>
          <Box marginTop={1}>
            <Text color="cyan">Base URL: </Text>
            <TextInput
              value={llmBaseUrl}
              onChange={setLlmBaseUrl}
              onSubmit={handleLlmBaseUrlSubmit}
              placeholder={llmProvider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue (leave empty for default)</Text>
          </Box>
        </Box>
      )}

    </Box>
  );
};
