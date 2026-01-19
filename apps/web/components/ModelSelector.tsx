'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { AnimatePresence, motion } from 'framer-motion';
import ScanEstimate from './ScanEstimate';

export interface ModelConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
  enableLLM?: boolean;
  provider?: string;
  modelConfig?: ModelConfig;
}

const providerModels = {
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free', 'nex-agi/deepseek-v3.1-nex-n1:free'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['qwen2.5:0.5b', 'llama3.2:latest', 'mistral:latest'],
};

export default function ModelSelector({ value, onChange, enableLLM }: ModelSelectorProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleProviderChange = (provider: ModelConfig['provider']) => {
    const defaultModel = providerModels[provider][0];
    onChange({
      provider,
      model: defaultModel,
      baseUrl: provider === 'ollama' ? 'http://localhost:11434' : undefined,
    });
  };

  const handleModelChange = (model: string) => {
    onChange({ ...value, model });
  };

  return (
              <AnimatePresence>
                {enableLLM && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-left space-y-6 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">AI Model Configuration</h4>

                      {/* Provider Selection */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Provider</p>
                        <div className="flex flex-wrap gap-2">
                          {(["openrouter", "openai", "anthropic", "gemini", "ollama"] as const).map((p) => (
                            <Button
                              key={p}
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => handleProviderChange(p)}
                              className={`rounded-lg border-white/5 text-[10px] font-bold transition-all ${
                                value.provider === p
                                  ? 'bg-white/10 text-white border-white/20'
                                  : 'bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white/60'
                              }`}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Model Selection */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Model</p>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                            className="w-full bg-white/[0.02] border border-white/5 text-xs text-white/60 h-10 pr-10 pl-4 rounded-lg text-left hover:bg-white/[0.04] transition-colors"
                          >
                            {value.model}
                          </button>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />

                          {/* Dropdown */}
                          <AnimatePresence>
                            {showModelDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-10 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
                              >
                                {providerModels[value.provider].map((model) => (
                                  <button
                                    key={model}
                                    type="button"
                                    onClick={() => {
                                      handleModelChange(model);
                                      setShowModelDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-xs text-left transition-colors ${
                                      value.model === model
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {model}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    </div>
                    <ScanEstimate
                      enableLLM={true}
                      provider={value.provider}
                      model={value.model}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
  );
}
