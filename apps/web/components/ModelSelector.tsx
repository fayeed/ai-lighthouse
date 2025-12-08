'use client';

import { useState } from 'react';

export interface ModelConfig {
  provider: 'ollama' | 'openai' | 'anthropic' | 'gemini';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

const providerModels = {
  ollama: ['qwen2.5:0.5b', 'qwen2.5:3b', 'llama3.2:3b', 'llama3.2:1b', 'gemma2:2b', 'phi3:mini'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
};

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProviderChange = (provider: ModelConfig['provider']) => {
    const defaultModel = providerModels[provider][0];
    onChange({
      provider,
      model: defaultModel,
      apiKey: provider === 'ollama' ? undefined : value.apiKey,
      baseUrl: provider === 'ollama' ? 'http://localhost:11434' : undefined,
    });
  };

  const handleModelChange = (model: string) => {
    onChange({ ...value, model });
  };

  const handleApiKeyChange = (apiKey: string) => {
    onChange({ ...value, apiKey });
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    onChange({ ...value, baseUrl });
  };

  const needsApiKey = value.provider !== 'ollama';

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">AI Model Configuration</h3>
      
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(providerModels) as Array<keyof typeof providerModels>).map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleProviderChange(provider)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                value.provider === provider
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {provider === 'ollama' && '🏠 '}
              {provider === 'openai' && '🤖 '}
              {provider === 'anthropic' && '🧠 '}
              {provider === 'gemini' && '✨ '}
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={value.model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {providerModels[value.provider].map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Base URL for Ollama */}
      {value.provider === 'ollama' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL
          </label>
          <input
            type="text"
            value={value.baseUrl || 'http://localhost:11434'}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Make sure Ollama is running locally
          </p>
        </div>
      )}

      {/* API Key for Cloud Providers */}
      {needsApiKey && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={value.apiKey || ''}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={`Enter your ${value.provider} API key`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
            >
              {showApiKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your API key is only sent to your backend server
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-900">
          <strong>ℹ️ Note:</strong> {' '}
          {value.provider === 'ollama' 
            ? 'Local models run on your machine. Make sure Ollama is installed and running.'
            : `${value.provider.charAt(0).toUpperCase() + value.provider.slice(1)} requires an API key. Your data will be sent to their servers.`
          }
        </div>
      </div>
    </div>
  );
}
