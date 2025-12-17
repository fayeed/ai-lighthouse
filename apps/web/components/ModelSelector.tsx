'use client';

import { useState } from 'react';

export interface ModelConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

const providerModels = {
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free', 'nex-agi/deepseek-v3.1-nex-n1:free'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['qwen2.5:0.5b', 'llama3.2:latest', 'mistral:latest'],
};

const isDev = process.env.NODE_ENV === 'development';

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProviderChange = (provider: ModelConfig['provider']) => {
    const defaultModel = providerModels[provider][0];
    onChange({
      provider,
      model: defaultModel,
      apiKey: provider === 'openrouter' || provider === 'ollama' ? undefined : value.apiKey,
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

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Model Configuration</h3>
      
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Provider
        </label>
        <div className={`grid grid-cols-2 ${isDev ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2`}>
          {(Object.keys(providerModels) as Array<keyof typeof providerModels>)
            .filter(provider => isDev || provider !== 'ollama')
            .map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleProviderChange(provider)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                value.provider === provider
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {provider === 'openrouter' && '🌐 '}
              {provider === 'openai' && '🤖 '}
              {provider === 'anthropic' && '🧠 '}
              {provider === 'gemini' && '✨ '}
              {provider === 'ollama' && '🏠 '}
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model
        </label>
        <select
          value={value.model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {providerModels[value.provider].map((model) => (
            <option key={model} value={model} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* API Key - Only for non-OpenRouter and non-Ollama providers */}
      {value.provider !== 'openrouter' && value.provider !== 'ollama' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={value.apiKey || ''}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={`Enter your ${value.provider} API key`}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {showApiKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your API key is only sent to your backend server
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className={`${value.provider === 'openrouter' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'} border rounded-lg p-3`}>
        <div className={`text-sm ${value.provider === 'openrouter' ? 'text-yellow-900 dark:text-yellow-300' : 'text-blue-900 dark:text-blue-300'}`}>
          <strong>{value.provider === 'openrouter' ? '⏱️ Note:' : 'ℹ️ Note:'}</strong> {' '}
          {value.provider === 'openrouter'
            ? '🆓 Free models available! API key configured on backend.'
            : value.provider === 'ollama'
            ? '🏠 Local development mode. Requires Ollama running on localhost:11434.'
            : `${value.provider.charAt(0).toUpperCase() + value.provider.slice(1)} requires an API key. Your data will be sent to their servers.`
          }
        </div>
      </div>
    </div>
  );
}
