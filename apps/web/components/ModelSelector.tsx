'use client';

import { useState } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

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
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white">AI Model Configuration</h3>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Provider
        </label>
        <ToggleGroup.Root
          type="single"
          value={value.provider}
          onValueChange={(val) => val && handleProviderChange(val as ModelConfig['provider'])}
          className={`grid grid-cols-2 ${isDev ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2`}
        >
          {(Object.keys(providerModels) as Array<keyof typeof providerModels>)
            .filter(provider => isDev || provider !== 'ollama')
            .map((provider) => (
            <ToggleGroup.Item
              key={provider}
              value={provider}
              className="px-4 py-3 rounded-xl font-medium text-sm transition-all border data-[state=on]:bg-teal-500/10 data-[state=on]:border-teal-500/30 data-[state=on]:text-teal-400 data-[state=off]:bg-zinc-900 data-[state=off]:border-zinc-800 data-[state=off]:text-gray-300 hover:bg-zinc-800 hover:border-zinc-700"
            >
              {provider === 'openrouter' && '🌐 '}
              {provider === 'openai' && '🤖 '}
              {provider === 'anthropic' && '🧠 '}
              {provider === 'gemini' && '✨ '}
              {provider === 'ollama' && '🏠 '}
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Model
        </label>
        <select
          value={value.model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full px-4 py-3 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-zinc-900 text-white transition-all"
        >
          {providerModels[value.provider].map((model) => (
            <option key={model} value={model} className="bg-zinc-900 text-white">
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* API Key - Only for non-OpenRouter and non-Ollama providers */}
      {value.provider !== 'openrouter' && value.provider !== 'ollama' && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={value.apiKey || ''}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={`Enter your ${value.provider} API key`}
              className="w-full px-4 py-3 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-zinc-900 text-white pr-20 placeholder:text-gray-600 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showApiKey ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your API key is only sent to your backend server
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className={`border rounded-xl p-4 ${
        value.provider === 'openrouter'
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : 'bg-teal-500/5 border-teal-500/20'
      }`}>
        <div className={`text-sm ${
          value.provider === 'openrouter'
            ? 'text-yellow-400'
            : 'text-teal-400'
        }`}>
          <span className="font-semibold">{value.provider === 'openrouter' ? '💡 Note:' : 'ℹ️ Note:'}</span>{' '}
          <span className="text-gray-400">
            {value.provider === 'openrouter'
              ? 'Free models available! API key configured on backend.'
              : value.provider === 'ollama'
              ? 'Local development mode. Requires Ollama running on localhost:11434.'
              : `${value.provider.charAt(0).toUpperCase() + value.provider.slice(1)} requires an API key. Your data will be sent to their servers.`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
